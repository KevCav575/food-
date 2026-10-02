// Normaliza texto para comparar ingredientes: minúsculas, sin acentos, solo [a-z0-9] separados
// por un espacio. Une los aditivos "E-220" / "E 220" en "e220".
export function normalizeText(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\be (\d{3}[a-z]?)\b/g, 'e$1')
    .trim();
}

export function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
