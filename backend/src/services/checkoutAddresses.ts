import type { CheckoutAddressInput } from "./checkout.js";

export type CheckoutAddressPayload =
  | { addressId: string }
  | { address: CheckoutAddressInput };

export function parseCheckoutAddressPayload(body: unknown): CheckoutAddressPayload | null {
  if (!body || typeof body !== "object") return null;

  const addressId = (body as { addressId?: unknown }).addressId;
  if (typeof addressId === "string" && addressId.trim()) {
    return { addressId: addressId.trim() };
  }

  const address = (body as { address?: unknown }).address;
  if (address && typeof address === "object") {
    return { address: address as CheckoutAddressInput };
  }

  return null;
}

export function serializeCheckoutAddressPayload(payload: CheckoutAddressPayload): string {
  return JSON.stringify(payload);
}

export function deserializeCheckoutAddressPayload(json: string): CheckoutAddressPayload | null {
  try {
    const parsed = JSON.parse(json) as Record<string, unknown>;
    if (typeof parsed.addressId === "string" && parsed.addressId.trim()) {
      return { addressId: parsed.addressId.trim() };
    }
    if (parsed.address && typeof parsed.address === "object") {
      return { address: parsed.address as CheckoutAddressInput };
    }
    if (typeof parsed.name === "string" && typeof parsed.line1 === "string") {
      return { address: parsed as CheckoutAddressInput };
    }
    return null;
  } catch {
    return null;
  }
}
