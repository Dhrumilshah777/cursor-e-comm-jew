import { prisma } from "../lib/prisma.js";
import { startWorker, QUEUE_NAMES } from "../lib/queue.js";
import { fulfillOrderOnShiprocket } from "../services/shiprocketFulfillment.js";
import type { ShiprocketRetryPayload } from "../lib/shiprocketQueue.js";

export function startShiprocketRetryWorker() {
  const worker = startWorker<ShiprocketRetryPayload>(
    QUEUE_NAMES.shiprocketRetry,
    async (job) => {
      const { orderId, orderNumber } = job.data;

      const order = await prisma.order.findUnique({
        where: { id: orderId },
        select: { shiprocketShipmentId: true, status: true },
      });

      if (!order) {
        console.warn(`[Shiprocket-retry] Order ${orderId} not found, skipping`);
        return;
      }

      if (order.shiprocketShipmentId) {
        console.log(
          `[Shiprocket-retry] Order ${orderNumber} already has shipment ${order.shiprocketShipmentId}, skipping`,
        );
        return;
      }

      console.log(`[Shiprocket-retry] Retrying fulfillment for order ${orderNumber}`);
      await fulfillOrderOnShiprocket(orderId);
    },
    { concurrency: 2 },
  );

  if (worker) {
    console.log(`[Queue] shiprocket-retry worker started`);
  }
  return worker;
}
