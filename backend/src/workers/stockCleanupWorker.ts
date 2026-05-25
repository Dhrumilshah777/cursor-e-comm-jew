import {
  parseCheckoutItems,
  restoreStock,
  type InventoryItem,
} from "../lib/inventory.js";
import { prisma } from "../lib/prisma.js";
import {
  getQueue,
  isQueueEnabled,
  QUEUE_NAMES,
  startWorker,
} from "../lib/queue.js";

const CRON_EVERY_MS = 60 * 1000;
const BATCH_SIZE = 100;

/**
 * Cleanup pass: find pending CheckoutPayments whose `expiresAt` is in the
 * past, flip them to `expired`, and restore their reserved stock so other
 * shoppers can buy the items.
 *
 * Safe to run concurrently — the `updateMany` predicate (`status: pending`)
 * makes the state transition idempotent.
 */
export async function runStockCleanup(): Promise<{ expired: number }> {
  const now = new Date();
  const candidates = await prisma.checkoutPayment.findMany({
    where: { status: "pending", expiresAt: { lt: now } },
    select: { id: true, itemsJson: true },
    take: BATCH_SIZE,
  });

  if (candidates.length === 0) {
    return { expired: 0 };
  }

  let expiredCount = 0;
  for (const session of candidates) {
    const items: InventoryItem[] = parseCheckoutItems(session.itemsJson);

    try {
      await prisma.$transaction(async (tx) => {
        const result = await tx.checkoutPayment.updateMany({
          where: { id: session.id, status: "pending" },
          data: { status: "expired" },
        });
        if (result.count === 0) return; // Someone else already expired it.

        if (items.length > 0) {
          await restoreStock(tx, items);
        }
        expiredCount++;
      });
    } catch (error) {
      console.error(
        `[stock-cleanup] failed to expire checkout ${session.id}:`,
        error,
      );
    }
  }

  if (expiredCount > 0) {
    console.info(`[stock-cleanup] released ${expiredCount} stale checkout(s)`);
  }
  return { expired: expiredCount };
}

let inlineTimer: NodeJS.Timeout | null = null;

export function startStockCleanupWorker(): void {
  if (!isQueueEnabled()) {
    if (inlineTimer) return;
    console.info(
      "[stock-cleanup] queue disabled — running cleanup on a local interval",
    );
    inlineTimer = setInterval(() => {
      void runStockCleanup().catch((error) =>
        console.error("[stock-cleanup] inline run failed:", error),
      );
    }, CRON_EVERY_MS);
    // Don't let this interval keep the process alive on shutdown.
    inlineTimer.unref?.();
    return;
  }

  const queue = getQueue(QUEUE_NAMES.stockCleanup);
  if (!queue) return;

  // Schedule a repeatable job; BullMQ dedupes by `jobId` so restarts are safe.
  void queue
    .add(
      "stock-cleanup-tick",
      {},
      {
        jobId: "stock-cleanup-cron",
        repeat: { every: CRON_EVERY_MS },
        removeOnComplete: true,
        removeOnFail: { age: 60 * 60 * 24 },
      },
    )
    .catch((error) => {
      console.error("[stock-cleanup] failed to register cron job:", error);
    });

  startWorker(QUEUE_NAMES.stockCleanup, async () => {
    await runStockCleanup();
  });
}
