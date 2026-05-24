import { Redis } from "ioredis";

type MemoryEntry = {
  value: string;
  expiresAt: number;
};

let client: Redis | null = null;
const memoryStore = new Map<string, MemoryEntry>();
let warnedNoRedis = false;

export const redisKeys = {
  otpPending: (phone: string) => `wj:otp:pending:${phone}`,
  otpSendLock: (inflightKey: string) => `wj:otp:send-lock:${inflightKey}`,
  shiprocketToken: () => "wj:shiprocket:auth-token",
} as const;

export function isRedisConfigured(): boolean {
  return Boolean(process.env.REDIS_URL?.trim());
}

function getClient(): Redis | null {
  const url = process.env.REDIS_URL?.trim();
  if (!url) {
    if (!warnedNoRedis) {
      const level = process.env.NODE_ENV === "production" ? "warn" : "info";
      console[level](
        "[Redis] REDIS_URL not set — using in-memory fallback (single server only).",
      );
      warnedNoRedis = true;
    }
    return null;
  }

  if (!client) {
    client = new Redis(url, {
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      lazyConnect: true,
    });
    client.on("error", (error: Error) => {
      console.error("[Redis] connection error:", error.message);
    });
  }

  return client;
}

export async function connectRedis(): Promise<void> {
  const redis = getClient();
  if (!redis) return;
  if (redis.status === "wait") {
    await redis.connect();
  }
}

export async function pingRedis(): Promise<boolean> {
  try {
    const redis = getClient();
    if (!redis) return false;
    const result = await redis.ping();
    return result === "PONG";
  } catch {
    return false;
  }
}

function pruneMemoryStore(): void {
  const now = Date.now();
  for (const [key, entry] of memoryStore) {
    if (entry.expiresAt <= now) {
      memoryStore.delete(key);
    }
  }
}

export async function cacheGet(key: string): Promise<string | null> {
  const redis = getClient();
  if (redis) {
    return redis.get(key);
  }

  pruneMemoryStore();
  const entry = memoryStore.get(key);
  if (!entry || entry.expiresAt <= Date.now()) {
    memoryStore.delete(key);
    return null;
  }
  return entry.value;
}

export async function cacheSet(
  key: string,
  value: string,
  ttlSeconds: number,
): Promise<void> {
  const redis = getClient();
  if (redis) {
    await redis.set(key, value, "EX", ttlSeconds);
    return;
  }

  memoryStore.set(key, {
    value,
    expiresAt: Date.now() + ttlSeconds * 1000,
  });
}

export async function cacheDel(key: string): Promise<void> {
  const redis = getClient();
  if (redis) {
    await redis.del(key);
    return;
  }
  memoryStore.delete(key);
}

export async function cacheSetNx(
  key: string,
  value: string,
  ttlSeconds: number,
): Promise<boolean> {
  const redis = getClient();
  if (redis) {
    const result = await redis.set(key, value, "EX", ttlSeconds, "NX");
    return result === "OK";
  }

  pruneMemoryStore();
  const existing = memoryStore.get(key);
  if (existing && existing.expiresAt > Date.now()) {
    return false;
  }

  memoryStore.set(key, {
    value,
    expiresAt: Date.now() + ttlSeconds * 1000,
  });
  return true;
}

export async function cacheGetJson<T>(key: string): Promise<T | null> {
  const raw = await cacheGet(key);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export async function cacheSetJson(
  key: string,
  value: unknown,
  ttlSeconds: number,
): Promise<void> {
  await cacheSet(key, JSON.stringify(value), ttlSeconds);
}

/**
 * Atomically increment a counter and ensure it expires after ttlSeconds.
 * Returns { count, ttlSeconds } where count is the new value after increment
 * and ttlSeconds is the remaining time-to-live for the key.
 */
export async function cacheIncrWithTtl(
  key: string,
  ttlSeconds: number,
): Promise<{ count: number; ttlSeconds: number }> {
  const redis = getClient();

  if (redis) {
    const pipeline = redis.multi();
    pipeline.incr(key);
    pipeline.ttl(key);
    const results = await pipeline.exec();

    let count = 0;
    let ttl = ttlSeconds;
    if (results) {
      const incrResult = results[0]?.[1];
      const ttlResult = results[1]?.[1];
      if (typeof incrResult === "number") count = incrResult;
      if (typeof ttlResult === "number") ttl = ttlResult;
    }

    if (count === 1 || ttl < 0) {
      await redis.expire(key, ttlSeconds);
      ttl = ttlSeconds;
    }

    return { count, ttlSeconds: ttl };
  }

  pruneMemoryStore();
  const now = Date.now();
  const existing = memoryStore.get(key);
  let count: number;
  let expiresAt: number;

  if (!existing || existing.expiresAt <= now) {
    count = 1;
    expiresAt = now + ttlSeconds * 1000;
  } else {
    count = Number.parseInt(existing.value, 10) + 1;
    if (Number.isNaN(count)) count = 1;
    expiresAt = existing.expiresAt;
  }

  memoryStore.set(key, { value: String(count), expiresAt });
  return {
    count,
    ttlSeconds: Math.max(1, Math.ceil((expiresAt - now) / 1000)),
  };
}
