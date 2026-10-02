import crypto from 'node:crypto';
import jwt, { type SignOptions } from 'jsonwebtoken';
import { env } from '../config/env.js';
import { prisma } from '../lib/prisma.js';
import { HttpError } from '../lib/httpError.js';

const JWT_ISSUER = 'food+';
const JWT_AUDIENCE = 'food+api';

export interface IssuedTokens {
  accessToken: string;
  accessExpiresAt: Date;
  refreshToken: string;
  refreshExpiresAt: Date;
}

const sha256 = (value: string) => crypto.createHash('sha256').update(value).digest('hex');

// ---------------------------------------------------------------------------
// Access token (JWT de corta duración)
// ---------------------------------------------------------------------------

function signAccessToken(userId: string): { token: string; expiresAt: Date } {
  const token = jwt.sign({}, env.JWT_ACCESS_SECRET, {
    subject: userId,
    algorithm: 'HS256',
    issuer: JWT_ISSUER,
    audience: JWT_AUDIENCE,
    expiresIn: env.JWT_ACCESS_TTL as SignOptions['expiresIn'],
  });
  const { exp } = jwt.decode(token) as { exp: number };
  return { token, expiresAt: new Date(exp * 1000) };
}

/** Verifica el JWT y devuelve el id del usuario. Lanza 401 si es inválido o expiró. */
export function verifyAccessToken(token: string): string {
  try {
    const payload = jwt.verify(token, env.JWT_ACCESS_SECRET, {
      algorithms: ['HS256'],
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
    });
    if (typeof payload === 'string' || !payload.sub) throw new Error('payload inválido');
    return payload.sub;
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      throw new HttpError(401, 'La sesión expiró', 'TOKEN_EXPIRED');
    }
    throw new HttpError(401, 'No autenticado', 'UNAUTHENTICATED');
  }
}

// ---------------------------------------------------------------------------
// Refresh token (opaco, rotativo, solo se guarda su hash)
// ---------------------------------------------------------------------------

async function createRefreshToken(userId: string): Promise<{ token: string; expiresAt: Date }> {
  const token = crypto.randomBytes(48).toString('base64url');
  const expiresAt = new Date(Date.now() + env.JWT_REFRESH_TTL_DAYS * 24 * 60 * 60 * 1000);
  await prisma.refreshToken.create({ data: { userId, tokenHash: sha256(token), expiresAt } });
  return { token, expiresAt };
}

export async function issueTokens(userId: string): Promise<IssuedTokens> {
  const access = signAccessToken(userId);
  const refresh = await createRefreshToken(userId);
  return {
    accessToken: access.token,
    accessExpiresAt: access.expiresAt,
    refreshToken: refresh.token,
    refreshExpiresAt: refresh.expiresAt,
  };
}

/**
 * Rota el refresh token: invalida el actual y emite un par nuevo.
 * Si se presenta un token ya revocado (posible robo), se revocan TODAS las sesiones del usuario.
 */
export async function rotateRefreshToken(rawToken: string): Promise<{ userId: string; tokens: IssuedTokens }> {
  const stored = await prisma.refreshToken.findUnique({ where: { tokenHash: sha256(rawToken) } });
  if (!stored) throw new HttpError(401, 'Sesión inválida', 'INVALID_REFRESH_TOKEN');

  if (stored.expiresAt < new Date()) {
    throw new HttpError(401, 'La sesión expiró, inicia sesión de nuevo', 'REFRESH_TOKEN_EXPIRED');
  }

  // Reclamo atómico: solo una petición puede revocar este token
  const { count } = await prisma.refreshToken.updateMany({
    where: { id: stored.id, revokedAt: null },
    data: { revokedAt: new Date() },
  });

  if (count === 0) {
    await revokeAllUserTokens(stored.userId);
    throw new HttpError(401, 'Sesión inválida, inicia sesión de nuevo', 'REFRESH_TOKEN_REUSED');
  }

  return { userId: stored.userId, tokens: await issueTokens(stored.userId) };
}

export async function revokeRefreshToken(rawToken: string): Promise<void> {
  await prisma.refreshToken.updateMany({
    where: { tokenHash: sha256(rawToken), revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

export async function revokeAllUserTokens(userId: string): Promise<void> {
  await prisma.refreshToken.updateMany({
    where: { userId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}
