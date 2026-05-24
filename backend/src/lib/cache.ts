import { revalidateFrontendTags } from "./frontendRevalidate.js";
import {
  cacheDelByPattern,
  cacheGetJson,
  cachePatterns,
  cacheSetJson,
} from "./redis.js";

export const PRODUCT_CACHE_TTL_SECONDS = 60;
export const HOMEPAGE_CACHE_TTL_SECONDS = 60;

/**
 * Read-through JSON cache: returns the cached value if present, otherwise
 * runs the loader, stores its result, and returns it. The cache is best-effort:
 * any cache error falls back to a direct loader call so the request still
 * succeeds.
 */
export async function cachedJson<T>(
  key: string,
  ttlSeconds: number,
  loader: () => Promise<T>,
): Promise<T> {
  try {
    const cached = await cacheGetJson<T>(key);
    if (cached !== null) return cached;
  } catch (error) {
    console.error(`[cache] read failed for ${key}:`, error);
  }

  const fresh = await loader();

  try {
    await cacheSetJson(key, fresh, ttlSeconds);
  } catch (error) {
    console.error(`[cache] write failed for ${key}:`, error);
  }

  return fresh;
}

/**
 * Invalidate every product-related cache entry. Also invalidates the
 * homepage cache because product cards are embedded in it.
 */
export async function invalidateCachedProducts(): Promise<void> {
  try {
    await Promise.all([
      cacheDelByPattern(cachePatterns.allProducts),
      cacheDelByPattern(cachePatterns.homepage),
    ]);
  } catch (error) {
    console.error("[cache] invalidateCachedProducts failed:", error);
  }

  // Fire-and-forget; never block admin mutations on frontend cache purge.
  void revalidateFrontendTags(["products", "homepage"]);
}

export async function invalidateCachedHomepage(): Promise<void> {
  try {
    await cacheDelByPattern(cachePatterns.homepage);
  } catch (error) {
    console.error("[cache] invalidateCachedHomepage failed:", error);
  }

  void revalidateFrontendTags(["homepage"]);
}
