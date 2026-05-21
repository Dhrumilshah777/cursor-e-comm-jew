"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  deactivateAdminCoupon,
  fetchAdminCoupons,
  type AdminCoupon,
} from "@/lib/adminApi";

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function AdminCouponsTable() {
  const [coupons, setCoupons] = useState<AdminCoupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [deactivatingId, setDeactivatingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setCoupons(await fetchAdminCoupons());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load coupons");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleDeactivate = async (coupon: AdminCoupon) => {
    if (!window.confirm(`Deactivate coupon "${coupon.code}"?`)) return;
    setActionError(null);
    setDeactivatingId(coupon.id);
    try {
      await deactivateAdminCoupon(coupon.id);
      await load();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to deactivate coupon");
    } finally {
      setDeactivatingId(null);
    }
  };

  if (loading) return <p className="text-sm font-light text-zinc-500">Loading coupons…</p>;
  if (error) return <p className="text-sm font-light text-red-700">{error}</p>;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="text-sm font-light text-zinc-600">{coupons.length} coupons</p>
        <Link
          href="/admin/coupons/new"
          className="inline-block border border-zinc-900 bg-zinc-900 px-5 py-2.5 text-[10px] font-light uppercase tracking-[0.18em] text-white transition hover:bg-zinc-800"
        >
          + Create coupon
        </Link>
      </div>

      {actionError ? <p className="text-sm font-light text-red-700">{actionError}</p> : null}

      <div className="overflow-x-auto border border-zinc-200 bg-white">
        <table className="w-full min-w-[920px] text-left text-sm font-light">
          <thead className="border-b border-zinc-100 text-[10px] uppercase tracking-[0.16em] text-zinc-500">
            <tr>
              <th className="px-5 py-3 font-normal">Code</th>
              <th className="px-5 py-3 font-normal">Discount</th>
              <th className="px-5 py-3 font-normal">Min order</th>
              <th className="px-5 py-3 font-normal">Usage</th>
              <th className="px-5 py-3 font-normal">Valid</th>
              <th className="px-5 py-3 font-normal">Status</th>
              <th className="px-5 py-3 font-normal">Actions</th>
            </tr>
          </thead>
          <tbody>
            {coupons.map((coupon) => (
              <tr key={coupon.id} className="border-b border-zinc-50">
                <td className="px-5 py-4 font-normal text-zinc-900">{coupon.code}</td>
                <td className="px-5 py-4 text-zinc-700">{coupon.valueLabel}</td>
                <td className="px-5 py-4 text-zinc-600">{coupon.minOrder ?? "—"}</td>
                <td className="px-5 py-4 text-zinc-600">
                  {coupon.usedCount}
                  {coupon.usageLimit != null ? ` / ${coupon.usageLimit}` : ""}
                  {coupon.usageLimitPerUser != null
                    ? ` · ${coupon.usageLimitPerUser}/user`
                    : ""}
                </td>
                <td className="px-5 py-4 text-zinc-600">
                  {formatDate(coupon.startsAt)} – {formatDate(coupon.endsAt)}
                </td>
                <td className="px-5 py-4">
                  <span
                    className={`inline-block px-2 py-1 text-[10px] uppercase tracking-[0.14em] ${
                      coupon.isActive
                        ? "bg-emerald-50 text-emerald-800"
                        : "bg-zinc-100 text-zinc-500"
                    }`}
                  >
                    {coupon.isActive ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="px-5 py-4">
                  <div className="flex flex-wrap gap-3">
                    <Link
                      href={`/admin/coupons/${coupon.id}/edit`}
                      className="text-[10px] uppercase tracking-[0.14em] text-zinc-600 hover:text-zinc-900"
                    >
                      Edit
                    </Link>
                    {coupon.isActive ? (
                      <button
                        type="button"
                        onClick={() => handleDeactivate(coupon)}
                        disabled={deactivatingId === coupon.id}
                        className="text-[10px] uppercase tracking-[0.14em] text-red-700 hover:text-red-900 disabled:opacity-50"
                      >
                        Deactivate
                      </button>
                    ) : null}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {coupons.length === 0 ? (
          <p className="px-5 py-8 text-sm font-light text-zinc-500">No coupons yet.</p>
        ) : null}
      </div>
    </div>
  );
}
