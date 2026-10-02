import multer from 'multer';
import { env } from '../config/env.js';
import { HttpError } from '../lib/httpError.js';

const ALLOWED = new Set(['image/jpeg', 'image/png', 'image/webp']);

// En memoria: la imagen se procesa y se descarta, nunca se escribe a disco
export const uploadImage = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: env.MAX_UPLOAD_MB * 1024 * 1024, files: 1, fields: 5 },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED.has(file.mimetype)) cb(null, true);
    else cb(new HttpError(415, 'Formato no compatible: usa JPG, PNG o WebP', 'UNSUPPORTED_IMAGE'));
  },
}).single('image');
