import path from 'node:path';
import { mkdirSync } from 'node:fs';
import sharp from 'sharp';
import { createWorker, PSM, type Worker } from 'tesseract.js';
import { env } from '../../config/env.js';
import { HttpError } from '../../lib/httpError.js';
import type { OcrProvider, OcrResult } from './ocr.types.js';

// Los modelos de idioma (~15 MB c/u) se descargan la primera vez y quedan en caché aquí
const CACHE_DIR = path.resolve('.ocr-cache');

/**
 * Mejora la foto para el OCR: corrige orientación EXIF, pasa a escala de grises,
 * estira el contraste y enfoca. Además valida que el archivo sea realmente una imagen.
 */
async function preprocess(image: Buffer): Promise<Buffer> {
  try {
    return await sharp(image, { limitInputPixels: 40_000_000 })
      .rotate()
      .resize({ width: 2200, height: 2200, fit: 'inside', withoutEnlargement: true })
      .greyscale()
      .normalize()
      .sharpen()
      .png()
      .toBuffer();
  } catch {
    throw new HttpError(415, 'El archivo no es una imagen válida', 'UNSUPPORTED_IMAGE');
  }
}

let workerPromise: Promise<Worker> | null = null;

/** Un solo worker reutilizado: crearlo cuesta ~1 s y procesa las peticiones en cola */
function getWorker(): Promise<Worker> {
  workerPromise ??= (async () => {
    mkdirSync(CACHE_DIR, { recursive: true });
    const worker = await createWorker(env.OCR_LANGS.split('+'), undefined, { cachePath: CACHE_DIR });
    // Bloque de texto automático; conserva espacios entre palabras
    await worker.setParameters({ tessedit_pageseg_mode: PSM.AUTO, preserve_interword_spaces: '1' });
    return worker;
  })().catch((err) => {
    workerPromise = null; // permite reintentar si falló la descarga del modelo
    throw err;
  });
  return workerPromise;
}

export const tesseractProvider: OcrProvider = {
  async recognize(image: Buffer): Promise<OcrResult> {
    const prepared = await preprocess(image);
    const worker = await getWorker();
    const { data } = await worker.recognize(prepared);
    return { text: data.text ?? '', confidence: data.confidence ?? 0 };
  },
};

/** Precarga el modelo al arrancar para que el primer usuario no espere la descarga */
export function warmUpOcr(): void {
  getWorker().catch((err) => console.error('No se pudo iniciar el OCR:', err));
}

export async function shutdownOcr(): Promise<void> {
  if (workerPromise) await (await workerPromise).terminate().catch(() => undefined);
}
