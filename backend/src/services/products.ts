import { cachedJson, PRODUCT_CACHE_TTL_SECONDS } from "../lib/cache.js";
import { prisma } from "../lib/prisma.js";
import { mapProductToDto, type CollectionProductDto } from "../lib/productMapper.js";
import { redisKeys } from "../lib/redis.js";

export async function getProducts(category?: string): Promise<CollectionProductDto[]> {
  return cachedJson(
    redisKeys.productsList(category),
    PRODUCT_CACHE_TTL_SECONDS,
    async () => {
      const products = await prisma.product.findMany({
        where: {
          isActive: true,
          ...(category ? { category } : {}),
        },
        orderBy: { name: "asc" },
      });
      return products.map(mapProductToDto);
    },
  );
}

export async function getProductBySlug(
  slug: string,
): Promise<CollectionProductDto | null> {
  return cachedJson(
    redisKeys.productBySlug(slug),
    PRODUCT_CACHE_TTL_SECONDS,
    async () => {
      const product = await prisma.product.findFirst({
        where: { slug, isActive: true },
      });
      if (!product) return null;
      return mapProductToDto(product);
    },
  );
}

export async function getRelatedProducts(
  slug: string,
  limit = 4,
): Promise<CollectionProductDto[]> {
  return cachedJson(
    redisKeys.productRelated(slug, limit),
    PRODUCT_CACHE_TTL_SECONDS,
    async () => {
      const current = await prisma.product.findFirst({
        where: { slug, isActive: true },
        select: { category: true },
      });

      if (!current) return [];

      const sameCategory = await prisma.product.findMany({
        where: {
          isActive: true,
          category: current.category,
          slug: { not: slug },
        },
        take: limit,
        orderBy: { name: "asc" },
      });

      if (sameCategory.length >= limit) {
        return sameCategory.map(mapProductToDto);
      }

      const others = await prisma.product.findMany({
        where: {
          isActive: true,
          category: { not: current.category },
          slug: { not: slug },
        },
        take: limit - sameCategory.length,
        orderBy: { name: "asc" },
      });

      return [...sameCategory, ...others].map(mapProductToDto);
    },
  );
}
