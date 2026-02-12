import { PrismaClient } from '@prisma/client';
import path from 'path';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function getResolvedDatabaseUrl(): string | undefined {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl || databaseUrl.trim() === '') return undefined;
  if (!databaseUrl.startsWith('file:')) return databaseUrl;
  const dbPath = databaseUrl.replace('file:', '');
  if (path.isAbsolute(dbPath)) return databaseUrl;
  return `file:${path.join(process.cwd(), dbPath)}`;
}

/** Placeholder URL used only when DATABASE_URL is missing at build time so PrismaClient constructor never receives undefined. */
const BUILD_PLACEHOLDER_URL = 'file::memory:?cache=shared';

function getDb(): PrismaClient {
  let url = getResolvedDatabaseUrl();
  const isPlaceholder = !url;
  if (isPlaceholder) {
    url = BUILD_PLACEHOLDER_URL;
  }
  if (!isPlaceholder && globalForPrisma.prisma) return globalForPrisma.prisma;
  const client = new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    datasources: {
      db: { url },
    },
  });
  if (!isPlaceholder) globalForPrisma.prisma = client;
  return client;
}

/** Lazy Prisma client: only created when first used, so build can succeed without DATABASE_URL. */
export const db = new Proxy({} as PrismaClient, {
  get(_, prop) {
    return (getDb() as unknown as Record<string | symbol, unknown>)[prop];
  },
});

