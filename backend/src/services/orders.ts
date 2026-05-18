import { prisma } from "../lib/prisma.js";
import { mapOrderToDto, type AccountOrderDto } from "../lib/orderMapper.js";

const orderInclude = {
  items: { include: { product: true } },
  deliveryAddress: true,
  statusEvents: { orderBy: { eventAt: "asc" as const } },
};

const orderDetailInclude = {
  ...orderInclude,
  returnRequests: {
    include: {
      orderItem: true,
      pickupAddress: true,
      images: true,
      order: { include: { user: true } },
      statusEvents: { orderBy: { eventAt: "asc" as const } },
    },
    orderBy: { submittedAt: "desc" as const },
    take: 1,
  },
};

export async function getOrdersForUserId(userId: string): Promise<AccountOrderDto[]> {
  const orders = await prisma.order.findMany({
    where: { userId },
    include: orderInclude,
    orderBy: { placedAt: "desc" },
  });

  return orders.map(mapOrderToDto);
}

export async function getOrderByIdForUserId(
  orderId: string,
  userId: string,
): Promise<AccountOrderDto | null> {
  const order = await prisma.order.findFirst({
    where: { id: orderId, userId },
    include: orderDetailInclude,
  });

  if (!order) return null;

  return mapOrderToDto(order);
}

export async function getOrdersForPhone(phone: string): Promise<AccountOrderDto[]> {
  const user = await prisma.user.findUnique({
    where: { phone },
    select: { id: true },
  });

  if (!user) return [];

  return getOrdersForUserId(user.id);
}

export async function getOrderByIdForPhone(
  orderId: string,
  phone: string,
): Promise<AccountOrderDto | null> {
  const user = await prisma.user.findUnique({
    where: { phone },
    select: { id: true },
  });

  if (!user) return null;

  return getOrderByIdForUserId(orderId, user.id);
}
