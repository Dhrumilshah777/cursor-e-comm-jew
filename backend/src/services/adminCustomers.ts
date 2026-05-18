import { prisma } from "../lib/prisma.js";

export async function listAdminCustomers() {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { orders: true, addresses: true } },
    },
  });

  return users.map((user) => ({
    id: user.id,
    name: user.name,
    phone: user.phone,
    email: user.email,
    createdAt: user.createdAt.toISOString(),
    orderCount: user._count.orders,
    addressCount: user._count.addresses,
  }));
}

export async function getAdminCustomerById(id: string) {
  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      addresses: true,
      orders: {
        orderBy: { placedAt: "desc" },
        select: {
          id: true,
          orderNumber: true,
          status: true,
          placedAt: true,
          totalPaise: true,
        },
      },
    },
  });

  if (!user) return null;

  return {
    id: user.id,
    name: user.name,
    phone: user.phone,
    email: user.email,
    createdAt: user.createdAt.toISOString(),
    addresses: user.addresses,
    orders: user.orders.map((order) => ({
      ...order,
      placedAt: order.placedAt.toISOString(),
      total: `₹${(order.totalPaise / 100).toLocaleString("en-IN")}`,
    })),
  };
}
