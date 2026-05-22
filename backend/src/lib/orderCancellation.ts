import type { OrderStatus } from "../generated/prisma/client.js";
import { formatPaise } from "./format.js";

export const CANCELLATION_WINDOW_MS = 24 * 60 * 60 * 1000;
export const CANCELLATION_GATEWAY_FEE_RATE = 0.01;
export const LATE_CANCELLATION_PROCESSING_PAISE = 100_000;

export const CANCELLATION_REASONS = [
  "Ordered by mistake",
  "Want to change the product",
  "Found a better price",
  "Delivery is taking too long",
  "Placed duplicate order",
  "Payment issue",
  "Other",
] as const;

export type CancellationReason = (typeof CANCELLATION_REASONS)[number];

const CANCELLATION_REASON_SET = new Set<string>(CANCELLATION_REASONS);

export const MAX_CANCELLATION_NOTE_LENGTH = 500;

export function parseCancellationReason(value: unknown): CancellationReason | null {
  if (typeof value !== "string" || !CANCELLATION_REASON_SET.has(value)) {
    return null;
  }
  return value as CancellationReason;
}

export function parseCancellationNote(value: unknown): string | null {
  if (value == null || value === "") return null;
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (trimmed.length > MAX_CANCELLATION_NOTE_LENGTH) {
    throw new Error(`Additional note must be ${MAX_CANCELLATION_NOTE_LENGTH} characters or less.`);
  }
  return trimmed;
}

const NON_CANCELLABLE_STATUSES = new Set<OrderStatus>([
  "SHIPPED",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "CANCELLED",
]);

export type CancellationQuote = {
  cancellable: boolean;
  withinFullRefundWindow: boolean;
  windowEndsAt: string;
  windowRemainingMs: number;
  totalPaise: number;
  gatewayFeePaise: number;
  processingFeePaise: number;
  deductionPaise: number;
  refundPaise: number;
  total: string;
  gatewayFee: string;
  processingFee: string;
  deduction: string;
  refundAmount: string;
};

function buildQuote(
  totalPaise: number,
  placedAt: Date,
  cancellable: boolean,
): CancellationQuote {
  const windowEndsAtMs = placedAt.getTime() + CANCELLATION_WINDOW_MS;
  const windowRemainingMs = Math.max(0, windowEndsAtMs - Date.now());
  const withinFullRefundWindow = windowRemainingMs > 0;
  const gatewayFeePaise = Math.round(totalPaise * CANCELLATION_GATEWAY_FEE_RATE);
  const processingFeePaise = withinFullRefundWindow ? 0 : LATE_CANCELLATION_PROCESSING_PAISE;
  const deductionPaise = gatewayFeePaise + processingFeePaise;
  const refundPaise = Math.max(0, totalPaise - deductionPaise);

  return {
    cancellable,
    withinFullRefundWindow,
    windowEndsAt: new Date(windowEndsAtMs).toISOString(),
    windowRemainingMs,
    totalPaise,
    gatewayFeePaise,
    processingFeePaise,
    deductionPaise,
    refundPaise,
    total: formatPaise(totalPaise),
    gatewayFee: formatPaise(gatewayFeePaise),
    processingFee: formatPaise(processingFeePaise),
    deduction: formatPaise(deductionPaise),
    refundAmount: formatPaise(refundPaise),
  };
}

export function isOrderCancellableStatus(status: OrderStatus): boolean {
  return !NON_CANCELLABLE_STATUSES.has(status);
}

export function getCancellationQuote(input: {
  status: OrderStatus;
  placedAt: Date;
  totalPaise: number;
}): CancellationQuote {
  const cancellable = isOrderCancellableStatus(input.status);
  return buildQuote(input.totalPaise, input.placedAt, cancellable);
}

export function formatCancellationCountdown(remainingMs: number): string {
  if (remainingMs <= 0) return "Window ended";

  const totalSeconds = Math.floor(remainingMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m ${seconds}s`;
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  }
  return `${seconds}s`;
}

export function cancellationBlockReason(status: OrderStatus): string | null {
  if (status === "CANCELLED") return "This order is already cancelled.";
  if (status === "SHIPPED" || status === "OUT_FOR_DELIVERY") {
    return "This order has already shipped and cannot be cancelled.";
  }
  if (status === "DELIVERED") {
    return "Delivered orders cannot be cancelled. You may request a return instead.";
  }
  return null;
}
