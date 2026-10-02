import type { SearchResponse } from '../types/api.ts';
import { SAFETY_STYLES } from './safetyStyles.ts';
import { ImageOffIcon } from './icons.tsx';

interface Props {
  query: string;
  results: SearchResponse;
  onSelect: (barcode: string) => void;
}

export function SearchResults({ query, results, onSelect }: Props) {
  if (results.products.length === 0) {
    return (
      <div className="rounded-3xl bg-white p-6 text-center ring-1 ring-slate-200">
        <p className="font-semibold">Sin resultados para “{query}”</p>
        <p className="mt-1 text-sm text-slate-600">Prueba con otra palabra o escanea el código de barras.</p>
      </div>
    );
  }

  return (
    <section aria-label="Resultados de búsqueda">
      <p className="mb-2 px-1 text-sm text-slate-500">
        {results.total.toLocaleString('es-MX')} resultados para “{query}”
      </p>
      <ul className="space-y-2">
        {results.products.map((item) => {
          const style = item.status ? SAFETY_STYLES[item.status] : null;
          return (
            <li key={item.barcode}>
              <button
                type="button"
                onClick={() => onSelect(item.barcode)}
                className="flex w-full items-center gap-3 rounded-2xl bg-white p-3 text-left ring-1 ring-slate-200 transition hover:ring-brand-500 focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:outline-none active:scale-[0.99]"
              >
                <div className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-slate-100">
                  {item.thumbnailUrl ? (
                    <img src={item.thumbnailUrl} alt="" loading="lazy" className="size-full object-contain" />
                  ) : (
                    <ImageOffIcon className="size-6 text-slate-300" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-slate-900">{item.name}</p>
                  {item.brand && <p className="truncate text-sm text-slate-500">{item.brand}</p>}
                  {style ? (
                    <p className={`mt-0.5 flex items-center gap-1.5 text-xs font-semibold ${style.text}`}>
                      <span className={`size-2 rounded-full ${style.dot}`} aria-hidden="true" />
                      {item.status === 'DANGER'
                        ? `Contiene ${item.matchedAllergens.map((m) => m.label).join(', ')}`
                        : style.title}
                    </p>
                  ) : (
                    <p className="mt-0.5 flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                      <span className="size-2 rounded-full bg-slate-300" aria-hidden="true" />
                      Toca para ver el análisis
                    </p>
                  )}
                </div>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
