import { Allergen } from '@prisma/client';
import { escapeRegExp, normalizeText } from '../lib/text.js';

interface AllergenDefinition {
  label: string;
  /** Etiqueta equivalente en `allergens_tags` / `traces_tags` de Open Food Facts */
  offTag: string;
  /** Términos que el usuario puede enviar para seleccionar este alérgeno */
  aliases: string[];
  /** Términos que delatan el alérgeno en un ingrediente (ES / EN / FR; acentos opcionales) */
  keywords: string[];
  /** Frases que contienen una keyword pero NO implican el alérgeno (ej. "leche de coco") */
  exclusions?: string[];
}

export const ALLERGEN_CATALOG: Record<Allergen, AllergenDefinition> = {
  GLUTEN: {
    label: 'Gluten',
    offTag: 'en:gluten',
    aliases: ['gluten', 'trigo', 'celiaco', 'celiaquia', 'wheat'],
    keywords: [
      'gluten', 'trigo', 'cebada', 'centeno', 'avena', 'espelta', 'kamut', 'triticale', 'semola',
      'malta', 'seitan', 'cuscus', 'bulgur',
      'wheat', 'barley', 'rye', 'oat', 'oats', 'spelt', 'malt', 'durum', 'couscous',
      'ble', 'orge', 'seigle', 'avoine', 'epeautre',
    ],
    exclusions: [
      'sin gluten', 'libre de gluten', 'gluten free', 'sans gluten',
      'trigo sarraceno', 'ble noir', 'semola de maiz', 'semola de arroz',
    ],
  },
  CRUSTACEANS: {
    label: 'Crustáceos',
    offTag: 'en:crustaceans',
    aliases: ['crustaceos', 'mariscos', 'camaron', 'crustaceans', 'shellfish'],
    keywords: [
      'crustaceo', 'camaron', 'gamba', 'langostino', 'langosta', 'cangrejo', 'jaiba', 'centolla',
      'cigala', 'bogavante', 'krill',
      'crustacean', 'shrimp', 'prawn', 'crab', 'lobster', 'crayfish',
      'crevette', 'crabe', 'homard',
    ],
  },
  EGGS: {
    label: 'Huevo',
    offTag: 'en:eggs',
    aliases: ['huevo', 'huevos', 'egg', 'eggs'],
    keywords: [
      'huevo', 'yema', 'ovoalbumina', 'lisozima', 'mayonesa',
      'egg', 'albumen', 'mayonnaise',
      'oeuf',
    ],
  },
  FISH: {
    label: 'Pescado',
    offTag: 'en:fish',
    aliases: ['pescado', 'pescados', 'fish'],
    keywords: [
      'pescado', 'atun', 'salmon', 'bacalao', 'merluza', 'sardina', 'anchoa', 'boqueron', 'trucha',
      'caballa', 'arenque', 'tilapia', 'surimi', 'worcestershire',
      'fish', 'tuna', 'cod', 'anchovy', 'anchovies', 'sardine', 'mackerel', 'herring', 'trout',
      'poisson', 'thon', 'saumon', 'morue',
    ],
  },
  PEANUTS: {
    label: 'Cacahuate / Maní',
    offTag: 'en:peanuts',
    aliases: ['cacahuate', 'cacahuete', 'mani', 'peanut', 'peanuts'],
    keywords: ['cacahuate', 'cacahuete', 'mani', 'peanut', 'groundnut', 'arachide', 'arachis'],
  },
  SOYBEANS: {
    label: 'Soya',
    offTag: 'en:soybeans',
    aliases: ['soya', 'soja', 'soy', 'soybeans'],
    keywords: ['soya', 'soja', 'tofu', 'edamame', 'tempeh', 'miso', 'soy', 'soybean'],
  },
  MILK: {
    label: 'Leche y lactosa',
    offTag: 'en:milk',
    aliases: ['leche', 'lactosa', 'lacteos', 'milk', 'lactose', 'dairy'],
    keywords: [
      'leche', 'lacteo', 'lactosa', 'lactosuero', 'caseina', 'caseinato', 'mantequilla', 'nata',
      'crema acida', 'queso', 'yogur', 'yogurt', 'kefir', 'ghee', 'requeson', 'grasa butirica',
      'lactoalbumina', 'lactoglobulina',
      'milk', 'lactose', 'whey', 'casein', 'caseinate', 'butter', 'buttermilk', 'cream', 'cheese',
      'yoghurt',
      'lait', 'lactoserum', 'beurre', 'fromage',
    ],
    exclusions: [
      'leche de coco', 'leche de almendra', 'leche de almendras', 'leche de soya', 'leche de soja',
      'leche de avena', 'leche de arroz', 'manteca de cacao', 'mantequilla de cacao',
      'mantequilla de cacahuate', 'mantequilla de cacahuete', 'mantequilla de mani',
      'coconut milk', 'cocoa butter', 'peanut butter', 'shea butter', 'cream of tartar',
      'lait de coco', 'beurre de cacao',
    ],
  },
  NUTS: {
    label: 'Frutos de cáscara',
    offTag: 'en:nuts',
    aliases: ['frutos secos', 'frutos de cascara', 'nueces', 'nuez', 'nuts', 'tree nuts'],
    keywords: [
      'almendra', 'avellana', 'nuez', 'nueces', 'anacardo', 'maranon', 'pistache', 'pistacho',
      'pacana', 'macadamia', 'castana de caju',
      'almond', 'hazelnut', 'walnut', 'cashew', 'pecan', 'pistachio', 'nut',
      'amande', 'noisette', 'noix',
    ],
    exclusions: ['nuez moscada', 'nuez de coco', 'noix de coco', 'noix de muscade'],
  },
  CELERY: {
    label: 'Apio',
    offTag: 'en:celery',
    aliases: ['apio', 'celery'],
    keywords: ['apio', 'apionabo', 'celery', 'celeri'],
  },
  MUSTARD: {
    label: 'Mostaza',
    offTag: 'en:mustard',
    aliases: ['mostaza', 'mustard'],
    keywords: ['mostaza', 'mustard', 'moutarde'],
  },
  SESAME_SEEDS: {
    label: 'Sésamo / Ajonjolí',
    offTag: 'en:sesame-seeds',
    aliases: ['sesamo', 'ajonjoli', 'sesame'],
    keywords: ['sesamo', 'ajonjoli', 'tahini', 'tahina', 'gomasio', 'sesame'],
  },
  SULPHITES: {
    label: 'Sulfitos',
    offTag: 'en:sulphur-dioxide-and-sulphites',
    aliases: ['sulfitos', 'sulfito', 'sulphites', 'sulfites'],
    keywords: [
      'sulfito', 'metabisulfito', 'bisulfito', 'dioxido de azufre', 'anhidrido sulfuroso',
      'sulphite', 'sulfite', 'metabisulphite', 'sulphur dioxide', 'sulfur dioxide',
      'e220', 'e221', 'e222', 'e223', 'e224', 'e225', 'e226', 'e227', 'e228',
    ],
  },
  LUPIN: {
    label: 'Altramuz',
    offTag: 'en:lupin',
    aliases: ['altramuz', 'lupino', 'lupin'],
    keywords: ['altramuz', 'altramuces', 'lupino', 'lupin', 'lupine'],
  },
  MOLLUSCS: {
    label: 'Moluscos',
    offTag: 'en:molluscs',
    aliases: ['moluscos', 'molusco', 'molluscs'],
    keywords: [
      'molusco', 'calamar', 'pulpo', 'sepia', 'jibia', 'mejillon', 'almeja', 'ostra', 'ostion',
      'vieira', 'berberecho', 'caracol', 'abulon',
      'mollusc', 'mollusk', 'squid', 'octopus', 'cuttlefish', 'mussel', 'clam', 'oyster', 'scallop',
      'snail', 'abalone',
      'calmar', 'poulpe', 'moule', 'huitre', 'escargot',
    ],
  },
};

export const ALL_ALLERGENS = Object.keys(ALLERGEN_CATALOG) as Allergen[];

export const allergenLabel = (a: Allergen) => ALLERGEN_CATALOG[a].label;

// ---------------------------------------------------------------------------
// Matchers precompilados (una sola RegExp por alérgeno)
// ---------------------------------------------------------------------------

interface CompiledMatcher {
  allergen: Allergen;
  pattern: RegExp;
  exclusion: RegExp | null;
}

const toPhrasePattern = (terms: string[]) =>
  terms
    .map(normalizeText)
    .sort((a, b) => b.length - a.length) // la frase más larga gana
    .map(escapeRegExp)
    .join('|');

const MATCHERS: CompiledMatcher[] = ALL_ALLERGENS.map((allergen) => {
  const def = ALLERGEN_CATALOG[allergen];
  return {
    allergen,
    // Palabra completa, con plural opcional (-s / -es)
    pattern: new RegExp(`(?:^| )(${toPhrasePattern(def.keywords)})(?:es|s)?(?= |$)`, 'g'),
    exclusion: def.exclusions?.length
      ? new RegExp(`(?<= )(?:${toPhrasePattern(def.exclusions)})(?= )`, 'g')
      : null,
  };
});

const OFF_TAG_TO_ALLERGEN = new Map<string, Allergen>(
  ALL_ALLERGENS.map((a) => [ALLERGEN_CATALOG[a].offTag, a]),
);

const ALIAS_TO_ALLERGEN = new Map<string, Allergen>(
  ALL_ALLERGENS.flatMap((a) => [
    [normalizeText(a), a] as const,
    ...ALLERGEN_CATALOG[a].aliases.map((alias) => [normalizeText(alias), a] as const),
  ]),
);

/** Resuelve la entrada del usuario ("GLUTEN", "lactosa", "maní", "cacahuate") a un Allergen. */
export function resolveAllergen(input: string): Allergen | null {
  return ALIAS_TO_ALLERGEN.get(normalizeText(input)) ?? null;
}

/** Convierte etiquetas de Open Food Facts (en:milk, en:gluten…) en Allergen; ignora las desconocidas. */
export function allergensFromOffTags(tags: string[]): Allergen[] {
  const out = new Set<Allergen>();
  for (const tag of tags) {
    const a = OFF_TAG_TO_ALLERGEN.get(tag.toLowerCase());
    if (a) out.add(a);
  }
  return [...out];
}

/**
 * Detecta qué alérgenos aparecen en un texto de ingrediente.
 * Devuelve cada alérgeno detectado con los términos exactos que lo activaron.
 */
export function detectAllergensInText(text: string): Map<Allergen, string[]> {
  const found = new Map<Allergen, string[]>();
  const normalized = normalizeText(text);
  if (!normalized) return found;

  for (const { allergen, pattern, exclusion } of MATCHERS) {
    // Las frases excluidas se borran antes de buscar keywords ("leche de coco" no es leche)
    let haystack = ` ${normalized} `;
    if (exclusion) haystack = haystack.replace(exclusion, (m) => ' '.repeat(m.length));

    const terms = new Set<string>();
    for (const m of haystack.matchAll(pattern)) terms.add(m[1]!);
    if (terms.size) found.set(allergen, [...terms]);
  }
  return found;
}
