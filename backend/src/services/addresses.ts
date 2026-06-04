import { prisma } from "../lib/prisma.js";
import { validateCheckoutAddress } from "./checkout.js";

const HIDDEN_LABELS = new Set(["Checkout", "Return pickup"]);

export type SavedAddressDto = {
  id: string;
  label: string;
  name: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  pincode: string;
  phone: string;
  isDefault: boolean;
};

export type UpdateAddressInput = {
  name: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
  phone: string;
  label?: string;
};

export function mapAddressToDto(address: {
  id: string;
  label: string | null;
  name: string;
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  pincode: string;
  phone: string;
  isDefault: boolean;
}): SavedAddressDto {
  return {
    id: address.id,
    label: address.label ?? "Home",
    name: address.name,
    line1: address.line1,
    line2: address.line2 ?? "",
    city: address.city,
    state: address.state,
    pincode: address.pincode,
    phone: address.phone,
    isDefault: address.isDefault,
  };
}

export async function listSavedAddressesForUser(userId: string) {
  const addresses = await prisma.address.findMany({
    where: {
      userId,
      NOT: { label: { in: [...HIDDEN_LABELS] } },
    },
    orderBy: [{ isDefault: "desc" }, { updatedAt: "desc" }],
  });

  return addresses.map(mapAddressToDto);
}

export async function updateSavedAddressForUser(
  userId: string,
  addressId: string,
  input: UpdateAddressInput,
) {
  const existing = await prisma.address.findFirst({
    where: {
      id: addressId,
      userId,
      NOT: { label: { in: [...HIDDEN_LABELS] } },
    },
  });

  if (!existing) {
    return { error: "NOT_FOUND" as const };
  }

  const validationError = validateCheckoutAddress({
    ...input,
    saveAddress: true,
  });
  if (validationError) {
    return { error: "INVALID" as const, message: validationError };
  }

  const phoneDigits = input.phone.replace(/\D/g, "").slice(-10);

  const updated = await prisma.address.update({
    where: { id: addressId },
    data: {
      name: input.name.trim(),
      line1: input.line1.trim(),
      line2: input.line2?.trim() || null,
      city: input.city.trim(),
      state: input.state.trim(),
      pincode: input.pincode.trim(),
      phone: `+91${phoneDigits}`,
      ...(input.label?.trim() ? { label: input.label.trim() } : {}),
    },
  });

  return { address: mapAddressToDto(updated) };
}

export async function deleteSavedAddressForUser(userId: string, addressId: string) {
  const existing = await prisma.address.findFirst({
    where: {
      id: addressId,
      userId,
      NOT: { label: { in: [...HIDDEN_LABELS] } },
    },
  });

  if (!existing) {
    return { error: "NOT_FOUND" as const };
  }

  const orderCount = await prisma.order.count({
    where: { deliveryAddressId: addressId },
  });

  if (orderCount > 0) {
    return {
      error: "IN_USE" as const,
      message: "This address was used for an order and cannot be deleted.",
    };
  }

  await prisma.address.delete({ where: { id: addressId } });
  return { ok: true as const };
}
