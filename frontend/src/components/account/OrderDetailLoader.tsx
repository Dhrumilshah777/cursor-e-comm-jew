"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import OrderDetailContent from "@/components/account/OrderDetailContent";
import type { AccountOrder } from "@/data/accountOrders";
import { fetchOrderById } from "@/lib/ordersApi";

export default function OrderDetailLoader({ orderId }: { orderId: string }) {
  const [order, setOrder] = useState<AccountOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const waNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER?.replace(/\D/g, "");
  const whatsappHref = waNumber ? `https://wa.me/${waNumber}` : "https://wa.me/";

  useEffect(() => {
    let cancelled = false;

    fetchOrderById(orderId)
      .then((data) => {
        if (cancelled) return;
        if (!data) {
          setError("Order not found.");
          return;
        }
        setOrder(data);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Failed to load order");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [orderId]);

  if (loading) {
    return (
      <p className="text-sm font-light text-zinc-500">Loading order details…</p>
    );
  }

  if (error || !order) {
    return (
      <div className="border border-zinc-100 bg-zinc-50/40 px-5 py-10 sm:px-8">
        <p className="text-sm font-light text-zinc-800">
          {error ?? "Order not found."}
        </p>
        <Link
          href="/account/my-orders"
          className="mt-4 inline-block text-[11px] font-light uppercase tracking-[0.16em] text-zinc-900 underline"
        >
          ← Back to my orders
        </Link>
      </div>
    );
  }

  return <OrderDetailContent order={order} whatsappHref={whatsappHref} onOrderUpdated={setOrder} />;
}
