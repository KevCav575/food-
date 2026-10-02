import bcrypt from 'bcrypt';
import { Prisma } from '@prisma/client';
import { env } from '../config/env.js';
import { prisma } from '../lib/prisma.js';
import { HttpError } from '../lib/httpError.js';
import type { LoginInput, RegisterInput } from '../validators/auth.validators.js';
import {
  issueTokens,
  revokeRefreshToken,
  rotateRefreshToken,
  type IssuedTokens,
} from './token.service.js';
import { getProfile, type UserProfile } from './user.service.js';

// Hash ficticio para que un login con email inexistente tarde lo mismo que uno real
// (evita enumerar usuarios midiendo el tiempo de respuesta).
const dummyHash = bcrypt.hash('food+-timing-dummy', env.BCRYPT_ROUNDS);

const invalidCredentials = () =>
  new HttpError(401, 'Email o contraseña incorrectos', 'INVALID_CREDENTIALS');

export interface AuthResult {
  user: UserProfile;
  tokens: IssuedTokens;
}

export async function register(input: RegisterInput): Promise<AuthResult> {
  const passwordHash = await bcrypt.hash(input.password, env.BCRYPT_ROUNDS);

  try {
    const user = await prisma.user.create({
      data: { email: input.email, passwordHash, name: input.name },
      select: { id: true },
    });
    return { user: await getProfile(user.id), tokens: await issueTokens(user.id) };
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      throw new HttpError(409, 'Ya existe una cuenta con ese email', 'EMAIL_TAKEN');
    }
    throw err;
  }
}

export async function login(input: LoginInput): Promise<AuthResult> {
  const user = await prisma.user.findUnique({
    where: { email: input.email },
    select: { id: true, passwordHash: true },
  });

  const valid = await bcrypt.compare(input.password, user?.passwordHash ?? (await dummyHash));
  if (!user || !valid) throw invalidCredentials();

  return { user: await getProfile(user.id), tokens: await issueTokens(user.id) };
}

export async function refresh(rawRefreshToken: string | undefined): Promise<AuthResult> {
  if (!rawRefreshToken) throw new HttpError(401, 'No autenticado', 'UNAUTHENTICATED');
  const { userId, tokens } = await rotateRefreshToken(rawRefreshToken);
  return { user: await getProfile(userId), tokens };
}

export async function logout(rawRefreshToken: string | undefined): Promise<void> {
  if (rawRefreshToken) await revokeRefreshToken(rawRefreshToken);
}
