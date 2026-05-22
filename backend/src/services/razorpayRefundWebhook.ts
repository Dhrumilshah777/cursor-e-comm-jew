import { returnStatusLabel } from "../lib/returnStatus.js";
import {
  cancelRefundPaymentStatusLabel,
  type CancelRefundStatus,
} from "../lib/cancelRefundStatus.js";
import {
  notifyAdminRefundFailed,
  notifyRefundProcessed,
} from "../lib/notifications.js";
import { prisma } from "../lib/prisma.js";

type RefundEntity = {
  id?: string;
  payment_id?: string;
  amount?: number;
  status?: string;
};

async function findReturnForRefund(refund: RefundEntity) {
  if (refund.id) {
    const byRefundId = await prisma.returnRequest.findFirst({
      where: { razorpayRefundId: refund.id },
      include: { order: { include: { user: true } }, orderItem: true },
    });
    if (byRefundId) return byRefundId;
  }

  if (refund.payment_id) {
    return prisma.returnRequest.findFirst({
      where: { order: { transactionId: refund.payment_id } },
      include: { order: { include: { user: true } }, orderItem: true },
      orderBy: { submittedAt: "desc" },
    });
  }

  return null;
}

async function findCancelledOrderForRefund(refund: RefundEntity) {
  if (refund.id) {
    const byRefundId = await prisma.order.findFirst({
      where: { cancelRazorpayRefundId: refund.id, status: "CANCELLED" },
      include: { user: true },
    });
    if (byRefundId) return byRefundId;
  }

  if (refund.payment_id) {
    return prisma.order.findFirst({
      where: {
        transactionId: refund.payment_id,
        status: "CANCELLED",
        cancelledAt: { not: null },
      },
      include: { user: true },
      orderBy: { cancelledAt: "desc" },
    });
  }

  return null;
}

async function updateCancelledOrderRefundStatus(
  orderId: string,
  status: CancelRefundStatus,
  processingAt?: Date,
) {
  await prisma.order.update({
    where: { id: orderId },
    data: {
      cancelRefundStatus: status,
      paymentStatus: cancelRefundPaymentStatusLabel(status),
      ...(processingAt ? { cancelRefundProcessingAt: processingAt } : {}),
    },
  });
}

export async function handleRazorpayRefundWebhook(event: string, refund: RefundEntity) {
  const returnRequest = await findReturnForRefund(refund);
  if (returnRequest) {
    return handleReturnRefundWebhook(event, refund, returnRequest);
  }

  const cancelledOrder = await findCancelledOrderForRefund(refund);
  if (cancelledOrder) {
    return handleCancelledOrderRefundWebhook(event, refund, cancelledOrder.id);
  }

  console.warn(`[Razorpay Webhook] No return or cancelled order for refund event ${event}`);
  return { ok: true as const, ignored: true as const };
}

async function handleCancelledOrderRefundWebhook(
  event: string,
  refund: RefundEntity,
  orderId: string,
) {
  const refundId = refund.id;

  if (event === "refund.created") {
    await prisma.order.update({
      where: { id: orderId },
      data: {
        cancelRazorpayRefundId: refundId ?? undefined,
        cancelRefundStatus: "INITIATED",
        paymentStatus: cancelRefundPaymentStatusLabel("INITIATED"),
      },
    });
    return { ok: true as const, event, orderId };
  }

  if (event === "refund.processed") {
    await updateCancelledOrderRefundStatus(orderId, "PROCESSING", new Date());
    return { ok: true as const, event, orderId };
  }

  if (event === "refund.failed") {
    await updateCancelledOrderRefundStatus(orderId, "FAILED");
    return { ok: true as const, event, orderId };
  }

  return { ok: true as const, ignored: true as const };
}

async function handleReturnRefundWebhook(
  event: string,
  refund: RefundEntity,
  returnRequest: NonNullable<Awaited<ReturnType<typeof findReturnForRefund>>>,
) {
  const refundId = refund.id ?? returnRequest.razorpayRefundId;
  const amountPaise = refund.amount ?? returnRequest.refundAmountPaise ?? 0;

  if (event === "refund.created") {
    await prisma.returnRequest.update({
      where: { id: returnRequest.id },
      data: {
        razorpayRefundId: refundId ?? undefined,
        refundStatus: "INITIATED",
        refundAmountPaise: amountPaise || undefined,
      },
    });
    return { ok: true as const, event };
  }

  if (event === "refund.processed") {
    await prisma.$transaction(async (tx) => {
      const current = await tx.returnRequest.findUnique({
        where: { id: returnRequest.id },
      });
      if (current?.status !== "REFUND_PROCESSED") {
        await tx.returnStatusEvent.create({
          data: {
            returnRequestId: returnRequest.id,
            status: "REFUND_PROCESSED",
            label: returnStatusLabel("REFUND_PROCESSED"),
            note: "Refund processed via Razorpay webhook",
          },
        });
      }

      await tx.returnRequest.update({
        where: { id: returnRequest.id },
        data: {
          status: "REFUND_PROCESSED",
          razorpayRefundId: refundId ?? undefined,
          refundStatus: "PROCESSED",
          refundAmountPaise: amountPaise || undefined,
        },
      });
    });

    if (returnRequest.order.user.phone) {
      void notifyRefundProcessed({
        customerPhone: returnRequest.order.user.phone,
        orderNumber: returnRequest.order.orderNumber,
        amountPaise: amountPaise || returnRequest.refundAmountPaise || 0,
      });
    }

    return { ok: true as const, event, returnRequestId: returnRequest.id };
  }

  if (event === "refund.failed") {
    await prisma.returnRequest.update({
      where: { id: returnRequest.id },
      data: {
        razorpayRefundId: refundId ?? undefined,
        refundStatus: "FAILED",
      },
    });

    void notifyAdminRefundFailed({
      orderNumber: returnRequest.order.orderNumber,
      returnRequestId: returnRequest.id,
      reason: refund.status,
    });

    return { ok: true as const, event, returnRequestId: returnRequest.id };
  }

  return { ok: true as const, ignored: true as const };
}
