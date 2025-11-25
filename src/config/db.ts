import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const db =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: ['query'], // Logs SQL queries to console (good for debugging)
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db;