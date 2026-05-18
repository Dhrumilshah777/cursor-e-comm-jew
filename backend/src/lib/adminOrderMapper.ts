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
import { mapOrderToDto } from "./orderMapper.js";

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

export function mapAdminOrderToDto(order: OrderWithRelations): AdminOrderDetailDto {
  const base = mapOrderToDto(order);

  return {
    ...base,
    statusCode: order.status,
    shiprocketOrderId: order.shiprocketOrderId,
    shiprocketShipmentId: order.shiprocketShipmentId,
    customer: order.user,
    items: order.items.map((item) => ({
      slug: item.slug,
      name: item.name,
      image: item.image,
      alt: item.product?.alt ?? item.name,
      metal: metalToDisplay(item.metal),
      purity: purityToDisplay(item.purity),
      size: item.size ?? undefined,
      weight: weightDisplay(item.product),
      quantity: item.quantity,
      unitPrice: formatPaise(item.unitPricePaise),
      lineTotal: formatPaise(item.unitPricePaise * item.quantity),
    })),
    payment: {
      method: order.paymentMethod,
      status: order.paymentStatus,
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
  };
}

export { orderStatusEventLabel };
