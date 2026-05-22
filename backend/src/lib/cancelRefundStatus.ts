import { formatDisplayDate } from "./format.js";
import type { TimelineStepDto } from "./orderMapper.js";

export type CancelRefundStatus =
  | "INITIATED"
  | "PROCESSING"
  | "CREDITED"
  | "FAILED";

export const REFUND_TIMELINE_LABELS = [
  "Refund initiated",
  "Refund processing",
  "Refund credited",
] as const;

export function normalizeCancelRefundStatus(
  raw: string | null | undefined,
): CancelRefundStatus | null {
  if (!raw) return null;
  if (raw === "PROCESSED") return "PROCESSING";
  if (raw === "MANUAL") return "INITIATED";
  if (
    raw === "INITIATED" ||
    raw === "PROCESSING" ||
    raw === "CREDITED" ||
    raw === "FAILED"
  ) {
    return raw;
  }
  return null;
}

export function cancelRefundPaymentStatusLabel(
  status: CancelRefundStatus | null,
): string {
  switch (status) {
    case "INITIATED":
      return "Refund initiated";
    case "PROCESSING":
      return "Refund processing";
    case "CREDITED":
      return "Refund credited";
    case "FAILED":
      return "Refund failed";
    default:
      return "Paid successfully";
  }
}

export function resolveOrderPaymentStatus(input: {
  paymentStatus: string;
  cancelledAt: Date | null;
  cancelRefundStatus: string | null;
}): string {
  if (input.cancelledAt) {
    const refundStatus = normalizeCancelRefundStatus(input.cancelRefundStatus);
    if (refundStatus) {
      return cancelRefundPaymentStatusLabel(refundStatus);
    }
  }

  const legacy = input.paymentStatus.toLowerCase();
  if (legacy === "refunded") return "Refund processing";
  if (legacy === "refund initiated") return "Refund initiated";

  return input.paymentStatus;
}

export function buildCancelRefundTimeline(input: {
  cancelRefundStatus: CancelRefundStatus | null;
  cancelledAt: Date | null;
  cancelRefundProcessingAt: Date | null;
  cancelRefundCreditedAt: Date | null;
}): TimelineStepDto[] {
  const { cancelRefundStatus: status, cancelledAt } = input;
  if (!status || !cancelledAt) return [];

  const dates = [
    cancelledAt,
    input.cancelRefundProcessingAt,
    input.cancelRefundCreditedAt,
  ];

  const completedUpTo =
    status === "CREDITED"
      ? 2
      : status === "PROCESSING"
        ? 1
        : status === "INITIATED" || status === "FAILED"
          ? 0
          : 0;

  const steps: TimelineStepDto[] = REFUND_TIMELINE_LABELS.map((label, index) => {
    const completed = index <= completedUpTo;
    let current = false;

    if (status === "CREDITED") {
      current = index === 2;
    } else if (status !== "FAILED") {
      current = index === completedUpTo + 1;
    }

    return {
      id: `refund-step-${index}`,
      label,
      completed,
      current,
      date: dates[index] ? formatDisplayDate(dates[index]!) : undefined,
    };
  });

  return steps;
}
