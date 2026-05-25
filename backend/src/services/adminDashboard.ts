import { prisma } from "../lib/prisma.js";
import { formatPaise } from "../lib/format.js";
import { Prisma } from "../generated/prisma/client.js";

export async function getAdminDashboard() {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const [
    totalOrders,
    ordersToday,
    pendingReturns,
    totalProducts,
    activeProducts,
    outOfStockProducts,
    totalCustomers,
    revenueTodayAgg,
    recentOrders,
    recentReturns,
    lowStockRows,
  ] = await Promise.all([
    prisma.order.count(),
    prisma.order.count({ where: { placedAt: { gte: startOfToday } } }),
    prisma.returnRequest.count({ where: { status: "UNDER_REVIEW" } }),
    prisma.product.count(),
    prisma.product.count({ where: { isActive: true } }),
    prisma.product.count({ where: { isActive: true, stockCount: { lte: 0 } } }),
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
    // Low stock = active products where stockCount is at or below the
    // product's own lowStockThreshold (including 0). Can't express that
    // comparison through Prisma's where clause directly, so we use raw SQL.
    prisma.$queryRaw<
      { id: string; name: string; slug: string; stockCount: number; lowStockThreshold: number }[]
    >(Prisma.sql`
      SELECT "id", "name", "slug", "stockCount", "lowStockThreshold"
      FROM "products"
      WHERE "isActive" = true
        AND "stockCount" <= "lowStockThreshold"
      ORDER BY "stockCount" ASC, "name" ASC
      LIMIT 10
    `),
  ]);

  const revenueTodayPaise = revenueTodayAgg._sum.totalPaise ?? 0;

  return {
    counts: {
      totalOrders,
      ordersToday,
      pendingReturns,
      totalProducts,
      activeProducts,
      outOfStockProducts,
      lowStockProducts: lowStockRows.length,
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
    lowStockProducts: lowStockRows.map((row) => ({
      id: row.id,
      name: row.name,
      slug: row.slug,
      stockCount: row.stockCount,
      lowStockThreshold: row.lowStockThreshold,
      isOutOfStock: row.stockCount <= 0,
    })),
  };
}
