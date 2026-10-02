import { PrismaClient } from '@prisma/client';
import { isProd } from '../config/env.js';

// Reutiliza una sola instancia durante el hot-reload de desarrollo
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({ log: isProd ? ['error'] : ['warn', 'error'] });

if (!isProd) globalForPrisma.prisma = prisma;
