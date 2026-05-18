import type { ReturnStatus } from "../generated/prisma/client.js";

export type ReturnAdminStatusSlug =
  | "under_review"
  | "approved"
  | "rejected"
  | "pickup_scheduled"
  | "item_received"
  | "refund_processed";

const toDb: Record<ReturnAdminStatusSlug, ReturnStatus> = {
  under_review: "UNDER_REVIEW",
  approved: "APPROVED",
  rejected: "REJECTED",
  pickup_scheduled: "PICKUP_SCHEDULED",
  item_received: "ITEM_RECEIVED",
  refund_processed: "REFUND_PROCESSED",
};

const toSlug: Record<ReturnStatus, ReturnAdminStatusSlug> = {
  UNDER_REVIEW: "under_review",
  APPROVED: "approved",
  REJECTED: "rejected",
  PICKUP_SCHEDULED: "pickup_scheduled",
  ITEM_RECEIVED: "item_received",
  REFUND_PROCESSED: "refund_processed",
};

const labels: Record<ReturnStatus, string> = {
  UNDER_REVIEW: "Under Review",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  PICKUP_SCHEDULED: "Pickup Scheduled",
  ITEM_RECEIVED: "Item Received",
  REFUND_PROCESSED: "Refund Processed",
};

export function returnStatusToDb(
  status: string,
): ReturnStatus | null {
  const normalized = status.toLowerCase().replace(/-/g, "_");
  if (normalized in toDb) {
    return toDb[normalized as ReturnAdminStatusSlug];
  }
  const upper = status.toUpperCase();
  if (upper in toSlug) {
    return upper as ReturnStatus;
  }
  return null;
}

export function returnStatusToSlug(status: ReturnStatus): ReturnAdminStatusSlug {
  return toSlug[status];
}

export function returnStatusLabel(status: ReturnStatus): string {
  return labels[status];
}
