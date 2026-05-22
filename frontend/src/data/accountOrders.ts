import type { MetalType } from "@/data/collections";
import type { CancellationInfo } from "@/lib/cancellation";

export type OrderStatus = "Delivered" | "Shipped" | "Processing" | "Cancelled";

export type TimelineStep = {
  id: string;
  label: string;
  completed: boolean;
  current?: boolean;
  date?: string;
};

export type CustomerReturnOnOrder = {
  id: string;
  status: string;
  statusLabel: string;
  reason: string;
  submittedAt: string;
  pickupScheduledFor: string | null;
  reversePickupAt: string | null;
  refundStatus: string | null;
  productSlug: string;
  productName: string;
  timeline: {
    status: string;
    label: string;
    note: string | null;
    date: string;
    eventAt: string;
  }[];
};

export type OrderLineItem = {
  id: string;
  slug: string;
  name: string;
  image: string;
  alt: string;
  metal: MetalType;
  purity: string;
  size?: string;
  price: string;
  quantity: number;
};

export type OrderPriceBreakdown = {
  goldValue: string;
  makingCharges: string;
  gst: string;
  shipping: string;
  subtotalBeforeDiscount: string;
  discount: string;
  couponCode?: string;
  total: string;
};

export type DeliveryAddress = {
  name: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  pincode: string;
  phone: string;
};

export type PaymentInfo = {
  method: string;
  status: string;
  transactionId: string;
};

export type ShippingInfo = {
  courier: string;
  trackingNumber: string;
  expectedDelivery: string;
};

export type AccountOrder = {
  id: string;
  orderNumber: string;
  placedOn: string;
  status: OrderStatus;
  items: OrderLineItem[];
  total: string;
  timeline: TimelineStep[];
  deliveryAddress: DeliveryAddress;
  payment: PaymentInfo;
  priceBreakdown: OrderPriceBreakdown;
  shipping: ShippingInfo;
  returnEligible: boolean;
  returnRequest?: CustomerReturnOnOrder | null;
  placedAt: string;
  cancellation: CancellationInfo;
  cancelRefundAmount?: string | null;
  cancelReason?: string | null;
  cancelNote?: string | null;
};

const statusStyles: Record<OrderStatus, string> = {
  Delivered: "bg-emerald-50 text-emerald-800 border-emerald-200",
  Shipped: "bg-sky-50 text-sky-800 border-sky-200",
  Processing: "bg-amber-50 text-amber-800 border-amber-200",
  Cancelled: "bg-red-50 text-red-800 border-red-200",
};

export function getOrderStatusClass(status: OrderStatus): string {
  return statusStyles[status];
}

export function getOrderDetailPath(orderId: string): string {
  return `/account/my-orders/${orderId}`;
}

export function isOrderDetailPath(pathname: string): boolean {
  return /^\/account\/my-orders\/[^/]+$/.test(pathname);
}

export function getOrderIdFromPathname(pathname: string): string | null {
  const match = pathname.match(/^\/account\/my-orders\/([^/]+)(?:\/return)?$/);
  return match?.[1] ?? null;
}
