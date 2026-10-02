import type { ErrorRequestHandler, RequestHandler } from 'express';
import { ZodError, z } from 'zod';
import multer from 'multer';
import { HttpError } from '../lib/httpError.js';
import { isProd } from '../config/env.js';

export const notFound: RequestHandler = (_req, res) => {
  res.status(404).json({ error: 'Recurso no encontrado', code: 'NOT_FOUND' });
};

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof ZodError) {
    res.status(400).json({
      error: 'Datos de entrada inválidos',
      code: 'VALIDATION_ERROR',
      details: z.flattenError(err).fieldErrors,
    });
    return;
  }

  if (err instanceof multer.MulterError) {
    const tooLarge = err.code === 'LIMIT_FILE_SIZE';
    res.status(tooLarge ? 413 : 400).json({
      error: tooLarge ? 'La imagen es demasiado grande' : 'Archivo inválido',
      code: tooLarge ? 'IMAGE_TOO_LARGE' : 'INVALID_UPLOAD',
    });
    return;
  }

  if (err instanceof HttpError) {
    res.status(err.status).json({ error: err.message, code: err.code });
    return;
  }

  console.error(err);
  // Nunca exponemos detalles internos en producción
  res.status(500).json({
    error: isProd ? 'Error interno del servidor' : String(err?.message ?? err),
    code: 'INTERNAL_ERROR',
  });
};
