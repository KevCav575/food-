import type { ScanError } from '../types/ui.ts';
import { AlertTriangleIcon, SearchIcon } from './icons.tsx';
import { btnPrimary, btnSecondary } from './ui/buttons.ts';

interface Props {
  error: ScanError;
  onRetry?: () => void;
  onDismiss?: () => void;
}

export function ErrorState({ error, onRetry, onDismiss }: Props) {
  const notFound = error.code === 'PRODUCT_NOT_FOUND';
  const Icon = notFound ? SearchIcon : AlertTriangleIcon;

  return (
    <div role="alert" className="rounded-3xl bg-white p-6 text-center shadow-sm ring-1 ring-slate-200">
      <div
        className={`mx-auto mb-3 flex size-14 items-center justify-center rounded-full ${
          notFound ? 'bg-slate-100 text-slate-500' : 'bg-red-50 text-red-600'
        }`}
      >
        <Icon className="size-7" />
      </div>
      <h2 className="text-lg font-semibold text-slate-900">{error.title}</h2>
      <p className="mt-1 text-sm text-slate-600">{error.message}</p>

      <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-center">
        {error.retryable && onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className={`${btnPrimary} min-h-12 px-6`}
          >
            Reintentar
          </button>
        )}
        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            className={`${btnSecondary} min-h-12 px-6`}
          >
            Volver
          </button>
        )}
      </div>
    </div>
  );
}
