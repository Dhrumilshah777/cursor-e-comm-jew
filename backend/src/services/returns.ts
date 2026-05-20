import {
  notifyAdminReturnRequested,
  notifyReturnApproved,
  notifyReturnRejected,
} from "../lib/notifications.js";
import { prisma } from "../lib/prisma.js";
import {
  mapReturnToAdminDto,
  mapReturnToCustomerDto,
  returnInclude,
} from "../lib/returnMapper.js";
import { returnStatusLabel, returnStatusToDb } from "../lib/returnStatus.js";
import type { ReturnImageType, ReturnStatus } from "../generated/prisma/client.js";
import {
  ReturnFulfillmentError,
  fulfillReturnOnApproval,
  initiateReturnRefundOnItemReceived,
} from "./returnFulfillment.js";

async function createReturnStatusEvent(
  returnRequestId: string,
  status: ReturnStatus,
  note?: string,
) {
  await prisma.returnStatusEvent.create({
    data: {
      returnRequestId,
      status,
      label: returnStatusLabel(status),
      note,
    },
  });
}

async function resolvePickupAddressId(
  userId: string,
  input:
    | { pickupAddressId: string }
    | {
        pickupAddress: {
          name: string;
          line1: string;
          line2?: string;
          city: string;
          state: string;
          pincode: string;
          phone: string;
        };
      },
) {
  if ("pickupAddressId" in input) {
    const address = await prisma.address.findFirst({
      where: { id: input.pickupAddressId, userId },
    });
    if (!address) return { error: "ADDRESS_NOT_FOUND" as const };
    return { pickupAddressId: address.id };
  }

  const pickup = input.pickupAddress;
  const address = await prisma.address.create({
    data: {
      userId,
      label: "Return pickup",
      name: pickup.name,
      line1: pickup.line1,
      line2: pickup.line2 ?? null,
      city: pickup.city,
      state: pickup.state,
      pincode: pickup.pincode,
      phone: pickup.phone,
    },
  });
  return { pickupAddressId: address.id };
}

export async function submitReturnRequest(input: {
  userId: string;
  orderId: string;
  orderItemId: string;
  reason: string;
  customerNotes?: string;
  policyConfirmed: boolean;
  productImageUrls?: string[];
  packagingImageUrls?: string[];
} & (
  | { pickupAddressId: string }
  | {
      pickupAddress: {
        name: string;
        line1: string;
        line2?: string;
        city: string;
        state: string;
        pincode: string;
        phone: string;
      };
    }
)) {
  const user = await prisma.user.findUnique({ where: { id: input.userId } });
  if (!user) return { error: "USER_NOT_FOUND" as const };

  const order = await prisma.order.findFirst({
    where: { id: input.orderId, userId: user.id },
    include: { items: true },
  });
  if (!order) return { error: "ORDER_NOT_FOUND" as const };

  const orderItem = order.items.find((item) => item.id === input.orderItemId);
  if (!orderItem) return { error: "ORDER_ITEM_NOT_FOUND" as const };

  const existing = await prisma.returnRequest.findFirst({
    where: { orderId: input.orderId, orderItemId: input.orderItemId },
  });
  if (existing) return { error: "RETURN_ALREADY_EXISTS" as const };

  const resolved = await resolvePickupAddressId(user.id, input);
  if ("error" in resolved) return resolved;
  const images: { type: ReturnImageType; url: string }[] = [
    ...(input.productImageUrls ?? []).map((url) => ({
      type: "PRODUCT" as const,
      url,
    })),
    ...(input.packagingImageUrls ?? []).map((url) => ({
      type: "PACKAGING" as const,
      url,
    })),
  ];

  const returnRequest = await prisma.returnRequest.create({
    data: {
      orderId: input.orderId,
      orderItemId: input.orderItemId,
      pickupAddressId: resolved.pickupAddressId,
      reason: input.reason,
      customerNotes: input.customerNotes,
      policyConfirmed: input.policyConfirmed,
      status: "UNDER_REVIEW",
      images: images.length
        ? { create: images.map((image) => ({ type: image.type, url: image.url })) }
        : undefined,
    },
    include: returnInclude,
  });

  await createReturnStatusEvent(returnRequest.id, "UNDER_REVIEW", "Return request submitted");

  const orderMeta = await prisma.order.findUnique({
    where: { id: input.orderId },
    select: {
      orderNumber: true,
      user: { select: { phone: true } },
      items: { where: { id: input.orderItemId }, select: { name: true }, take: 1 },
    },
  });

  if (orderMeta) {
    void notifyAdminReturnRequested({
      orderNumber: orderMeta.orderNumber,
      productName: orderMeta.items[0]?.name ?? "Product",
      customerPhone: orderMeta.user.phone,
      reason: input.reason,
    });
  }

  return { returnRequest: mapReturnToCustomerDto(returnRequest) };
}

export async function getReturnForOrder(userId: string, orderId: string) {
  const returnRequest = await prisma.returnRequest.findFirst({
    where: { orderId, order: { userId } },
    include: returnInclude,
    orderBy: { submittedAt: "desc" },
  });

  if (!returnRequest) return null;
  return mapReturnToCustomerDto(returnRequest);
}

export async function approveReturnRequest(id: string) {
  try {
    const result = await fulfillReturnOnApproval(id);
    const returnRequest = await prisma.returnRequest.findUnique({
      where: { id },
      include: returnInclude,
    });
    if (!returnRequest) return { error: "NOT_FOUND" as const };

    const customerPhone = returnRequest.order.user.phone;
    void notifyReturnApproved({
      customerPhone,
      orderNumber: returnRequest.order.orderNumber,
      pickupScheduledFor: returnRequest.pickupScheduledFor,
    });

    return {
      returnRequest: mapReturnToAdminDto(returnRequest),
      log: result.log,
    };
  } catch (error) {
    if (error instanceof ReturnFulfillmentError) {
      return { error: "FULFILLMENT_FAILED" as const, message: error.message, log: error.log };
    }
    throw error;
  }
}

export async function markReturnItemReceived(id: string) {
  try {
    const result = await initiateReturnRefundOnItemReceived(id);
    const returnRequest = await prisma.returnRequest.findUnique({
      where: { id },
      include: returnInclude,
    });
    if (!returnRequest) return { error: "NOT_FOUND" as const };
    return {
      returnRequest: mapReturnToAdminDto(returnRequest),
      log: result.log,
    };
  } catch (error) {
    if (error instanceof ReturnFulfillmentError) {
      return { error: "FULFILLMENT_FAILED" as const, message: error.message, log: error.log };
    }
    throw error;
  }
}

export async function updateReturnStatus(
  id: string,
  status: ReturnStatus,
  options?: { pickupScheduledFor?: string; note?: string },
) {
  if (status === "ITEM_RECEIVED") {
    return markReturnItemReceived(id);
  }

  const data: {
    status: ReturnStatus;
    pickupScheduledFor?: string;
    reviewedAt?: Date;
  } = { status };

  if (options?.pickupScheduledFor) {
    data.pickupScheduledFor = options.pickupScheduledFor;
  }

  if (status === "APPROVED" || status === "REJECTED") {
    data.reviewedAt = new Date();
  }

  const updated = await prisma.returnRequest.update({
    where: { id },
    data,
    include: returnInclude,
  });

  await createReturnStatusEvent(id, status, options?.note);

  if (status === "REJECTED") {
    void notifyReturnRejected({
      customerPhone: updated.order.user.phone,
      orderNumber: updated.order.orderNumber,
    });
  }

  return mapReturnToAdminDto(updated);
}

export async function appendAdminNotes(id: string, adminNotes: string) {
  const updated = await prisma.returnRequest.update({
    where: { id },
    data: { adminNotes },
    include: returnInclude,
  });
  return mapReturnToAdminDto(updated);
}

export async function listAdminReturns(filters: {
  status?: string;
  orderNumber?: string;
  from?: string;
  to?: string;
}) {
  const status = filters.status ? returnStatusToDb(filters.status) : undefined;

  const returns = await prisma.returnRequest.findMany({
    where: {
      ...(status ? { status } : {}),
      ...(filters.orderNumber
        ? { order: { orderNumber: { contains: filters.orderNumber, mode: "insensitive" } } }
        : {}),
      ...(filters.from || filters.to
        ? {
            submittedAt: {
              ...(filters.from ? { gte: new Date(filters.from) } : {}),
              ...(filters.to ? { lte: new Date(filters.to) } : {}),
            },
          }
        : {}),
    },
    include: returnInclude,
    orderBy: { submittedAt: "desc" },
  });

  return returns.map(mapReturnToAdminDto);
}

export async function getAdminReturnById(id: string) {
  const returnRequest = await prisma.returnRequest.findUnique({
    where: { id },
    include: returnInclude,
  });
  if (!returnRequest) return null;
  return mapReturnToAdminDto(returnRequest);
}
