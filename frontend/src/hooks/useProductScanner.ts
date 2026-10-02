import { useCallback, useEffect, useRef, useState } from 'react';
import { ApiError } from '../services/api.ts';
import { getProductByBarcode, searchProducts } from '../services/products.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { usePaywall } from '../context/PaywallContext.tsx';
import type { ProductResponse, SearchResponse } from '../types/api.ts';

export interface ScanError {
  code: string;
  title: string;
  message: string;
  /** Si es posible reintentar la misma operación */
  retryable: boolean;
}

type Loading = null | 'barcode' | 'search';

interface ScannerState {
  loading: Loading;
  product: ProductResponse | null;
  /** Se conserva al abrir un producto para poder volver a la lista */
  searchResults: SearchResponse | null;
  lastQuery: string | null;
  error: ScanError | null;
}

const initialState: ScannerState = {
  loading: null,
  product: null,
  searchResults: null,
  lastQuery: null,
  error: null,
};

function toScanError(err: unknown): ScanError {
  if (!(err instanceof ApiError)) {
    return {
      code: 'NETWORK',
      title: 'Sin conexión',
      message: 'No pudimos contactar al servidor. Revisa tu conexión a internet.',
      retryable: true,
    };
  }

  switch (err.code) {
    case 'PRODUCT_NOT_FOUND':
      return {
        code: err.code,
        title: 'Producto no encontrado',
        message: 'No encontramos la información de este producto. Prueba con otro resultado o escanea sus ingredientes.',
        retryable: false,
      };
    case 'VALIDATION_ERROR':
      return {
        code: err.code,
        title: 'Revisa los datos',
        message: Object.values(err.details ?? {}).flat()[0] ?? err.message,
        retryable: false,
      };
    case 'RATE_LIMITED':
    case 'UPSTREAM_RATE_LIMITED':
      return {
        code: err.code,
        title: 'Demasiadas consultas',
        message: 'Espera unos segundos e inténtalo de nuevo.',
        retryable: true,
      };
    case 'UPSTREAM_TIMEOUT':
    case 'UPSTREAM_ERROR':
      return {
        code: err.code,
        title: 'Servicio no disponible',
        message: 'La base de datos de productos no responde en este momento.',
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

// Fase 4: el backend responderá 402 / SCAN_LIMIT_REACHED cuando se agote el plan gratuito
const isLimitError = (err: unknown) =>
  err instanceof ApiError && (err.status === 402 || err.code === 'SCAN_LIMIT_REACHED');

const isAbort = (err: unknown) => err instanceof DOMException && err.name === 'AbortError';

export function useProductScanner() {
  const { user, refreshUser } = useAuth();
  const { openPaywall } = usePaywall();
  const [state, setState] = useState<ScannerState>(initialState);
  const abortRef = useRef<AbortController | null>(null);
  const lastActionRef = useRef<(() => void) | null>(null);

  // Cancela la petición en curso al desmontar
  useEffect(() => () => abortRef.current?.abort(), []);

  /** Cancela cualquier petición anterior y devuelve la señal de la nueva */
  const nextSignal = () => {
    abortRef.current?.abort();
    abortRef.current = new AbortController();
    return abortRef.current.signal;
  };

  const blockedByPaywall = user?.scansRemaining === 0;

  const lookupBarcode = useCallback(
    async (barcode: string) => {
      lastActionRef.current = () => void lookupBarcode(barcode);
      if (blockedByPaywall) return openPaywall();

      const signal = nextSignal();
      setState((s) => ({ ...s, loading: 'barcode', error: null, product: null }));
      try {
        const product = await getProductByBarcode(barcode, signal);
        setState((s) => ({ ...s, loading: null, product }));
        void refreshUser(); // actualiza el contador de escaneos
      } catch (err) {
        if (isAbort(err)) return;
        if (isLimitError(err)) {
          setState((s) => ({ ...s, loading: null }));
          void refreshUser();
          return openPaywall();
        }
        setState((s) => ({ ...s, loading: null, error: toScanError(err) }));
      }
    },
    [blockedByPaywall, refreshUser, openPaywall],
  );

  const search = useCallback(
    async (query: string) => {
      lastActionRef.current = () => void search(query);
      if (blockedByPaywall) return openPaywall();

      const signal = nextSignal();
      setState((s) => ({
        ...s,
        loading: 'search',
        error: null,
        product: null,
        searchResults: null,
        lastQuery: query,
      }));
      try {
        const searchResults = await searchProducts(query, 1, signal);
        setState((s) => ({ ...s, loading: null, searchResults }));
        void refreshUser();
      } catch (err) {
        if (isAbort(err)) return;
        if (isLimitError(err)) {
          setState((s) => ({ ...s, loading: null }));
          void refreshUser();
          return openPaywall();
        }
        setState((s) => ({ ...s, loading: null, error: toScanError(err) }));
      }
    },
    [blockedByPaywall, refreshUser, openPaywall],
  );

  const retry = useCallback(() => lastActionRef.current?.(), []);

  /** Cierra el detalle del producto y vuelve a la lista de resultados (si la hay) */
  const backToResults = useCallback(() => setState((s) => ({ ...s, product: null, error: null })), []);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    setState(initialState);
  }, []);

  return { ...state, lookupBarcode, search, retry, backToResults, reset };
}
