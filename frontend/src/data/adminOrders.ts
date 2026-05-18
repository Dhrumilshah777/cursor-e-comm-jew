export const ADMIN_ORDER_STATUSES = [
  { code: "PROCESSING", label: "Processing" },
  { code: "CONFIRMED", label: "Confirmed" },
  { code: "PACKED", label: "Packed" },
  { code: "SHIPPED", label: "Shipped" },
  { code: "OUT_FOR_DELIVERY", label: "Out for Delivery" },
  { code: "DELIVERED", label: "Delivered" },
  { code: "CANCELLED", label: "Cancelled" },
] as const;

export type AdminOrderStatusCode = (typeof ADMIN_ORDER_STATUSES)[number]["code"];

/** Updated via Shiprocket webhook — not selectable in admin dropdown */
export const ADMIN_WEBHOOK_ONLY_STATUS_CODES = new Set<AdminOrderStatusCode>([
  "DELIVERED",
  "CANCELLED",
]);

export function isAdminManualOrderStatus(code: string): boolean {
  return !ADMIN_WEBHOOK_ONLY_STATUS_CODES.has(code as AdminOrderStatusCode);
}

export function adminOrderDetailPath(orderId: string): string {
  return `/admin/orders/${orderId}`;
}
