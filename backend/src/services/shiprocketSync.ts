import type { Order } from "../generated/prisma/client.js";
import {
  hasShiprocketMeta,
  mergeShiprocketMeta,
  metaToOrderUpdate,
  parseShiprocketMetaFromSources,
  type ParsedShiprocketMeta,
} from "../lib/shiprocketMeta.js";
import {
  getShiprocketOrderDetails,
  getShiprocketShipmentDetails,
  isShiprocketConfigured,
  trackShiprocketByAwb,
  trackShiprocketByShipmentId,
} from "../lib/shiprocket.js";
import { prisma } from "../lib/prisma.js";

function orderMetaFromDb(order: Order): ParsedShiprocketMeta {
  return {
    expectedDelivery: order.expectedDelivery,
    pickupDateLabel: order.pickupDateLabel,
    pickupTimeLabel: order.pickupTimeLabel,
    pickupScheduledAt: order.pickupScheduledAt,
  };
}

function needsShiprocketMetaSync(order: Order): boolean {
  if (!order.shiprocketShipmentId) return false;
  return !order.expectedDelivery || !order.pickupDateLabel;
}

export async function fetchShiprocketMetaForOrder(order: {
  shiprocketShipmentId: number | null;
  shiprocketOrderId: number | null;
  trackingNumber: string | null;
}): Promise<ParsedShiprocketMeta> {
  if (!isShiprocketConfigured() || !order.shiprocketShipmentId) {
    return {
      expectedDelivery: null,
      pickupDateLabel: null,
      pickupTimeLabel: null,
      pickupScheduledAt: null,
    };
  }

  const shipmentId = order.shiprocketShipmentId;
  const sources: unknown[] = [];

  if (order.trackingNumber) {
    try {
      sources.push(await trackShiprocketByAwb(order.trackingNumber));
    } catch (error) {
      console.warn(
        `[Shiprocket Sync] track/awb failed for ${order.trackingNumber}:`,
        error instanceof Error ? error.message : error,
      );
    }
  }

  try {
    sources.push(await trackShiprocketByShipmentId(shipmentId));
  } catch (error) {
    console.warn(
      `[Shiprocket Sync] track/shipment failed for ${shipmentId}:`,
      error instanceof Error ? error.message : error,
    );
  }

  try {
    sources.push(await getShiprocketShipmentDetails(shipmentId));
  } catch (error) {
    console.warn(
      `[Shiprocket Sync] shipments/${shipmentId} failed:`,
      error instanceof Error ? error.message : error,
    );
  }

  if (order.shiprocketOrderId) {
    try {
      sources.push(await getShiprocketOrderDetails(order.shiprocketOrderId));
    } catch (error) {
      console.warn(
        `[Shiprocket Sync] orders/show/${order.shiprocketOrderId} failed:`,
        error instanceof Error ? error.message : error,
      );
    }
  }

  return parseShiprocketMetaFromSources(...sources);
}

export async function syncShiprocketMetaToOrder(
  orderId: string,
  options?: { force?: boolean },
): Promise<Order | null> {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order || !order.shiprocketShipmentId) return order;

  if (!options?.force && !needsShiprocketMetaSync(order)) {
    return order;
  }

  const fetched = await fetchShiprocketMetaForOrder(order);
  if (!hasShiprocketMeta(fetched)) {
    return order;
  }

  const merged = mergeShiprocketMeta(orderMetaFromDb(order), fetched);
  const update = metaToOrderUpdate(merged);
  if (Object.keys(update).length === 0) {
    return order;
  }

  return prisma.order.update({
    where: { id: orderId },
    data: update,
  });
}

export { needsShiprocketMetaSync };
