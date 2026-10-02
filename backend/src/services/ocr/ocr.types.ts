export interface OcrResult {
  text: string;
  /** Confianza media, 0–100 */
  confidence: number;
}

/**
 * Contrato del motor de OCR. Hoy se usa tesseract.js (local, gratuito); para cambiar a un
 * servicio en la nube (Google Cloud Vision, AWS Textract…) basta otra implementación.
 */
export interface OcrProvider {
  recognize(image: Buffer): Promise<OcrResult>;
}
