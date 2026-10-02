import type { Request, Response } from 'express';
import { getUserId } from '../middlewares/requireAuth.js';
import { HttpError } from '../lib/httpError.js';
import { splitIngredientsText } from '../lib/ingredients.js';
import { ocr } from '../services/ocr/index.js';
import { parseLabelText } from '../services/labelParser.service.js';
import { analyzeProduct } from '../services/allergenAnalysis.service.js';
import { getUserAllergens } from '../services/user.service.js';
import { assertCanScan, consumeScan } from '../services/quota.service.js';
import { recordScan } from '../services/scan.service.js';

/** POST /api/scan-ingredients — multipart con el campo "image" */
export async function scanIngredients(req: Request, res: Response) {
  const userId = getUserId(req);
  if (!req.file) throw new HttpError(400, 'Adjunta una foto de los ingredientes', 'IMAGE_REQUIRED');

  await assertCanScan(userId);

  const [ocrResult, userAllergens] = await Promise.all([
    ocr.recognize(req.file.buffer),
    getUserAllergens(userId),
  ]);

  const label = parseLabelText(ocrResult.text);
  if (!label.hasText) {
    throw new HttpError(422, 'No se detectó texto legible en la foto', 'NO_TEXT_DETECTED');
  }

  // Si no se encontró el encabezado "Ingredientes", se analiza todo el texto leído
  const analysis = analyzeProduct(
    {
      ingredients: splitIngredientsText(label.ingredientsText ?? label.cleanText),
      allergenTags: label.allergenTags,
      traceTags: label.traceTags,
    },
    userAllergens,
  );

  // Una lectura fallida no consume cupo; una exitosa sí (de forma atómica)
  const scansRemaining = await consumeScan(userId);

  const id = await recordScan({
    userId,
    type: 'OCR',
    query: label.ingredientsText?.slice(0, 200),
    isSafe: analysis.isSafe,
    matchedAllergens: analysis.matchedAllergens.map((m) => m.allergen),
  });

  res.json({
    scan: {
      id,
      rawText: ocrResult.text.trim(),
      ingredientsText: label.ingredientsText,
      confidence: ocrResult.confidence,
    },
    analysis,
    scansRemaining,
  });
}
