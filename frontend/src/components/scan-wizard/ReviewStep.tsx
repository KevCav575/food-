import type { Photo } from '../../hooks/useIngredientScan.ts';
import type { ScanError } from '../../types/ui.ts';
import { AlertTriangleIcon, CheckIcon, RefreshIcon, Spinner, TextScanIcon } from '../icons.tsx';
import { btnPrimary, btnSecondary } from '../ui/buttons.ts';

interface Props {
  photo: Photo | null;
  preparing: boolean;
  error: ScanError | null;
  onRetake: () => void;
  onAnalyze: () => void;
}

const CHECKLIST = [
  'Las letras se ven nítidas, sin desenfoque',
  'Se ve la lista completa de ingredientes',
  'No hay reflejos ni sombras sobre el texto',
];

export function ReviewStep({ photo, preparing, error, onRetake, onAnalyze }: Props) {
  // Si el OCR no encontró texto, la acción principal pasa a ser repetir la foto
  const retakeFirst = error?.code === 'NO_TEXT_DETECTED' || error?.code === 'UNSUPPORTED_IMAGE';

  return (
    <section aria-labelledby="review-title" className="space-y-5">
      <div className="overflow-hidden rounded-3xl bg-slate-900 ring-1 ring-slate-200">
        {photo ? (
          <img
            src={photo.url}
            alt="Foto de la lista de ingredientes"
            className="mx-auto max-h-[52dvh] w-full object-contain"
          />
        ) : (
          <div className="flex aspect-[4/3] items-center justify-center gap-2 text-sm text-white/80">
            {preparing ? (
              <>
                <Spinner /> Preparando imagen…
              </>
            ) : (
              'Sin imagen'
            )}
          </div>
        )}
      </div>

      {error ? (
        <div role="alert" className="flex gap-3 rounded-2xl bg-red-50 p-4 text-red-800 ring-1 ring-red-200">
          <AlertTriangleIcon className="size-6 shrink-0 text-red-600" />
          <div>
            <p className="font-semibold">{error.title}</p>
            <p className="mt-0.5 text-sm">{error.message}</p>
          </div>
        </div>
      ) : (
        <div>
          <h2 id="review-title" className="text-xl font-bold text-slate-900">
            ¿El texto es legible?
          </h2>
          <p className="mt-1 text-sm text-slate-600">Revisa la foto antes de analizarla:</p>
          <ul className="mt-3 space-y-2">
            {CHECKLIST.map((item) => (
              <li key={item} className="flex items-center gap-2.5 text-sm text-slate-700">
                <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-700">
                  <CheckIcon className="size-3" strokeWidth={3} />
                </span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className={`flex gap-2 ${retakeFirst ? 'flex-col' : 'flex-col-reverse sm:flex-row'}`}>
        <button
          type="button"
          onClick={onRetake}
          className={`${retakeFirst ? `${btnPrimary} text-lg` : btnSecondary} min-h-14 flex-1`}
        >
          <RefreshIcon className="size-5" /> Volver a intentar
        </button>
        {!retakeFirst && (
          <button
            type="button"
            onClick={onAnalyze}
            disabled={!photo || preparing}
            className={`${btnPrimary} min-h-14 flex-[1.4] text-lg`}
          >
            <TextScanIcon className="size-6" />
            {error?.retryable ? 'Reintentar análisis' : 'Analizar ingredientes'}
          </button>
        )}
      </div>
    </section>
  );
}
