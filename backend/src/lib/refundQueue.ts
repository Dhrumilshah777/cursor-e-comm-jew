import { getQueue, QUEUE_NAMES } from "./queue.js";

export type RefundJobKind = "order-cancellation" | "return";

export type RefundJobPayload =
  | {
      kind: "order-cancellation";
      orderId: string;
      paymentId: string;
      amountPaise: number;
      orderNumber: string;
      refundAmountLabel: string;
    }
  | {
      kind: "return";
      returnRequestId: string;
      paymentId: string;
      amountPaise: number;
      orderNumber: string;
    };

const REFUND_JOB_OPTIONS = {
  attempts: 6,
  backoff: { type: "exponential" as const, delay: 10_000 },
};

/**
 * Enqueue a Razorpay refund. Falls back to running the refund inline if the
 * queue isn't configured (dev / no REDIS_URL). Returns immediately so the
 * caller's request isn't blocked on Razorpay's API.
 */
export async function enqueueRefund(payload: RefundJobPayload): Promise<void> {
  const queue = getQueue(QUEUE_NAMES.refunds);

  if (!queue) {
    const { processRefundJob } = await import("../workers/refundsWorker.js");
    void processRefundJob(payload).catch((error) => {
      console.error(`[Refund:${payload.kind}] inline run failed:`, error);
    });
    return;
  }

  await queue.add(payload.kind, payload, REFUND_JOB_OPTIONS);
}
