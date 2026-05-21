"use client";

import { useCallback, useEffect, useState } from "react";
import {
  fetchAdminAbandonedCheckouts,
  type AdminAbandonedCheckout,
} from "@/lib/adminApi";

export default function AdminAbandonedCheckoutsTable() {
  const [sessions, setSessions] = useState<AdminAbandonedCheckout[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setSessions(await fetchAdminAbandonedCheckouts());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load abandoned checkouts");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return <p className="text-sm font-light text-zinc-500">Loading abandoned checkouts…</p>;
  }
  if (error) {
    return <p className="text-sm font-light text-red-700">{error}</p>;
  }

  const expiredCount = sessions.filter((session) => session.status === "expired").length;
  const pendingCount = sessions.filter((session) => session.status === "pending").length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap gap-4 text-sm font-light text-zinc-600">
          <span>{sessions.length} payment attempts</span>
          <span>{expiredCount} not completed</span>
          {pendingCount > 0 ? (
            <span>{pendingCount} still open</span>
          ) : null}
        </div>
        <button
          type="button"
          onClick={load}
          className="cursor-pointer border border-zinc-300 px-4 py-2 text-[10px] font-light uppercase tracking-[0.16em] text-zinc-700 transition hover:border-zinc-900 hover:text-zinc-900"
        >
          Refresh
        </button>
      </div>

      {sessions.length === 0 ? (
        <p className="text-sm font-light text-zinc-600">
          No abandoned checkouts yet. Sessions appear here when a customer clicks Pay with
          Razorpay but does not complete payment.
        </p>
      ) : (
        <div className="overflow-x-auto border border-zinc-200 bg-white">
          <table className="w-full min-w-[980px] text-left text-sm font-light">
            <thead className="border-b border-zinc-100 text-[10px] uppercase tracking-[0.16em] text-zinc-500">
              <tr>
                <th className="px-5 py-3 font-normal">Customer</th>
                <th className="px-5 py-3 font-normal">Started</th>
                <th className="px-5 py-3 font-normal">Amount</th>
                <th className="px-5 py-3 font-normal">Coupon</th>
                <th className="px-5 py-3 font-normal">Delivery</th>
                <th className="px-5 py-3 font-normal">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {sessions.map((session) => (
                <tr key={session.id}>
                  <td className="px-5 py-4 text-zinc-900">
                    <span className="block font-normal">
                      {session.customer.name ?? "Customer"}
                    </span>
                    <span className="mt-0.5 block text-xs text-zinc-500">
                      {session.customer.phone}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-zinc-700">
                    <span className="block">{session.startedAtLabel}</span>
                    <span className="mt-0.5 block text-[11px] text-zinc-500">
                      Expires {session.expiresAtLabel}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-zinc-900">
                    <span className="block">{session.amount}</span>
                    {session.discount ? (
                      <span className="mt-0.5 block text-[11px] text-emerald-700">
                        incl. -{session.discount} discount
                      </span>
                    ) : null}
                  </td>
                  <td className="px-5 py-4 text-zinc-700">
                    {session.couponCode ? (
                      <span className="text-xs font-normal uppercase tracking-[0.1em] text-zinc-900">
                        {session.couponCode}
                      </span>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-5 py-4 text-zinc-600">{session.addressSummary}</td>
                  <td className="px-5 py-4">
                    <span
                      className={`inline-block px-2 py-1 text-[10px] uppercase tracking-[0.14em] ${
                        session.status === "pending"
                          ? "bg-amber-50 text-amber-800"
                          : "bg-zinc-100 text-zinc-600"
                      }`}
                    >
                      {session.statusLabel}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
