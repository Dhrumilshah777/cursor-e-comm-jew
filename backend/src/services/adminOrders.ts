import { prisma } from "../lib/prisma.js";
import { mapAdminOrderToDto, orderStatusEventLabel } from "../lib/adminOrderMapper.js";
import {
  fulfillOrderOnShiprocket,
  getShiprocketLogFromError,
  type ShiprocketLogEntry,
} from "./shiprocketFulfillment.js";
import type { OrderStatus } from "../generated/prisma/client.js";

const orderInclude = {
  items: { include: { product: true } },
  deliveryAddress: true,
  statusEvents: { orderBy: { eventAt: "asc" as const } },
  user: { select: { id: true, name: true, phone: true, email: true } },
};

export type AdminOrderUpdateResult = {
  order: ReturnType<typeof mapAdminOrderToDto>;
  shiprocketWarning?: string;
  shiprocketLog?: ShiprocketLogEntry[];
  /** True when Shiprocket failed — order status was not changed to Shipped */
  shiprocketFailed?: boolean;
};

export async function listAdminOrders(filters: {
  status?: string;
  search?: string;
  from?: string;
  to?: string;
}) {
  const status = filters.status?.toUpperCase() as OrderStatus | undefined;

  const orders = await prisma.order.findMany({
    where: {
      ...(status ? { status } : {}),
      ...(filters.search
        ? {
            OR: [
              { orderNumber: { contains: filters.search, mode: "insensitive" } },
              { user: { phone: { contains: filters.search } } },
              { user: { name: { contains: filters.search, mode: "insensitive" } } },
            ],
          }
        : {}),
      ...(filters.from || filters.to
        ? {
            placedAt: {
              ...(filters.from ? { gte: new Date(filters.from) } : {}),
              ...(filters.to ? { lte: new Date(filters.to) } : {}),
            },
          }
        : {}),
    },
    include: orderInclude,
    orderBy: { placedAt: "desc" },
  });

  return orders.map((order) => mapAdminOrderToDto(order));
}

export async function getAdminOrderById(id: string) {
  const order = await prisma.order.findUnique({
    where: { id },
    include: orderInclude,
  });
  if (!order) return null;
  return mapAdminOrderToDto(order);
}

export async function updateAdminOrder(
  id: string,
  data: {
    status?: OrderStatus;
    courier?: string | null;
    trackingNumber?: string | null;
    expectedDelivery?: string | null;
    paymentStatus?: string;
  },
): Promise<AdminOrderUpdateResult | null> {
  const existing = await prisma.order.findUnique({ where: { id } });
  if (!existing) return null;

  const shouldFulfillOnShiprocket =
    data.status === "SHIPPED" &&
    existing.status !== "SHIPPED" &&
    !existing.shiprocketShipmentId;

  let shiprocketLog: ShiprocketLogEntry[] | undefined;

  if (shouldFulfillOnShiprocket) {
    try {
      const result = await fulfillOrderOnShiprocket(id);
      shiprocketLog = result.log;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Shiprocket fulfillment failed";
      shiprocketLog = getShiprocketLogFromError(error);
      console.error(`Shiprocket fulfillment for order ${id}:`, error);

      const unchanged = await prisma.order.findUnique({
        where: { id },
        include: orderInclude,
      });
      if (!unchanged) return null;

      return {
        order: mapAdminOrderToDto(unchanged),
        shiprocketWarning: message,
        shiprocketFailed: true,
        ...(shiprocketLog?.length ? { shiprocketLog } : {}),
      };
    }
  }

  const order = await prisma.$transaction(async (tx) => {
    if (data.status && data.status !== existing.status) {
      await tx.orderStatusEvent.create({
        data: {
          orderId: id,
          status: data.status,
          label: orderStatusEventLabel(data.status),
        },
      });
    }

    return tx.order.update({
      where: { id },
      data: {
        ...(data.status ? { status: data.status } : {}),
        ...(data.courier !== undefined ? { courier: data.courier } : {}),
        ...(data.trackingNumber !== undefined ? { trackingNumber: data.trackingNumber } : {}),
        ...(data.expectedDelivery !== undefined
          ? { expectedDelivery: data.expectedDelivery }
          : {}),
        ...(data.paymentStatus ? { paymentStatus: data.paymentStatus } : {}),
      },
      include: orderInclude,
    });
  });

  return {
    order: mapAdminOrderToDto(order),
    ...(shiprocketLog?.length ? { shiprocketLog } : {}),
  };
}

export async function addOrderStatusEvent(
  orderId: string,
  input: { status: OrderStatus; label: string; note?: string; eventAt?: string },
) {
  const existing = await prisma.order.findUnique({ where: { id: orderId } });
  if (!existing) return null;

  const shouldFulfillOnShiprocket =
    input.status === "SHIPPED" &&
    existing.status !== "SHIPPED" &&
    !existing.shiprocketShipmentId;

  let shiprocketLog: ShiprocketLogEntry[] | undefined;

  if (shouldFulfillOnShiprocket) {
    try {
      const result = await fulfillOrderOnShiprocket(orderId);
      shiprocketLog = result.log;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Shiprocket fulfillment failed";
      shiprocketLog = getShiprocketLogFromError(error);
      console.error(`Shiprocket fulfillment for order ${orderId}:`, error);

      const unchanged = await prisma.order.findUnique({
        where: { id: orderId },
        include: orderInclude,
      });
      if (!unchanged) return null;

      return {
        order: mapAdminOrderToDto(unchanged),
        shiprocketWarning: message,
        shiprocketFailed: true,
        ...(shiprocketLog?.length ? { shiprocketLog } : {}),
      };
    }
  }

  const event = await prisma.orderStatusEvent.create({
    data: {
      orderId,
      status: input.status,
      label: input.label,
      note: input.note,
      eventAt: input.eventAt ? new Date(input.eventAt) : undefined,
    },
  });

  await prisma.order.update({
    where: { id: orderId },
    data: { status: input.status },
  });

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: orderInclude,
  });

  if (!order) return null;

  return {
    order: mapAdminOrderToDto(order),
    event: {
      id: event.id,
      status: event.status,
      label: event.label,
      note: event.note,
      eventAt: event.eventAt.toISOString(),
    },
    ...(shiprocketLog?.length ? { shiprocketLog } : {}),
  };
}
