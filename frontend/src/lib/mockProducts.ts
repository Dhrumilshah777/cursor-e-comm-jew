import {
  collectionProducts,
  getProductsByCategory,
  getRelatedProducts,
  type CollectionProduct,
  type CollectionSlug,
} from "@/data/collections";
import { applyEarringImageOverrides } from "@/data/earringAssets";
import { applyPendantImageOverrides } from "@/data/pendantAssets";

function withStock(product: CollectionProduct): CollectionProduct {
  const withImages = applyEarringImageOverrides(
    applyPendantImageOverrides(product),
  );

  if (withImages.stockCount !== undefined && withImages.inStock !== undefined) {
    return withImages;
  }

  return {
    ...withImages,
    stockCount: 10,
    lowStockThreshold: 2,
    inStock: true,
  };
}

const mockCatalog = collectionProducts.map(withStock);

export function getMockProducts(category?: CollectionSlug): CollectionProduct[] {
  if (category) {
    return getProductsByCategory(category).map(withStock);
  }
  return mockCatalog;
}

export function getMockProductBySlug(slug: string): CollectionProduct | null {
  return mockCatalog.find((product) => product.slug === slug) ?? null;
}

export function searchMockProducts(query: string): CollectionProduct[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return [];

  return mockCatalog.filter(
    (product) =>
      product.name.toLowerCase().includes(normalized) ||
      product.sku.toLowerCase().includes(normalized) ||
      product.slug.toLowerCase().includes(normalized) ||
      product.category.toLowerCase().includes(normalized),
  );
}

export function getMockRelatedProducts(
  slug: string,
  limit = 4,
): CollectionProduct[] {
  return getRelatedProducts(slug, limit).map(withStock);
}
