import type { Order, OrderStatus } from "../generated/prisma/client.js";
import { orderStatusEventLabel } from "../lib/format.js";
import { notifyOrderCancelledOnShiprocket } from "../lib/notifications.js";
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
import { mapShiprocketStatusToOrderStatus } from "./shiprocketWebhook.js";

const STATUS_KEYS = [
  "current_status",
  "shipment_status",
  "status",
  "ship_status",
];

function deepFindString(obj: unknown, keys: string[]): string | null {
  if (!obj || typeof obj !== "object") return null;

  if (Array.isArray(obj)) {
    for (const item of obj) {
      const found = deepFindString(item, keys);
      if (found) return found;
    }
    return null;
  }

  const record = obj as Record<string, unknown>;
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }

  for (const value of Object.values(record)) {
    const found = deepFindString(value, keys);
    if (found) return found;
  }

  return null;
}

function extractStatusFromSources(...sources: unknown[]): string | null {
  for (const source of sources) {
    const status = deepFindString(source, STATUS_KEYS);
    if (status) return status;
  }
  return null;
}

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

export function shouldSyncShiprocketStatus(status: OrderStatus): boolean {
  return status !== "DELIVERED" && status !== "CANCELLED";
}

async function fetchShiprocketSourcesForOrder(order: {
  shiprocketShipmentId: number | null;
  shiprocketOrderId: number | null;
  trackingNumber: string | null;
}): Promise<unknown[]> {
  if (!isShiprocketConfigured() || !order.shiprocketShipmentId) {
    return [];
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

  return sources;
}

export async function fetchShiprocketMetaForOrder(order: {
  shiprocketShipmentId: number | null;
  shiprocketOrderId: number | null;
  trackingNumber: string | null;
}): Promise<ParsedShiprocketMeta> {
  const sources = await fetchShiprocketSourcesForOrder(order);
  return parseShiprocketMetaFromSources(...sources);
}

async function applyShiprocketStatusUpdate(
  order: Order,
  mappedStatus: OrderStatus,
  rawStatus: string | null,
): Promise<Order> {
  if (order.status === mappedStatus) {
    return order;
  }

  const note = rawStatus
    ? `Updated from Shiprocket (${rawStatus})`
    : "Updated from Shiprocket";

  await prisma.$transaction(async (tx) => {
    await tx.orderStatusEvent.create({
      data: {
        orderId: order.id,
        status: mappedStatus,
        label: orderStatusEventLabel(mappedStatus),
        note,
      },
    });

    await tx.order.update({
      where: { id: order.id },
      data: {
        status: mappedStatus,
        ...(mappedStatus === "CANCELLED" && !order.cancelledAt
          ? {
              cancelledAt: new Date(),
              cancelNote:
                order.cancelNote ??
                "Shipment cancelled on Shiprocket. Contact support if you need help.",
            }
          : {}),
      },
    });
  });

  console.log(
    `[Shiprocket Sync] Order ${order.orderNumber} updated: ${order.status} → ${mappedStatus}`,
  );

  if (mappedStatus === "CANCELLED") {
    void notifyOrderCancelledOnShiprocket(order.id).catch((error) => {
      console.error(
        `[Shiprocket Sync] Cancel SMS failed for ${order.orderNumber}:`,
        error,
      );
    });
  }

  return (await prisma.order.findUnique({ where: { id: order.id } })) ?? order;
}

export async function syncShiprocketStatusToOrder(
  orderId: string,
): Promise<Order | null> {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order || !order.shiprocketShipmentId) return order;
  if (!shouldSyncShiprocketStatus(order.status)) return order;

  const sources = await fetchShiprocketSourcesForOrder(order);
  const rawStatus = extractStatusFromSources(...sources);
  const mappedStatus = mapShiprocketStatusToOrderStatus(rawStatus);

  if (!mappedStatus || mappedStatus === order.status) {
    return order;
  }

  return applyShiprocketStatusUpdate(order, mappedStatus, rawStatus);
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

/** Pull latest Shiprocket shipment status + delivery/pickup meta into our database. */
export async function syncShiprocketToOrder(
  orderId: string,
  options?: { force?: boolean },
): Promise<Order | null> {
  await syncShiprocketStatusToOrder(orderId);
  return syncShiprocketMetaToOrder(orderId, options);
}

export { needsShiprocketMetaSync };
