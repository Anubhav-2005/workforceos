import "server-only";

import { PrismaClient } from "@prisma/client";

export class DatabaseConfigurationError extends Error {
  readonly status = 503;

  constructor() {
    super("Database is not configured. Set DATABASE_URL to enable workspace data.");
    this.name = "DatabaseConfigurationError";
  }
}

const globalForPrisma = globalThis as typeof globalThis & { workforcePrisma?: PrismaClient };

export function isDatabaseConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL?.trim());
}

export function getPrisma(): PrismaClient {
  if (!isDatabaseConfigured()) throw new DatabaseConfigurationError();

  if (!globalForPrisma.workforcePrisma) {
    globalForPrisma.workforcePrisma = new PrismaClient({
      log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    });
  }
  return globalForPrisma.workforcePrisma;
}
