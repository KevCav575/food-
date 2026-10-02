import type { Allergen, Plan } from '@prisma/client';
import { env } from '../config/env.js';
import { quotaState } from './quota.service.js';
import { prisma } from '../lib/prisma.js';
import { HttpError } from '../lib/httpError.js';
import { allergenLabel } from '../domain/allergens.js';
import type { UpdateProfileInput } from '../validators/user.validators.js';

export interface UserProfile {
  id: string;
  email: string;
  name: string | null;
  plan: Plan;
  scanCount: number;
  /** null = ilimitado (plan PREMIUM) */
  scanLimit: number | null;
  scansRemaining: number | null;
  /** Cuándo se recargan los escaneos gratuitos (null = tanda sin empezar o Premium) */
  scansResetAt: Date | null;
  allergies: { allergen: Allergen; label: string }[];
  createdAt: Date;
}

// Selección explícita: passwordHash y datos de Stripe nunca salen de este servicio
const profileSelect = {
  id: true,
  email: true,
  name: true,
  plan: true,
  scanCount: true,
  scanWindowStart: true,
  createdAt: true,
  allergies: { select: { allergen: true }, orderBy: { allergen: 'asc' } },
} as const;

type ProfileRow = NonNullable<Awaited<ReturnType<typeof findProfileRow>>>;

const findProfileRow = (userId: string) =>
  prisma.user.findUnique({ where: { id: userId }, select: profileSelect });

const toProfile = ({ scanWindowStart, ...row }: ProfileRow): UserProfile => {
  const quota = quotaState({ plan: row.plan, scanCount: row.scanCount, scanWindowStart });
  return {
    ...row,
    scanLimit: row.plan === 'PREMIUM' ? null : env.FREE_SCAN_LIMIT,
    scansRemaining: quota.remaining,
    scansResetAt: quota.resetsAt,
    allergies: row.allergies.map(({ allergen }) => ({ allergen, label: allergenLabel(allergen) })),
  };
};

export async function getProfile(userId: string): Promise<UserProfile> {
  const row = await findProfileRow(userId);
  if (!row) throw new HttpError(404, 'Usuario no encontrado', 'USER_NOT_FOUND');
  return toProfile(row);
}

export async function updateProfile(userId: string, input: UpdateProfileInput): Promise<UserProfile> {
  const row = await prisma.user.update({
    where: { id: userId },
    data: { name: input.name },
    select: profileSelect,
  });
  return toProfile(row);
}

export async function getUserAllergens(userId: string): Promise<Allergen[]> {
  const rows = await prisma.userAllergy.findMany({ where: { userId }, select: { allergen: true } });
  return rows.map((r) => r.allergen);
}

/** Reemplaza por completo la lista de alergias del usuario (operación idempotente). */
export async function setUserAllergens(userId: string, allergens: Allergen[]): Promise<UserProfile> {
  await prisma.$transaction([
    prisma.userAllergy.deleteMany({ where: { userId, allergen: { notIn: allergens } } }),
    prisma.userAllergy.createMany({
      data: allergens.map((allergen) => ({ userId, allergen })),
      skipDuplicates: true,
    }),
  ]);
  return getProfile(userId);
}
