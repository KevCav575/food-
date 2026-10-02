import { env } from './config/env.js';
import { createApp } from './app.js';
import { prisma } from './lib/prisma.js';
import { shutdownOcr, warmUpOcr } from './services/ocr/index.js';

const app = createApp();

const server = app.listen(env.PORT, () => {
  console.log(`🚀 food+ API escuchando en http://localhost:${env.PORT}/api`);
  warmUpOcr();
});

async function shutdown(signal: string) {
  console.log(`${signal} recibido, cerrando…`);
  server.close(async () => {
    await Promise.all([prisma.$disconnect(), shutdownOcr()]);
    process.exit(0);
  });
}

process.on('SIGINT', () => void shutdown('SIGINT'));
process.on('SIGTERM', () => void shutdown('SIGTERM'));
