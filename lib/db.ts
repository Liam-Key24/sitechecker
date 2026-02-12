import { PrismaClient } from '@prisma/client';
import path from 'path';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function getResolvedDatabaseUrl(): string | undefined {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) return undefined;
  if (!databaseUrl.startsWith('file:')) return databaseUrl;
  const dbPath = databaseUrl.replace('file:', '');
  if (path.isAbsolute(dbPath)) return databaseUrl;
  return `file:${path.join(process.cwd(), dbPath)}`;
}

function getDb(): PrismaClient {
  const url = getResolvedDatabaseUrl();
  if (!url) {
    throw new Error(
      'DATABASE_URL is not set. Set it in .env (e.g. DATABASE_URL="file:./dev.db") so the database can be used at runtime.'
    );
  }
  if (globalForPrisma.prisma) return globalForPrisma.prisma;
  globalForPrisma.prisma = new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    datasources: {
      db: { url },
    },
  });
  return globalForPrisma.prisma;
}

/** Lazy Prisma client: only created when first used, so build can succeed without DATABASE_URL. */
export const db = new Proxy({} as PrismaClient, {
  get(_, prop) {
    return (getDb() as unknown as Record<string | symbol, unknown>)[prop];
  },
});

