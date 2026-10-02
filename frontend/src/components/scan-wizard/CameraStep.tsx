import { useEffect, useRef, useState } from 'react';
import { FlashIcon, GalleryIcon, Spinner, XIcon } from '../icons.tsx';

interface Props {
  onCapture: (photo: Blob) => void;
  onPickFile: (file: File) => void;
  onClose: () => void;
}

type Status = { kind: 'starting' } | { kind: 'ready' } | { kind: 'error'; message: string };

// Capacidades no incluidas aún en los tipos de TypeScript del DOM
type ExtendedCapabilities = MediaTrackCapabilities & { torch?: boolean; focusMode?: string[] };
type ExtendedConstraints = MediaTrackConstraintSet & { torch?: boolean; focusMode?: string };

function cameraErrorMessage(err: unknown): string {
  switch (err instanceof DOMException ? err.name : '') {
    case 'NotAllowedError':
      return 'Permiso de cámara denegado. Actívalo en los ajustes del navegador o sube una foto.';
    case 'NotFoundError':
    case 'OverconstrainedError':
      return 'No encontramos una cámara en este dispositivo.';
    case 'NotReadableError':
      return 'Otra aplicación está usando la cámara.';
    default:
      return 'No pudimos iniciar la cámara.';
  }
}

/**
 * Recorta el área del marco guía sobre el fotograma real del video.
 * El <video> usa object-cover, así que hay que deshacer su escala y desplazamiento.
 */
function captureFrame(video: HTMLVideoElement, frame: HTMLElement): Promise<Blob> {
  const vw = video.videoWidth;
  const vh = video.videoHeight;
  const v = video.getBoundingClientRect();
  const f = frame.getBoundingClientRect();

  const scale = Math.max(v.width / vw, v.height / vh);
  const offsetX = v.left + (v.width - vw * scale) / 2;
  const offsetY = v.top + (v.height - vh * scale) / 2;

  // Un pequeño margen alrededor del marco para no cortar letras del borde
  const margin = 0.05;
  let sw = (f.width / scale) * (1 + 2 * margin);
  let sh = (f.height / scale) * (1 + 2 * margin);
  let sx = (f.left - offsetX) / scale - (f.width / scale) * margin;
  let sy = (f.top - offsetY) / scale - (f.height / scale) * margin;
  sx = Math.max(0, sx);
  sy = Math.max(0, sy);
  sw = Math.min(vw - sx, sw);
  sh = Math.min(vh - sy, sh);

  const canvas = document.createElement('canvas');
  canvas.width = Math.round(sw);
  canvas.height = Math.round(sh);
  canvas.getContext('2d')!.drawImage(video, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);

  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('captura fallida'))), 'image/jpeg', 0.92),
  );
}

export function CameraStep({ onCapture, onPickFile, onClose }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<MediaStreamTrack | null>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  const nativeCameraRef = useRef<HTMLInputElement>(null);

  const [status, setStatus] = useState<Status>({ kind: 'starting' });
  const [torch, setTorch] = useState<{ supported: boolean; on: boolean }>({ supported: false, on: false });
  const [flash, setFlash] = useState(false);
  const [capturing, setCapturing] = useState(false);

  // Pantalla completa: bloquea el scroll del fondo mientras la cámara está abierta
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  useEffect(() => {
    let stream: MediaStream | null = null;
    let cancelled = false;

    (async () => {
      if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
        setStatus({ kind: 'error', message: 'La cámara requiere una conexión segura (HTTPS).' });
        return;
      }
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          // Alta resolución: el texto de los ingredientes suele ser muy pequeño
          video: { facingMode: { ideal: 'environment' }, width: { ideal: 1920 }, height: { ideal: 1080 } },
        });
        if (cancelled) return stream.getTracks().forEach((t) => t.stop());

        const video = videoRef.current!;
        video.srcObject = stream;
        await video.play();

        const track = stream.getVideoTracks()[0]!;
        trackRef.current = track;
        const caps = (track.getCapabilities?.() ?? {}) as ExtendedCapabilities;
        if (caps.focusMode?.includes('continuous')) {
          track.applyConstraints({ advanced: [{ focusMode: 'continuous' } as ExtendedConstraints] }).catch(() => {});
        }
        setTorch({ supported: Boolean(caps.torch), on: false });
        setStatus({ kind: 'ready' });
      } catch (err) {
        if (!cancelled) setStatus({ kind: 'error', message: cameraErrorMessage(err) });
      }
    })();

    return () => {
      cancelled = true;
      stream?.getTracks().forEach((t) => t.stop());
      trackRef.current = null;
    };
  }, []);

  const toggleTorch = async () => {
    const track = trackRef.current;
    if (!track) return;
    try {
      await track.applyConstraints({ advanced: [{ torch: !torch.on } as ExtendedConstraints] });
      setTorch((t) => ({ ...t, on: !t.on }));
    } catch {
      setTorch({ supported: false, on: false });
    }
  };

  const shoot = async () => {
    const video = videoRef.current;
    const frame = frameRef.current;
    if (!video || !frame || !video.videoWidth || capturing) return;
    setCapturing(true);
    setFlash(true);
    setTimeout(() => setFlash(false), 150);
    navigator.vibrate?.(40);
    try {
      onCapture(await captureFrame(video, frame));
    } catch {
      setCapturing(false);
      setStatus({ kind: 'error', message: 'No pudimos tomar la foto. Inténtalo de nuevo.' });
    }
  };

  const ready = status.kind === 'ready';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Cámara para fotografiar los ingredientes"
      className="fixed inset-0 z-50 flex flex-col bg-black text-white"
    >
      {/* Barra superior */}
      <div className="relative z-10 flex items-center justify-between px-3 pt-[max(0.75rem,env(safe-area-inset-top))] pb-3">
        <button
          type="button"
          onClick={onClose}
          className="flex size-11 items-center justify-center rounded-full bg-white/10 backdrop-blur hover:bg-white/20"
          aria-label="Cerrar cámara"
        >
          <XIcon className="size-5" />
        </button>
        <p className="text-sm font-semibold">Ingredientes</p>
        {torch.supported ? (
          <button
            type="button"
            onClick={() => void toggleTorch()}
            aria-pressed={torch.on}
            className={`flex size-11 items-center justify-center rounded-full backdrop-blur ${
              torch.on ? 'bg-amber-400 text-slate-900' : 'bg-white/10 hover:bg-white/20'
            }`}
            aria-label={torch.on ? 'Apagar linterna' : 'Encender linterna'}
          >
            <FlashIcon className="size-5" />
          </button>
        ) : (
          <span className="size-11" aria-hidden="true" />
        )}
      </div>

      {/* Visor */}
      <div className="relative flex-1 overflow-hidden">
        <video
          ref={videoRef}
          className="absolute inset-0 size-full object-cover"
          muted
          playsInline
          autoPlay
          aria-hidden="true"
        />

        {/* Marco guía: todo lo de fuera se oscurece */}
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-4 px-5">
          <p className="rounded-full bg-black/55 px-4 py-1.5 text-center text-sm font-medium backdrop-blur">
            {ready ? 'Alinea la lista de ingredientes dentro del marco' : ' '}
          </p>
          <div
            ref={frameRef}
            className="relative h-[58%] w-full max-w-md rounded-2xl shadow-[0_0_0_9999px_rgba(0,0,0,0.55)]"
          >
            {/* Esquinas */}
            {[
              'top-0 left-0 border-t-4 border-l-4 rounded-tl-2xl',
              'top-0 right-0 border-t-4 border-r-4 rounded-tr-2xl',
              'bottom-0 left-0 border-b-4 border-l-4 rounded-bl-2xl',
              'bottom-0 right-0 border-b-4 border-r-4 rounded-br-2xl',
            ].map((c) => (
              <span key={c} className={`absolute size-9 border-brand-500 ${c}`} />
            ))}
            {/* Líneas de texto simuladas como pista visual */}
            {ready && (
              <div className="absolute inset-6 flex flex-col justify-center gap-3 opacity-25">
                {[90, 100, 80, 95, 70].map((w, i) => (
                  <div key={i} className="h-0.5 rounded bg-white" style={{ width: `${w}%` }} />
                ))}
              </div>
            )}
          </div>
        </div>

        {status.kind === 'starting' && (
          <div className="absolute inset-0 flex items-center justify-center gap-2 text-sm">
            <Spinner /> Iniciando cámara…
          </div>
        )}

        {status.kind === 'error' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black/80 p-8 text-center">
            <p role="alert" className="max-w-xs text-base">
              {status.message}
            </p>
            <button
              type="button"
              onClick={() => nativeCameraRef.current?.click()}
              className="flex min-h-12 items-center gap-2 rounded-2xl bg-white px-5 font-semibold text-slate-900"
            >
              <GalleryIcon className="size-5" /> Usar la cámara del teléfono
            </button>
          </div>
        )}

        {/* Destello al disparar */}
        <div
          aria-hidden="true"
          className={`pointer-events-none absolute inset-0 bg-white transition-opacity duration-150 ${
            flash ? 'opacity-70' : 'opacity-0'
          }`}
        />
      </div>

      {/* Barra inferior: galería · disparador */}
      <div className="relative z-10 grid grid-cols-3 items-center px-6 pt-4 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        <button
          type="button"
          onClick={() => galleryRef.current?.click()}
          className="flex size-12 items-center justify-center justify-self-start rounded-2xl bg-white/10 hover:bg-white/20"
          aria-label="Elegir foto de la galería"
        >
          <GalleryIcon className="size-6" />
        </button>
        <button
          type="button"
          onClick={() => void shoot()}
          disabled={!ready || capturing}
          className="flex size-20 items-center justify-center justify-self-center rounded-full bg-white/20 ring-4 ring-white transition active:scale-95 disabled:opacity-40"
          aria-label="Tomar foto"
        >
          <span className="size-16 rounded-full bg-white" />
        </button>
        <span aria-hidden="true" />
      </div>

      {[
        // Galería del teléfono
        { ref: galleryRef, capture: undefined },
        // capture="environment" abre directamente la cámara nativa (respaldo si getUserMedia falla)
        { ref: nativeCameraRef, capture: 'environment' as const },
      ].map(({ ref, capture }) => (
        <input
          key={capture ?? 'gallery'}
          ref={ref}
          type="file"
          accept="image/*"
          capture={capture}
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            e.target.value = '';
            if (file) onPickFile(file);
          }}
        />
      ))}
    </div>
  );
}
