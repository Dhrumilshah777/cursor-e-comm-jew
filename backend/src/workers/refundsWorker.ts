import { prisma } from "../lib/prisma.js";
import { createRazorpayRefund } from "../lib/razorpay.js";
import { startWorker, QUEUE_NAMES } from "../lib/queue.js";
import {
  notifyAdminCancellationRefundFailed,
  notifyAdminRefundFailed,
} from "../lib/notifications.js";
import { cancelRefundCreditedUpdate } from "../lib/cancelRefundStatus.js";
import type { RefundJobPayload } from "../lib/refundQueue.js";

/**
 * Idempotent refund executor. Reads the current state of the order/return
 * before calling Razorpay so we never create duplicate refunds even if a job
 * is retried after a partial failure.
 */
export async function processRefundJob(payload: RefundJobPayload): Promise<void> {
  if (payload.kind === "order-cancellation") {
    await processCancellationRefund(payload);
    return;
  }
  await processReturnRefund(payload);
}

async function processCancellationRefund(
  payload: Extract<RefundJobPayload, { kind: "order-cancellation" }>,
): Promise<void> {
  const order = await prisma.order.findUnique({ where: { id: payload.orderId } });
  if (!order) {
    console.warn(`[Refund:cancel] Order ${payload.orderId} not found, skipping`);
    return;
  }

  if (order.cancelRazorpayRefundId) {
    console.log(
      `[Refund:cancel] Order ${order.orderNumber} already has refund ${order.cancelRazorpayRefundId}, skipping`,
    );
    return;
  }

  const refund = await createRazorpayRefund({
    paymentId: payload.paymentId,
    amountPaise: payload.amountPaise,
    notes: {
      order_number: payload.orderNumber,
      reason: "customer_cancellation",
    },
  });

  if (refund.status === "processed") {
    await prisma.order.update({
      where: { id: order.id },
      data: {
        cancelRazorpayRefundId: refund.id,
        ...cancelRefundCreditedUpdate(new Date()),
      },
    });
  } else {
    await prisma.order.update({
      where: { id: order.id },
      data: { cancelRazorpayRefundId: refund.id },
    });
  }
}

async function processReturnRefund(
  payload: Extract<RefundJobPayload, { kind: "return" }>,
): Promise<void> {
  const returnRequest = await prisma.returnRequest.findUnique({
    where: { id: payload.returnRequestId },
  });
  if (!returnRequest) {
    console.warn(`[Refund:return] Return ${payload.returnRequestId} not found, skipping`);
    return;
  }

  if (returnRequest.razorpayRefundId) {
    console.log(
      `[Refund:return] Return ${returnRequest.id} already has refund ${returnRequest.razorpayRefundId}, skipping`,
    );
    return;
  }

  const refund = await createRazorpayRefund({
    paymentId: payload.paymentId,
    amountPaise: payload.amountPaise,
    notes: {
      returnRequestId: returnRequest.id,
      orderNumber: payload.orderNumber,
    },
  });

  await prisma.returnRequest.update({
    where: { id: returnRequest.id },
    data: {
      razorpayRefundId: refund.id,
      refundStatus: refund.status === "processed" ? "PROCESSED" : "INITIATED",
    },
  });
}

export function startRefundsWorker() {
  const worker = startWorker<RefundJobPayload>(
    QUEUE_NAMES.refunds,
    async (job) => {
      try {
        await processRefundJob(job.data);
      } catch (error) {
        const isFinalAttempt =
          (job.attemptsMade ?? 0) + 1 >= (job.opts.attempts ?? 1);
        if (isFinalAttempt) {
          // Last try — alert admin so they can refund manually in Razorpay.
          await alertOnFinalFailure(job.data, error);
        }
        throw error;
      }
    },
    { concurrency: 3 },
  );

  if (worker) {
    console.log(`[Queue] refunds worker started`);
  }
  return worker;
}

async function alertOnFinalFailure(
  payload: RefundJobPayload,
  error: unknown,
): Promise<void> {
  const reason = error instanceof Error ? error.message : "Unknown error";

  if (payload.kind === "order-cancellation") {
    await notifyAdminCancellationRefundFailed({
      orderNumber: payload.orderNumber,
      refundAmount: payload.refundAmountLabel,
      reason,
    });
    return;
  }

  await notifyAdminRefundFailed({
    orderNumber: payload.orderNumber,
    returnRequestId: payload.returnRequestId,
    reason,
  });
}
