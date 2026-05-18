"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { fetchAdminDashboard, type AdminDashboard } from "@/lib/adminApi";

export default function AdminDashboard() {
  const [dashboard, setDashboard] = useState<AdminDashboard | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAdminDashboard()
      .then(setDashboard)
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Failed to load dashboard"),
      );
  }, []);

  if (error) {
    return <p className="text-sm font-light text-red-700">{error}</p>;
  }

  if (!dashboard) {
    return <p className="text-sm font-light text-zinc-500">Loading dashboard…</p>;
  }

  const stats = [
    { label: "Total orders", value: String(dashboard.counts.totalOrders) },
    { label: "Orders today", value: String(dashboard.counts.ordersToday) },
    { label: "Pending returns", value: String(dashboard.counts.pendingReturns) },
    { label: "Active products", value: String(dashboard.counts.activeProducts) },
    { label: "Customers", value: String(dashboard.counts.totalCustomers) },
    { label: "Revenue today", value: dashboard.counts.revenueToday },
  ];

  return (
    <div className="space-y-10">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat) => (
          <div key={stat.label} className="border border-zinc-200 bg-white px-5 py-6">
            <p className="text-[10px] font-normal uppercase tracking-[0.2em] text-zinc-500">
              {stat.label}
            </p>
            <p className="mt-2 text-2xl font-light text-zinc-950">{stat.value}</p>
          </div>
        ))}
      </div>

      <section>
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-sm font-normal uppercase tracking-[0.2em] text-zinc-900">
            Recent orders
          </h2>
          <Link
            href="/admin/orders"
            className="text-[10px] font-light uppercase tracking-[0.16em] text-zinc-600 hover:text-zinc-900"
          >
            View all →
          </Link>
        </div>
        <ul className="mt-4 divide-y divide-zinc-100 border border-zinc-200 bg-white">
          {dashboard.recentOrders.map((order) => (
            <li
              key={order.id}
              className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 text-sm font-light"
            >
              <Link
                href={`/admin/orders/${order.id}`}
                className="text-zinc-900 hover:underline"
              >
                {order.orderNumber}
              </Link>
              <span className="text-zinc-600">{order.status}</span>
              <span className="text-zinc-900">{order.total}</span>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-sm font-normal uppercase tracking-[0.2em] text-zinc-900">
            Returns under review
          </h2>
          <Link
            href="/admin/returns"
            className="text-[10px] font-light uppercase tracking-[0.16em] text-zinc-600 hover:text-zinc-900"
          >
            View all →
          </Link>
        </div>
        {dashboard.recentReturns.length === 0 ? (
          <p className="mt-4 text-sm font-light text-zinc-500">No pending returns.</p>
        ) : (
          <ul className="mt-4 divide-y divide-zinc-100 border border-zinc-200 bg-white">
            {dashboard.recentReturns.map((item) => (
              <li
                key={item.id}
                className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 text-sm font-light"
              >
                <span className="text-zinc-900">{item.orderNumber}</span>
                <span className="text-zinc-600">{item.status}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
