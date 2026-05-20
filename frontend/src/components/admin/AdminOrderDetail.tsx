"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  ADMIN_ORDER_STATUSES,
  ADMIN_WEBHOOK_ONLY_STATUS_CODES,
  isAdminManualOrderStatus,
} from "@/data/adminOrders";
import {
  fetchAdminOrderById,
  AdminOrderStatusError,
  updateAdminOrderStatus,
  type AdminOrderDetail,
  type ShiprocketLogEntry,
} from "@/lib/adminApi";

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-wrap justify-between gap-2 border-b border-zinc-100 py-3 last:border-0">
      <dt className="text-[10px] font-normal uppercase tracking-[0.16em] text-zinc-500">
        {label}
      </dt>
      <dd className="text-sm font-light text-zinc-900">{value}</dd>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border border-zinc-200 bg-white">
      <h3 className="border-b border-zinc-100 px-5 py-4 text-[11px] font-normal uppercase tracking-[0.2em] text-zinc-900">
        {title}
      </h3>
      <div className="px-5 py-2">{children}</div>
    </section>
  );
}

export default function AdminOrderDetail({ orderId }: { orderId: string }) {
  const [order, setOrder] = useState<AdminOrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusDraft, setStatusDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [shiprocketLog, setShiprocketLog] = useState<ShiprocketLogEntry[] | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchAdminOrderById(orderId);
      setOrder(data);
      setStatusDraft(data.statusCode);
      if (data.shiprocketFulfillmentLog?.length) {
        setShiprocketLog(data.shiprocketFulfillmentLog);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load order");
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    load();
  }, [load]);

  const handleStatusSave = async () => {
    if (!order || statusDraft === order.statusCode) return;

    if (!isAdminManualOrderStatus(statusDraft)) {
      setSaveMessage(
        "Delivered and Cancelled can only be set via Shiprocket — not from this dropdown.",
      );
      return;
    }

    setSaving(true);
    setSaveMessage(null);
    setShiprocketLog(null);
    try {
      const { order: updated, shiprocketLog: log } = await updateAdminOrderStatus(
        orderId,
        statusDraft,
      );
      setOrder(updated);
      setStatusDraft(updated.statusCode);
      if (log?.length) {
        setShiprocketLog(log);
      } else if (updated.shiprocketFulfillmentLog?.length) {
        setShiprocketLog(updated.shiprocketFulfillmentLog);
      }
      if (statusDraft === "SHIPPED" && updated.shipping.trackingNumber) {
        setSaveMessage(
          `Order marked shipped. AWB ${updated.shipping.trackingNumber} (${updated.shipping.courier}).`,
        );
      } else {
        setSaveMessage("Order status updated.");
      }
    } catch (err) {
      if (err instanceof AdminOrderStatusError) {
        if (err.order) {
          setOrder(err.order);
          setStatusDraft(err.order.statusCode);
        }
        if (err.shiprocketLog?.length) setShiprocketLog(err.shiprocketLog);
        setSaveMessage(`Shiprocket failed — status not changed: ${err.message}`);
      } else {
        setSaveMessage(err instanceof Error ? err.message : "Failed to update status");
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <p className="text-sm font-light text-zinc-500">Loading order…</p>;
  }

  if (error || !order) {
    return (
      <div>
        <p className="text-sm font-light text-red-700">{error ?? "Order not found."}</p>
        <Link
          href="/admin/orders"
          className="mt-4 inline-block text-[11px] uppercase tracking-[0.16em] text-zinc-600 underline"
        >
          ← Back to orders
        </Link>
      </div>
    );
  }

  const address = order.deliveryAddress;
  const addressLines = [
    address.line1,
    address.line2,
    `${address.city}, ${address.state} ${address.pincode}`,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Link
          href="/admin/orders"
          className="text-[11px] font-light uppercase tracking-[0.16em] text-zinc-600 hover:text-zinc-900"
        >
          ← All orders
        </Link>
        <p className="text-[10px] font-normal uppercase tracking-[0.2em] text-zinc-500">
          {order.orderNumber}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Section title="Order information">
          <dl>
            <InfoRow label="Order ID" value={order.orderNumber} />
            <InfoRow label="Order date" value={order.placedOn} />
            <InfoRow label="Payment status" value={order.payment.status} />
            <InfoRow label="Order status" value={order.status} />
            <InfoRow label="Total amount" value={order.total} />
          </dl>
        </Section>

        <Section title="Customer information">
          <dl>
            <InfoRow label="Name" value={order.customer.name ?? "—"} />
            <InfoRow label="Phone" value={order.customer.phone} />
            <InfoRow label="Address" value={addressLines} />
          </dl>
        </Section>
      </div>

      <Section title="Update order status">
        <div className="flex flex-wrap items-end gap-4 py-4">
          <label className="block min-w-[220px] flex-1">
            <span className="text-[10px] font-normal uppercase tracking-[0.16em] text-zinc-500">
              Status
            </span>
            <select
              value={statusDraft}
              onChange={(e) => setStatusDraft(e.target.value)}
              className="mt-1 w-full border border-zinc-300 bg-white px-3 py-2.5 text-sm font-light text-zinc-900 focus:outline-none"
            >
              {ADMIN_ORDER_STATUSES.map((option) => {
                const webhookOnly = ADMIN_WEBHOOK_ONLY_STATUS_CODES.has(option.code);
                return (
                  <option
                    key={option.code}
                    value={option.code}
                    disabled={webhookOnly}
                  >
                    {option.label}
                    {webhookOnly ? " (Shiprocket)" : ""}
                  </option>
                );
              })}
            </select>
            <p className="mt-2 text-[10px] font-light leading-relaxed text-zinc-500">
              Delivered and Cancelled are updated automatically from Shiprocket webhooks.
            </p>
          </label>
          <button
            type="button"
            onClick={handleStatusSave}
            disabled={saving || statusDraft === order.statusCode}
            className="cursor-pointer border border-zinc-900 bg-zinc-900 px-5 py-2.5 text-[10px] font-light uppercase tracking-[0.16em] text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save status"}
          </button>
        </div>
        {saveMessage ? (
          <p
            className={`pb-4 text-sm font-light ${
              saveMessage.includes("Shiprocket failed") ||
                saveMessage.includes("status not changed")
                ? "text-red-700"
                : "text-zinc-600"
            }`}
          >
            {saveMessage}
          </p>
        ) : null}
        {shiprocketLog && shiprocketLog.length > 0 ? (
          <div className="border-t border-zinc-100 pb-4">
            <p className="py-3 text-[10px] font-normal uppercase tracking-[0.16em] text-zinc-500">
              Shiprocket API log
            </p>
            <ul className="space-y-3">
              {shiprocketLog.map((entry) => (
                <li
                  key={entry.step}
                  className={`border px-3 py-3 text-xs font-light ${
                    entry.ok
                      ? "border-emerald-200 bg-emerald-50/50 text-zinc-800"
                      : "border-red-200 bg-red-50/50 text-red-900"
                  }`}
                >
                  <p className="font-normal uppercase tracking-[0.12em]">
                    {entry.step}{" "}
                    <span className={entry.ok ? "text-emerald-700" : "text-red-700"}>
                      {entry.ok ? "OK" : "FAILED"}
                    </span>
                  </p>
                  <p className="mt-1 text-zinc-700">{entry.summary}</p>
                  {entry.error ? (
                    <p className="mt-1 text-red-700">{entry.error}</p>
                  ) : null}
                  {entry.response !== undefined ? (
                    <pre className="mt-2 max-h-48 overflow-auto whitespace-pre-wrap break-all rounded bg-white/80 p-2 text-[10px] text-zinc-600">
                      {JSON.stringify(entry.response, null, 2)}
                    </pre>
                  ) : null}
                </li>
              ))}
            </ul>
            <p className="mt-2 text-[10px] font-light text-zinc-500">
              Same details are printed in the backend terminal.
            </p>
          </div>
        ) : null}
        {order.statusHistory.length > 0 ? (
          <ul className="border-t border-zinc-100 py-4 text-sm font-light text-zinc-600">
            {order.statusHistory.map((event) => (
              <li key={event.id} className="flex flex-wrap justify-between gap-2 py-2">
                <span>
                  {event.label}{" "}
                  <span className="text-zinc-400">({event.statusLabel})</span>
                </span>
                <span className="text-zinc-500">{event.date}</span>
              </li>
            ))}
          </ul>
        ) : null}
      </Section>

      <Section title="Ordered products">
        <ul className="divide-y divide-zinc-100 py-2">
          {order.items.map((item) => (
            <li key={`${order.id}-${item.slug}`} className="flex gap-4 py-4">
              <div className="relative h-20 w-20 shrink-0 overflow-hidden bg-zinc-100">
                <Image
                  src={item.image}
                  alt={item.alt}
                  fill
                  className="object-cover"
                  sizes="80px"
                />
              </div>
              <div className="min-w-0 flex-1 text-sm font-light">
                <p className="font-normal uppercase tracking-[0.1em] text-zinc-900">
                  {item.name}
                </p>
                <p className="mt-1 text-zinc-600">
                  {item.metal} · {item.purity}
                  {item.size ? ` · Size ${item.size}` : ""}
                </p>
                <p className="mt-1 text-zinc-500">
                  Qty {item.quantity} · Weight {item.weight}
                </p>
                <p className="mt-2 text-zinc-900">
                  {item.unitPrice} each · Line total {item.lineTotal}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Payment details">
        <dl>
          <InfoRow label="Payment method" value={order.payment.method} />
          <InfoRow label="Razorpay payment ID" value={order.payment.razorpayPaymentId} />
          <InfoRow label="Paid / unpaid" value={order.payment.paid ? "Paid" : "Unpaid"} />
          <InfoRow label="Transaction status" value={order.payment.status} />
        </dl>
      </Section>

      <Section title="Shipment & warehouse pickup">
        <dl>
          <InfoRow label="Courier" value={order.shipping.courier} />
          <InfoRow label="AWB / tracking" value={order.shipping.trackingNumber} />
          <InfoRow label="Expected delivery" value={order.shipping.expectedDelivery} />
          <InfoRow
            label="Warehouse pickup date"
            value={order.warehousePickup.date}
          />
          <InfoRow
            label="Warehouse pickup time"
            value={order.warehousePickup.time}
          />
          {order.shiprocketOrderId ? (
            <InfoRow
              label="Shiprocket order ID"
              value={String(order.shiprocketOrderId)}
            />
          ) : null}
          {order.shiprocketShipmentId ? (
            <InfoRow
              label="Shiprocket shipment ID"
              value={String(order.shiprocketShipmentId)}
            />
          ) : null}
        </dl>
        {(order.shiprocketFulfillmentLog?.length ?? 0) > 0 ||
        (shiprocketLog && shiprocketLog.length > 0) ? (
          <div className="border-t border-zinc-100 pb-4">
            <p className="py-3 text-[10px] font-normal uppercase tracking-[0.16em] text-zinc-500">
              Shiprocket pickup log (saved)
            </p>
            <ul className="space-y-3">
              {(shiprocketLog ?? order.shiprocketFulfillmentLog ?? []).map((entry) => (
                <li
                  key={entry.step}
                  className={`border px-3 py-3 text-xs font-light ${
                    entry.ok
                      ? "border-emerald-200 bg-emerald-50/50 text-zinc-800"
                      : "border-red-200 bg-red-50/50 text-red-900"
                  }`}
                >
                  <p className="font-normal uppercase tracking-[0.12em]">
                    {entry.step}{" "}
                    <span className={entry.ok ? "text-emerald-700" : "text-red-700"}>
                      {entry.ok ? "OK" : "FAILED"}
                    </span>
                  </p>
                  <p className="mt-1 text-zinc-700">{entry.summary}</p>
                  {entry.error ? (
                    <p className="mt-1 text-red-700">{entry.error}</p>
                  ) : null}
                  {entry.response !== undefined ? (
                    <pre className="mt-2 max-h-48 overflow-auto whitespace-pre-wrap break-all rounded bg-white/80 p-2 text-[10px] text-zinc-600">
                      {JSON.stringify(entry.response, null, 2)}
                    </pre>
                  ) : null}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
        <p className="border-t border-zinc-100 py-3 text-xs font-light text-zinc-500">
          Shiprocket runs when you set status to{" "}
          <span className="text-zinc-700">Shipped</span>. Pickup date and time come
          from the schedule pickup API and stay on this order after refresh.
        </p>
      </Section>
    </div>
  );
}
