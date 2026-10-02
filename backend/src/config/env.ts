import 'dotenv/config';
import { z } from 'zod';

// Valida las variables de entorno al arrancar: si falta algo, el proceso no inicia.
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  CORS_ORIGINS: z
    .string()
    .default('http://localhost:5173')
    .transform((v) => v.split(',').map((o) => o.trim()).filter(Boolean)),

  DATABASE_URL: z.string().url(),

  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_ACCESS_TTL: z
    .string()
    .regex(/^\d+[smh]$/, 'Formato esperado: 900s, 15m o 1h')
    .default('15m'),
  JWT_REFRESH_TTL_DAYS: z.coerce.number().int().positive().default(7),
  BCRYPT_ROUNDS: z.coerce.number().int().min(10).max(15).default(12),

  FREE_SCAN_LIMIT: z.coerce.number().int().nonnegative().default(5),
  // Los escaneos gratuitos se recargan este número de horas después del primero de cada tanda
  SCAN_WINDOW_HOURS: z.coerce.number().positive().default(5),

  // OCR (tesseract.js): idiomas de los modelos y tamaño máximo de subida
  OCR_LANGS: z.string().default('spa+eng'),
  MAX_UPLOAD_MB: z.coerce.number().positive().max(20).default(6),

  OFF_BASE_URL: z.string().url().default('https://world.openfoodfacts.org'),
  // Buscador por nombre recomendado por Open Food Facts (Search-a-licious)
  OFF_SEARCH_URL: z.string().url().default('https://search.openfoodfacts.org'),
  OFF_USER_AGENT: z.string().default('food+/0.1'),

  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  STRIPE_PRICE_ID: z.string().optional(),
  FRONTEND_URL: z.string().url().default('http://localhost:5173'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Variables de entorno inválidas:', z.flattenError(parsed.error).fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
export const isProd = env.NODE_ENV === 'production';
