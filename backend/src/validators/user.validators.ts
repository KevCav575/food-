import { z } from 'zod';
import type { Allergen } from '@prisma/client';
import { resolveAllergen } from '../domain/allergens.js';

export const updateProfileSchema = z.object({
  name: z.string().trim().min(1).max(100).nullable(),
});

/**
 * Acepta tanto claves del enum ("GLUTEN", "MILK") como términos en español/inglés
 * ("lactosa", "maní", "cacahuate", "mariscos") y los resuelve al enum `Allergen`.
 */
export const updateAllergiesSchema = z
  .object({
    allergies: z.array(z.string().trim().min(1).max(50)).max(30),
  })
  .transform(({ allergies }, ctx) => {
    const resolved = new Set<Allergen>();
    const unknown: string[] = [];

    for (const input of allergies) {
      const allergen = resolveAllergen(input);
      if (allergen) resolved.add(allergen);
      else unknown.push(input);
    }

    if (unknown.length) {
      ctx.addIssue({
        code: 'custom',
        path: ['allergies'],
        message: `Alergias no reconocidas: ${unknown.join(', ')}. Consulta GET /api/allergens.`,
      });
      return z.NEVER;
    }
    return [...resolved];
  });

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
