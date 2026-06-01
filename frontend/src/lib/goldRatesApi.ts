import { fetchWithTimeout, getApiBaseUrl } from "@/lib/api";

export type GoldRateSnapshot = {
  rate24ktPerGram: number;
  updatedAt: string;
};

export async function fetchGoldRateSnapshot(): Promise<GoldRateSnapshot | null> {
  try {
    const url = new URL("/api/gold-rates", getApiBaseUrl());
    const response = await fetchWithTimeout(url.toString(), { cache: "no-store" });
    if (!response.ok) return null;
    return (await response.json()) as GoldRateSnapshot;
  } catch {
    return null;
  }
}
