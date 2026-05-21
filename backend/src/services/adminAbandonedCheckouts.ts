import { formatDisplayDate, formatPaise } from "../lib/format.js";
import { prisma } from "../lib/prisma.js";
import { deserializeCheckoutAddressPayload } from "./checkoutAddresses.js";

async function resolveAddressSummary(addressJson: string): Promise<string> {
  const payload = deserializeCheckoutAddressPayload(addressJson);
  if (!payload) return "—";

  if ("addressId" in payload) {
    const address = await prisma.address.findUnique({
      where: { id: payload.addressId },
      select: { name: true, city: true, pincode: true },
    });
    if (!address) return "Saved address";
    return `${address.name}, ${address.city} ${address.pincode}`;
  }

  return `${payload.address.name}, ${payload.address.city} ${payload.address.pincode}`;
}

function formatDateTime(value: Date): string {
  return value.toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

export async function listAdminAbandonedCheckouts(limit = 100) {
  const sessions = await prisma.checkoutPayment.findMany({
    where: { status: { not: "completed" } },
    include: {
      user: { select: { id: true, name: true, phone: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  const now = Date.now();

  return Promise.all(
    sessions.map(async (session) => {
      const expired = session.expiresAt.getTime() < now;

      return {
        id: session.id,
        razorpayOrderId: session.razorpayOrderId,
        status: expired ? "expired" : "pending",
        statusLabel: expired ? "Payment not completed" : "Payment in progress",
        startedAt: session.createdAt.toISOString(),
        startedOn: formatDisplayDate(session.createdAt),
        startedAtLabel: formatDateTime(session.createdAt),
        expiresAt: session.expiresAt.toISOString(),
        expiresAtLabel: formatDateTime(session.expiresAt),
        subtotal: formatPaise(session.subtotalPaise || session.amountPaise),
        discount:
          session.discountPaise > 0 ? formatPaise(session.discountPaise) : null,
        amount: formatPaise(session.amountPaise),
        couponCode: session.couponCode,
        addressSummary: await resolveAddressSummary(session.addressJson),
        customer: {
          id: session.user.id,
          name: session.user.name,
          phone: session.user.phone,
          email: session.user.email,
        },
      };
    }),
  );
}
