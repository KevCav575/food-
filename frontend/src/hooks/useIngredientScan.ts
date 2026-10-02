import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { usePaywall } from '../context/PaywallContext.tsx';
import { ApiError } from '../services/api.ts';
import { scanIngredients } from '../services/scan.ts';
import { compressImage, UnsupportedImageError } from '../lib/imageCompression.ts';
import type { IngredientScanResponse } from '../types/api.ts';
import type { ScanError } from '../types/ui.ts';

export type WizardStep = 'instructions' | 'camera' | 'review' | 'analyzing' | 'result';

/** Etapas del paso 4, para el loader */
export type AnalyzeStage = 'extracting' | 'matching';

export interface Photo {
  /** Imagen ya comprimida: es exactamente lo que se envía al servidor */
  blob: Blob;
  url: string;
}

interface State {
  step: WizardStep;
  photo: Photo | null;
  /** Se está comprimiendo la foto recién tomada */
  preparing: boolean;
  stage: AnalyzeStage | null;
  result: IngredientScanResponse | null;
  error: ScanError | null;
}

const initialState: State = {
  step: 'instructions',
  photo: null,
  preparing: false,
  stage: null,
  result: null,
  error: null,
};

// Tiempo mínimo que se muestra "Cruzando con tus alergias…" para que el usuario perciba el paso
const MATCHING_MIN_MS = 450;

function toScanError(err: unknown): ScanError {
  if (err instanceof UnsupportedImageError) {
    return {
      code: 'UNSUPPORTED_IMAGE',
      title: 'Formato no compatible',
      message: 'No pudimos abrir esa imagen. Toma la foto con la cámara o usa un JPG/PNG.',
      retryable: false,
    };
  }
  if (!(err instanceof ApiError)) {
    return {
      code: 'NETWORK',
      title: 'Sin conexión',
      message: 'No pudimos contactar al servidor. Revisa tu conexión e inténtalo de nuevo.',
      retryable: true,
    };
  }
  switch (err.code) {
    case 'NO_TEXT_DETECTED':
      return {
        code: err.code,
        title: 'No pudimos leer el texto',
        message:
          'Asegúrate de que la lista de ingredientes esté enfocada, bien iluminada y dentro del marco.',
        retryable: false,
      };
    case 'IMAGE_TOO_LARGE':
    case 'UNSUPPORTED_IMAGE':
      return { code: err.code, title: 'Imagen no válida', message: err.message, retryable: false };
    case 'RATE_LIMITED':
      return {
        code: err.code,
        title: 'Demasiados intentos',
        message: 'Espera unos segundos e inténtalo de nuevo.',
        retryable: true,
      };
    case 'UNAUTHENTICATED':
    case 'TOKEN_EXPIRED':
      return {
        code: err.code,
        title: 'Tu sesión expiró',
        message: 'Vuelve a iniciar sesión para continuar.',
        retryable: false,
      };
    default:
      return { code: err.code ?? 'UNKNOWN', title: 'Algo salió mal', message: err.message, retryable: true };
  }
}

const isLimitError = (err: unknown) =>
  err instanceof ApiError && (err.status === 402 || err.code === 'SCAN_LIMIT_REACHED');

const isAbort = (err: unknown) => err instanceof DOMException && err.name === 'AbortError';

export function useIngredientScan() {
  const { user, refreshUser, mergeUser } = useAuth();
  const { openPaywall } = usePaywall();
  const [state, setState] = useState<State>(initialState);
  const abortRef = useRef<AbortController | null>(null);
  const photoUrlRef = useRef<string | null>(null);

  // Libera la URL de la foto anterior al reemplazarla y al desmontar
  const setPhotoUrl = (url: string | null) => {
    if (photoUrlRef.current) URL.revokeObjectURL(photoUrlRef.current);
    photoUrlRef.current = url;
  };
  useEffect(
    () => () => {
      abortRef.current?.abort();
      setPhotoUrl(null);
    },
    [],
  );

  const outOfScans = user?.scansRemaining === 0;

  const openCamera = useCallback(() => {
    if (outOfScans) return openPaywall();
    setState((s) => ({ ...s, step: 'camera', error: null }));
  }, [outOfScans, openPaywall]);

  /** Recibe la foto de la cámara o de la galería, la comprime y pasa a confirmación */
  const acceptPhoto = useCallback(async (raw: Blob) => {
    if (outOfScans) return openPaywall();
    setState((s) => ({ ...s, step: 'review', preparing: true, error: null, photo: null }));
    try {
      const blob = await compressImage(raw);
      const url = URL.createObjectURL(blob);
      setPhotoUrl(url);
      setState((s) => ({ ...s, preparing: false, photo: { blob, url } }));
    } catch (err) {
      setState((s) => ({ ...s, preparing: false, error: toScanError(err) }));
    }
  }, [outOfScans, openPaywall]);

  const retake = useCallback(() => {
    abortRef.current?.abort();
    setState((s) => ({ ...s, step: 'camera', error: null, stage: null }));
  }, []);

  const analyze = useCallback(async () => {
    const photo = state.photo;
    if (!photo) return;
    if (outOfScans) return openPaywall();

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setState((s) => ({ ...s, step: 'analyzing', stage: 'extracting', error: null }));
    try {
      const result = await scanIngredients(photo.blob, controller.signal);
      setState((s) => ({ ...s, stage: 'matching' }));
      await new Promise((r) => setTimeout(r, MATCHING_MIN_MS));
      if (controller.signal.aborted) return;

      setState((s) => ({ ...s, step: 'result', stage: null, result }));
      if (result.scansRemaining !== undefined) mergeUser({ scansRemaining: result.scansRemaining });
      void refreshUser();
    } catch (err) {
      if (isAbort(err)) return;
      if (isLimitError(err)) {
        setState((s) => ({ ...s, step: 'review', stage: null }));
        void refreshUser(); // el contador local estaba desactualizado
        return openPaywall();
      }
      // Se vuelve a la confirmación con la foto, para reintentar o tomar otra
      setState((s) => ({ ...s, step: 'review', stage: null, error: toScanError(err) }));
    }
  }, [state.photo, outOfScans, mergeUser, refreshUser, openPaywall]);

  const cancelAnalysis = useCallback(() => {
    abortRef.current?.abort();
    setState((s) => ({ ...s, step: 'review', stage: null }));
  }, []);

  /** Vuelve al inicio para escanear otro producto */
  const restart = useCallback(() => {
    abortRef.current?.abort();
    setPhotoUrl(null);
    setState(initialState);
  }, []);

  const closeCamera = useCallback(
    () => setState((s) => ({ ...s, step: s.photo ? 'review' : 'instructions' })),
    [],
  );

  return {
    ...state,
    openCamera,
    closeCamera,
    acceptPhoto,
    retake,
    analyze,
    cancelAnalysis,
    restart,
  };
}
