"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  getOrderDetailPath,
  getOrderStatusClass,
  type AccountOrder,
} from "@/data/accountOrders";
import { fetchOrders } from "@/lib/ordersApi";

function OrderCard({ order }: { order: AccountOrder }) {
  const detailPath = getOrderDetailPath(order.id);

  return (
    <Link
      href={detailPath}
      className="block cursor-pointer border border-zinc-100 bg-white transition hover:border-zinc-300 hover:shadow-sm"
    >
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-zinc-100 px-4 py-4 sm:px-5">
        <div>
          <p className="text-[10px] font-normal uppercase tracking-[0.22em] text-zinc-500">
            Order
          </p>
          <p className="mt-1 text-sm font-light uppercase tracking-[0.12em] text-zinc-900">
            {order.orderNumber}
          </p>
          <p className="mt-1 text-xs font-light text-zinc-500">
            Placed on {order.placedOn}
          </p>
        </div>
        <span
          className={`border px-2.5 py-1 text-[10px] font-normal uppercase tracking-[0.18em] ${getOrderStatusClass(order.status)}`}
        >
          {order.status}
        </span>
      </div>

      <ul className="divide-y divide-zinc-100">
        {order.items.map((item) => (
          <li
            key={`${order.id}-${item.slug}`}
            className="flex gap-4 px-4 py-4 sm:gap-5 sm:px-5"
          >
            <div className="relative h-20 w-20 shrink-0 overflow-hidden bg-zinc-100 sm:h-24 sm:w-24">
              <Image
                src={item.image}
                alt={item.alt}
                fill
                className="object-cover"
                sizes="96px"
              />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-normal uppercase tracking-[0.14em] text-zinc-900 sm:text-[13px]">
                {item.name}
              </p>
              <p className="mt-1 text-[11px] font-light text-zinc-500">
                {item.metal}
              </p>
              <p className="mt-2 text-xs font-light text-zinc-600">
                Qty: {item.quantity}
              </p>
            </div>
            <p className="shrink-0 text-sm font-light text-zinc-900">
              {item.price}
            </p>
          </li>
        ))}
      </ul>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-zinc-100 px-4 py-4 sm:px-5">
        <p className="text-xs font-light text-zinc-600">
          Total <span className="text-sm text-zinc-900">{order.total}</span>
        </p>
        <p className="text-[10px] font-light uppercase tracking-[0.16em] text-zinc-500">
          View order details →
        </p>
      </div>
    </Link>
  );
}

function OrdersUnavailable() {
  return (
    <div className="mt-8 border border-amber-100 bg-amber-50/50 px-5 py-8 sm:px-8">
      <p className="text-sm font-light text-zinc-800">
        Unable to load your orders right now.
      </p>
      <p className="mt-2 text-sm font-light text-zinc-600">
        Make sure the API server is running on{" "}
        <code className="text-xs">localhost:4000</code>, then refresh this page.
      </p>
    </div>
  );
}

export default function MyOrdersContent() {
  const [orders, setOrders] = useState<AccountOrder[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    fetchOrders()
      .then((data) => {
        if (!cancelled) setOrders(data);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <p className="mt-8 text-sm font-light text-zinc-500">Loading your orders…</p>
    );
  }

  if (failed || orders === null) {
    return <OrdersUnavailable />;
  }

  if (orders.length === 0) {
    return (
      <div className="mt-8 border border-zinc-100 bg-zinc-50/40 px-5 py-10 sm:px-8">
        <p className="text-sm font-light text-zinc-600">You have no orders yet.</p>
      </div>
    );
  }

  return (
    <div className="mt-8 space-y-6">
      {orders.map((order) => (
        <OrderCard key={order.id} order={order} />
      ))}
    </div>
  );
}
