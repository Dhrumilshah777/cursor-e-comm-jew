import { fetchWithTimeout, getApiBaseUrl } from "@/lib/api";
import type { CollectionProduct } from "@/data/collections";
import type { CollectionSlug } from "@/data/collections";
import {
  getMockProductBySlug,
  getMockProducts,
  getMockRelatedProducts,
  searchMockProducts,
} from "@/lib/mockProducts";

type ProductsResponse = { products: CollectionProduct[] };
type ProductResponse = { product: CollectionProduct };

const PRODUCT_REVALIDATE_SECONDS = 60;

async function publicGet<T>(path: string, tags: string[]): Promise<T> {
  const url = new URL(path, getApiBaseUrl());
  const response = await fetchWithTimeout(url.toString(), {
    next: { revalidate: PRODUCT_REVALIDATE_SECONDS, tags },
  });
  if (!response.ok) {
    throw new Error(`API ${response.status}: ${path}`);
  }
  return response.json() as Promise<T>;
}

export async function fetchProducts(
  category?: CollectionSlug,
): Promise<CollectionProduct[]> {
  const path = category
    ? `/api/products?category=${encodeURIComponent(category)}`
    : "/api/products";
  const tags = category ? ["products", `products:${category}`] : ["products"];
  try {
    const data = await publicGet<ProductsResponse>(path, tags);
    if (data.products.length > 0) {
      return data.products;
    }
  } catch {
    // Fall back to local mock catalog when the API is unavailable.
  }
  return getMockProducts(category);
}

export async function searchProducts(query: string): Promise<CollectionProduct[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const path = `/api/products?q=${encodeURIComponent(trimmed)}`;
  try {
    const data = await publicGet<ProductsResponse>(path, [
      "products",
      `search:${trimmed.toLowerCase()}`,
    ]);
    if (data.products.length > 0) {
      return data.products;
    }
  } catch {
    // Fall back to local mock catalog when the API is unavailable.
  }
  return searchMockProducts(trimmed);
}

export async function fetchProductBySlug(
  slug: string,
): Promise<CollectionProduct | null> {
  try {
    const data = await publicGet<ProductResponse>(`/api/products/${slug}`, [
      "products",
      `product:${slug}`,
    ]);
    if (data.product) {
      return data.product;
    }
  } catch {
    // Fall back to local mock catalog when the API is unavailable.
  }
  return getMockProductBySlug(slug);
}

export async function fetchRelatedProducts(
  slug: string,
  limit = 4,
): Promise<CollectionProduct[]> {
  try {
    const data = await publicGet<ProductsResponse>(
      `/api/products/${slug}/related?limit=${limit}`,
      ["products", `product:${slug}:related`],
    );
    if (data.products.length > 0) {
      return data.products;
    }
  } catch {
    // Fall back to local mock catalog when the API is unavailable.
  }
  return getMockRelatedProducts(slug, limit);
}
