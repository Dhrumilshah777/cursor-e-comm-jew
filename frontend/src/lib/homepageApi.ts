import { fetchWithTimeout, getApiBaseUrl } from "@/lib/api";
import { getMockHomepage, isMockDataEnabled } from "@/lib/mockData";

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

export async function fetchHomepage(): Promise<HomepageData> {
  if (isMockDataEnabled()) {
    return getMockHomepage();
  }

  try {
    const response = await fetchWithTimeout(
      new URL("/api/homepage", getApiBaseUrl()).toString(),
      {
        next: { revalidate: 60, tags: ["homepage"] },
        timeoutMs: 4_000,
      },
    );
    if (!response.ok) {
      throw new Error("Failed to load homepage");
    }
    return response.json() as Promise<HomepageData>;
  } catch {
    return getMockHomepage();
  }
}
