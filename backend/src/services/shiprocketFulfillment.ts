import type { Address, Order, OrderItem, Product, User } from "../generated/prisma/client.js";
import { prisma } from "../lib/prisma.js";
import { parseShiprocketPickupSchedule } from "../lib/shiprocketPickup.js";
import {
  assignShiprocketAwb,
  createShiprocketAdhocOrder,
  generateShiprocketPickup,
  getShiprocketPickupLocation,
  isShiprocketConfigured,
} from "../lib/shiprocket.js";
import type { Prisma } from "../generated/prisma/client.js";

const DEFAULT_DIM_CM = 12;
const MIN_WEIGHT_KG = 0.1;

export type ShiprocketLogEntry = {
  step: string;
  ok: boolean;
  summary: string;
  response?: unknown;
  error?: string;
};

export type ShiprocketFulfillmentResult = {
  order: Order;
  log: ShiprocketLogEntry[];
};

type OrderForShiprocket = Order & {
  items: (OrderItem & { product: Product | null })[];
  deliveryAddress: Address;
  user: Pick<User, "id" | "name" | "phone" | "email">;
};

class ShiprocketFulfillmentError extends Error {
  log: ShiprocketLogEntry[];

  constructor(message: string, log: ShiprocketLogEntry[]) {
    super(message);
    this.name = "ShiprocketFulfillmentError";
    this.log = log;
  }
}

function logToConsole(orderNumber: string, entry: ShiprocketLogEntry) {
  const prefix = `[Shiprocket][${orderNumber}] ${entry.step}`;
  if (entry.ok) {
    console.log(`${prefix} OK — ${entry.summary}`);
    if (entry.response !== undefined) {
      console.log(`${prefix} response:`, JSON.stringify(entry.response, null, 2));
    }
  } else {
    console.error(`${prefix} FAILED — ${entry.summary}`);
    if (entry.error) console.error(`${prefix} error:`, entry.error);
    if (entry.response !== undefined) {
      console.error(`${prefix} response:`, JSON.stringify(entry.response, null, 2));
    }
  }
}

function pushLog(
  orderNumber: string,
  log: ShiprocketLogEntry[],
  entry: ShiprocketLogEntry,
) {
  log.push(entry);
  logToConsole(orderNumber, entry);
}

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

function orderWeightKg(items: OrderForShiprocket["items"]): number {
  let grams = 0;
  for (const item of items) {
    const productWeight = item.product?.weightGrams;
    if (productWeight) {
      grams += Number.parseFloat(productWeight.toString()) * item.quantity;
    }
  }
  const kg = grams / 1000;
  return Math.max(kg, MIN_WEIGHT_KG);
}

function buildAdhocPayload(order: OrderForShiprocket) {
  const address = order.deliveryAddress;
  const customerName = address.name || order.user.name || "Customer";
  const { first, last } = splitName(customerName);
  const subTotalRupee = order.totalPaise / 100;

  const orderItems = order.items.map((item) => ({
    name: item.name.slice(0, 100),
    sku: (item.product?.sku ?? item.slug).slice(0, 50),
    units: item.quantity,
    selling_price: Math.max(1, Math.round(item.unitPricePaise / 100)),
    discount: 0,
    tax: 0,
    hsn: 7113,
  }));

  return {
    order_id: order.orderNumber.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 50),
    order_date: order.placedAt.toISOString().slice(0, 10),
    pickup_location: getShiprocketPickupLocation(),
    comment: `Store order ${order.orderNumber}`,
    billing_customer_name: first,
    billing_last_name: last,
    billing_address: address.line1,
    billing_address_2: address.line2 ?? "",
    billing_city: address.city,
    billing_pincode: address.pincode,
    billing_state: address.state,
    billing_country: "India",
    billing_email: order.user.email?.trim() || "orders@wholesalejewelry.com",
    billing_phone: phoneDigits(address.phone),
    shipping_is_billing: true,
    order_items: orderItems,
    payment_method: "Prepaid" as const,
    shipping_charges: 0,
    giftwrap_charges: 0,
    transaction_charges: 0,
    total_discount: 0,
    sub_total: subTotalRupee,
    length: DEFAULT_DIM_CM,
    breadth: DEFAULT_DIM_CM,
    height: 6,
    weight: orderWeightKg(order.items),
  };
}

export function getShiprocketLogFromError(error: unknown): ShiprocketLogEntry[] | undefined {
  if (error instanceof ShiprocketFulfillmentError) {
    return error.log;
  }
  return undefined;
}

export async function fulfillOrderOnShiprocket(
  orderId: string,
): Promise<ShiprocketFulfillmentResult> {
  const log: ShiprocketLogEntry[] = [];

  if (!isShiprocketConfigured()) {
    throw new ShiprocketFulfillmentError("Shiprocket is not configured on the server", log);
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: { include: { product: true } },
      deliveryAddress: true,
      user: { select: { id: true, name: true, phone: true, email: true } },
    },
  });

  if (!order) {
    throw new ShiprocketFulfillmentError("Order not found", log);
  }

  const orderNumber = order.orderNumber;
  console.log(`[Shiprocket][${orderNumber}] Starting fulfillment for order ${orderId}`);

  if (order.shiprocketShipmentId) {
    const entry: ShiprocketLogEntry = {
      step: "skipped",
      ok: true,
      summary: `Already synced (shipment_id=${order.shiprocketShipmentId}, AWB=${order.trackingNumber ?? "n/a"})`,
    };
    pushLog(orderNumber, log, entry);
    return { order, log };
  }

  const payload = buildAdhocPayload(order);
  pushLog(orderNumber, log, {
    step: "request_payload",
    ok: true,
    summary: `pickup=${payload.pickup_location}, weight=${payload.weight}kg, items=${payload.order_items.length}`,
    response: payload,
  });

  let createResponse;
  try {
    createResponse = await createShiprocketAdhocOrder(payload);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Create order failed";
    pushLog(orderNumber, log, {
      step: "create_adhoc",
      ok: false,
      summary: message,
      error: message,
    });
    throw new ShiprocketFulfillmentError(message, log);
  }

  const shiprocketOrderId = createResponse.order_id;
  const shipmentId = createResponse.shipment_id;

  pushLog(orderNumber, log, {
    step: "create_adhoc",
    ok: Boolean(shipmentId),
    summary: `order_id=${shiprocketOrderId ?? "—"}, shipment_id=${shipmentId ?? "—"}, status=${createResponse.status ?? "—"}`,
    response: createResponse,
  });

  if (!shipmentId) {
    const message =
      createResponse.message ?? "Shiprocket did not return a shipment ID";
    throw new ShiprocketFulfillmentError(message, log);
  }

  let awbResponse;
  try {
    awbResponse = await assignShiprocketAwb(shipmentId);
  } catch (error) {
    const message = error instanceof Error ? error.message : "AWB assignment failed";
    pushLog(orderNumber, log, {
      step: "assign_awb",
      ok: false,
      summary: message,
      error: message,
    });
    throw new ShiprocketFulfillmentError(message, log);
  }

  const awbData = awbResponse.response?.data;
  const awbCode = awbData?.awb_code;
  const courierName = awbData?.courier_name;

  pushLog(orderNumber, log, {
    step: "assign_awb",
    ok: Boolean(awbCode),
    summary: [
      `awb_assign_status=${awbResponse.awb_assign_status ?? "—"}`,
      `awb=${awbCode ?? "—"}`,
      `courier=${courierName ?? "—"}`,
      awbData?.etd ? `etd=${awbData.etd}` : null,
    ]
      .filter(Boolean)
      .join(", "),
    response: awbResponse,
  });

  if (!awbCode) {
    const message =
      awbResponse.message ?? "Shiprocket AWB assignment did not return a tracking number";
    throw new ShiprocketFulfillmentError(message, log);
  }

  const expectedDelivery = awbData?.etd ?? null;
  let pickupSchedule = {
    dateLabel: null as string | null,
    timeLabel: null as string | null,
    scheduledAt: null as Date | null,
  };

  try {
    const pickupResponse = await generateShiprocketPickup(shipmentId);
    pickupSchedule = parseShiprocketPickupSchedule(pickupResponse);
    const { dateLabel, timeLabel } = pickupSchedule;
    pushLog(orderNumber, log, {
      step: "schedule_pickup",
      ok: pickupResponse.pickup_status === 1,
      summary: `pickup_status=${pickupResponse.pickup_status ?? "—"}, date=${dateLabel ?? "—"}, time=${timeLabel ?? "—"}`,
      response: pickupResponse,
    });
  } catch (pickupError) {
    const message =
      pickupError instanceof Error ? pickupError.message : "Pickup scheduling failed";
    pushLog(orderNumber, log, {
      step: "schedule_pickup",
      ok: false,
      summary: message,
      error: message,
    });
  }

  const fulfillmentLog = log as unknown as Prisma.InputJsonValue;

  const updated = await prisma.order.update({
    where: { id: orderId },
    data: {
      shiprocketOrderId: shiprocketOrderId ?? null,
      shiprocketShipmentId: shipmentId,
      trackingNumber: awbCode,
      courier: courierName ?? "Shiprocket",
      expectedDelivery: expectedDelivery ?? undefined,
      pickupScheduledAt: pickupSchedule.scheduledAt ?? undefined,
      pickupDateLabel: pickupSchedule.dateLabel ?? undefined,
      pickupTimeLabel: pickupSchedule.timeLabel ?? undefined,
      shiprocketFulfillmentLog: fulfillmentLog,
    },
  });

  pushLog(orderNumber, log, {
    step: "saved_to_db",
    ok: true,
    summary: `courier=${courierName ?? "Shiprocket"}, awb=${awbCode}, shipment_id=${shipmentId}`,
    response: {
      shiprocketOrderId,
      shiprocketShipmentId: shipmentId,
      trackingNumber: awbCode,
      courier: courierName,
      expectedDelivery,
    },
  });

  console.log(`[Shiprocket][${orderNumber}] Fulfillment complete`);

  return { order: updated, log };
}
