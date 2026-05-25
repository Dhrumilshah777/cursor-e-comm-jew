import { prisma } from "../lib/prisma.js";
import {
  createRazorpayOrder,
  fetchRazorpayOrder,
  getRazorpayKeyId,
  verifyRazorpayPaymentSignature,
  verifyRazorpayWebhookSignature,
} from "../lib/razorpay.js";
import {
  deserializeCheckoutAddressPayload,
  serializeCheckoutAddressPayload,
  type CheckoutAddressPayload,
} from "./checkoutAddresses.js";
import {
  getCartCheckoutTotals,
  placeOrderFromCart,
  validateCheckoutAddress,
  validateCheckoutEmail,
  normalizeCheckoutEmail,
} from "./checkout.js";
import { handleRazorpayRefundWebhook } from "./razorpayRefundWebhook.js";
import {
  checkAvailability,
  InsufficientStockError,
  parseCheckoutItems,
  reserveStock,
  restoreStock,
  serializeCheckoutItems,
  type InventoryItem,
  type UnavailableItem,
} from "../lib/inventory.js";

// 15-minute reservation window — matches the customer-visible expiry shown
// on the checkout page and the cleanup worker that releases stale carts.
const CHECKOUT_TTL_MS = 15 * 60 * 1000;

async function placeOrderForCheckoutSession(
  userId: string,
  session: {
    addressJson: string;
    customerEmail: string | null;
    couponId: string | null;
    couponCode: string | null;
    discountPaise: number;
  },
  paymentMethod: string,
  transactionId: string,
) {
  const payload = deserializeCheckoutAddressPayload(session.addressJson);
  if (!payload) {
    return { error: "INVALID_ADDRESS" as const, message: "Invalid checkout address" };
  }

  if (!session.customerEmail) {
    return { error: "INVALID_EMAIL" as const, message: "Email is required" };
  }

  const orderInput = {
    paymentMethod,
    transactionId,
    customerEmail: session.customerEmail,
    couponId: session.couponId,
    couponCode: session.couponCode,
    discountPaise: session.discountPaise,
  };

  if ("addressId" in payload) {
    return placeOrderFromCart(userId, {
      addressId: payload.addressId,
      ...orderInput,
    });
  }

  return placeOrderFromCart(userId, {
    address: payload.address,
    ...orderInput,
  });
}

/**
 * Stock was decremented at create-order time using the cart snapshot.
 * If the cart changed between then and order placement (rare), the
 * actually-placed order won't match the reservation. We reconcile here:
 *   - reserved > ordered → restore the difference
 *   - reserved < ordered → try to decrement extra; warn if we can't
 *     (means cart grew faster than other buyers; very rare)
 */
async function reconcileStockAfterOrder(
  sessionId: string,
  shopOrderId: string,
): Promise<void> {
  const session = await prisma.checkoutPayment.findUnique({
    where: { id: sessionId },
    select: { itemsJson: true },
  });
  if (!session) return;

  const orderItems = await prisma.orderItem.findMany({
    where: { orderId: shopOrderId },
    select: { productId: true, quantity: true },
  });

  const reserved = parseCheckoutItems(session.itemsJson);

  const reservedMap = new Map<string, number>();
  for (const r of reserved) {
    reservedMap.set(r.productId, (reservedMap.get(r.productId) ?? 0) + r.quantity);
  }
  const orderedMap = new Map<string, number>();
  for (const o of orderItems) {
    if (!o.productId) continue;
    orderedMap.set(o.productId, (orderedMap.get(o.productId) ?? 0) + o.quantity);
  }

  const productIds = new Set([...reservedMap.keys(), ...orderedMap.keys()]);
  for (const pid of productIds) {
    const reservedQty = reservedMap.get(pid) ?? 0;
    const orderedQty = orderedMap.get(pid) ?? 0;
    const diff = reservedQty - orderedQty;

    if (diff > 0) {
      try {
        await prisma.product.update({
          where: { id: pid },
          data: { stockCount: { increment: diff } },
        });
      } catch (error) {
        console.error(`[inventory] reconciliation restore failed for ${pid}:`, error);
      }
      continue;
    }

    if (diff < 0) {
      const need = -diff;
      const result = await prisma.product.updateMany({
        where: { id: pid, stockCount: { gte: need } },
        data: { stockCount: { decrement: need } },
      });
      if (result.count === 0) {
        console.error(
          `[inventory] overdraft during reconciliation for product ${pid}: ordered ${orderedQty}, reserved ${reservedQty}. Manual adjustment may be required.`,
        );
      }
    }
  }
}

export async function createRazorpayCheckout(
  userId: string,
  payload: CheckoutAddressPayload,
  customerEmail: string,
  couponCode?: string | null,
) {
  const emailError = validateCheckoutEmail(customerEmail);
  if (emailError) {
    return { error: "INVALID_EMAIL" as const, message: emailError };
  }
  const normalizedEmail = normalizeCheckoutEmail(customerEmail);

  if ("addressId" in payload) {
    const saved = await prisma.address.findFirst({
      where: { id: payload.addressId, userId },
    });
    if (!saved) {
      return { error: "ADDRESS_NOT_FOUND" as const };
    }
  } else {
    const validationError = validateCheckoutAddress(payload.address);
    if (validationError) {
      return { error: "INVALID_ADDRESS" as const, message: validationError };
    }
  }

  const totals = await getCartCheckoutTotals(userId, couponCode);
  if ("error" in totals) {
    return totals;
  }

  const itemsSnapshot: InventoryItem[] = totals.cart.items.map((item) => ({
    productId: item.productId,
    quantity: item.quantity,
  }));

  // Pre-flight check so we can surface a clean "X is sold out" message
  // before hitting Razorpay. The reserve step below is still the source
  // of truth (covers races between this check and the decrement).
  const availability = await checkAvailability(itemsSnapshot);
  if (!availability.ok) {
    return {
      error: "OUT_OF_STOCK" as const,
      unavailable: availability.unavailable,
    };
  }

  const receipt = `wj_${userId.slice(-8)}_${Date.now()}`;
  const razorpayOrder = await createRazorpayOrder({
    amountPaise: totals.totalPaise,
    receipt,
    notes: { userId },
  });

  try {
    await prisma.$transaction(async (tx) => {
      await reserveStock(tx, itemsSnapshot);
      await tx.checkoutPayment.create({
        data: {
          userId,
          razorpayOrderId: razorpayOrder.id,
          addressJson: serializeCheckoutAddressPayload(payload),
          itemsJson: serializeCheckoutItems(itemsSnapshot),
          subtotalPaise: totals.subtotalPaise,
          discountPaise: totals.discountPaise,
          couponId: totals.coupon?.couponId ?? null,
          couponCode: totals.coupon?.code ?? null,
          amountPaise: totals.totalPaise,
          customerEmail: normalizedEmail,
          expiresAt: new Date(Date.now() + CHECKOUT_TTL_MS),
        },
      });
    });
  } catch (error) {
    if (error instanceof InsufficientStockError) {
      // Stock was sniped by another buyer between availability check and
      // reservation. Razorpay order will auto-expire on their side.
      const unavailable: UnavailableItem[] = [
        {
          productId: error.productId,
          available: 0,
          requested: error.requested,
        },
      ];
      return { error: "OUT_OF_STOCK" as const, unavailable };
    }
    throw error;
  }

  return {
    keyId: getRazorpayKeyId(),
    razorpayOrderId: razorpayOrder.id,
    amount: razorpayOrder.amount,
    currency: razorpayOrder.currency,
    subtotalPaise: totals.subtotalPaise,
    shippingPaise: totals.shippingPaise,
    discountPaise: totals.discountPaise,
    totalPaise: totals.totalPaise,
    coupon: totals.coupon,
  };
}

/**
 * Mark a checkout session as failed/cancelled and restore any reserved
 * stock. Safe to call multiple times — only `pending` sessions are touched.
 */
async function releaseCheckoutSessionStock(
  sessionId: string,
  reason: "expired" | "failed",
): Promise<void> {
  const session = await prisma.checkoutPayment.findUnique({
    where: { id: sessionId },
    select: { id: true, status: true, itemsJson: true },
  });

  if (!session || session.status !== "pending") return;

  const items = parseCheckoutItems(session.itemsJson);

  await prisma.$transaction(async (tx) => {
    const updated = await tx.checkoutPayment.updateMany({
      where: { id: session.id, status: "pending" },
      data: { status: reason },
    });
    if (updated.count === 0) return;
    if (items.length > 0) {
      await restoreStock(tx, items);
    }
  });
}

export async function verifyRazorpayCheckoutAndPlaceOrder(
  userId: string,
  input: {
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature: string;
  },
) {
  if (
    !verifyRazorpayPaymentSignature(
      input.razorpayOrderId,
      input.razorpayPaymentId,
      input.razorpaySignature,
    )
  ) {
    return { error: "PAYMENT_VERIFICATION_FAILED" as const };
  }

  const session = await prisma.checkoutPayment.findUnique({
    where: { razorpayOrderId: input.razorpayOrderId },
  });

  if (!session || session.userId !== userId) {
    return { error: "CHECKOUT_SESSION_NOT_FOUND" as const };
  }

  if (session.status === "completed" && session.shopOrderId) {
    const order = await prisma.order.findFirst({
      where: { id: session.shopOrderId, userId },
      include: {
        items: { include: { product: true } },
        deliveryAddress: true,
        statusEvents: { orderBy: { eventAt: "asc" } },
      },
    });
    if (order) {
      const { mapOrderToDto } = await import("../lib/orderMapper.js");
      return { order: mapOrderToDto(order) };
    }
  }

  if (session.expiresAt < new Date()) {
    // Reservation lapsed before the user finished paying — release the
    // hold so other shoppers can buy the items. Razorpay will refund
    // the captured payment via its standard auto-refund flow.
    await releaseCheckoutSessionStock(session.id, "expired").catch((error) => {
      console.error(
        `[inventory] failed to release expired session ${session.id}:`,
        error,
      );
    });
    return { error: "CHECKOUT_SESSION_EXPIRED" as const };
  }

  const razorpayOrder = await fetchRazorpayOrder(input.razorpayOrderId);
  if (razorpayOrder.amount !== session.amountPaise) {
    return { error: "PAYMENT_AMOUNT_MISMATCH" as const };
  }

  const result = await placeOrderForCheckoutSession(
    userId,
    {
      addressJson: session.addressJson,
      customerEmail: session.customerEmail,
      couponId: session.couponId,
      couponCode: session.couponCode,
      discountPaise: session.discountPaise,
    },
    "Razorpay",
    input.razorpayPaymentId,
  );

  if ("error" in result) {
    return result;
  }

  if (!("order" in result)) {
    return { error: "ORDER_FAILED" as const };
  }

  await prisma.checkoutPayment.update({
    where: { id: session.id },
    data: {
      status: "completed",
      shopOrderId: result.order.id,
    },
  });

  await reconcileStockAfterOrder(session.id, result.order.id).catch((error) => {
    console.error("[inventory] reconciliation failed:", error);
  });

  return result;
}

export async function handleRazorpayWebhook(rawBody: string, signature: string) {
  if (!verifyRazorpayWebhookSignature(rawBody, signature)) {
    return { error: "INVALID_WEBHOOK_SIGNATURE" as const };
  }

  const payload = JSON.parse(rawBody) as {
    event?: string;
    payload?: {
      payment?: { entity?: { id?: string; order_id?: string; status?: string } };
      refund?: {
        entity?: {
          id?: string;
          payment_id?: string;
          amount?: number;
          status?: string;
        };
      };
    };
  };

  const event = payload.event ?? "";

  if (
    event === "refund.created" ||
    event === "refund.processed" ||
    event === "refund.failed"
  ) {
    const refund = payload.payload?.refund?.entity;
    if (!refund?.id && !refund?.payment_id) {
      return { ok: true as const, ignored: true };
    }
    return handleRazorpayRefundWebhook(event, refund);
  }

  if (event === "payment.failed") {
    const payment = payload.payload?.payment?.entity;
    if (!payment?.order_id) {
      return { ok: true as const, ignored: true };
    }
    const session = await prisma.checkoutPayment.findUnique({
      where: { razorpayOrderId: payment.order_id },
      select: { id: true, status: true },
    });
    if (session && session.status === "pending") {
      await releaseCheckoutSessionStock(session.id, "failed").catch((error) => {
        console.error(
          `[inventory] failed to release session ${session.id} on payment.failed:`,
          error,
        );
      });
    }
    return { ok: true as const };
  }

  if (event !== "payment.captured") {
    return { ok: true as const, ignored: true };
  }

  const payment = payload.payload?.payment?.entity;
  if (!payment?.order_id || !payment.id) {
    return { ok: true as const, ignored: true };
  }

  const session = await prisma.checkoutPayment.findUnique({
    where: { razorpayOrderId: payment.order_id },
  });

  if (!session || session.status === "completed") {
    return { ok: true as const };
  }

  const result = await placeOrderForCheckoutSession(
    session.userId,
    {
      addressJson: session.addressJson,
      customerEmail: session.customerEmail,
      couponId: session.couponId,
      couponCode: session.couponCode,
      discountPaise: session.discountPaise,
    },
    "Razorpay",
    payment.id,
  );

  if ("error" in result) {
    return { error: "ORDER_FAILED" as const };
  }

  if (!("order" in result)) {
    return { error: "ORDER_FAILED" as const };
  }

  await prisma.checkoutPayment.update({
    where: { id: session.id },
    data: { status: "completed", shopOrderId: result.order.id },
  });

  await reconcileStockAfterOrder(session.id, result.order.id).catch((error) => {
    console.error("[inventory] webhook reconciliation failed:", error);
  });

  return { ok: true as const };
}
