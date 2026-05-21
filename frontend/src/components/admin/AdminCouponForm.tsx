"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useEffect, useState } from "react";
import {
  createAdminCoupon,
  fetchAdminCouponById,
  updateAdminCoupon,
  type AdminCoupon,
  type AdminCouponPayload,
} from "@/lib/adminApi";

const inputClass =
  "w-full border border-zinc-300 bg-white px-3 py-2.5 text-sm font-light text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-400";

function toDatetimeLocal(iso: string | null): string {
  if (!iso) return "";
  const date = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function emptyForm(): AdminCouponPayload {
  return {
    code: "",
    type: "PERCENTAGE",
    value: 10,
    minOrderRupees: null,
    maxDiscountRupees: null,
    usageLimit: null,
    usageLimitPerUser: 1,
    startsAt: null,
    endsAt: null,
    isActive: true,
  };
}

function couponToForm(coupon: AdminCoupon): AdminCouponPayload {
  return {
    code: coupon.code,
    type: coupon.type,
    value: coupon.value,
    minOrderRupees: coupon.minOrderPaise != null ? coupon.minOrderPaise / 100 : null,
    maxDiscountRupees:
      coupon.maxDiscountPaise != null ? coupon.maxDiscountPaise / 100 : null,
    usageLimit: coupon.usageLimit,
    usageLimitPerUser: coupon.usageLimitPerUser,
    startsAt: coupon.startsAt,
    endsAt: coupon.endsAt,
    isActive: coupon.isActive,
  };
}

function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <label className="block">
      <span className="text-[10px] font-normal uppercase tracking-[0.16em] text-zinc-500">
        {label}
      </span>
      <div className="mt-1">{children}</div>
      {hint ? <p className="mt-1 text-[10px] font-light text-zinc-500">{hint}</p> : null}
    </label>
  );
}

export default function AdminCouponForm({
  couponId,
  mode,
}: {
  couponId?: string;
  mode: "create" | "edit";
}) {
  const router = useRouter();
  const [form, setForm] = useState<AdminCouponPayload>(emptyForm);
  const [loading, setLoading] = useState(mode === "edit");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (mode !== "edit" || !couponId) return;
    fetchAdminCouponById(couponId)
      .then((coupon) => setForm(couponToForm(coupon)))
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Failed to load coupon"),
      )
      .finally(() => setLoading(false));
  }, [couponId, mode]);

  const update = <K extends keyof AdminCouponPayload>(
    key: K,
    value: AdminCouponPayload[K],
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError(null);

    try {
      if (mode === "create") {
        await createAdminCoupon(form);
      } else if (couponId) {
        await updateAdminCoupon(couponId, form);
      }
      router.push("/admin/coupons");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save coupon");
      setSaving(false);
    }
  };

  if (loading) {
    return <p className="text-sm font-light text-zinc-500">Loading coupon…</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Link
          href="/admin/coupons"
          className="text-[11px] font-light uppercase tracking-[0.16em] text-zinc-600 hover:text-zinc-900"
        >
          ← All coupons
        </Link>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Coupon code" hint="Customers enter this at checkout">
          <input
            className={inputClass}
            value={form.code}
            onChange={(e) => update("code", e.target.value.toUpperCase())}
            required
          />
        </Field>
        <Field label="Status">
          <select
            className={inputClass}
            value={form.isActive ? "active" : "inactive"}
            onChange={(e) => update("isActive", e.target.value === "active")}
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </Field>
        <Field label="Discount type">
          <select
            className={inputClass}
            value={form.type}
            onChange={(e) =>
              update("type", e.target.value as AdminCouponPayload["type"])
            }
          >
            <option value="PERCENTAGE">Percentage (%)</option>
            <option value="FIXED_AMOUNT">Fixed amount (₹)</option>
          </select>
        </Field>
        <Field
          label={form.type === "PERCENTAGE" ? "Discount percent" : "Discount amount (₹)"}
        >
          <input
            type="number"
            min={form.type === "PERCENTAGE" ? 1 : 1}
            max={form.type === "PERCENTAGE" ? 100 : undefined}
            step={form.type === "PERCENTAGE" ? 1 : 0.01}
            className={inputClass}
            value={form.value}
            onChange={(e) => update("value", Number(e.target.value))}
            required
          />
        </Field>
        <Field label="Minimum order (₹)" hint="Optional">
          <input
            type="number"
            min={0}
            step={0.01}
            className={inputClass}
            value={form.minOrderRupees ?? ""}
            onChange={(e) =>
              update(
                "minOrderRupees",
                e.target.value ? Number(e.target.value) : null,
              )
            }
          />
        </Field>
        {form.type === "PERCENTAGE" ? (
          <Field label="Max discount cap (₹)" hint="Optional">
            <input
              type="number"
              min={0}
              step={0.01}
              className={inputClass}
              value={form.maxDiscountRupees ?? ""}
              onChange={(e) =>
                update(
                  "maxDiscountRupees",
                  e.target.value ? Number(e.target.value) : null,
                )
              }
            />
          </Field>
        ) : null}
        <Field label="Total usage limit" hint="Optional">
          <input
            type="number"
            min={1}
            className={inputClass}
            value={form.usageLimit ?? ""}
            onChange={(e) =>
              update("usageLimit", e.target.value ? Number(e.target.value) : null)
            }
          />
        </Field>
        <Field label="Uses per customer" hint="Optional">
          <input
            type="number"
            min={1}
            className={inputClass}
            value={form.usageLimitPerUser ?? ""}
            onChange={(e) =>
              update(
                "usageLimitPerUser",
                e.target.value ? Number(e.target.value) : null,
              )
            }
          />
        </Field>
        <Field label="Starts at" hint="Optional">
          <input
            type="datetime-local"
            className={inputClass}
            value={toDatetimeLocal(form.startsAt ?? null)}
            onChange={(e) =>
              update("startsAt", e.target.value ? new Date(e.target.value).toISOString() : null)
            }
          />
        </Field>
        <Field label="Ends at" hint="Optional">
          <input
            type="datetime-local"
            className={inputClass}
            value={toDatetimeLocal(form.endsAt ?? null)}
            onChange={(e) =>
              update("endsAt", e.target.value ? new Date(e.target.value).toISOString() : null)
            }
          />
        </Field>
      </div>

      {error ? <p className="text-sm font-light text-red-600">{error}</p> : null}

      <button
        type="submit"
        disabled={saving}
        className="border border-zinc-900 bg-zinc-900 px-8 py-3 text-[11px] font-normal uppercase tracking-[0.22em] text-white transition hover:bg-zinc-800 disabled:opacity-60"
      >
        {saving ? "Saving…" : mode === "create" ? "Create coupon" : "Save changes"}
      </button>
    </form>
  );
}
