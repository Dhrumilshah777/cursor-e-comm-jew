import { prisma } from "../lib/prisma.js";
import { formatPaise } from "../lib/format.js";

export async function getAdminDashboard() {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const [
    totalOrders,
    ordersToday,
    pendingReturns,
    totalProducts,
    activeProducts,
    totalCustomers,
    revenueTodayAgg,
    recentOrders,
    recentReturns,
  ] = await Promise.all([
    prisma.order.count(),
    prisma.order.count({ where: { placedAt: { gte: startOfToday } } }),
    prisma.returnRequest.count({ where: { status: "UNDER_REVIEW" } }),
    prisma.product.count(),
    prisma.product.count({ where: { isActive: true } }),
    prisma.user.count(),
    prisma.order.aggregate({
      where: { placedAt: { gte: startOfToday } },
      _sum: { totalPaise: true },
    }),
    prisma.order.findMany({
      take: 5,
      orderBy: { placedAt: "desc" },
      select: {
        id: true,
        orderNumber: true,
        status: true,
        totalPaise: true,
        placedAt: true,
      },
    }),
    prisma.returnRequest.findMany({
      take: 5,
      where: { status: "UNDER_REVIEW" },
      orderBy: { submittedAt: "desc" },
      select: {
        id: true,
        status: true,
        submittedAt: true,
        order: { select: { orderNumber: true } },
      },
    }),
  ]);

  const revenueTodayPaise = revenueTodayAgg._sum.totalPaise ?? 0;

  return {
    counts: {
      totalOrders,
      ordersToday,
      pendingReturns,
      totalProducts,
      activeProducts,
      totalCustomers,
      revenueToday: formatPaise(revenueTodayPaise),
      revenueTodayPaise,
    },
    recentOrders: recentOrders.map((order) => ({
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      total: formatPaise(order.totalPaise),
      placedAt: order.placedAt.toISOString(),
    })),
    recentReturns: recentReturns.map((item) => ({
      id: item.id,
      orderNumber: item.order.orderNumber,
      status: item.status,
      submittedAt: item.submittedAt.toISOString(),
    })),
  };
}
