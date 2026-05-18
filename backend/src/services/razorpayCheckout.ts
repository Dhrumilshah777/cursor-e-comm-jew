import { prisma } from "../lib/prisma.js";
import {
  createRazorpayOrder,
  fetchRazorpayOrder,
  getRazorpayKeyId,
  verifyRazorpayPaymentSignature,
  verifyRazorpayWebhookSignature,
} from "../lib/razorpay.js";
import {
  getCartCheckoutTotals,
  placeOrderFromCart,
  type CheckoutAddressInput,
  validateCheckoutAddress,
} from "./checkout.js";

const CHECKOUT_TTL_MS = 30 * 60 * 1000;

export async function createRazorpayCheckout(
  userId: string,
  address: CheckoutAddressInput,
) {
  const validationError = validateCheckoutAddress(address);
  if (validationError) {
    return { error: "INVALID_ADDRESS" as const, message: validationError };
  }

  const totals = await getCartCheckoutTotals(userId);
  if ("error" in totals) {
    return totals;
  }

  const receipt = `wj_${userId.slice(-8)}_${Date.now()}`;
  const razorpayOrder = await createRazorpayOrder({
    amountPaise: totals.totalPaise,
    receipt,
    notes: { userId },
  });

  await prisma.checkoutPayment.create({
    data: {
      userId,
      razorpayOrderId: razorpayOrder.id,
      addressJson: JSON.stringify(address),
      amountPaise: totals.totalPaise,
      expiresAt: new Date(Date.now() + CHECKOUT_TTL_MS),
    },
  });

  return {
    keyId: getRazorpayKeyId(),
    razorpayOrderId: razorpayOrder.id,
    amount: razorpayOrder.amount,
    currency: razorpayOrder.currency,
    subtotalPaise: totals.subtotalPaise,
    shippingPaise: totals.shippingPaise,
    totalPaise: totals.totalPaise,
  };
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
    return { error: "CHECKOUT_SESSION_EXPIRED" as const };
  }

  const razorpayOrder = await fetchRazorpayOrder(input.razorpayOrderId);
  if (razorpayOrder.amount !== session.amountPaise) {
    return { error: "PAYMENT_AMOUNT_MISMATCH" as const };
  }

  const address = JSON.parse(session.addressJson) as CheckoutAddressInput;

  const result = await placeOrderFromCart(userId, {
    address,
    paymentMethod: "Razorpay",
    transactionId: input.razorpayPaymentId,
  });

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
    };
  };

  if (payload.event !== "payment.captured") {
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

  const address = JSON.parse(session.addressJson) as CheckoutAddressInput;
  const result = await placeOrderFromCart(session.userId, {
    address,
    paymentMethod: "Razorpay",
    transactionId: payment.id,
  });

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

  return { ok: true as const };
}
