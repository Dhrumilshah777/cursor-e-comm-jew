import { getApiBaseUrl } from "@/lib/api";

export type DeliveryEstimateResponse =
  | {
      available: true;
      pincode: string;
      shiprocketEdd: string;
      estimatedDelivery: string;
      bufferDays: number;
    }
  | {
      available: false;
      pincode: string;
      message: string;
    };

export async function fetchDeliveryEstimate(
  pincode: string,
  weightKg?: number,
): Promise<DeliveryEstimateResponse> {
  const params = new URLSearchParams({ pincode });
  if (weightKg !== undefined && Number.isFinite(weightKg)) {
    params.set("weightKg", String(weightKg));
  }

  const response = await fetch(
    new URL(`/api/delivery/estimate?${params.toString()}`, getApiBaseUrl()).toString(),
    { cache: "no-store" },
  );

  const body = (await response.json().catch(() => ({}))) as DeliveryEstimateResponse & {
    error?: string;
    message?: string;
  };

  if (!response.ok) {
    throw new Error(body.message ?? "Could not check delivery for this PIN code.");
  }

  return body;
}
