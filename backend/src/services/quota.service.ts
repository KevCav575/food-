import type { Plan } from '@prisma/client';
import { env } from '../config/env.js';
import { prisma } from '../lib/prisma.js';
import { HttpError } from '../lib/httpError.js';

/*
 * Plan gratuito: FREE_SCAN_LIMIT escaneos por "tanda". La tanda empieza con el primer escaneo
 * y se recarga SCAN_WINDOW_HOURS después. Premium no tiene límite.
 */

const windowMs = () => env.SCAN_WINDOW_HOURS * 60 * 60 * 1000;

export interface QuotaState {
  /** Escaneos restantes en la tanda actual (null = ilimitado) */
  remaining: number | null;
  /** Cuándo se recargan los escaneos (null si la tanda no ha empezado o es Premium) */
  resetsAt: Date | null;
}

interface QuotaFields {
  plan: Plan;
  scanCount: number;
  scanWindowStart: Date | null;
}

/** Estado efectivo del cupo, sin escribir en la BD (una tanda vencida cuenta como recargada). */
export function quotaState(user: QuotaFields, now = new Date()): QuotaState {
  if (user.plan === 'PREMIUM') return { remaining: null, resetsAt: null };

  const start = user.scanWindowStart;
  const expired = !start || now.getTime() - start.getTime() >= windowMs();
  if (expired) return { remaining: env.FREE_SCAN_LIMIT, resetsAt: null };

  return {
    remaining: Math.max(0, env.FREE_SCAN_LIMIT - user.scanCount),
    resetsAt: new Date(start.getTime() + windowMs()),
  };
}

const quotaSelect = { plan: true, scanCount: true, scanWindowStart: true } as const;

const limitReached = (resetsAt: Date | null) =>
  new HttpError(
    402,
    `Usaste tus ${env.FREE_SCAN_LIMIT} escaneos gratuitos. Se recargan ${env.SCAN_WINDOW_HOURS} horas después del primero` +
      (resetsAt ? ` (${resetsAt.toISOString()}).` : '.'),
    'SCAN_LIMIT_REACHED',
  );

/** Comprobación previa (barata) para no gastar OCR/API en un usuario sin escaneos. */
export async function assertCanScan(userId: string): Promise<void> {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: quotaSelect });
  if (!user) throw new HttpError(401, 'No autenticado', 'UNAUTHENTICATED');
  const state = quotaState(user);
  if (state.remaining === 0) throw limitReached(state.resetsAt);
}

/**
 * Descuenta un escaneo de forma atómica. Devuelve los escaneos restantes (null = ilimitado).
 * 1. Si la tanda venció (o nunca empezó), se abre una nueva: contador a 0, inicio = ahora.
 *    El WHERE hace que solo una petición concurrente la abra.
 * 2. El incremento solo se aplica si aún queda cupo: dos peticiones simultáneas no superan el límite.
 */
export async function consumeScan(userId: string): Promise<number | null> {
  const now = new Date();
  const cutoff = new Date(now.getTime() - windowMs());

  await prisma.user.updateMany({
    where: { id: userId, plan: 'FREE', OR: [{ scanWindowStart: null }, { scanWindowStart: { lte: cutoff } }] },
    data: { scanCount: 0, scanWindowStart: now },
  });

  const { count } = await prisma.user.updateMany({
    where: { id: userId, OR: [{ plan: 'PREMIUM' }, { scanCount: { lt: env.FREE_SCAN_LIMIT } }] },
    data: { scanCount: { increment: 1 } },
  });

  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId }, select: quotaSelect });
  const state = quotaState(user, now);
  if (count === 0) throw limitReached(state.resetsAt);
  return state.remaining;
}
