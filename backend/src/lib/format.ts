import type { GoldPurity, MetalType, OrderStatus } from "../generated/prisma/client.js";

export function formatPaise(paise: number): string {
  return `₹${(paise / 100).toLocaleString("en-IN")}`;
}

export function formatDisplayDate(date: Date): string {
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function metalToDisplay(metal: MetalType): string {
  const map: Record<MetalType, string> = {
    YELLOW_GOLD: "Yellow Gold",
    ROSE_GOLD: "Rose Gold",
    WHITE_GOLD: "White Gold",
  };
  return map[metal];
}

export function purityToDisplay(purity: GoldPurity): string {
  const map: Record<GoldPurity, string> = {
    KT_14: "14KT",
    KT_18: "18KT",
    KT_22: "22KT",
  };
  return map[purity];
}

export const ORDER_STATUS_OPTIONS: OrderStatus[] = [
  "PROCESSING",
  "CONFIRMED",
  "PACKED",
  "SHIPPED",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "CANCELLED",
];

export function orderStatusToDisplay(status: OrderStatus): string {
  const map: Record<OrderStatus, string> = {
    PROCESSING: "Processing",
    CONFIRMED: "Confirmed",
    PACKED: "Packed",
    SHIPPED: "Shipped",
    OUT_FOR_DELIVERY: "Out for Delivery",
    DELIVERED: "Delivered",
    CANCELLED: "Cancelled",
  };
  return map[status];
}

export function orderStatusEventLabel(status: OrderStatus): string {
  const map: Record<OrderStatus, string> = {
    PROCESSING: "Processing",
    CONFIRMED: "Order Confirmed",
    PACKED: "Packed",
    SHIPPED: "Shipped",
    OUT_FOR_DELIVERY: "Out for Delivery",
    DELIVERED: "Delivered",
    CANCELLED: "Cancelled",
  };
  return map[status];
}

export function parseOrderStatus(value: string): OrderStatus | null {
  const normalized = value.trim().toUpperCase().replace(/[\s-]+/g, "_");
  if (ORDER_STATUS_OPTIONS.includes(normalized as OrderStatus)) {
    return normalized as OrderStatus;
  }
  return null;
}
