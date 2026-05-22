"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { adminOrderDetailPath } from "@/data/adminOrders";
import { fetchAdminOrders } from "@/lib/adminApi";
import CancellationCountdown from "@/components/admin/CancellationCountdown";

export default function AdminOrdersTable() {
  const router = useRouter();
  const [orders, setOrders] = useState<
    Awaited<ReturnType<typeof fetchAdminOrders>>
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAdminOrders()
      .then(setOrders)
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Failed to load orders"),
      )
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-sm font-light text-zinc-500">Loading orders…</p>;
  if (error) return <p className="text-sm font-light text-red-700">{error}</p>;

  if (orders.length === 0) {
    return <p className="text-sm font-light text-zinc-600">No orders found.</p>;
  }

  return (
    <div className="overflow-x-auto border border-zinc-200 bg-white">
      <table className="w-full min-w-[760px] text-left text-sm font-light">
        <thead className="border-b border-zinc-100 text-[10px] uppercase tracking-[0.16em] text-zinc-500">
          <tr>
            <th className="px-5 py-3 font-normal">Order</th>
            <th className="px-5 py-3 font-normal">Customer</th>
            <th className="px-5 py-3 font-normal">Status</th>
            <th className="px-5 py-3 font-normal">Placed</th>
            <th className="px-5 py-3 font-normal">24h window</th>
            <th className="px-5 py-3 font-normal">Amount paid</th>
            <th className="px-5 py-3 font-normal">Coupon</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100">
          {orders.map((order) => (
            <tr
              key={order.id}
              className="cursor-pointer hover:bg-zinc-50/80"
              onClick={() => router.push(adminOrderDetailPath(order.id))}
            >
              <td className="px-5 py-4">
                <Link
                  href={adminOrderDetailPath(order.id)}
                  onClick={(e) => e.stopPropagation()}
                  className="font-light text-zinc-900 underline-offset-2 hover:underline"
                >
                  {order.orderNumber}
                </Link>
              </td>
              <td className="px-5 py-4 text-zinc-700">
                {order.customer.name ?? "—"}
                <span className="block text-xs text-zinc-500">{order.customer.phone}</span>
              </td>
              <td className="px-5 py-4 text-zinc-700">
                <Link
                  href={adminOrderDetailPath(order.id)}
                  onClick={(e) => e.stopPropagation()}
                  className="hover:underline"
                >
                  {order.status}
                </Link>
              </td>
              <td className="px-5 py-4 text-zinc-700">{order.placedOn}</td>
              <td className="px-5 py-4 text-zinc-700">
                {order.cancellation?.cancellable ? (
                  <CancellationCountdown
                    windowEndsAt={order.cancellation.windowEndsAt}
                    cancellable={order.cancellation.cancellable}
                    className="text-xs"
                  />
                ) : (
                  "—"
                )}
              </td>
              <td className="px-5 py-4 text-zinc-900">
                <span>{order.total}</span>
                {order.priceBreakdown.discount &&
                order.priceBreakdown.discount !== "₹0" &&
                order.priceBreakdown.discount !== "₹0.00" ? (
                  <span className="mt-0.5 block text-[11px] font-light text-emerald-700">
                    incl. -{order.priceBreakdown.discount} discount
                  </span>
                ) : null}
              </td>
              <td className="px-5 py-4 text-zinc-700">
                {order.priceBreakdown.couponCode ? (
                  <span className="text-xs font-normal uppercase tracking-[0.1em] text-zinc-900">
                    {order.priceBreakdown.couponCode}
                  </span>
                ) : (
                  "—"
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
