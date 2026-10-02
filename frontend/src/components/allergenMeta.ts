import type { Allergen } from '../types/api.ts';

// Datos de presentación: ícono reconocible de un vistazo y ejemplos de dónde aparece cada alérgeno.
// La etiqueta oficial viene del backend (GET /api/allergens).
export const ALLERGEN_META: Record<Allergen, { emoji: string; hint: string }> = {
  GLUTEN: { emoji: '🌾', hint: 'Trigo, cebada, centeno, avena' },
  MILK: { emoji: '🥛', hint: 'Leche, lactosa, queso, mantequilla' },
  PEANUTS: { emoji: '🥜', hint: 'Cacahuate, maní, crema de cacahuate' },
  NUTS: { emoji: '🌰', hint: 'Almendra, nuez, avellana, pistache' },
  EGGS: { emoji: '🥚', hint: 'Huevo, albúmina, mayonesa' },
  SOYBEANS: { emoji: '🫘', hint: 'Soya, tofu, lecitina de soya' },
  FISH: { emoji: '🐟', hint: 'Atún, salmón, anchoa, surimi' },
  CRUSTACEANS: { emoji: '🦐', hint: 'Camarón, langosta, cangrejo, jaiba' },
  MOLLUSCS: { emoji: '🦑', hint: 'Calamar, pulpo, mejillón, ostión' },
  SESAME_SEEDS: { emoji: '🥯', hint: 'Ajonjolí, tahini' },
  CELERY: { emoji: '🥬', hint: 'Apio y apionabo' },
  MUSTARD: { emoji: '🌭', hint: 'Mostaza y salsas que la contienen' },
  SULPHITES: { emoji: '🍷', hint: 'Vino, frutos secos deshidratados, E220–E228' },
  LUPIN: { emoji: '🌼', hint: 'Harina de altramuz o lupino' },
};

// Orden de presentación: primero los más frecuentes
export const ALLERGEN_ORDER = Object.keys(ALLERGEN_META) as Allergen[];
