import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { PrismaClient } from "../generated/prisma/client.js";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

/**
 * Tuned per-instance Postgres pool.
 *
 * Sizing rule of thumb:  POOL_MAX × number_of_app_instances ≤ Postgres max_connections − headroom.
 * Render's free Postgres caps at 97 connections; with a single dyno + workers
 * a max of 10 leaves room for migrations, prisma studio, etc. Bump
 * DATABASE_POOL_MAX as you scale dynos — but always check the DB cap first.
 */
const POOL_DEFAULTS = {
  max: 10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 10_000,
  statementTimeoutMillis: 15_000,
};

function readPoolConfig() {
  const max = Number(process.env.DATABASE_POOL_MAX);
  const idleMs = Number(process.env.DATABASE_POOL_IDLE_TIMEOUT_MS);
  const connectMs = Number(process.env.DATABASE_POOL_CONNECT_TIMEOUT_MS);
  const stmtMs = Number(process.env.DATABASE_STATEMENT_TIMEOUT_MS);

  return {
    max: Number.isFinite(max) && max > 0 ? max : POOL_DEFAULTS.max,
    idleTimeoutMillis:
      Number.isFinite(idleMs) && idleMs > 0 ? idleMs : POOL_DEFAULTS.idleTimeoutMillis,
    connectionTimeoutMillis:
      Number.isFinite(connectMs) && connectMs > 0
        ? connectMs
        : POOL_DEFAULTS.connectionTimeoutMillis,
    statementTimeoutMillis:
      Number.isFinite(stmtMs) && stmtMs > 0
        ? stmtMs
        : POOL_DEFAULTS.statementTimeoutMillis,
  };
}

function createPrismaClient(): PrismaClient {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not set. Copy .env.example to .env and configure Postgres.");
  }

  // Prisma Postgres / Accelerate URL (from `npx prisma dev` or Prisma Cloud)
  if (databaseUrl.startsWith("prisma+")) {
    return new PrismaClient({
      accelerateUrl: databaseUrl,
      log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    });
  }

  const poolConfig = readPoolConfig();
  const pool = new Pool({
    connectionString: databaseUrl,
    max: poolConfig.max,
    idleTimeoutMillis: poolConfig.idleTimeoutMillis,
    connectionTimeoutMillis: poolConfig.connectionTimeoutMillis,
    // Stops runaway queries from holding a connection forever.
    statement_timeout: poolConfig.statementTimeoutMillis,
  });

  pool.on("error", (error) => {
    console.error("[Postgres] idle pool client error:", error.message);
  });

  const adapter = new PrismaPg(pool);

  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
