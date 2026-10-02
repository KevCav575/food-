import type { CookieOptions, Response } from 'express';
import { isProd } from '../config/env.js';
import type { IssuedTokens } from '../services/token.service.js';

export const ACCESS_COOKIE = 'fp_access';
export const REFRESH_COOKIE = 'fp_refresh';

// El refresh token solo viaja a /api/auth, nunca al resto de la API
const REFRESH_PATH = '/api/auth';

const base: CookieOptions = {
  httpOnly: true, // inaccesible desde JavaScript (mitiga XSS)
  secure: isProd, // solo HTTPS en producción
  sameSite: 'strict', // no se envía en peticiones cross-site (mitiga CSRF)
};

export function setAuthCookies(res: Response, tokens: IssuedTokens): void {
  res.cookie(ACCESS_COOKIE, tokens.accessToken, {
    ...base,
    path: '/api',
    expires: tokens.accessExpiresAt,
  });
  res.cookie(REFRESH_COOKIE, tokens.refreshToken, {
    ...base,
    path: REFRESH_PATH,
    expires: tokens.refreshExpiresAt,
  });
}

export function clearAuthCookies(res: Response): void {
  res.clearCookie(ACCESS_COOKIE, { ...base, path: '/api' });
  res.clearCookie(REFRESH_COOKIE, { ...base, path: REFRESH_PATH });
}
