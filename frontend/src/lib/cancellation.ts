export const CANCELLATION_WINDOW_MS = 24 * 60 * 60 * 1000;

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

export const MAX_CANCELLATION_NOTE_LENGTH = 500;

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

export type CancellationInfo = {
  cancellable: boolean;
  withinFullRefundWindow: boolean;
  windowEndsAt: string;
  windowRemainingMs: number;
  total: string;
  gatewayFee: string;
  processingFee: string;
  deduction: string;
  refundAmount: string;
};
