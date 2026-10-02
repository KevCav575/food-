import type { Request, Response } from 'express';
import { getUserId } from '../middlewares/requireAuth.js';
import { HttpError } from '../lib/httpError.js';
import { barcodeParamsSchema, searchQuerySchema } from '../validators/product.validators.js';
import { getProductByBarcode, searchProductsByName } from '../services/openFoodFacts.service.js';
import { analyzeProduct } from '../services/allergenAnalysis.service.js';
import { getUserAllergens } from '../services/user.service.js';
import { recordScan } from '../services/scan.service.js';
import { assertCanScan, consumeScan } from '../services/quota.service.js';

/** GET /api/products/barcode/:barcode — producto completo + análisis de alérgenos */
export async function getByBarcode(req: Request, res: Response) {
  const { barcode } = barcodeParamsSchema.parse(req.params);
  const userId = getUserId(req);
  await assertCanScan(userId);

  const [product, userAllergens] = await Promise.all([
    getProductByBarcode(barcode),
    getUserAllergens(userId),
  ]);
  if (!product) throw new HttpError(404, 'Producto no encontrado', 'PRODUCT_NOT_FOUND');

  const analysis = analyzeProduct(product, userAllergens);
  // Solo se cobra el escaneo si hubo resultado (un "no encontrado" no consume cupo)
  const scansRemaining = await consumeScan(userId);

  await recordScan({
    userId,
    type: 'BARCODE',
    barcode,
    productName: product.name,
    isSafe: analysis.isSafe,
    matchedAllergens: analysis.matchedAllergens.map((m) => m.allergen),
  });

  res.json({ product, analysis, scansRemaining });
}

/** GET /api/products/search?q=…&page=… — lista ligera con el estado de cada resultado */
export async function search(req: Request, res: Response) {
  const { q, page } = searchQuerySchema.parse(req.query);
  const userId = getUserId(req);
  await assertCanScan(userId);

  const [result, userAllergens] = await Promise.all([
    searchProductsByName(q, page),
    getUserAllergens(userId),
  ]);

  const products = result.products.map((product) => {
    const analysis = analyzeProduct(product, userAllergens);
    // Sin la lista de ingredientes solo podemos afirmar lo que la etiqueta declara (alérgenos y
    // trazas). Nunca se marca "seguro" sin ver los ingredientes: eso lo decide el detalle.
    const conclusive =
      product.ingredients.length > 0 || analysis.status === 'DANGER' || analysis.status === 'CAUTION';
    return {
      barcode: product.barcode,
      name: product.name,
      brand: product.brand,
      thumbnailUrl: product.thumbnailUrl,
      status: conclusive ? analysis.status : null,
      matchedAllergens: analysis.matchedAllergens.map(({ allergen, label }) => ({ allergen, label })),
    };
  });

  const scansRemaining = await consumeScan(userId);
  await recordScan({ userId, type: 'SEARCH', query: q });

  res.json({ page: result.page, pageSize: result.pageSize, total: result.total, products, scansRemaining });
}
