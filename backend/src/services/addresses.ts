import { prisma } from "../lib/prisma.js";

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
