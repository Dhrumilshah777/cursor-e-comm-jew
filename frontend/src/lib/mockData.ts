import {
  collectionProducts,
  getProductsByCategory,
  getRelatedProducts,
  type CollectionProduct,
  type CollectionSlug,
} from "@/data/collections";
import type {
  HomepageData,
  HomepageProductCard,
  HomepageVideo,
} from "@/lib/homepageApi";

const PROMO_VIDEO =
  "https://palmonas.com/cdn/shop/videos/c/vp/bb026995c2684066a92fd9a2324a77e3/bb026995c2684066a92fd9a2324a77e3.SD-480p-1.5Mbps-59300699.mp4?v=0";

/** Set NEXT_PUBLIC_USE_MOCK_DATA=true on Vercel to skip API calls while the backend is down. */
export function isMockDataEnabled(): boolean {
  return process.env.NEXT_PUBLIC_USE_MOCK_DATA === "true";
}

function toHomepageCard(product: CollectionProduct): HomepageProductCard {
  return {
    id: product.id,
    name: product.name,
    href: `/products/${product.slug}`,
    image: product.image,
    alt: product.alt,
    price: product.price,
    metal: product.metal,
  };
}

export function getMockProducts(category?: CollectionSlug): CollectionProduct[] {
  if (category) return getProductsByCategory(category);
  return collectionProducts;
}

export function getMockProductBySlug(slug: string): CollectionProduct | null {
  return collectionProducts.find((product) => product.slug === slug) ?? null;
}

export function searchMockProducts(query: string): CollectionProduct[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  return collectionProducts.filter(
    (product) =>
      product.name.toLowerCase().includes(q) ||
      product.category.toLowerCase().includes(q) ||
      product.metal.toLowerCase().includes(q) ||
      product.slug.replace(/-/g, " ").includes(q) ||
      product.sku.toLowerCase().includes(q),
  );
}

export function getMockRelatedProducts(
  slug: string,
  limit = 4,
): CollectionProduct[] {
  return getRelatedProducts(slug, limit);
}

export function getMockHomepage(): HomepageData {
  return {
    newArrivals: collectionProducts.slice(0, 8).map(toHomepageCard),
    topStyles: collectionProducts.slice(8, 12).map(toHomepageCard),
    eleganceInMotion: collectionProducts.slice(12, 20).map((product, index) => ({
      id: `mock-reel-${product.id}`,
      href: `/products/${product.slug}`,
      videoUrl: index % 2 === 0 ? PROMO_VIDEO : "",
      image: product.image,
      alt: product.alt,
      caption: product.name,
    })) satisfies HomepageVideo[],
  };
}
