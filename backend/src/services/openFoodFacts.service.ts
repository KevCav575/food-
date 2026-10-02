import { env } from '../config/env.js';
import { HttpError } from '../lib/httpError.js';
import { TtlCache } from '../lib/ttlCache.js';
import { splitIngredientsText } from '../lib/ingredients.js';
import type { Product, ProductIngredient, ProductSearchResult } from '../types/product.js';

// Docs: https://openfoodfacts.github.io/openfoodfacts-server/api/
// Límites de OFF: ~100 req/min para lectura de productos y ~10 req/min para búsquedas.

const TIMEOUT_MS = 8000;
const MAX_INGREDIENT_DEPTH = 4;

const FIELDS = [
  'code',
  'product_name',
  'product_name_es',
  'generic_name',
  'brands',
  'image_front_url',
  'image_url',
  'image_front_small_url',
  'ingredients_text',
  'ingredients_text_es',
  'ingredients_text_en',
  'ingredients',
  'allergens_tags',
  'traces_tags',
].join(',');

// --- Tipos de la respuesta cruda de OFF (solo los campos que pedimos; todos opcionales) ---

interface OffIngredient {
  id?: string;
  text?: string;
  ingredients?: OffIngredient[];
}

interface OffProduct {
  code?: string;
  product_name?: string;
  product_name_es?: string;
  generic_name?: string;
  /** La API clásica la da como texto («A, B»); Search-a-licious como lista */
  brands?: string | string[];
  image_front_url?: string;
  image_url?: string;
  image_front_small_url?: string;
  ingredients_text?: string;
  ingredients_text_es?: string;
  ingredients_text_en?: string;
  ingredients?: OffIngredient[];
  allergens_tags?: string[];
  traces_tags?: string[];
}

interface OffProductResponse {
  status?: number;
  product?: OffProduct;
}

interface OffSearchResponse {
  count?: number;
  page?: number | string;
  page_size?: number | string;
  products?: OffProduct[];
}

/** Respuesta de Search-a-licious (search.openfoodfacts.org) */
interface SearchaliciousResponse {
  count?: number;
  hits?: OffProduct[];
}

// Search-a-licious no indexa el texto de ingredientes: solo alérgenos y trazas declarados.
// El análisis completo se hace al abrir el producto (API de producto).
const SEARCH_FIELDS = [
  'code',
  'product_name',
  'product_name_es',
  'generic_name',
  'brands',
  'image_front_url',
  'image_front_small_url',
  'allergens_tags',
  'traces_tags',
].join(',');

const productCache = new TtlCache<Product | null>(60 * 60 * 1000, 1000); // 1 h
const searchCache = new TtlCache<ProductSearchResult>(10 * 60 * 1000, 300); // 10 min

// ---------------------------------------------------------------------------
// HTTP
// ---------------------------------------------------------------------------

async function offGet<T>(url: URL): Promise<{ status: number; body: T | null }> {
  let res: Response;
  try {
    res = await fetch(url, {
      headers: { 'User-Agent': env.OFF_USER_AGENT, Accept: 'application/json' },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch {
    throw new HttpError(504, 'Open Food Facts no respondió a tiempo', 'UPSTREAM_TIMEOUT');
  }

  if (res.status === 429) {
    throw new HttpError(503, 'Servicio de productos saturado, intenta en un momento', 'UPSTREAM_RATE_LIMITED');
  }
  if (res.status === 404) return { status: 404, body: null };
  if (!res.ok) throw new HttpError(502, 'Error al consultar Open Food Facts', 'UPSTREAM_ERROR');

  return { status: res.status, body: (await res.json()) as T };
}

// ---------------------------------------------------------------------------
// Normalización
// ---------------------------------------------------------------------------

const clean = (s: string | undefined) => {
  // OFF marca los alérgenos con guiones bajos: "_leche_ en polvo"
  const v = s?.replace(/_/g, '').replace(/\s+/g, ' ').trim();
  return v ? v : null;
};

function flattenIngredients(list: OffIngredient[], depth = 0): ProductIngredient[] {
  if (depth > MAX_INGREDIENT_DEPTH) return [];
  return list.flatMap((ing) => {
    const text = clean(ing.text) ?? clean(ing.id?.replace(/^[a-z]{2}:/, '').replace(/-/g, ' '));
    const self: ProductIngredient[] = text ? [{ text, sourceId: ing.id, depth }] : [];
    return [...self, ...(ing.ingredients ? flattenIngredients(ing.ingredients, depth + 1) : [])];
  });
}

// Reexportado por compatibilidad: la implementación vive en lib/ingredients
export { splitIngredientsText };

function normalizeProduct(p: OffProduct, fallbackBarcode?: string): Product {
  const ingredientsText =
    clean(p.ingredients_text_es) ?? clean(p.ingredients_text) ?? clean(p.ingredients_text_en);

  const ingredients = p.ingredients?.length
    ? flattenIngredients(p.ingredients)
    : ingredientsText
      ? splitIngredientsText(ingredientsText)
      : [];

  return {
    barcode: p.code ?? fallbackBarcode ?? '',
    name:
      clean(p.product_name_es) ?? clean(p.product_name) ?? clean(p.generic_name) ?? 'Producto sin nombre',
    brand: clean(Array.isArray(p.brands) ? p.brands[0] : p.brands?.split(',')[0]),
    imageUrl: p.image_front_url ?? p.image_url ?? null,
    thumbnailUrl: p.image_front_small_url ?? p.image_front_url ?? null,
    ingredientsText,
    ingredients,
    allergenTags: p.allergens_tags ?? [],
    traceTags: p.traces_tags ?? [],
  };
}

// ---------------------------------------------------------------------------
// API pública del servicio
// ---------------------------------------------------------------------------

/** Busca un producto por código de barras (EAN/UPC). Devuelve null si no existe. */
export async function getProductByBarcode(barcode: string): Promise<Product | null> {
  const cached = productCache.get(barcode);
  if (cached !== undefined) return cached;

  const url = new URL(`/api/v2/product/${encodeURIComponent(barcode)}`, env.OFF_BASE_URL);
  url.searchParams.set('fields', FIELDS);

  const { body } = await offGet<OffProductResponse>(url);
  const product = body?.status === 1 && body.product ? normalizeProduct(body.product, barcode) : null;

  productCache.set(barcode, product);
  return product;
}

/** Búsqueda principal: Search-a-licious, el buscador actual de Open Food Facts. */
async function searchWithSearchalicious(query: string, page: number, pageSize: number): Promise<ProductSearchResult> {
  const url = new URL('/search', env.OFF_SEARCH_URL);
  url.searchParams.set('q', query);
  url.searchParams.set('langs', 'es,en');
  url.searchParams.set('page', String(page));
  url.searchParams.set('page_size', String(pageSize));
  url.searchParams.set('fields', SEARCH_FIELDS);

  const { body } = await offGet<SearchaliciousResponse>(url);
  const products = (body?.hits ?? []).filter((p) => p.code).map((p) => normalizeProduct(p));
  return { page, pageSize, total: body?.count ?? products.length, products };
}

/** Respaldo: la búsqueda clásica (/cgi/search.pl), que a veces responde 503. */
async function searchWithLegacyApi(query: string, page: number, pageSize: number): Promise<ProductSearchResult> {
  const url = new URL('/cgi/search.pl', env.OFF_BASE_URL);
  url.searchParams.set('search_terms', query);
  url.searchParams.set('search_simple', '1');
  url.searchParams.set('action', 'process');
  url.searchParams.set('json', '1');
  url.searchParams.set('page', String(page));
  url.searchParams.set('page_size', String(pageSize));
  url.searchParams.set('fields', FIELDS);

  const { body } = await offGet<OffSearchResponse>(url);
  const products = (body?.products ?? []).filter((p) => p.code).map((p) => normalizeProduct(p));

  // Esta API sí trae los ingredientes: sus resultados sirven como caché del detalle
  for (const p of products) if (p.ingredients.length && !productCache.get(p.barcode)) productCache.set(p.barcode, p);

  return { page, pageSize, total: body?.count ?? products.length, products };
}

/** Busca productos por nombre comercial / marca. */
export async function searchProductsByName(
  query: string,
  page = 1,
  pageSize = 20,
): Promise<ProductSearchResult> {
  const cacheKey = `${query.toLowerCase()}|${page}|${pageSize}`;
  const cached = searchCache.get(cacheKey);
  if (cached) return cached;

  let result: ProductSearchResult;
  try {
    result = await searchWithSearchalicious(query, page, pageSize);
  } catch (err) {
    console.warn('Search-a-licious falló, se usa la búsqueda clásica:', err instanceof Error ? err.message : err);
    result = await searchWithLegacyApi(query, page, pageSize);
  }

  searchCache.set(cacheKey, result);
  return result;
}
