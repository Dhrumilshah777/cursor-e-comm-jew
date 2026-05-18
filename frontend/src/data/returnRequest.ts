import type { TimelineStep } from "@/data/accountOrders";

export const RETURN_REASONS = [
  "Damaged Product",
  "Wrong Item Received",
  "Size Issue",
  "Product Not As Expected",
  "Quality Concern",
  "Changed My Mind",
] as const;

export type ReturnReason = (typeof RETURN_REASONS)[number];

export function returnReasonNeedsPhotos(reason: ReturnReason | null): boolean {
  return reason === "Damaged Product" || reason === "Wrong Item Received";
}

export type ReturnAdminStatus =
  | "under_review"
  | "approved"
  | "rejected"
  | "pickup_scheduled"
  | "item_received"
  | "refund_processed";

export const RETURN_ELIGIBILITY_RULES = [
  "Product must be unused and in the same condition as received",
  "Original packaging, box, and pouch must be included",
  "Hallmark certificate and invoice must be included",
  "Return request must be within the 15-day return window",
] as const;

export const RETURN_FLOW_STEPS = [
  "Select Product",
  "Choose Reason",
  "Upload Images",
  "Additional Notes",
  "Pickup Address",
  "Submit Request",
] as const;

export function getReturnRequestPath(orderId: string): string {
  return `/account/my-orders/${orderId}/return`;
}

export function isReturnRequestPath(pathname: string): boolean {
  return /^\/account\/my-orders\/[^/]+\/return$/.test(pathname);
}

export function getReturnStorageKey(orderId: string): string {
  return `jewelry-return-request-${orderId}`;
}

export function getReturnTimelineForStatus(
  status: ReturnAdminStatus,
  submittedAt?: string,
  pickupScheduledFor?: string,
): TimelineStep[] {
  const submittedDate = submittedAt
    ? new Date(submittedAt).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "Today";

  if (status === "rejected") {
    return [
      {
        id: "return-0",
        label: "Request Submitted",
        completed: true,
        date: submittedDate,
      },
      {
        id: "return-1",
        label: "Under Review",
        completed: true,
        date: submittedDate,
      },
      {
        id: "return-rejected",
        label: "Request Not Approved",
        completed: true,
        current: true,
      },
    ];
  }

  const steps: TimelineStep[] = [
    {
      id: "return-0",
      label: "Request Submitted",
      completed: true,
      date: submittedDate,
    },
    {
      id: "return-1",
      label: "Under Review",
      completed: status !== "under_review",
      current: status === "under_review",
    },
    {
      id: "return-2",
      label: "Pickup Scheduled",
      completed: ["pickup_scheduled", "item_received", "refund_processed"].includes(
        status,
      ),
      current: status === "approved" || status === "pickup_scheduled",
      date: pickupScheduledFor,
    },
    {
      id: "return-3",
      label: "Item Received",
      completed: ["item_received", "refund_processed"].includes(status),
      current: status === "item_received",
    },
    {
      id: "return-4",
      label: "Refund Processed",
      completed: status === "refund_processed",
      current: status === "refund_processed",
    },
  ];

  return steps;
}

export type CustomerNotificationPreview = {
  whatsapp: string;
  sms: string;
  email: string;
};

export function getCustomerNotifications(
  status: ReturnAdminStatus,
  pickupScheduledFor?: string,
): CustomerNotificationPreview | null {
  if (status === "approved" || status === "pickup_scheduled") {
    const pickupLine = pickupScheduledFor
      ? `Pickup scheduled for ${pickupScheduledFor}.`
      : "Pickup will be scheduled shortly.";
    return {
      whatsapp: `Your return request has been approved. ${pickupLine} Our team will coordinate with you for a smooth collection.`,
      sms: `Dhrumil Jewellers: Your return is approved. ${pickupLine}`,
      email: `Dear Customer,\n\nYour return request has been approved. ${pickupLine}\n\nThank you for your patience.\n\nWarm regards,\nDhrumil Jewellers Client Care`,
    };
  }

  if (status === "rejected") {
    return {
      whatsapp:
        "Thank you for reaching out. Your return request could not be approved as the item does not meet our return eligibility criteria. Our Client Care team is happy to assist you further.",
      sms:
        "Dhrumil Jewellers: Your return request could not be approved. Please contact Client Care for assistance.",
      email:
        "Dear Customer,\n\nThank you for your return request. After careful review, we regret that we are unable to approve this return as the item does not meet our return eligibility criteria.\n\nShould you need any assistance, our Client Care team will be delighted to help.\n\nWarm regards,\nDhrumil Jewellers Client Care",
    };
  }

  return null;
}

export function getStatusLabel(status: ReturnAdminStatus): string {
  const labels: Record<ReturnAdminStatus, string> = {
    under_review: "Under Review",
    approved: "Approved",
    rejected: "Not Approved",
    pickup_scheduled: "Pickup Scheduled",
    item_received: "Item Received",
    refund_processed: "Refund Processed",
  };
  return labels[status];
}
