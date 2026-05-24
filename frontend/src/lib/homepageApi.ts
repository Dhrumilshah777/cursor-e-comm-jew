import { getApiBaseUrl } from "@/lib/api";

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
  const response = await fetch(new URL("/api/homepage", getApiBaseUrl()).toString(), {
    next: { revalidate: 60, tags: ["homepage"] },
  });
  if (!response.ok) {
    throw new Error("Failed to load homepage");
  }
  return response.json() as Promise<HomepageData>;
}
