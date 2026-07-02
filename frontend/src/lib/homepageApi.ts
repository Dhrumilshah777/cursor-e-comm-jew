import { fetchWithTimeout, getApiBaseUrl } from "@/lib/api";
import { getMockProducts } from "@/lib/mockProducts";

export type HomepageProductCard = {
  id: string;
  name: string;
  href: string;
  image: string;
  alt: string;
  price: string;
  metal: string;
};

export type HomepageVideo = {
  id: string;
  href: string;
  videoUrl: string;
  image: string;
  alt: string;
  caption?: string | null;
};

export type HomepageData = {
  newArrivals: HomepageProductCard[];
  topStyles: HomepageProductCard[];
  eleganceInMotion: HomepageVideo[];
};

function buildMockHomepage(): HomepageData {
  const cards = getMockProducts().slice(0, 8).map((product) => ({
    id: product.id,
    name: product.name,
    href: `/products/${product.slug}`,
    image: product.image,
    alt: product.alt,
    price: product.price,
    metal: product.metal,
  }));

  return {
    newArrivals: cards.slice(0, 4),
    topStyles: cards.slice(4, 8),
    eleganceInMotion: [],
  };
}

export async function fetchHomepage(): Promise<HomepageData> {
  try {
    const response = await fetchWithTimeout(
      new URL("/api/homepage", getApiBaseUrl()).toString(),
      {
        next: { revalidate: 60, tags: ["homepage"] },
      },
    );
    if (!response.ok) {
      throw new Error("Failed to load homepage");
    }

    const data = (await response.json()) as HomepageData;
    if (
      data.newArrivals.length > 0 ||
      data.topStyles.length > 0 ||
      data.eleganceInMotion.length > 0
    ) {
      return data;
    }
  } catch {
    // Fall back to local mock catalog when the API is unavailable.
  }

  return buildMockHomepage();
}
