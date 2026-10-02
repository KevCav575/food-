import type { Request, Response } from 'express';
import { ALL_ALLERGENS, ALLERGEN_CATALOG } from '../domain/allergens.js';

// Catálogo público para construir el selector de alergias en el frontend
const catalog = ALL_ALLERGENS.map((allergen) => ({
  allergen,
  label: ALLERGEN_CATALOG[allergen].label,
  aliases: ALLERGEN_CATALOG[allergen].aliases,
}));

export function listAllergens(_req: Request, res: Response) {
  res.set('Cache-Control', 'public, max-age=86400').json({ allergens: catalog });
}
