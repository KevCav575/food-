import rateLimit from 'express-rate-limit';

const base = {
  standardHeaders: 'draft-8' as const,
  legacyHeaders: false,
  message: { error: 'Demasiadas solicitudes, intenta más tarde.', code: 'RATE_LIMITED' },
};

// Límite general para toda la API
export const globalLimiter = rateLimit({ ...base, windowMs: 15 * 60 * 1000, limit: 300 });

// Login / registro: mitiga fuerza bruta y credential stuffing
export const authLimiter = rateLimit({
  ...base,
  windowMs: 15 * 60 * 1000,
  limit: 10,
  skipSuccessfulRequests: true,
});

// Búsqueda / escaneo: protege la cuota de Open Food Facts
export const searchLimiter = rateLimit({ ...base, windowMs: 60 * 1000, limit: 20 });

// OCR: cada imagen cuesta varios segundos de CPU
export const ocrLimiter = rateLimit({ ...base, windowMs: 60 * 1000, limit: 8 });
