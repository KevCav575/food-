import { useCallback } from 'react';
import { useProductScanner } from '../hooks/useProductScanner.ts';
import { SearchBar } from './SearchBar.tsx';
import { SearchResults } from './SearchResults.tsx';
import { ProductResultCard } from './ProductResultCard.tsx';
import { ErrorState } from './ErrorState.tsx';
import { ProductResultSkeleton, SearchResultsSkeleton } from './LoadingStates.tsx';

/** Búsqueda por nombre comercial en Open Food Facts; al tocar un resultado se abre su análisis */
export function ProductSearch() {
  const scanner = useProductScanner();
  const { lookupBarcode, search, reset, backToResults } = scanner;
  const busy = scanner.loading !== null;
  const hasOutput = busy || scanner.error || scanner.product || scanner.searchResults;

  const newSearch = useCallback(() => {
    reset();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [reset]);

  return (
    <div className="space-y-5">
      {/* Mientras se ve el detalle de un producto, la barra se oculta para darle espacio */}
      {!scanner.product && (
        <SearchBar
          onSearch={search}
          loading={scanner.loading === 'search'}
          disabled={busy}
          defaultValue={scanner.lastQuery ?? ''}
        />
      )}

      {hasOutput && (
        <div aria-live="polite">
          {scanner.loading === 'barcode' && <ProductResultSkeleton />}
          {scanner.loading === 'search' && <SearchResultsSkeleton />}

          {!busy && scanner.error && (
            <ErrorState
              error={scanner.error}
              onRetry={scanner.retry}
              onDismiss={scanner.searchResults ? backToResults : newSearch}
            />
          )}

          {!busy && !scanner.error && scanner.product && (
            <ProductResultCard
              data={scanner.product}
              onBack={scanner.searchResults ? backToResults : undefined}
              onScanAgain={newSearch}
            />
          )}

          {!busy && !scanner.error && !scanner.product && scanner.searchResults && (
            <SearchResults
              query={scanner.lastQuery ?? ''}
              results={scanner.searchResults}
              onSelect={lookupBarcode}
            />
          )}
        </div>
      )}
    </div>
  );
}
