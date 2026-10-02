import type { Photo } from '../../hooks/useIngredientScan.ts';
import type { IngredientScanResponse } from '../../types/api.ts';
import { SAFETY_STYLES } from '../safetyStyles.ts';
import { IngredientList } from '../IngredientList.tsx';
import { AlertTriangleIcon, PhotoCameraIcon } from '../icons.tsx';
import { btnDark } from '../ui/buttons.ts';

interface Props {
  data: IngredientScanResponse;
  photo: Photo | null;
  onScanAgain: () => void;
}

// Por debajo de esta confianza del OCR se pide al usuario verificar con el empaque
const LOW_CONFIDENCE = 70;

export function ScanResult({ data, photo, onScanAgain }: Props) {
  const { analysis, scan } = data;
  const style = SAFETY_STYLES[analysis.status];
  const lowConfidence = scan.confidence < LOW_CONFIDENCE;

  return (
    <article className="space-y-4">
      {/* Semáforo */}
      <div
        role="status"
        aria-live="polite"
        className={`rounded-3xl border-2 p-5 shadow-sm ${style.card} ${style.text}`}
      >
        <div className="flex items-start gap-4">
          <span className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-white/70">
            <style.Icon className="size-8" />
          </span>
          <div className="min-w-0">
            <p className="text-2xl leading-tight font-extrabold">{style.title}</p>
            <p className="mt-1 text-sm font-medium opacity-90">{analysis.summary}</p>
          </div>
        </div>

        {analysis.matchedAllergens.length > 0 && (
          <ul className="mt-4 flex flex-wrap gap-2" aria-label="Alérgenos detectados">
            {analysis.matchedAllergens.map((m) => (
              <li key={m.allergen} className="rounded-full bg-red-600 px-3 py-1 text-xs font-bold text-white">
                {m.label}
              </li>
            ))}
          </ul>
        )}

        {analysis.traces.length > 0 && (
          <p className="mt-3 text-sm font-medium text-amber-800">
            Puede contener trazas de: {analysis.traces.map((t) => t.label).join(', ')}
          </p>
        )}
      </div>

      {lowConfidence && (
        <div className="flex gap-3 rounded-2xl bg-amber-50 p-4 text-sm text-amber-900 ring-1 ring-amber-200">
          <AlertTriangleIcon className="size-5 shrink-0 text-amber-600" />
          <p>
            <span className="font-semibold">La lectura fue difícil.</span> Algunas palabras pudieron leerse mal;
            compara la lista con el empaque o toma otra foto con mejor luz.
          </p>
        </div>
      )}

      {analysis.warnings.includes('NO_ALLERGIES_CONFIGURED') && (
        <p className="rounded-2xl bg-blue-50 p-4 text-sm text-blue-800 ring-1 ring-blue-100">
          Aún no configuraste tus alergias, así que no podemos personalizar el análisis.
        </p>
      )}

      {/* Ingredientes con resaltado */}
      <div className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
        <IngredientList
          ingredients={analysis.ingredients}
          rawText={scan.ingredientsText}
          userAllergens={analysis.userAllergens}
        />

        {/* Transparencia: qué leyó exactamente el OCR, para poder compararlo con el empaque */}
        <details className="group mt-4 border-t border-slate-100 pt-3">
          <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between text-sm font-medium text-slate-600">
            Ver foto y texto detectado
            <span className="text-slate-400 transition group-open:rotate-180" aria-hidden="true">
              ▾
            </span>
          </summary>
          <div className="mt-2 space-y-3">
            {photo && (
              <img src={photo.url} alt="Tu foto" className="max-h-56 w-full rounded-xl bg-slate-100 object-contain" />
            )}
            <pre className="max-h-48 overflow-auto rounded-xl bg-slate-50 p-3 font-sans text-xs leading-relaxed whitespace-pre-wrap text-slate-600">
              {scan.rawText}
            </pre>
            <p className="text-xs text-slate-400">Confianza de lectura: {Math.round(scan.confidence)} %</p>
          </div>
        </details>
      </div>

      <button
        type="button"
        onClick={onScanAgain}
        className={`${btnDark} min-h-14 w-full text-lg`}
      >
        <PhotoCameraIcon className="size-6" /> Escanear otro producto
      </button>

      <p className="px-1 text-xs leading-relaxed text-slate-500">{analysis.disclaimer}</p>
    </article>
  );
}
