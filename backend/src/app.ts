import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { env } from './config/env.js';
import { globalLimiter } from './middlewares/rateLimiters.js';
import { errorHandler, notFound } from './middlewares/errorHandler.js';
import { apiRouter } from './routes/index.js';

export function createApp() {
  const app = express();

  app.disable('x-powered-by');
  app.set('trust proxy', 1); // necesario para que el rate limiter vea la IP real detrás de un proxy

  app.use(helmet());
  app.use(
    cors({
      // CORS restrictivo: solo los orígenes de la lista blanca, con credenciales (cookies)
      origin: (origin, cb) => {
        if (!origin || env.CORS_ORIGINS.includes(origin)) return cb(null, true);
        cb(new Error('Origen no permitido por CORS'));
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
      allowedHeaders: ['Content-Type'],
    }),
  );

  // Fase 4: el webhook de Stripe necesita el body sin parsear y se monta ANTES de express.json()
  app.use(express.json({ limit: '10kb' }));
  app.use(cookieParser());
  app.use('/api', globalLimiter, apiRouter);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
