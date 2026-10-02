import { Router } from 'express';
import { prisma } from '../lib/prisma.js';

export const healthRouter = Router();

healthRouter.get('/', async (_req, res) => {
  let db = 'ok';
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch {
    db = 'unreachable';
  }
  res.json({ status: 'ok', db, timestamp: new Date().toISOString() });
});
