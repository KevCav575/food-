import type { ProductIngredient } from '../types/product.js';

/**
 * Separa un texto de ingredientes por comas/punto y coma de primer nivel,
 * respetando paréntesis y decimales ("cacao 2,5%").
 */
export function splitIngredientsText(text: string): ProductIngredient[] {
  const parts: string[] = [];
  let depth = 0;
  let current = '';

  for (let i = 0; i < text.length; i++) {
    const ch = text[i]!;
    if ('([{'.includes(ch)) depth++;
    else if (')]}'.includes(ch)) depth = Math.max(0, depth - 1);

    const isDecimalComma = ch === ',' && /\d/.test(text[i - 1] ?? '') && /\d/.test(text[i + 1] ?? '');
    if ((ch === ',' || ch === ';') && depth === 0 && !isDecimalComma) {
      parts.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  parts.push(current);

  return parts
    .map((p) => p.replace(/_/g, '').replace(/\s+/g, ' ').replace(/\.\s*$/, '').trim())
    .filter(Boolean)
    .map((text) => ({ text, depth: 0 }));
}
