import { useState } from 'react';
import type { ProductResponse } from '../types/api.ts';
import { SAFETY_STYLES } from './safetyStyles.ts';
import { IngredientList } from './IngredientList.tsx';
import { ArrowLeftIcon, ImageOffIcon } from './icons.tsx';
import { btnDark } from './ui/buttons.ts';

interface Props {
  data: ProductResponse;
  onBack?: () => void;
  onScanAgain?: () => void;
}

export function ProductResultCard({ data, onBack, onScanAgain }: Props) {
  const { product, analysis } = data;
  const style = SAFETY_STYLES[analysis.status];
  const [imageFailed, setImageFailed] = useState(false);
  const showImage = product.imageUrl && !imageFailed;

  return (
    <article className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-200">
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          className="flex min-h-11 items-center gap-1 px-4 pt-3 text-sm font-medium text-slate-600 hover:text-slate-900"
        >
          <ArrowLeftIcon className="size-4" /> Volver a resultados
        </button>
      )}

      {/* Producto */}
      <header className="flex gap-4 p-4">
        <div className="flex size-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-slate-50 ring-1 ring-slate-100">
          {showImage ? (
            <img
              src={product.imageUrl!}
              alt={product.name}
              className="size-full object-contain"
              onError={() => setImageFailed(true)}
            />
          ) : (
            <ImageOffIcon className="size-8 text-slate-300" />
          )}
        </div>
        <div className="min-w-0 flex-1 py-1">
          <h2 className="text-lg leading-tight font-bold text-slate-900">{product.name}</h2>
          {product.brand && <p className="mt-1 text-sm text-slate-600">{product.brand}</p>}
          <p className="mt-1 font-mono text-xs text-slate-400">{product.barcode}</p>
        </div>
      </header>

      {/* Semáforo */}
      <div
        role="status"
        aria-live="polite"
        className={`mx-4 rounded-2xl border-2 p-4 ${style.card} ${style.text}`}
      >
        <div className="flex items-start gap-3">
          <style.Icon className="size-8 shrink-0" />
          <div className="min-w-0">
            <p className="text-lg leading-tight font-bold">{style.title}</p>
            <p className="mt-1 text-sm font-medium opacity-90">{analysis.summary}</p>
          </div>
        </div>

        {analysis.matchedAllergens.length > 0 && (
          <ul className="mt-3 flex flex-wrap gap-2" aria-label="Alérgenos detectados">
            {analysis.matchedAllergens.map((m) => (
              <li
                key={m.allergen}
                className="rounded-full bg-red-600 px-3 py-1 text-xs font-bold text-white"
              >
                {m.label}
              </li>
            ))}
          </ul>
        )}

        {analysis.traces.length > 0 && (
          <p className="mt-3 text-xs font-medium text-amber-800">
            Puede contener trazas de: {analysis.traces.map((t) => t.label).join(', ')}
          </p>
        )}
      </div>

      {analysis.warnings.includes('NO_ALLERGIES_CONFIGURED') && (
        <p className="mx-4 mt-3 rounded-xl bg-blue-50 p-3 text-sm text-blue-800">
          Aún no configuraste tus alergias, así que no podemos personalizar el análisis.
        </p>
      )}

      {/* Ingredientes */}
      <div className="p-4">
        <IngredientList
          ingredients={analysis.ingredients}
          rawText={product.ingredientsText}
          userAllergens={analysis.userAllergens}
        />
      </div>

      <footer className="space-y-3 border-t border-slate-100 bg-slate-50 p-4">
        {onScanAgain && (
          <button
            type="button"
            onClick={onScanAgain}
            className={`${btnDark} min-h-12 w-full`}
          >
            Analizar otro producto
          </button>
        )}
        <p className="text-xs leading-relaxed text-slate-500">{analysis.disclaimer}</p>
      </footer>
    </article>
  );
}
