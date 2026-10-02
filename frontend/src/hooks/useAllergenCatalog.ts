import { useCallback, useEffect, useState } from 'react';
import { getAllergenCatalog, type AllergenCatalogItem } from '../services/profile.ts';

// El catálogo es estático: se pide una sola vez por sesión de la app
let cache: AllergenCatalogItem[] | null = null;

export function useAllergenCatalog() {
  const [catalog, setCatalog] = useState<AllergenCatalogItem[] | null>(cache);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    setError(false);
    try {
      cache = await getAllergenCatalog();
      setCatalog(cache);
    } catch {
      setError(true);
    }
  }, []);

  useEffect(() => {
    if (!cache) void load();
  }, [load]);

  return { catalog, error, retry: load };
}
