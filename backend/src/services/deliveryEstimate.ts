import {
  addDaysFromToday,
  addDaysToDateInput,
  formatDisplayDate,
} from "../lib/deliveryDates.js";
import {
  checkShiprocketServiceability,
  getShiprocketPickupPincode,
  isShiprocketConfigured,
} from "../lib/shiprocket.js";

const CUSTOMER_BUFFER_DAYS = 2;

function readNumberField(obj: unknown, keys: string[]): number | null {
  if (!obj || typeof obj !== "object") return null;
  const record = obj as Record<string, unknown>;
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string" && value.trim()) {
      const parsed = Number.parseInt(value.trim(), 10);
      if (Number.isFinite(parsed)) return parsed;
    }
  }
  return null;
}

function readStringField(obj: unknown, keys: string[]): string | null {
  if (!obj || typeof obj !== "object") return null;
  const record = obj as Record<string, unknown>;
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return null;
}

function extractCouriers(payload: unknown): unknown[] {
  if (!payload || typeof payload !== "object") return [];
  const record = payload as Record<string, unknown>;

  const data = record.data;
  if (Array.isArray(data)) return data;

  if (data && typeof data === "object") {
    const dataRecord = data as Record<string, unknown>;
    const couriers = dataRecord.available_courier_companies;
    if (Array.isArray(couriers)) return couriers;
  }

  const couriers = record.available_courier_companies;
  if (Array.isArray(couriers)) return couriers;

  return [];
}

function parseShiprocketEddFromCouriers(couriers: unknown[]): string | null {
  let bestDate: Date | null = null;

  for (const courier of couriers) {
    const etdRaw = readStringField(courier, ["etd", "edd", "expected_delivery_date"]);
    if (etdRaw) {
      const withBuffer = addDaysToDateInput(etdRaw, 0);
      if (withBuffer) {
        const parsed = Date.parse(withBuffer);
        if (!Number.isNaN(parsed)) {
          const date = new Date(parsed);
          if (!bestDate || date < bestDate) bestDate = date;
        }
      }
    }

    const days = readNumberField(courier, [
      "estimated_delivery_days",
      "etd_days",
      "delivery_days",
    ]);
    if (days !== null) {
      const date = new Date();
      date.setHours(12, 0, 0, 0);
      date.setDate(date.getDate() + days);
      if (!bestDate || date < bestDate) bestDate = date;
    }
  }

  return bestDate ? formatDisplayDate(bestDate) : null;
}

export type DeliveryEstimateResult =
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
    }
  | {
      error: "INVALID_PINCODE" | "SHIPROCKET_NOT_CONFIGURED" | "PICKUP_PINCODE_MISSING";
      message: string;
    };

export async function estimateDeliveryToPincode(
  pincode: string,
  weightKg = 0.1,
): Promise<DeliveryEstimateResult> {
  const normalized = pincode.replace(/\D/g, "");
  if (normalized.length !== 6) {
    return {
      error: "INVALID_PINCODE",
      message: "Please enter a valid 6-digit PIN code.",
    };
  }

  if (!isShiprocketConfigured()) {
    return {
      error: "SHIPROCKET_NOT_CONFIGURED",
      message: "Delivery check is temporarily unavailable. Please try again later.",
    };
  }

  let pickupPostcode: string;
  try {
    pickupPostcode = getShiprocketPickupPincode();
  } catch {
    return {
      error: "PICKUP_PINCODE_MISSING",
      message: "Delivery check is temporarily unavailable. Please try again later.",
    };
  }

  const response = await checkShiprocketServiceability({
    pickupPostcode,
    deliveryPostcode: normalized,
    weightKg: Math.max(0.1, weightKg),
    cod: false,
  });

  const couriers = extractCouriers(response);
  if (couriers.length === 0) {
    return {
      available: false,
      pincode: normalized,
      message: "Delivery is not available to this PIN code at the moment.",
    };
  }

  const shiprocketEdd = parseShiprocketEddFromCouriers(couriers);
  if (!shiprocketEdd) {
    const fallbackEdd = addDaysFromToday(5, 0);
    return {
      available: true,
      pincode: normalized,
      shiprocketEdd: fallbackEdd,
      estimatedDelivery: addDaysFromToday(5, CUSTOMER_BUFFER_DAYS),
      bufferDays: CUSTOMER_BUFFER_DAYS,
    };
  }

  const estimatedDelivery =
    addDaysToDateInput(shiprocketEdd, CUSTOMER_BUFFER_DAYS) ?? shiprocketEdd;

  return {
    available: true,
    pincode: normalized,
    shiprocketEdd,
    estimatedDelivery,
    bufferDays: CUSTOMER_BUFFER_DAYS,
  };
}
