"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { CancellationInfo, CancellationReason } from "@/lib/cancellation";
import {
  CANCELLATION_REASONS,
  MAX_CANCELLATION_NOTE_LENGTH,
} from "@/lib/cancellation";
import { cancelOrder } from "@/lib/ordersApi";

type CancelOrderSectionProps = {
  orderId: string;
  orderNumber: string;
  cancellation: CancellationInfo;
  onCancelled?: (order: import("@/data/accountOrders").AccountOrder) => void;
};

export default function CancelOrderSection({
  orderId,
  orderNumber,
  cancellation,
  onCancelled,
}: CancelOrderSectionProps) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [reason, setReason] = useState<CancellationReason | "">("");
  const [note, setNote] = useState("");
  const [policyConfirmed, setPolicyConfirmed] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!cancellation.cancellable) {
    return null;
  }

  const canSubmit = Boolean(reason) && policyConfirmed && !cancelling;

  const resetForm = () => {
    setConfirming(false);
    setReason("");
    setNote("");
    setPolicyConfirmed(false);
    setError(null);
  };

  const handleCancel = async () => {
    if (!reason || !policyConfirmed) return;

    setCancelling(true);
    setError(null);
    try {
      const result = await cancelOrder(orderId, {
        reason,
        note: note.trim() || undefined,
        policyConfirmed: true,
      });
      onCancelled?.(result.order);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to cancel order");
    } finally {
      setCancelling(false);
    }
  };

  return (
    <section className="border border-red-100 bg-red-50/30 px-5 py-6 sm:px-8 sm:py-8">
      <h3 className="text-[11px] font-normal uppercase tracking-[0.22em] text-zinc-900 sm:text-xs">
        Cancel order
      </h3>
      <p className="mt-3 text-sm font-light text-zinc-700">
        {cancellation.withinFullRefundWindow ? (
          <>
            Cancel within 24 hours of placing the order for a refund of{" "}
            <strong className="font-normal text-zinc-900">{cancellation.refundAmount}</strong>{" "}
            (1% payment gateway fee deducted).
          </>
        ) : (
          <>
            Refund on cancellation:{" "}
            <strong className="font-normal text-zinc-900">{cancellation.refundAmount}</strong>{" "}
            after ₹1,000 processing charge and 1% payment gateway fee.
          </>
        )}
      </p>
      {!confirming ? (
        <button
          type="button"
          onClick={() => setConfirming(true)}
          className="mt-5 cursor-pointer border border-red-300 bg-white px-5 py-2.5 text-[10px] font-light uppercase tracking-[0.16em] text-red-800 transition hover:border-red-500"
        >
          Cancel order
        </button>
      ) : (
        <div className="mt-6 space-y-5">
          <label className="block">
            <span className="text-[10px] uppercase tracking-[0.16em] text-zinc-600">
              Reason for cancellation <span className="text-red-700">*</span>
            </span>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value as CancellationReason | "")}
              className="mt-2 w-full border border-zinc-200 bg-white px-4 py-3 text-sm font-light text-zinc-900 focus:border-zinc-500 focus:outline-none"
            >
              <option value="">Select a reason</option>
              {CANCELLATION_REASONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-[10px] uppercase tracking-[0.16em] text-zinc-600">
              Additional note
            </span>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value.slice(0, MAX_CANCELLATION_NOTE_LENGTH))}
              rows={4}
              placeholder="Tell us more..."
              className="mt-2 w-full resize-y border border-zinc-200 bg-white px-4 py-3 text-sm font-light text-zinc-800 placeholder:text-zinc-400 focus:border-zinc-500 focus:outline-none"
            />
          </label>

          <label className="flex cursor-pointer gap-3 border border-zinc-200 bg-white p-4">
            <input
              type="checkbox"
              checked={policyConfirmed}
              onChange={(e) => setPolicyConfirmed(e.target.checked)}
              className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer accent-zinc-900"
            />
            <span className="text-sm font-light leading-relaxed text-zinc-700">
              I understand that cancellation charges may apply as per the cancellation policy.
            </span>
          </label>

          <p className="text-sm font-light text-zinc-800">
            Cancel order <strong className="font-normal">{orderNumber}</strong> and refund{" "}
            {cancellation.refundAmount}?
          </p>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleCancel}
              disabled={!canSubmit}
              className="cursor-pointer border border-red-800 bg-red-800 px-5 py-2.5 text-[10px] font-light uppercase tracking-[0.16em] text-white transition hover:bg-red-900 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {cancelling ? "Cancelling…" : "Confirm cancellation"}
            </button>
            <button
              type="button"
              onClick={resetForm}
              disabled={cancelling}
              className="cursor-pointer border border-zinc-300 bg-white px-5 py-2.5 text-[10px] font-light uppercase tracking-[0.16em] text-zinc-800"
            >
              Keep order
            </button>
          </div>
        </div>
      )}
      {error ? <p className="mt-3 text-sm font-light text-red-700">{error}</p> : null}
    </section>
  );
}
