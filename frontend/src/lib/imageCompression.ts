// Comprime una foto en el navegador antes de subirla. Una foto de celular pesa 3–8 MB; para OCR
// basta con ~2000 px en el lado largo (texto pequeño legible) y JPEG ≤ 1 MB.

export interface CompressOptions {
  /** Lado más largo máximo, en píxeles */
  maxDimension?: number;
  /** Tamaño objetivo; se baja la calidad (y si hace falta la resolución) hasta cumplirlo */
  maxBytes?: number;
  initialQuality?: number;
  minQuality?: number;
}

export class UnsupportedImageError extends Error {}

const toBlob = (canvas: HTMLCanvasElement, quality: number) =>
  new Promise<Blob>((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('toBlob falló'))), 'image/jpeg', quality),
  );

/** Decodifica la imagen respetando la orientación EXIF (fotos verticales de celular) */
async function decode(input: Blob): Promise<ImageBitmap | HTMLImageElement> {
  try {
    return await createImageBitmap(input, { imageOrientation: 'from-image' });
  } catch {
    // Safari antiguo / formatos que createImageBitmap no acepta: se intenta con <img>
    const url = URL.createObjectURL(input);
    try {
      const img = new Image();
      img.src = url;
      await img.decode();
      return img;
    } catch {
      throw new UnsupportedImageError('Formato de imagen no compatible');
    } finally {
      URL.revokeObjectURL(url);
    }
  }
}

export async function compressImage(input: Blob, options: CompressOptions = {}): Promise<Blob> {
  const { maxDimension = 2000, maxBytes = 1_000_000, initialQuality = 0.85, minQuality = 0.55 } = options;

  const source = await decode(input);
  const width = 'naturalWidth' in source ? source.naturalWidth : source.width;
  const height = 'naturalHeight' in source ? source.naturalHeight : source.height;

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new UnsupportedImageError('El navegador no puede procesar imágenes');

  let scale = Math.min(1, maxDimension / Math.max(width, height));
  let result: Blob | null = null;

  try {
    // Hasta 3 reducciones de resolución; en cada una se prueba bajando la calidad
    for (let attempt = 0; attempt < 3; attempt++) {
      canvas.width = Math.round(width * scale);
      canvas.height = Math.round(height * scale);
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(source, 0, 0, canvas.width, canvas.height);

      for (let q = initialQuality; q >= minQuality - 1e-9; q -= 0.1) {
        result = await toBlob(canvas, q);
        if (result.size <= maxBytes) return result;
      }
      scale *= 0.8;
    }
    return result!; // el mejor esfuerzo, aunque supere maxBytes
  } finally {
    if ('close' in source) source.close();
  }
}
