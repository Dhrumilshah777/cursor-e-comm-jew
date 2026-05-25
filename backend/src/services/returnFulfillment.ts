import type {
  Address,
  Order,
  OrderItem,
  Product,
  ReturnRequest,
  User,
} from "../generated/prisma/client.js";
import { notifyRefundInitiated } from "../lib/notifications.js";
import { prisma } from "../lib/prisma.js";
import { enqueueRefund } from "../lib/refundQueue.js";
import { restoreStock } from "../lib/inventory.js";
import {
  assignShiprocketAwb,
  createShiprocketReturnOrder,
  generateShiprocketPickup,
  getShiprocketWarehouseAddress,
  isShiprocketConfigured,
} from "../lib/shiprocket.js";
import { returnStatusLabel } from "../lib/returnStatus.js";

const DEFAULT_DIM_CM = 12;
const MIN_WEIGHT_KG = 0.1;

export type ReturnFulfillmentLogEntry = {
  step: string;
  ok: boolean;
  summary: string;
  response?: unknown;
  error?: string;
};

export class ReturnFulfillmentError extends Error {
  log: ReturnFulfillmentLogEntry[];

  constructor(message: string, log: ReturnFulfillmentLogEntry[]) {
    super(message);
    this.name = "ReturnFulfillmentError";
    this.log = log;
  }
}

type ReturnForFulfillment = ReturnRequest & {
  order: Order & { user: User };
  orderItem: OrderItem & { product: Product | null };
  pickupAddress: Address;
};

function phoneDigits(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length >= 10) return digits.slice(-10);
  return digits;
}

function splitName(fullName: string): { first: string; last: string } {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { first: "Customer", last: "." };
  if (parts.length === 1) return { first: parts[0]!, last: "." };
  return { first: parts[0]!, last: parts.slice(1).join(" ") };
}

function itemWeightKg(item: OrderItem & { product: Product | null }): number {
  const grams = item.product?.weightGrams
    ? Number.parseFloat(item.product.weightGrams.toString()) * item.quantity
    : 0;
  const kg = grams / 1000;
  return Math.max(kg, MIN_WEIGHT_KG);
}

function formatPickupLabel(dateIso: string | undefined): string {
  if (!dateIso) return "Pickup scheduled — courier will contact you";
  const parsed = new Date(dateIso);
  if (Number.isNaN(parsed.getTime())) return dateIso;
  return parsed.toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function buildReturnPayload(returnRequest: ReturnForFulfillment) {
  const pickup = returnRequest.pickupAddress;
  const warehouse = getShiprocketWarehouseAddress();
  const customer = returnRequest.order.user;
  const item = returnRequest.orderItem;
  const pickupName = splitName(pickup.name || customer.name || "Customer");
  const warehouseName = splitName(warehouse.name);
  const lineTotalPaise = item.unitPricePaise * item.quantity;
  const subTotalRupee = Math.max(1, Math.round(lineTotalPaise / 100));
  const channelId = process.env.SHIPROCKET_CHANNEL_ID?.trim();

  const payload = {
    order_id: `RET-${returnRequest.id.replace(/[^a-zA-Z0-9]/g, "").slice(0, 40)}`,
    order_date: returnRequest.submittedAt.toISOString().slice(0, 10),
    ...(channelId ? { channel_id: Number.parseInt(channelId, 10) } : {}),
    pickup_customer_name: pickupName.first,
    pickup_last_name: pickupName.last,
    pickup_address: pickup.line1,
    pickup_address_2: pickup.line2 ?? "",
    pickup_city: pickup.city,
    pickup_state: pickup.state,
    pickup_country: "India",
    pickup_pincode: Number.parseInt(pickup.pincode, 10),
    pickup_email: customer.email ?? "customer@wholesalejewelry.local",
    pickup_phone: phoneDigits(pickup.phone || customer.phone),
    shipping_customer_name: warehouseName.first,
    shipping_last_name: warehouseName.last,
    shipping_address: warehouse.address,
    shipping_address_2: warehouse.address2,
    shipping_city: warehouse.city,
    shipping_state: warehouse.state,
    shipping_country: "India",
    shipping_pincode: Number.parseInt(warehouse.pincode, 10),
    shipping_email: warehouse.email,
    shipping_phone: phoneDigits(warehouse.phone),
    order_items: [
      {
        name: item.name.slice(0, 100),
        sku: (item.product?.sku ?? item.slug).slice(0, 50),
        units: item.quantity,
        selling_price: Math.max(1, Math.round(item.unitPricePaise / 100)),
        discount: 0,
        hsn: 7113,
      },
    ],
    payment_method: "Prepaid" as const,
    sub_total: subTotalRupee,
    length: DEFAULT_DIM_CM,
    breadth: DEFAULT_DIM_CM,
    height: DEFAULT_DIM_CM,
    weight: itemWeightKg(item),
  };

  return { payload, lineTotalPaise, subTotalRupee };
}

export async function fulfillReturnOnApproval(returnRequestId: string) {
  const log: ReturnFulfillmentLogEntry[] = [];

  const returnRequest = await prisma.returnRequest.findUnique({
    where: { id: returnRequestId },
    include: {
      order: { include: { user: true } },
      orderItem: { include: { product: true } },
      pickupAddress: true,
    },
  });

  if (!returnRequest) {
    throw new ReturnFulfillmentError("Return request not found", log);
  }

  if (returnRequest.status !== "UNDER_REVIEW") {
    throw new ReturnFulfillmentError(
      `Return must be under review to approve (current: ${returnRequest.status})`,
      log,
    );
  }

  if (!isShiprocketConfigured()) {
    throw new ReturnFulfillmentError("Shiprocket is not configured", log);
  }

  const { payload, lineTotalPaise } = buildReturnPayload(returnRequest);

  let shiprocketReturnOrderId: string | undefined =
    returnRequest.shiprocketReturnOrderId ?? undefined;
  let shiprocketReturnShipmentId: string | undefined =
    returnRequest.shiprocketReturnShipmentId ?? undefined;
  let pickupScheduledFor: string | undefined = returnRequest.pickupScheduledFor ?? undefined;
  let reversePickupAt: Date | undefined = returnRequest.reversePickupAt ?? undefined;

  if (!shiprocketReturnShipmentId) {
    try {
      const created = await createShiprocketReturnOrder(payload);
      log.push({
        step: "create_return",
        ok: true,
        summary: created.message ?? "Return order created",
        response: created,
      });
      if (created.order_id != null) {
        shiprocketReturnOrderId = String(created.order_id);
      }
      if (created.shipment_id != null) {
        shiprocketReturnShipmentId = String(created.shipment_id);
      }
    } catch (error) {
      log.push({
        step: "create_return",
        ok: false,
        summary: "Failed to create Shiprocket return order",
        error: error instanceof Error ? error.message : String(error),
      });
      throw new ReturnFulfillmentError("Shiprocket return order failed", log);
    }

    const shipmentId = Number.parseInt(shiprocketReturnShipmentId ?? "", 10);
    if (!Number.isFinite(shipmentId)) {
      throw new ReturnFulfillmentError("Shiprocket did not return a shipment id", log);
    }

    try {
      const awb = await assignShiprocketAwb(shipmentId);
      log.push({
        step: "assign_awb",
        ok: true,
        summary: awb.message ?? "AWB assigned for return",
        response: awb,
      });
    } catch (error) {
      log.push({
        step: "assign_awb",
        ok: false,
        summary: "AWB assignment failed (continuing to pickup)",
        error: error instanceof Error ? error.message : String(error),
      });
    }

    try {
      const pickup = await generateShiprocketPickup(shipmentId);
      const scheduled =
        pickup.response?.pickup_scheduled_date ??
        (pickup as { pickup_scheduled_date?: string }).pickup_scheduled_date;
      if (scheduled) {
        pickupScheduledFor = formatPickupLabel(scheduled);
        const parsed = new Date(scheduled);
        if (!Number.isNaN(parsed.getTime())) {
          reversePickupAt = parsed;
        }
      }
      log.push({
        step: "schedule_pickup",
        ok: true,
        summary: scheduled
          ? `Reverse pickup scheduled for ${pickupScheduledFor}`
          : pickup.message ?? "Pickup requested",
        response: pickup,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      log.push({
        step: "schedule_pickup",
        ok: false,
        summary: message.includes("Already in Pickup Queue")
          ? "Pickup already queued"
          : "Pickup schedule failed",
        error: message,
      });
      if (!pickupScheduledFor) {
        pickupScheduledFor = "Within 1–2 business days — courier will call before pickup";
      }
    }
  }

  const now = new Date();
  const updated = await prisma.$transaction(async (tx) => {
    await tx.returnStatusEvent.create({
      data: {
        returnRequestId,
        status: "APPROVED",
        label: returnStatusLabel("APPROVED"),
        note: "Return approved — Shiprocket reverse pickup scheduled",
      },
    });

    await tx.returnStatusEvent.create({
      data: {
        returnRequestId,
        status: "PICKUP_SCHEDULED",
        label: returnStatusLabel("PICKUP_SCHEDULED"),
        note: pickupScheduledFor ?? undefined,
      },
    });

    return tx.returnRequest.update({
      where: { id: returnRequestId },
      data: {
        status: "PICKUP_SCHEDULED",
        reviewedAt: now,
        pickupScheduledFor: pickupScheduledFor ?? null,
        reversePickupAt: reversePickupAt ?? null,
        shiprocketReturnOrderId: shiprocketReturnOrderId ?? null,
        shiprocketReturnShipmentId: shiprocketReturnShipmentId ?? null,
        refundAmountPaise: lineTotalPaise,
      },
    });
  });

  return { returnRequest: updated, log, pickupScheduledFor };
}

export async function initiateReturnRefundOnItemReceived(returnRequestId: string) {
  const log: ReturnFulfillmentLogEntry[] = [];

  const returnRequest = await prisma.returnRequest.findUnique({
    where: { id: returnRequestId },
    include: {
      order: true,
      orderItem: true,
    },
  });

  if (!returnRequest) {
    throw new ReturnFulfillmentError("Return request not found", log);
  }

  if (
    returnRequest.status !== "PICKUP_SCHEDULED" &&
    returnRequest.status !== "ITEM_RECEIVED"
  ) {
    throw new ReturnFulfillmentError(
      `Refund can only start after pickup is scheduled (current: ${returnRequest.status})`,
      log,
    );
  }

  if (returnRequest.razorpayRefundId) {
    return {
      returnRequest,
      log,
      refundStatus: returnRequest.refundStatus ?? "INITIATED",
      alreadyRefunded: true,
    };
  }

  const paymentId = returnRequest.order.transactionId;
  if (!paymentId) {
    throw new ReturnFulfillmentError("Order has no Razorpay payment id for refund", log);
  }

  const lineTotalPaise =
    returnRequest.refundAmountPaise ??
    returnRequest.orderItem.unitPricePaise * returnRequest.orderItem.quantity;

  // Refund is created asynchronously — admin's "Item received" action returns
  // immediately and the worker calls Razorpay in the background.
  // Stock is also restored here since the physical item is back at the
  // warehouse and can be resold.
  const updated = await prisma.$transaction(async (tx) => {
    await tx.returnStatusEvent.create({
      data: {
        returnRequestId,
        status: "ITEM_RECEIVED",
        label: returnStatusLabel("ITEM_RECEIVED"),
        note: "Item received at warehouse — refund initiated",
      },
    });

    if (returnRequest.orderItem.productId) {
      await restoreStock(tx, [
        {
          productId: returnRequest.orderItem.productId,
          quantity: returnRequest.orderItem.quantity,
        },
      ]);
    }

    return tx.returnRequest.update({
      where: { id: returnRequestId },
      data: {
        status: "ITEM_RECEIVED",
        refundStatus: "INITIATED",
        refundAmountPaise: lineTotalPaise,
      },
      include: {
        order: { include: { user: true } },
        orderItem: true,
        pickupAddress: true,
        images: true,
        statusEvents: { orderBy: { eventAt: "asc" } },
      },
    });
  });

  log.push({
    step: "razorpay_refund",
    ok: true,
    summary: "Refund queued for processing",
  });

  try {
    await enqueueRefund({
      kind: "return",
      returnRequestId: returnRequest.id,
      paymentId,
      amountPaise: lineTotalPaise,
      orderNumber: returnRequest.order.orderNumber,
    });
  } catch (error) {
    console.error(`Failed to enqueue return refund ${returnRequest.id}:`, error);
  }

  if (updated.order.user.phone) {
    void notifyRefundInitiated({
      customerPhone: updated.order.user.phone,
      orderNumber: updated.order.orderNumber,
      amountPaise: lineTotalPaise,
    });
  }

  return {
    returnRequest: updated,
    log,
    refundStatus: "INITIATED" as const,
    alreadyRefunded: false,
  };
}
