// Modelo de producto normalizado e independiente del proveedor (Open Food Facts u otro).

export interface ProductIngredient {
  text: string;
  /** Id taxonómico del proveedor, ej. "en:whole-milk-powder" */
  sourceId?: string;
  /** 0 = ingrediente principal, 1+ = sub-ingrediente (ej. dentro de "chocolate (…)") */
  depth: number;
}

export interface Product {
  barcode: string;
  name: string;
  brand: string | null;
  imageUrl: string | null;
  thumbnailUrl: string | null;
  /** Texto crudo de ingredientes tal como aparece en la etiqueta */
  ingredientsText: string | null;
  ingredients: ProductIngredient[];
  /** Alérgenos declarados por el proveedor, ej. ["en:milk", "en:gluten"] */
  allergenTags: string[];
  /** "Puede contener trazas de…", ej. ["en:nuts"] */
  traceTags: string[];
}

export interface ProductSearchResult {
  page: number;
  pageSize: number;
  total: number;
  products: Product[];
}
