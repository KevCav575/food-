import { z } from 'zod';

export const barcodeParamsSchema = z.object({
  // EAN-8, UPC-A (12), EAN-13 y GTIN-14
  barcode: z.string().regex(/^\d{8,14}$/, 'Código de barras inválido (8 a 14 dígitos)'),
});

export const searchQuerySchema = z.object({
  q: z
    .string()
    .trim()
    .min(2, 'Escribe al menos 2 caracteres')
    .max(100)
    .regex(/^[\p{L}\p{N}\s'&.,-]+$/u, 'La búsqueda contiene caracteres no permitidos'),
  page: z.coerce.number().int().min(1).max(50).default(1),
});
