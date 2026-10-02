import { useState, type FormEvent } from 'react';
import { SearchIcon, Spinner, XIcon } from './icons.tsx';
import { btnPrimary } from './ui/buttons.ts';

interface Props {
  onSearch: (query: string) => void;
  loading?: boolean;
  disabled?: boolean;
  defaultValue?: string;
}

// La búsqueda se envía al pulsar "Buscar" (no mientras se escribe), porque cada consulta
// consume un escaneo del plan gratuito.
export function SearchBar({ onSearch, loading, disabled, defaultValue = '' }: Props) {
  const [query, setQuery] = useState(defaultValue);
  const trimmed = query.trim();
  const canSubmit = trimmed.length >= 2 && !loading && !disabled;

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (canSubmit) onSearch(trimmed);
  };

  return (
    <form role="search" onSubmit={submit} className="space-y-2">
      <label htmlFor="product-search" className="sr-only">
        Buscar producto por nombre
      </label>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-slate-400" />
          <input
            id="product-search"
            type="search"
            autoComplete="off"
            enterKeyHint="search"
            minLength={2}
            maxLength={100}
            placeholder="Ej. galletas Marías, Nutella…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            disabled={disabled}
            aria-describedby="search-hint"
            className="min-h-14 w-full rounded-2xl border-0 bg-white pr-12 pl-12 text-base shadow-sm ring-1 ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-brand-600 focus:outline-none disabled:bg-slate-100 [&::-webkit-search-cancel-button]:hidden"
          />
          {query && !loading && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="absolute top-1/2 right-2 flex size-10 -translate-y-1/2 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              aria-label="Borrar búsqueda"
            >
              <XIcon className="size-5" />
            </button>
          )}
        </div>
        <button
          type="submit"
          disabled={!canSubmit}
          className={`${btnPrimary} min-h-14 min-w-24 px-5`}
        >
          {loading ? <Spinner /> : 'Buscar'}
          {loading && <span className="sr-only">Buscando…</span>}
        </button>
      </div>
      <p id="search-hint" className="px-1 text-xs text-slate-500">
        Busca por nombre comercial o marca. Cada búsqueda cuenta como un escaneo.
      </p>
    </form>
  );
}
