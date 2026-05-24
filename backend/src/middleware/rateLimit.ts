import type { NextFunction, Request, Response } from "express";
import { cacheIncrWithTtl } from "../lib/redis.js";

export type RateLimitKeyResolver = (req: Request) => string | null;

export type RateLimitOptions = {
  /** Stable identifier for this limiter (used in Redis keys + logs). */
  name: string;
  /** Window size in seconds. */
  windowSeconds: number;
  /** Maximum requests allowed per window. */
  max: number;
  /**
   * Functions that return a unique key (e.g. IP, userId, phone). Each key
   * is tracked independently. Returning null skips that key.
   */
  keys: RateLimitKeyResolver[];
  /** Friendly message when limit is hit. Defaults to a generic 429 message. */
  message?: string;
  /** Skip limiting entirely when this returns true (e.g. admin requests). */
  skip?: (req: Request) => boolean;
};

function clientIp(req: Request): string {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded.trim()) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  return req.ip ?? req.socket.remoteAddress ?? "unknown";
}

export const ipKey =
  (label: string): RateLimitKeyResolver =>
  (req) => {
    const ip = clientIp(req);
    return ip ? `${label}:ip:${ip}` : null;
  };

export const userKey =
  (label: string): RateLimitKeyResolver =>
  (req) => {
    const userId = (req as Request & { customer?: { userId?: string } }).customer?.userId;
    return userId ? `${label}:user:${userId}` : null;
  };

export const phoneFromBodyKey =
  (label: string): RateLimitKeyResolver =>
  (req) => {
    const raw = (req.body as { phone?: unknown })?.phone;
    if (typeof raw !== "string") return null;
    const digits = raw.replace(/\D/g, "");
    if (digits.length < 10) return null;
    return `${label}:phone:${digits.slice(-10)}`;
  };

export function createRateLimiter(options: RateLimitOptions) {
  const { name, windowSeconds, max, keys, message, skip } = options;
  const redisPrefix = `wj:rl:${name}`;

  return async function rateLimitMiddleware(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    if (skip?.(req)) {
      next();
      return;
    }

    try {
      let highestCount = 0;
      let lowestRemaining = max;
      let resetSeconds = windowSeconds;

      for (const resolver of keys) {
        const subKey = resolver(req);
        if (!subKey) continue;
        const fullKey = `${redisPrefix}:${subKey}`;
        const { count, ttlSeconds } = await cacheIncrWithTtl(fullKey, windowSeconds);
        if (count > highestCount) highestCount = count;
        const remaining = Math.max(0, max - count);
        if (remaining < lowestRemaining) lowestRemaining = remaining;
        if (ttlSeconds > 0 && ttlSeconds < resetSeconds) resetSeconds = ttlSeconds;
      }

      res.setHeader("RateLimit-Limit", String(max));
      res.setHeader("RateLimit-Remaining", String(lowestRemaining));
      res.setHeader("RateLimit-Reset", String(resetSeconds));

      if (highestCount > max) {
        res.setHeader("Retry-After", String(resetSeconds));
        res.status(429).json({
          error:
            message ??
            "Too many requests. Please slow down and try again in a moment.",
          retryAfterSeconds: resetSeconds,
        });
        return;
      }

      next();
    } catch (error) {
      console.error(`[RateLimit:${name}] failed:`, error);
      // Fail-open: never block legit traffic if Redis hiccups.
      next();
    }
  };
}
