import type { Allergen } from '@prisma/client';
import {
  allergenLabel,
  allergensFromOffTags,
  detectAllergensInText,
} from '../domain/allergens.js';
import type { Product } from '../types/product.js';

/**
 * SAFE     → no se detectó ningún alérgeno del perfil.
 * DANGER   → contiene al menos un alérgeno del perfil.
 * CAUTION  → no lo contiene, pero declara trazas ("puede contener") de un alérgeno del perfil.
 * UNKNOWN  → el producto no tiene datos de ingredientes suficientes: no podemos afirmar que es seguro.
 */
export type SafetyStatus = 'SAFE' | 'CAUTION' | 'DANGER' | 'UNKNOWN';

export type AnalysisWarning = 'NO_ALLERGIES_CONFIGURED' | 'NO_INGREDIENTS_DATA' | 'TRACES_DETECTED';

export type MatchSource = 'INGREDIENTS' | 'PRODUCT_LABEL';

export interface AnalyzedIngredient {
  text: string;
  depth: number;
  /** Todos los alérgenos detectados en este ingrediente (sean o no del perfil) */
  detectedAllergens: Allergen[];
  /** Alérgenos del perfil del usuario presentes en este ingrediente */
  triggeredBy: Allergen[];
  isDangerous: boolean;
  /** Términos que provocaron la coincidencia, útil para resaltar en la UI */
  matchedTerms: string[];
}

export interface AllergenMatch {
  allergen: Allergen;
  label: string;
  sources: MatchSource[];
  ingredients: string[];
}

export interface AllergenRef {
  allergen: Allergen;
  label: string;
}

export interface AnalysisResult {
  status: SafetyStatus;
  /** true solo cuando status === 'SAFE' */
  isSafe: boolean;
  summary: string;
  userAllergens: AllergenRef[];
  ingredients: AnalyzedIngredient[];
  triggeredIngredients: AnalyzedIngredient[];
  matchedAllergens: AllergenMatch[];
  traces: AllergenRef[];
  warnings: AnalysisWarning[];
  disclaimer: string;
}

export type AnalysisInput = Pick<Product, 'ingredients' | 'allergenTags' | 'traceTags'>;

const DISCLAIMER =
  'food+ es una herramienta orientativa basada en datos colaborativos de Open Food Facts. ' +
  'Verifica siempre la etiqueta del envase antes de consumir el producto.';

const ref = (allergen: Allergen): AllergenRef => ({ allergen, label: allergenLabel(allergen) });
const labels = (list: Allergen[]) => list.map(allergenLabel).join(', ');

export function analyzeProduct(product: AnalysisInput, userAllergenList: Allergen[]): AnalysisResult {
  const userAllergens = new Set(userAllergenList);
  const matches = new Map<Allergen, AllergenMatch>();

  const addMatch = (allergen: Allergen, source: MatchSource, ingredient?: string) => {
    const m = matches.get(allergen) ?? { ...ref(allergen), sources: [], ingredients: [] };
    if (!m.sources.includes(source)) m.sources.push(source);
    if (ingredient && !m.ingredients.includes(ingredient)) m.ingredients.push(ingredient);
    matches.set(allergen, m);
  };

  // 1) Ingrediente por ingrediente (texto + id taxonómico del proveedor)
  const ingredients: AnalyzedIngredient[] = product.ingredients.map((ing) => {
    const searchable = [ing.text, ing.sourceId?.replace(/^[a-z]{2}:/, '')].filter(Boolean).join(' ');
    const detected = detectAllergensInText(searchable);

    const detectedAllergens = [...detected.keys()];
    const triggeredBy = detectedAllergens.filter((a) => userAllergens.has(a));
    const matchedTerms = [...new Set(triggeredBy.flatMap((a) => detected.get(a) ?? []))];

    for (const a of triggeredBy) addMatch(a, 'INGREDIENTS', ing.text);

    return {
      text: ing.text,
      depth: ing.depth,
      detectedAllergens,
      triggeredBy,
      isDangerous: triggeredBy.length > 0,
      matchedTerms,
    };
  });

  // 2) Alérgenos declarados a nivel de producto (cubre ingredientes que el texto no menciona)
  for (const a of allergensFromOffTags(product.allergenTags)) {
    if (userAllergens.has(a)) addMatch(a, 'PRODUCT_LABEL');
  }

  // 3) Trazas: solo cuentan si no están ya confirmadas como contenido
  const traces = allergensFromOffTags(product.traceTags)
    .filter((a) => userAllergens.has(a) && !matches.has(a))
    .map(ref);

  // 4) Estado global
  const matchedAllergens = [...matches.values()];
  const hasIngredientData = ingredients.length > 0 || product.allergenTags.length > 0;

  const warnings: AnalysisWarning[] = [];
  if (userAllergens.size === 0) warnings.push('NO_ALLERGIES_CONFIGURED');
  if (!hasIngredientData) warnings.push('NO_INGREDIENTS_DATA');
  if (traces.length) warnings.push('TRACES_DETECTED');

  let status: SafetyStatus;
  let summary: string;
  if (matchedAllergens.length) {
    status = 'DANGER';
    summary = `Contiene alérgenos de tu perfil: ${labels(matchedAllergens.map((m) => m.allergen))}.`;
  } else if (!hasIngredientData) {
    status = 'UNKNOWN';
    summary = 'No hay información de ingredientes suficiente para evaluar este producto.';
  } else if (traces.length) {
    status = 'CAUTION';
    summary = `Puede contener trazas de: ${labels(traces.map((t) => t.allergen))}.`;
  } else {
    status = 'SAFE';
    summary =
      userAllergens.size === 0
        ? 'Configura tus alergias en tu perfil para obtener un análisis personalizado.'
        : 'No se detectaron alérgenos de tu perfil.';
  }

  return {
    status,
    isSafe: status === 'SAFE',
    summary,
    userAllergens: [...userAllergens].map(ref),
    ingredients,
    triggeredIngredients: ingredients.filter((i) => i.isDangerous),
    matchedAllergens,
    traces,
    warnings,
    disclaimer: DISCLAIMER,
  };
}
