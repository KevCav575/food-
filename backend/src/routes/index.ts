import { Router } from 'express';
import { healthRouter } from './health.routes.js';
import { authRouter } from './auth.routes.js';
import { userRouter } from './user.routes.js';
import { productRouter } from './product.routes.js';
import { listAllergens } from '../controllers/allergen.controller.js';
import { requireAuth } from '../middlewares/requireAuth.js';
import { ocrLimiter, searchLimiter } from '../middlewares/rateLimiters.js';
import { uploadImage } from '../middlewares/upload.js';
import { scanIngredients } from '../controllers/scanIngredients.controller.js';

export const apiRouter = Router();

apiRouter.use('/health', healthRouter);
apiRouter.get('/allergens', listAllergens);
apiRouter.use('/auth', authRouter);
apiRouter.use('/users/me', requireAuth, userRouter);
apiRouter.use('/products', requireAuth, searchLimiter, productRouter);
apiRouter.post('/scan-ingredients', requireAuth, ocrLimiter, uploadImage, scanIngredients);
// Fase 4: apiRouter.use('/billing', requireAuth, billingRouter);
