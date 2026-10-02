import { api } from './api.ts';
import type { ProductResponse, SearchResponse } from '../types/api.ts';

export const getProductByBarcode = (barcode: string, signal?: AbortSignal) =>
  api<ProductResponse>(`/products/barcode/${encodeURIComponent(barcode)}`, { signal });

export const searchProducts = (query: string, page = 1, signal?: AbortSignal) =>
  api<SearchResponse>(
    `/products/search?${new URLSearchParams({ q: query, page: String(page) })}`,
    { signal },
  );
