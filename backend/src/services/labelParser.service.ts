import { ALLERGEN_CATALOG, detectAllergensInText } from '../domain/allergens.js';

export interface ParsedLabel {
  /** Texto del OCR limpio (saltos de línea unidos) */
  cleanText: string;
  /** Sección de ingredientes, o null si no se encontró el encabezado "Ingredientes" */
  ingredientsText: string | null;
  /** Etiquetas tipo Open Food Facts (en:milk…) de la declaración "Contiene: …" */
  allergenTags: string[];
  /** Etiquetas de "Puede contener…" / "Elaborado en una planta que procesa…" */
  traceTags: string[];
  /** Hay texto suficiente para analizar */
  hasText: boolean;
}

const HEADER = /\b(?:ingredientes|ingredients?|ingr[eé]dients|ingredienti)\b\s*[:;.\-–]?\s*/i;

// Lo que suele venir después de la lista de ingredientes en una etiqueta
const SECTION_END = new RegExp(
  [
    'informaci[oó]n nutri\\w*',
    'tabla nutri\\w*',
    'datos de nutrici[oó]n',
    'nutrition facts',
    'valor energ[eé]tico',
    'contenido neto',
    'cont\\.? net',
    'cons[eé]rv\\w+',
    'hecho en',
    '(?:elaborado|fabricado|envasado|distribuido|importado) (?:por|en)',
    'consumir preferentemente',
    'fecha de caducidad',
    'modo de (?:empleo|preparaci[oó]n)',
    'contiene\\s*:',
    'puede contener',
    'may contain',
    'contains\\s*:',
  ]
    .map((p) => `\\b${p}`)
    .join('|'),
  'i',
);

const CONTAINS = /\b(?:contiene|contains)\s*:\s*([^.\n]+)/gi;
const TRACES =
  /\b(?:puede contener(?:\s+trazas)?(?:\s+de)?|may contain(?:\s+traces of)?|(?:elaborad[oa]|producid[oa]|fabricad[oa]) en (?:una |la )?(?:planta|l[ií]nea|instalaci[oó]n)[^.\n]*?(?:procesa|maneja|utiliza)n?)\s*:?\s*([^.\n]+)/gi;

/** Une el texto del OCR: palabras cortadas con guion al final de línea y saltos de línea */
function cleanOcrText(raw: string): string {
  return raw
    .replace(/\r/g, '')
    .replace(/(\p{L})[-‐]\n\s*(\p{L})/gu, '$1$2')
    .replace(/\s*\n\s*/g, ' ')
    .replace(/[|]/g, 'l') // error típico de OCR
    .replace(/\s{2,}/g, ' ')
    .trim();
}

function tagsFrom(matches: Iterable<RegExpMatchArray>): string[] {
  const tags = new Set<string>();
  for (const m of matches) {
    for (const allergen of detectAllergensInText(m[1] ?? '').keys()) {
      tags.add(ALLERGEN_CATALOG[allergen].offTag);
    }
  }
  return [...tags];
}

export function parseLabelText(rawText: string): ParsedLabel {
  const cleanText = cleanOcrText(rawText);
  const letters = cleanText.match(/\p{L}/gu)?.length ?? 0;

  let ingredientsText: string | null = null;
  const header = HEADER.exec(cleanText);
  if (header) {
    const rest = cleanText.slice(header.index + header[0].length);
    const end = SECTION_END.exec(rest);
    const section = (end ? rest.slice(0, end.index) : rest).replace(/[\s.,;]+$/, '').trim();
    if (section.length >= 3) ingredientsText = section;
  }

  return {
    cleanText,
    ingredientsText,
    allergenTags: tagsFrom(cleanText.matchAll(CONTAINS)),
    traceTags: tagsFrom(cleanText.matchAll(TRACES)),
    hasText: letters >= 12,
  };
}
