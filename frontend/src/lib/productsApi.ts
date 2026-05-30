import { fetchWithTimeout, getApiBaseUrl } from "@/lib/api";
import type { CollectionProduct } from "@/data/collections";
import type { CollectionSlug } from "@/data/collections";
import {
  getMockProductBySlug,
  getMockProducts,
  getMockRelatedProducts,
  isMockDataEnabled,
  searchMockProducts,
} from "@/lib/mockData";

type ProductsResponse = { products: CollectionProduct[] };
type ProductResponse = { product: CollectionProduct };

const PRODUCT_REVALIDATE_SECONDS = 60;
const PRODUCT_FETCH_TIMEOUT_MS = 4_000;

async function publicGet<T>(path: string, tags: string[]): Promise<T> {
  const url = new URL(path, getApiBaseUrl());
  const response = await fetchWithTimeout(url.toString(), {
    next: { revalidate: PRODUCT_REVALIDATE_SECONDS, tags },
    timeoutMs: PRODUCT_FETCH_TIMEOUT_MS,
  });
  if (!response.ok) {
    throw new Error(`API ${response.status}: ${path}`);
  }
  return response.json() as Promise<T>;
}

export async function fetchProducts(
  category?: CollectionSlug,
): Promise<CollectionProduct[]> {
  if (isMockDataEnabled()) {
    return getMockProducts(category);
  }

  const path = category
    ? `/api/products?category=${encodeURIComponent(category)}`
    : "/api/products";
  const tags = category ? ["products", `products:${category}`] : ["products"];
  try {
    const data = await publicGet<ProductsResponse>(path, tags);
    return data.products;
  } catch {
    return getMockProducts(category);
  }
}

export async function searchProducts(query: string): Promise<CollectionProduct[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  if (isMockDataEnabled()) {
    return searchMockProducts(trimmed);
  }

  const path = `/api/products?q=${encodeURIComponent(trimmed)}`;
  try {
    const data = await publicGet<ProductsResponse>(path, [
      "products",
      `search:${trimmed.toLowerCase()}`,
    ]);
    return data.products;
  } catch {
    return searchMockProducts(trimmed);
  }
}

export async function fetchProductBySlug(
  slug: string,
): Promise<CollectionProduct | null> {
  if (isMockDataEnabled()) {
    return getMockProductBySlug(slug);
  }

  try {
    const data = await publicGet<ProductResponse>(`/api/products/${slug}`, [
      "products",
      `product:${slug}`,
    ]);
    return data.product;
  } catch {
    return getMockProductBySlug(slug);
  }
}

export async function fetchRelatedProducts(
  slug: string,
  limit = 4,
): Promise<CollectionProduct[]> {
  if (isMockDataEnabled()) {
    return getMockRelatedProducts(slug, limit);
  }

  try {
    const data = await publicGet<ProductsResponse>(
      `/api/products/${slug}/related?limit=${limit}`,
      ["products", `product:${slug}:related`],
    );
    return data.products;
  } catch {
    return getMockRelatedProducts(slug, limit);
  }
}
