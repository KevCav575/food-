import type { Request, RequestHandler } from 'express';
import { ACCESS_COOKIE } from '../lib/authCookies.js';
import { HttpError } from '../lib/httpError.js';
import { verifyAccessToken } from '../services/token.service.js';

export const requireAuth: RequestHandler = (req, _res, next) => {
  const token: unknown = req.cookies?.[ACCESS_COOKIE];
  if (typeof token !== 'string' || !token) {
    return next(new HttpError(401, 'No autenticado', 'UNAUTHENTICATED'));
  }
  req.user = { id: verifyAccessToken(token) };
  next();
};

/** Devuelve el id del usuario autenticado (usar solo en rutas protegidas por requireAuth). */
export function getUserId(req: Request): string {
  if (!req.user) throw new HttpError(401, 'No autenticado', 'UNAUTHENTICATED');
  return req.user.id;
}
