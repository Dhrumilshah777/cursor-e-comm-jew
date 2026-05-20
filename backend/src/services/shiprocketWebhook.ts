import type { OrderStatus } from "../generated/prisma/client.js";
import { orderStatusEventLabel } from "../lib/format.js";
import { notifyOrderDelivered } from "../lib/notifications.js";
import { prisma } from "../lib/prisma.js";

export type ShiprocketWebhookPayload = Record<string, unknown>;

function getWebhookSecret(): string | null {
  const secret = process.env.SHIPROCKET_WEBHOOK_SECRET?.trim();
  return secret || null;
}

export function verifyShiprocketWebhookToken(headerValue: string | undefined): boolean {
  const secret = getWebhookSecret();
  if (!secret) return false;
  if (!headerValue?.trim()) return false;
  return headerValue.trim() === secret;
}

function readString(payload: ShiprocketWebhookPayload, keys: string[]): string | null {
  for (const key of keys) {
    const value = payload[key];
    if (value === null || value === undefined) continue;
    const text = String(value).trim();
    if (text) return text;
  }
  return null;
}

function readInt(payload: ShiprocketWebhookPayload, keys: string[]): number | null {
  const text = readString(payload, keys);
  if (!text) return null;
  const parsed = Number.parseInt(text, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

export function extractShiprocketStatus(payload: ShiprocketWebhookPayload): string | null {
  return readString(payload, [
    "current_status",
    "shipment_status",
    "status",
    "current_status_id",
  ]);
}

function normalizeStatusToken(raw: string): string {
  return raw.trim().toLowerCase().replace(/[\s-]+/g, "_");
}

export function mapShiprocketStatusToOrderStatus(
  rawStatus: string | null,
): OrderStatus | null {
  if (!rawStatus) return null;

  const status = normalizeStatusToken(rawStatus);

  if (
    status.includes("cancel") ||
    status === "canceled" ||
    status === "cancelled"
  ) {
    return "CANCELLED";
  }

  if (status.includes("delivered") || status === "dl") {
    return "DELIVERED";
  }

  if (status.includes("out_for_delivery") || status.includes("ofd")) {
    return "OUT_FOR_DELIVERY";
  }

  if (
    status.includes("shipped") ||
    status.includes("in_transit") ||
    status.includes("intransit") ||
    status.includes("picked") ||
    status.includes("pickup") ||
    status.includes("dispatched") ||
    status.includes("manifest")
  ) {
    return "SHIPPED";
  }

  return null;
}

async function findOrderFromWebhook(payload: ShiprocketWebhookPayload) {
  const shiprocketOrderId = readInt(payload, ["order_id", "sr_order_id"]);
  const shiprocketShipmentId = readInt(payload, ["shipment_id", "sr_shipment_id"]);
  const channelOrderId = readString(payload, [
    "channel_order_id",
    "channel_orderid",
    "order_number",
  ]);
  const awb = readString(payload, ["awb", "awb_code", "tracking_number", "awb_no"]);

  const orConditions: Array<Record<string, unknown>> = [];

  if (shiprocketOrderId !== null) {
    orConditions.push({ shiprocketOrderId });
  }
  if (shiprocketShipmentId !== null) {
    orConditions.push({ shiprocketShipmentId });
  }
  if (channelOrderId) {
    orConditions.push({ orderNumber: channelOrderId });
  }
  if (awb) {
    orConditions.push({ trackingNumber: awb });
  }

  if (orConditions.length === 0) {
    return null;
  }

  return prisma.order.findFirst({
    where: { OR: orConditions },
    include: {
      statusEvents: { orderBy: { eventAt: "desc" }, take: 1 },
      user: { select: { phone: true } },
    },
  });
}

export async function handleShiprocketWebhook(payload: ShiprocketWebhookPayload) {
  if (!getWebhookSecret()) {
    return { error: "WEBHOOK_NOT_CONFIGURED" as const };
  }

  const rawStatus = extractShiprocketStatus(payload);
  const mappedStatus = mapShiprocketStatusToOrderStatus(rawStatus);

  console.log("[Shiprocket Webhook] Received:", JSON.stringify(payload, null, 2));
  console.log(
    `[Shiprocket Webhook] status=${rawStatus ?? "—"} mapped=${mappedStatus ?? "—"}`,
  );

  if (!mappedStatus) {
    return {
      ok: true as const,
      ignored: true as const,
      reason: "Status not mapped",
    };
  }

  const order = await findOrderFromWebhook(payload);
  if (!order) {
    console.warn("[Shiprocket Webhook] No matching order in database");
    return {
      ok: true as const,
      ignored: true as const,
      reason: "Order not found",
    };
  }

  if (order.status === mappedStatus) {
    return {
      ok: true as const,
      orderId: order.id,
      orderNumber: order.orderNumber,
      status: mappedStatus,
      unchanged: true as const,
    };
  }

  // Do not downgrade delivered orders to cancelled unless explicitly cancelled in payload
  if (
    order.status === "DELIVERED" &&
    mappedStatus === "CANCELLED" &&
    rawStatus &&
    !normalizeStatusToken(rawStatus).includes("cancel")
  ) {
    return {
      ok: true as const,
      ignored: true as const,
      reason: "Delivered order not auto-cancelled",
    };
  }

  const courier = readString(payload, ["courier_name", "courier"]);
  const awb = readString(payload, ["awb", "awb_code", "tracking_number"]);
  const etd = readString(payload, ["etd", "expected_delivery_date"]);

  await prisma.$transaction(async (tx) => {
    await tx.orderStatusEvent.create({
      data: {
        orderId: order.id,
        status: mappedStatus,
        label: orderStatusEventLabel(mappedStatus),
        note: rawStatus
          ? `Updated via Shiprocket webhook (${rawStatus})`
          : "Updated via Shiprocket webhook",
      },
    });

    await tx.order.update({
      where: { id: order.id },
      data: {
        status: mappedStatus,
        ...(courier ? { courier } : {}),
        ...(awb ? { trackingNumber: awb } : {}),
        ...(etd ? { expectedDelivery: etd } : {}),
      },
    });
  });

  console.log(
    `[Shiprocket Webhook] Order ${order.orderNumber} updated: ${order.status} → ${mappedStatus}`,
  );

  if (mappedStatus === "DELIVERED" && order.user.phone) {
    void notifyOrderDelivered({
      customerPhone: order.user.phone,
      orderNumber: order.orderNumber,
    });
  }

  return {
    ok: true as const,
    orderId: order.id,
    orderNumber: order.orderNumber,
    status: mappedStatus,
    previousStatus: order.status,
  };
}
