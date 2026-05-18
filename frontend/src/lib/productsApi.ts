import { apiFetch } from "@/lib/api";
import type { CollectionProduct } from "@/data/collections";
import type { CollectionSlug } from "@/data/collections";

type ProductsResponse = { products: CollectionProduct[] };
type ProductResponse = { product: CollectionProduct };

export async function fetchProducts(
  category?: CollectionSlug,
): Promise<CollectionProduct[]> {
  const path = category
    ? `/api/products?category=${encodeURIComponent(category)}`
    : "/api/products";
  const data = await apiFetch<ProductsResponse>(path);
  return data.products;
}

export async function fetchProductBySlug(
  slug: string,
): Promise<CollectionProduct | null> {
  try {
    const data = await apiFetch<ProductResponse>(`/api/products/${slug}`);
    return data.product;
  } catch {
    return null;
  }
}

export async function fetchRelatedProducts(
  slug: string,
  limit = 4,
): Promise<CollectionProduct[]> {
  try {
    const data = await apiFetch<ProductsResponse>(
      `/api/products/${slug}/related?limit=${limit}`,
    );
    return data.products;
  } catch {
    return [];
  }
}
