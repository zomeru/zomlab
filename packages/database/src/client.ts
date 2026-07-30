import { PrismaPg } from "@prisma/adapter-pg";
import { env } from "@zomlab/env";
import { PrismaClient } from "../generated/prisma/client";

function createPrismaClient() {
  const adapter = new PrismaPg({
    connectionString: env.DATABASE_URL,
  });

  const client = new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

  return client;
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function getDb() {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = createPrismaClient();
  }
  return globalForPrisma.prisma;
}

export const db = new Proxy<PrismaClient>({} as PrismaClient, {
  get(_target, key: string) {
    return getDb()[key as keyof PrismaClient];
  },
});
