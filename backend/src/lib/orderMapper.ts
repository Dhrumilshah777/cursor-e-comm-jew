import type {
  Address,
  Order,
  OrderItem,
  OrderStatus,
  OrderStatusEvent,
  Product,
} from "../generated/prisma/client.js";
import {
  mapReturnToCustomerDto,
  type CustomerReturnSummaryDto,
  type ReturnWithRelations,
} from "./returnMapper.js";
import { customerDeliveryDateFromShiprocketEdd } from "./deliveryDates.js";
import {
  buildCancelRefundTimeline,
  cancelRefundPaymentStatusLabel,
  normalizeCancelRefundStatus,
  resolveOrderPaymentStatus,
} from "./cancelRefundStatus.js";
import { getCancellationQuote, type CancellationQuote } from "./orderCancellation.js";
import {
  formatDisplayDate,
  formatPaise,
  metalToDisplay,
  orderStatusToDisplay,
  purityToDisplay,
} from "./format.js";

const TIMELINE_LABELS = [
  "Order Confirmed",
  "Packed",
  "Shipped",
  "Out for Delivery",
  "Delivered",
] as const;

export type OrderLineItemDto = {
  id: string;
  slug: string;
  name: string;
  image: string;
  alt: string;
  metal: string;
  purity: string;
  size?: string;
  price: string;
  quantity: number;
};

export type TimelineStepDto = {
  id: string;
  label: string;
  completed: boolean;
  current?: boolean;
  date?: string;
};

export type AccountOrderDto = {
  id: string;
  orderNumber: string;
  placedOn: string;
  status: string;
  items: OrderLineItemDto[];
  total: string;
  timeline: TimelineStepDto[];
  deliveryAddress: {
    name: string;
    line1: string;
    line2: string;
    city: string;
    state: string;
    pincode: string;
    phone: string;
  };
  payment: {
    method: string;
    status: string;
    transactionId: string;
  };
  priceBreakdown: {
    goldValue: string;
    makingCharges: string;
    gst: string;
    shipping: string;
    subtotalBeforeDiscount: string;
    discount: string;
    couponCode?: string;
    total: string;
  };
  shipping: {
    courier: string;
    trackingNumber: string;
    expectedDelivery: string;
  };
  returnEligible: boolean;
  returnRequest: CustomerReturnSummaryDto | null;
  placedAt: string;
  cancellation: CancellationQuote;
  cancelRefundAmount: string | null;
  cancelReason: string | null;
  cancelNote: string | null;
  cancelRefundStatus: string | null;
  cancelRefundStatusLabel: string | null;
  refundTimeline: TimelineStepDto[];
};

type OrderWithRelations = Order & {
  items: (OrderItem & { product: Product | null })[];
  deliveryAddress: Address;
  statusEvents: OrderStatusEvent[];
  returnRequests?: ReturnWithRelations[];
};

export function buildTimeline(
  events: OrderStatusEvent[],
  orderStatus: OrderStatus,
): TimelineStepDto[] {
  const byLabel = new Map(events.map((event) => [event.label, event]));

  const steps: TimelineStepDto[] = TIMELINE_LABELS.map((label, index) => {
    const event = byLabel.get(label);
    return {
      id: `step-${index}`,
      label,
      completed: Boolean(event),
      date: event ? formatDisplayDate(event.eventAt) : undefined,
    };
  });

  const lastCompletedIndex = steps.reduce(
    (last, step, index) => (step.completed ? index : last),
    -1,
  );

  if (lastCompletedIndex >= 0) {
    steps[lastCompletedIndex]!.current =
      orderStatus !== "DELIVERED" || lastCompletedIndex === steps.length - 1;
  }

  return steps;
}

export function isReturnEligible(
  status: OrderStatus,
  statusEvents: OrderStatusEvent[],
): boolean {
  if (status !== "DELIVERED") return false;

  const deliveredEvent = statusEvents.find((event) => event.label === "Delivered");
  const deliveredAt = deliveredEvent?.eventAt;
  if (!deliveredAt) return false;

  const daysSinceDelivery =
    (Date.now() - deliveredAt.getTime()) / (1000 * 60 * 60 * 24);
  return daysSinceDelivery <= 15;
}

function mapLineItem(item: OrderItem & { product: Product | null }): OrderLineItemDto {
  return {
    id: item.id,
    slug: item.slug,
    name: item.name,
    image: item.image,
    alt: item.product?.alt ?? item.name,
    metal: metalToDisplay(item.metal),
    purity: purityToDisplay(item.purity),
    size: item.size ?? undefined,
    price: formatPaise(item.unitPricePaise),
    quantity: item.quantity,
  };
}

function mapReturnOnOrder(
  order: OrderWithRelations,
): CustomerReturnSummaryDto | null {
  const latest = order.returnRequests?.[0];
  if (!latest) return null;
  return mapReturnToCustomerDto(latest);
}

export function mapOrderToDto(order: OrderWithRelations): AccountOrderDto {
  const status = orderStatusToDisplay(order.status);
  const cancellation = getCancellationQuote({
    status: order.status,
    placedAt: order.placedAt,
    totalPaise: order.totalPaise,
  });
  const cancelRefundStatus = normalizeCancelRefundStatus(order.cancelRefundStatus);
  const refundTimeline =
    order.status === "CANCELLED"
      ? buildCancelRefundTimeline({
          cancelRefundStatus,
          cancelledAt: order.cancelledAt,
          cancelRefundProcessingAt: order.cancelRefundProcessingAt,
          cancelRefundCreditedAt: order.cancelRefundCreditedAt,
        })
      : [];

  return {
    id: order.id,
    orderNumber: order.orderNumber,
    placedOn: formatDisplayDate(order.placedAt),
    placedAt: order.placedAt.toISOString(),
    status,
    items: order.items.map(mapLineItem),
    total: formatPaise(order.totalPaise),
    timeline: buildTimeline(order.statusEvents, order.status),
    deliveryAddress: {
      name: order.deliveryAddress.name,
      line1: order.deliveryAddress.line1,
      line2: order.deliveryAddress.line2 ?? "",
      city: order.deliveryAddress.city,
      state: order.deliveryAddress.state,
      pincode: order.deliveryAddress.pincode,
      phone: order.deliveryAddress.phone,
    },
    payment: {
      method: order.paymentMethod,
      status: resolveOrderPaymentStatus({
        paymentStatus: order.paymentStatus,
        cancelledAt: order.cancelledAt,
        cancelRefundStatus: order.cancelRefundStatus,
      }),
      transactionId: order.transactionId ?? "—",
    },
    priceBreakdown: {
      goldValue: formatPaise(order.goldValuePaise),
      makingCharges: formatPaise(order.makingChargePaise),
      gst: formatPaise(order.gstPaise),
      shipping: formatPaise(order.shippingPaise),
      subtotalBeforeDiscount: formatPaise(order.totalPaise + order.discountPaise),
      discount: formatPaise(order.discountPaise),
      couponCode: order.couponCode ?? undefined,
      total: formatPaise(order.totalPaise),
    },
    shipping: {
      courier: order.courier ?? "—",
      trackingNumber: order.trackingNumber ?? "Pending dispatch",
      expectedDelivery: customerDeliveryDateFromShiprocketEdd(order.expectedDelivery),
    },
    returnEligible: isReturnEligible(order.status, order.statusEvents),
    returnRequest: mapReturnOnOrder(order),
    cancellation,
    cancelRefundAmount:
      order.cancelRefundPaise != null ? formatPaise(order.cancelRefundPaise) : null,
    cancelReason: order.cancelReason ?? null,
    cancelNote: order.cancelNote ?? null,
    cancelRefundStatus: cancelRefundStatus,
    cancelRefundStatusLabel: cancelRefundStatus
      ? cancelRefundPaymentStatusLabel(cancelRefundStatus)
      : null,
    refundTimeline,
  };
}
