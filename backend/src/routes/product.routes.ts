import { Router } from 'express';
import * as product from '../controllers/product.controller.js';

// Montado en /api/products detrás de requireAuth + searchLimiter
export const productRouter = Router();

productRouter.get('/search', product.search);
productRouter.get('/barcode/:barcode', product.getByBarcode);
