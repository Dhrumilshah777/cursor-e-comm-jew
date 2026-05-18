import type {
  Address,
  Order,
  OrderItem,
  ReturnRequest,
  ReturnRequestImage,
  ReturnStatusEvent,
  User,
} from "../generated/prisma/client.js";
import { formatDisplayDate, formatPaise, metalToDisplay, purityToDisplay } from "./format.js";
import { returnStatusLabel, returnStatusToSlug } from "./returnStatus.js";

export type ReturnWithRelations = ReturnRequest & {
  order: Order & { user: User };
  orderItem: OrderItem;
  pickupAddress: Address;
  images: ReturnRequestImage[];
  statusEvents: ReturnStatusEvent[];
};

export function mapReturnToAdminDto(returnRequest: ReturnWithRelations) {
  const productImages = returnRequest.images
    .filter((image) => image.type === "PRODUCT")
    .map((image) => image.url);
  const packagingImages = returnRequest.images
    .filter((image) => image.type === "PACKAGING")
    .map((image) => image.url);

  return {
    id: returnRequest.id,
    orderId: returnRequest.orderId,
    orderNumber: returnRequest.order.orderNumber,
    orderItemId: returnRequest.orderItemId,
    submittedAt: returnRequest.submittedAt.toISOString(),
    status: returnStatusToSlug(returnRequest.status),
    statusLabel: returnStatusLabel(returnRequest.status),
    reason: returnRequest.reason,
    customerNotes: returnRequest.customerNotes ?? "",
    adminNotes: returnRequest.adminNotes ?? "",
    policyConfirmed: returnRequest.policyConfirmed,
    pickupScheduledFor: returnRequest.pickupScheduledFor,
    reversePickupAt: returnRequest.reversePickupAt?.toISOString() ?? null,
    shiprocketReturnOrderId: returnRequest.shiprocketReturnOrderId,
    shiprocketReturnShipmentId: returnRequest.shiprocketReturnShipmentId,
    razorpayRefundId: returnRequest.razorpayRefundId,
    refundStatus: returnRequest.refundStatus,
    refundAmountPaise: returnRequest.refundAmountPaise,
    reviewedAt: returnRequest.reviewedAt?.toISOString() ?? null,
    customer: {
      id: returnRequest.order.user.id,
      name: returnRequest.order.user.name,
      phone: returnRequest.order.user.phone,
      email: returnRequest.order.user.email,
    },
    product: {
      slug: returnRequest.orderItem.slug,
      name: returnRequest.orderItem.name,
      metal: metalToDisplay(returnRequest.orderItem.metal),
      purity: purityToDisplay(returnRequest.orderItem.purity),
      size: returnRequest.orderItem.size,
      price: formatPaise(returnRequest.orderItem.unitPricePaise),
      image: returnRequest.orderItem.image,
    },
    productImageUrls: productImages,
    packagingImageUrls: packagingImages,
    pickupAddress: {
      name: returnRequest.pickupAddress.name,
      line1: returnRequest.pickupAddress.line1,
      line2: returnRequest.pickupAddress.line2 ?? "",
      city: returnRequest.pickupAddress.city,
      state: returnRequest.pickupAddress.state,
      pincode: returnRequest.pickupAddress.pincode,
      phone: returnRequest.pickupAddress.phone,
    },
    timeline: returnRequest.statusEvents.map((event) => ({
      id: event.id,
      status: returnStatusToSlug(event.status),
      label: event.label,
      note: event.note,
      date: formatDisplayDate(event.eventAt),
      eventAt: event.eventAt.toISOString(),
    })),
  };
}

export const returnInclude = {
  order: { include: { user: true } },
  orderItem: true,
  pickupAddress: true,
  images: true,
  statusEvents: { orderBy: { eventAt: "asc" as const } },
};

export type CustomerReturnSummaryDto = {
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

export function mapReturnToCustomerDto(
  returnRequest: ReturnWithRelations,
): CustomerReturnSummaryDto {
  return {
    id: returnRequest.id,
    status: returnStatusToSlug(returnRequest.status),
    statusLabel: returnStatusLabel(returnRequest.status),
    reason: returnRequest.reason,
    submittedAt: returnRequest.submittedAt.toISOString(),
    pickupScheduledFor: returnRequest.pickupScheduledFor,
    reversePickupAt: returnRequest.reversePickupAt?.toISOString() ?? null,
    refundStatus: returnRequest.refundStatus,
    productSlug: returnRequest.orderItem.slug,
    productName: returnRequest.orderItem.name,
    timeline: returnRequest.statusEvents.map((event) => ({
      status: returnStatusToSlug(event.status),
      label: event.label,
      note: event.note,
      date: formatDisplayDate(event.eventAt),
      eventAt: event.eventAt.toISOString(),
    })),
  };
}
