import { tesseractProvider } from './tesseract.provider.js';
import type { OcrProvider } from './ocr.types.js';

// Punto único para cambiar de motor de OCR
export const ocr: OcrProvider = tesseractProvider;

export { warmUpOcr, shutdownOcr } from './tesseract.provider.js';
export type { OcrResult } from './ocr.types.js';
