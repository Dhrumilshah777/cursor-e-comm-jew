import { getQueue, QUEUE_NAMES } from "./queue.js";

export type ShiprocketRetryPayload = {
  kind: "fulfill-order";
  orderId: string;
  orderNumber: string;
  attempt: number;
};

const SHIPROCKET_RETRY_OPTIONS = {
  attempts: 5,
  backoff: { type: "exponential" as const, delay: 60_000 },
};

/**
 * Fire-and-forget retry job for Shiprocket order fulfillment. Used when the
 * synchronous attempt at admin "Mark Shipped" time fails — we still want the
 * order to eventually get a Shiprocket shipment + AWB without manual retry.
 *
 * Silently no-ops if Redis is not configured.
 */
export async function enqueueShiprocketRetry(
  payload: Omit<ShiprocketRetryPayload, "kind" | "attempt"> & { attempt?: number },
): Promise<void> {
  const queue = getQueue(QUEUE_NAMES.shiprocketRetry);
  if (!queue) return;

  await queue.add(
    "fulfill-order",
    {
      kind: "fulfill-order",
      orderId: payload.orderId,
      orderNumber: payload.orderNumber,
      attempt: payload.attempt ?? 1,
    },
    SHIPROCKET_RETRY_OPTIONS,
  );
}
