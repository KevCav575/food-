// Contratos de la API de food+ (reflejan backend/src/types y los servicios del backend)

export type Allergen =
  | 'GLUTEN'
  | 'CRUSTACEANS'
  | 'EGGS'
  | 'FISH'
  | 'PEANUTS'
  | 'SOYBEANS'
  | 'MILK'
  | 'NUTS'
  | 'CELERY'
  | 'MUSTARD'
  | 'SESAME_SEEDS'
  | 'SULPHITES'
  | 'LUPIN'
  | 'MOLLUSCS';

export interface AllergenRef {
  allergen: Allergen;
  label: string;
}

export interface UserProfile {
  id: string;
  email: string;
  name: string | null;
  plan: 'FREE' | 'PREMIUM';
  scanCount: number;
  scanLimit: number | null;
  scansRemaining: number | null;
  /** ISO: cuándo se recargan los escaneos gratuitos (null = tanda sin empezar o Premium) */
  scansResetAt: string | null;
  allergies: AllergenRef[];
  createdAt: string;
}

export interface Product {
  barcode: string;
  name: string;
  brand: string | null;
  imageUrl: string | null;
  thumbnailUrl: string | null;
  ingredientsText: string | null;
}

export type SafetyStatus = 'SAFE' | 'CAUTION' | 'DANGER' | 'UNKNOWN';

export type AnalysisWarning = 'NO_ALLERGIES_CONFIGURED' | 'NO_INGREDIENTS_DATA' | 'TRACES_DETECTED';

export interface AnalyzedIngredient {
  text: string;
  depth: number;
  detectedAllergens: Allergen[];
  triggeredBy: Allergen[];
  isDangerous: boolean;
  matchedTerms: string[];
}

export interface AllergenMatch extends AllergenRef {
  sources: ('INGREDIENTS' | 'PRODUCT_LABEL')[];
  ingredients: string[];
}

export interface Analysis {
  status: SafetyStatus;
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

export interface ProductResponse {
  product: Product;
  analysis: Analysis;
}

export interface SearchItem {
  barcode: string;
  name: string;
  brand: string | null;
  thumbnailUrl: string | null;
  /** null: el buscador no trae los ingredientes; el análisis completo se ve al abrir el producto */
  status: SafetyStatus | null;
  matchedAllergens: AllergenRef[];
}

export interface SearchResponse {
  page: number;
  pageSize: number;
  total: number;
  products: SearchItem[];
}

// --- Escaneo de ingredientes por OCR: POST /api/scan-ingredients (multipart, campo "image") ---

export interface IngredientScanResponse {
  scan: {
    id: string;
    /** Texto completo que devolvió el OCR */
    rawText: string;
    /** Sección de ingredientes extraída del texto (null si no se encontró el encabezado) */
    ingredientsText: string | null;
    /** Confianza media del OCR, 0–100 */
    confidence: number;
  };
  analysis: Analysis;
  /** Escaneos gratuitos restantes tras este escaneo (null = ilimitado) */
  scansRemaining: number | null;
}
