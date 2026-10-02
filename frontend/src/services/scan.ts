import { api } from './api.ts';
import type { IngredientScanResponse } from '../types/api.ts';

/** Envía la foto (ya comprimida) como multipart/form-data: ~33 % menos peso que Base64. */
export function scanIngredients(image: Blob, signal?: AbortSignal) {
  const form = new FormData();
  form.append('image', image, 'ingredientes.jpg');
  return api<IngredientScanResponse>('/scan-ingredients', { method: 'POST', body: form, signal });
}
