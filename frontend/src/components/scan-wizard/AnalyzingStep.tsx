import type { CSSProperties } from 'react';
import type { AnalyzeStage } from '../../hooks/useIngredientScan.ts';
import { btnGhost } from '../ui/buttons.ts';

interface Props {
  stage: AnalyzeStage | null;
  onCancel: () => void;
}

const STAGE_LABEL: Record<AnalyzeStage, string> = {
  extracting: 'Extrayendo texto de la foto',
  matching: 'Cruzando con tus alergias',
};

// Anchos de "palabras" que imitan un párrafo de ingredientes (en %)
const WORDS = [18, 26, 12, 30, 22, 16, 34, 14, 24, 20, 28, 12, 18, 32, 16, 22];
// Posiciones que imitan ingredientes resaltados
const HIGHLIGHTED = new Set([3, 10]);

const delay = (i: number): CSSProperties => ({ animationDelay: `${i * 90}ms` });

/** Skeleton con la forma exacta de ScanResult, para que el resultado "aparezca" en su sitio */
export function AnalyzingStep({ stage, onCancel }: Props) {
  const stageIndex = stage === 'matching' ? 1 : 0;

  return (
    <section aria-busy="true" aria-labelledby="analyzing-status" className="space-y-4">
      <p id="analyzing-status" role="status" aria-live="polite" className="sr-only">
        Analizando ingredientes: {stage ? STAGE_LABEL[stage] : ''}…
      </p>

      {/* Progreso de las dos etapas, sin texto */}
      <div className="grid grid-cols-2 gap-1.5" aria-hidden="true">
        {[0, 1].map((i) => (
          <div key={i} className="h-1 overflow-hidden rounded-full bg-slate-200">
            <div
              className={`h-full rounded-full bg-brand-500 transition-all duration-700 ease-out ${
                i < stageIndex ? 'w-full' : i === stageIndex ? 'w-2/3 animate-pulse' : 'w-0'
              }`}
            />
          </div>
        ))}
      </div>

      <div aria-hidden="true" className="space-y-4">
        {/* Semáforo */}
        <div className="rounded-3xl border-2 border-slate-200 bg-slate-100 p-5">
          <div className="flex items-start gap-4">
            <div className="size-14 shrink-0 animate-pulse rounded-2xl bg-slate-200" style={delay(0)} />
            <div className="flex-1 space-y-2.5 pt-1">
              <div className="h-6 w-3/5 animate-pulse rounded-lg bg-slate-200" style={delay(1)} />
              <div className="h-3.5 w-full animate-pulse rounded bg-slate-200" style={delay(2)} />
              <div className="h-3.5 w-4/5 animate-pulse rounded bg-slate-200" style={delay(3)} />
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <div className="h-6 w-24 animate-pulse rounded-full bg-slate-200" style={delay(4)} />
            <div className="h-6 w-16 animate-pulse rounded-full bg-slate-200" style={delay(5)} />
          </div>
        </div>

        {/* Ingredientes */}
        <div className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
          <div className="mb-4 flex items-center justify-between">
            <div className="h-5 w-28 animate-pulse rounded-lg bg-slate-200" />
            <div className="h-3.5 w-24 animate-pulse rounded bg-slate-100" />
          </div>
          <div className="flex flex-wrap gap-x-1.5 gap-y-3">
            {WORDS.map((w, i) => (
              <div
                key={i}
                className={`h-4 animate-pulse rounded ${HIGHLIGHTED.has(i) ? 'bg-red-100' : 'bg-slate-200'}`}
                style={{ width: `${w}%`, ...delay(i % 6) }}
              />
            ))}
          </div>
          <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
            <div className="h-3.5 w-40 animate-pulse rounded bg-slate-100" />
            <div className="size-3.5 animate-pulse rounded bg-slate-100" />
          </div>
        </div>

        {/* Botón */}
        <div className="h-14 animate-pulse rounded-2xl bg-slate-200" />
      </div>

      <div className="text-center">
        <button type="button" onClick={onCancel} className={`${btnGhost} min-h-11 px-4 text-sm`}>
          Cancelar
        </button>
      </div>
    </section>
  );
}
