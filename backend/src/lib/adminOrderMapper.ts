import type {
  Address,
  Order,
  OrderItem,
  OrderStatus,
  OrderStatusEvent,
  Product,
  User,
} from "../generated/prisma/client.js";
import {
  formatDisplayDate,
  formatPaise,
  metalToDisplay,
  orderStatusEventLabel,
  orderStatusToDisplay,
  purityToDisplay,
} from "./format.js";
import { resolveOrderPaymentStatus } from "./cancelRefundStatus.js";
import { mapOrderToDto } from "./orderMapper.js";
import {
  formatCancellationCountdown,
  getCancellationQuote,
  type CancellationQuote,
} from "./orderCancellation.js";
import type { ShiprocketLogEntry } from "../services/shiprocketFulfillment.js";

export type AdminOrderLineItemDto = {
  slug: string;
  name: string;
  image: string;
  alt: string;
  metal: string;
  purity: string;
  size?: string;
  weight: string;
  quantity: number;
  unitPrice: string;
  lineTotal: string;
};

export type AdminOrderDetailDto = ReturnType<typeof mapOrderToDto> & {
  statusCode: OrderStatus;
  shiprocketOrderId: number | null;
  shiprocketShipmentId: number | null;
  customer: {
    id: string;
    name: string | null;
    phone: string;
    email: string | null;
  };
  items: AdminOrderLineItemDto[];
  payment: {
    method: string;
    status: string;
    transactionId: string;
    razorpayPaymentId: string;
    paid: boolean;
  };
  statusHistory: {
    id: string;
    status: OrderStatus;
    statusLabel: string;
    label: string;
    note: string | null;
    eventAt: string;
    date: string;
  }[];
  warehousePickup: {
    date: string;
    time: string;
    scheduledAt: string | null;
  };
  shiprocketFulfillmentLog: ShiprocketLogEntry[] | null;
  placedAt: string;
  cancellation: CancellationQuote;
  cancellationCountdown: string;
};

type OrderWithRelations = Order & {
  items: (OrderItem & { product: Product | null })[];
  deliveryAddress: Address;
  statusEvents: OrderStatusEvent[];
  user: Pick<User, "id" | "name" | "phone" | "email">;
};

function weightDisplay(product: Product | null): string {
  if (!product) return "—";
  return `${Number.parseFloat(product.weightGrams.toString()).toFixed(2)} g`;
}

function isPaymentPaid(paymentStatus: string): boolean {
  return paymentStatus.toLowerCase().includes("paid");
}

function formatWarehousePickupDate(order: Order): string {
  if (order.pickupDateLabel) return order.pickupDateLabel;
  if (order.pickupScheduledAt) return formatDisplayDate(order.pickupScheduledAt);
  return "—";
}

function formatWarehousePickupTime(order: Order): string {
  if (order.pickupTimeLabel) return order.pickupTimeLabel;
  if (order.pickupScheduledAt) {
    return order.pickupScheduledAt.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  }
  return "—";
}

function parseShiprocketFulfillmentLog(value: unknown): ShiprocketLogEntry[] | null {
  if (!Array.isArray(value)) return null;
  const entries = value.filter(
    (entry): entry is ShiprocketLogEntry =>
      entry !== null &&
      typeof entry === "object" &&
      typeof (entry as ShiprocketLogEntry).step === "string" &&
      typeof (entry as ShiprocketLogEntry).ok === "boolean" &&
      typeof (entry as ShiprocketLogEntry).summary === "string",
  );
  return entries.length > 0 ? entries : null;
}

export function mapAdminOrderToDto(order: OrderWithRelations): AdminOrderDetailDto {
  const base = mapOrderToDto(order);
  const cancellation = getCancellationQuote({
    status: order.status,
    placedAt: order.placedAt,
    totalPaise: order.totalPaise,
  });

  return {
    ...base,
    statusCode: order.status,
    placedAt: order.placedAt.toISOString(),
    cancellation,
    cancellationCountdown: cancellation.cancellable
      ? formatCancellationCountdown(cancellation.windowRemainingMs)
      : "—",
    shiprocketOrderId: order.shiprocketOrderId,
    shiprocketShipmentId: order.shiprocketShipmentId,
    customer: {
      ...order.user,
      name: order.user.name ?? order.deliveryAddress.name ?? null,
    },
    items: order.items.map((item) => ({
      id: item.id,
      slug: item.slug,
      name: item.name,
      image: item.image,
      alt: item.product?.alt ?? item.name,
      metal: metalToDisplay(item.metal),
      purity: purityToDisplay(item.purity),
      size: item.size ?? undefined,
      weight: weightDisplay(item.product),
      quantity: item.quantity,
      price: formatPaise(item.unitPricePaise),
      unitPrice: formatPaise(item.unitPricePaise),
      lineTotal: formatPaise(item.unitPricePaise * item.quantity),
    })),
    payment: {
      method: order.paymentMethod,
      status: resolveOrderPaymentStatus({
        paymentStatus: order.paymentStatus,
        cancelledAt: order.cancelledAt,
        cancelRefundStatus: order.cancelRefundStatus,
      }),
      transactionId: order.transactionId ?? "—",
      razorpayPaymentId: order.transactionId ?? "—",
      paid: isPaymentPaid(order.paymentStatus),
    },
    statusHistory: order.statusEvents.map((event) => ({
      id: event.id,
      status: event.status,
      statusLabel: orderStatusToDisplay(event.status),
      label: event.label,
      note: event.note,
      eventAt: event.eventAt.toISOString(),
      date: formatDisplayDate(event.eventAt),
    })),
    warehousePickup: {
      date: formatWarehousePickupDate(order),
      time: formatWarehousePickupTime(order),
      scheduledAt: order.pickupScheduledAt?.toISOString() ?? null,
    },
    shiprocketFulfillmentLog: parseShiprocketFulfillmentLog(order.shiprocketFulfillmentLog),
  };
}

export { orderStatusEventLabel };
