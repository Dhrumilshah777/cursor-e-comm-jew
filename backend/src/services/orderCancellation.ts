import { orderStatusEventLabel } from "../lib/format.js";
import {
  cancelRefundPaymentStatusLabel,
  type CancelRefundStatus,
} from "../lib/cancelRefundStatus.js";
import {
  cancellationBlockReason,
  getCancellationQuote,
  isOrderCancellableStatus,
  parseCancellationNote,
  parseCancellationReason,
  type CancellationReason,
} from "../lib/orderCancellation.js";
import { createRazorpayRefund } from "../lib/razorpay.js";
import { mapOrderToDto } from "../lib/orderMapper.js";
import {
  notifyAdminOrderCancelled,
  notifyOrderCancelled,
} from "../lib/notifications.js";
import { prisma } from "../lib/prisma.js";

export class OrderCancellationError extends Error {
  code: string;

  constructor(message: string, code: string) {
    super(message);
    this.name = "OrderCancellationError";
    this.code = code;
  }
}

export type CancelOrderInput = {
  reason: CancellationReason;
  note?: string | null;
};

export async function cancelOrderForUser(
  orderId: string,
  userId: string,
  input: CancelOrderInput,
) {
  const order = await prisma.order.findFirst({
    where: { id: orderId, userId },
    include: {
      items: { include: { product: true } },
      deliveryAddress: true,
      statusEvents: { orderBy: { eventAt: "asc" } },
      returnRequests: { take: 1 },
      user: { select: { phone: true, name: true } },
    },
  });

  if (!order) {
    throw new OrderCancellationError("Order not found", "ORDER_NOT_FOUND");
  }

  const blockReason = cancellationBlockReason(order.status);
  if (blockReason) {
    throw new OrderCancellationError(blockReason, "NOT_CANCELLABLE");
  }

  if (!isOrderCancellableStatus(order.status)) {
    throw new OrderCancellationError(
      "This order cannot be cancelled.",
      "NOT_CANCELLABLE",
    );
  }

  if (order.returnRequests.length > 0) {
    throw new OrderCancellationError(
      "This order has a return request and cannot be cancelled.",
      "RETURN_EXISTS",
    );
  }

  const quote = getCancellationQuote({
    status: order.status,
    placedAt: order.placedAt,
    totalPaise: order.totalPaise,
  });

  if (quote.refundPaise <= 0) {
    throw new OrderCancellationError(
      "Refund amount is zero after deductions. Contact client care to cancel.",
      "REFUND_TOO_LOW",
    );
  }

  let cancelRazorpayRefundId: string | null = null;
  let cancelRefundStatus: CancelRefundStatus = "INITIATED";
  let cancelRefundProcessingAt: Date | null = null;

  if (order.transactionId) {
    try {
      const refund = await createRazorpayRefund({
        paymentId: order.transactionId,
        amountPaise: quote.refundPaise,
        notes: {
          order_number: order.orderNumber,
          reason: "customer_cancellation",
        },
      });
      cancelRazorpayRefundId = refund.id;
      if (refund.status === "processed") {
        cancelRefundStatus = "PROCESSING";
        cancelRefundProcessingAt = new Date();
      }
    } catch (error) {
      console.error(`Razorpay refund failed for order ${order.orderNumber}:`, error);
      throw new OrderCancellationError(
        "Refund could not be processed. Please contact client care.",
        "REFUND_FAILED",
      );
    }
  } else {
    cancelRefundStatus = "INITIATED";
  }

  const paymentStatus = cancelRefundPaymentStatusLabel(cancelRefundStatus);

  const noteParts = [
    quote.withinFullRefundWindow
      ? "Cancelled within 24 hours (1% payment gateway fee deducted)."
      : "Cancelled after 24 hours (₹1,000 processing + 1% gateway fee deducted).",
    `Reason: ${input.reason}.`,
    input.note ? `Note: ${input.note}` : null,
    `Refund ${quote.refundAmount}.`,
  ].filter(Boolean);

  const updated = await prisma.$transaction(async (tx) => {
    await tx.orderStatusEvent.create({
      data: {
        orderId: order.id,
        status: "CANCELLED",
        label: orderStatusEventLabel("CANCELLED"),
        note: noteParts.join(" "),
      },
    });

    return tx.order.update({
      where: { id: order.id },
      data: {
        status: "CANCELLED",
        cancelledAt: new Date(),
        cancelReason: input.reason,
        cancelNote: input.note ?? null,
        cancelRefundPaise: quote.refundPaise,
        cancelDeductionPaise: quote.deductionPaise,
        cancelRazorpayRefundId,
        cancelRefundStatus,
        cancelRefundProcessingAt,
        paymentStatus,
      },
      include: {
        items: { include: { product: true } },
        deliveryAddress: true,
        statusEvents: { orderBy: { eventAt: "asc" } },
        returnRequests: {
          include: {
            orderItem: true,
            pickupAddress: true,
            images: true,
            order: { include: { user: true } },
            statusEvents: { orderBy: { eventAt: "asc" } },
          },
          orderBy: { submittedAt: "desc" },
          take: 1,
        },
      },
    });
  });

    void notifyOrderCancelled({
    customerPhone: order.user.phone,
    orderNumber: order.orderNumber,
    refundAmount: quote.refundAmount,
    refundStatus: paymentStatus,
  });
  void notifyAdminOrderCancelled({
    orderNumber: order.orderNumber,
    customerPhone: order.user.phone,
    refundAmount: quote.refundAmount,
    refundStatus: paymentStatus,
  });

  return {
    order: mapOrderToDto(updated),
    cancellation: quote,
  };
}
