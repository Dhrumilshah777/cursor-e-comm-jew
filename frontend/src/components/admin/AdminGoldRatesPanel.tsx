"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  fetchAdminGoldRates,
  updateAdminGoldRates,
  type AdminGoldRates,
} from "@/lib/adminApi";
import {
  calculatePriceBreakup,
  type GoldPurity,
} from "@/lib/pricing";

const inputClass =
  "w-full max-w-xs border border-zinc-300 bg-white px-3 py-2.5 text-sm font-light text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-400";

function formatInr(value: number): string {
  return `₹${value.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatRatePerGram(value: number): string {
  return `${formatInr(value)}/g`;
}

function RateRow({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-zinc-100 py-3">
      <div>
        <p className="text-sm font-light text-zinc-900">{label}</p>
        {note ? <p className="mt-0.5 text-[11px] font-light text-zinc-500">{note}</p> : null}
      </div>
      <p className="text-sm font-normal text-zinc-900">{value}</p>
    </div>
  );
}

export default function AdminGoldRatesPanel() {
  const [rates, setRates] = useState<AdminGoldRates | null>(null);
  const [input24kt, setInput24kt] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAdminGoldRates()
      .then((data) => {
        setRates(data);
        setInput24kt(String(data.rate24ktPerGram));
      })
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Failed to load gold rates"),
      )
      .finally(() => setLoading(false));
  }, []);

  const previewRates = useMemo(() => {
    const parsed = Number.parseFloat(input24kt.replace(/,/g, ""));
    if (!Number.isFinite(parsed) || parsed <= 0 || !rates) return rates;
    const factor22 = rates.purityFactors["22kt"];
    const factor18 = rates.purityFactors["18kt"];
    const factor14 = rates.purityFactors["14kt"];
    const rate24 = parsed;
    return {
      ...rates,
      rate24ktPerGram: rate24,
      derivedRates: {
        "22kt": rate24 * factor22,
        "18kt": rate24 * factor18,
        "14kt": rate24 * factor14,
      },
    };
  }, [input24kt, rates]);

  const exampleBreakup = useMemo(() => {
    if (!previewRates) return null;
    const purity: GoldPurity = "22kt";
    const weightGrams = 10;
    const makingCharge = { type: "percentage" as const, value: 7 };
    return calculatePriceBreakup({
      netWeightGrams: weightGrams,
      purity,
      makingCharge,
      gstPercent: 3,
      pricePerGram: previewRates.derivedRates[purity],
    });
  }, [previewRates]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setMessage(null);

    const rate24ktPerGram = Number.parseFloat(input24kt.replace(/,/g, ""));
    if (!Number.isFinite(rate24ktPerGram) || rate24ktPerGram <= 0) {
      setError("Enter a valid 24KT rate per gram.");
      setSaving(false);
      return;
    }

    try {
      const result = await updateAdminGoldRates(rate24ktPerGram);
      setRates(result.rates);
      setInput24kt(String(result.rates.rate24ktPerGram));
      setMessage(
        `Gold rates saved. ${result.productsUpdated} product price${result.productsUpdated === 1 ? "" : "s"} updated.`,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save gold rates");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <p className="text-sm font-light text-zinc-500">Loading gold rates…</p>;
  }

  if (!previewRates) {
    return <p className="text-sm font-light text-red-700">{error ?? "Unable to load gold rates."}</p>;
  }

  return (
    <div className="space-y-8">
      <form onSubmit={handleSubmit} className="border border-zinc-200 bg-white p-5 sm:p-8">
        <h3 className="text-sm font-normal uppercase tracking-[0.18em] text-zinc-900">
          Set 24KT base rate
        </h3>
        <p className="mt-2 max-w-2xl text-sm font-light text-zinc-600">
          Enter today&apos;s 24KT gold rate per gram. The store derives 22KT, 18KT, and 14KT
          automatically and recalculates every product price.
        </p>

        <div className="mt-6 flex flex-wrap items-end gap-4">
          <label className="block">
            <span className="text-[10px] font-normal uppercase tracking-[0.16em] text-zinc-500">
              24KT rate (₹ / gram)
            </span>
            <div className="mt-1 flex items-center gap-2">
              <span className="text-sm text-zinc-500">₹</span>
              <input
                type="number"
                min={0.01}
                step={0.01}
                required
                value={input24kt}
                onChange={(e) => setInput24kt(e.target.value)}
                className={inputClass}
              />
              <span className="text-sm font-light text-zinc-500">/ g</span>
            </div>
          </label>
          <button
            type="submit"
            disabled={saving}
            className="cursor-pointer bg-zinc-900 px-5 py-2.5 text-[10px] font-normal uppercase tracking-[0.18em] text-white transition hover:bg-zinc-800 disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save & update all prices"}
          </button>
        </div>

        {error ? <p className="mt-4 text-sm font-light text-red-700">{error}</p> : null}
        {message ? <p className="mt-4 text-sm font-light text-emerald-800">{message}</p> : null}
      </form>

      <section className="border border-zinc-200 bg-white p-5 sm:p-8">
        <h3 className="text-sm font-normal uppercase tracking-[0.18em] text-zinc-900">
          Derived rates
        </h3>
        <div className="mt-4 max-w-xl">
          <RateRow
            label="22KT"
            value={formatRatePerGram(previewRates.derivedRates["22kt"])}
            note={`24KT × ${previewRates.purityFactors["22kt"]}`}
          />
          <RateRow
            label="18KT"
            value={formatRatePerGram(previewRates.derivedRates["18kt"])}
            note={`24KT × ${previewRates.purityFactors["18kt"]}`}
          />
          <RateRow
            label="14KT"
            value={formatRatePerGram(previewRates.derivedRates["14kt"])}
            note={`24KT × ${(previewRates.purityFactors["14kt"]).toFixed(4)} (14÷24)`}
          />
        </div>
      </section>

      {exampleBreakup ? (
        <section className="border border-zinc-200 bg-zinc-50/60 p-5 sm:p-8">
          <h3 className="text-sm font-normal uppercase tracking-[0.18em] text-zinc-900">
            Example (22KT · 10g · 7% making · 3% GST)
          </h3>
          <dl className="mt-4 max-w-xl space-y-2 text-sm font-light text-zinc-700">
            <div className="flex justify-between gap-4">
              <dt>22KT rate</dt>
              <dd>{formatRatePerGram(exampleBreakup.pricePerGram)}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt>Gold value</dt>
              <dd>{formatInr(exampleBreakup.goldValue)}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt>Making charges (7%)</dt>
              <dd>{formatInr(exampleBreakup.makingCharge)}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt>Subtotal</dt>
              <dd>{formatInr(exampleBreakup.subtotal)}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt>GST (3%)</dt>
              <dd>{formatInr(exampleBreakup.gst)}</dd>
            </div>
            <div className="flex justify-between gap-4 border-t border-zinc-200 pt-3 text-zinc-900">
              <dt className="font-normal">Final price</dt>
              <dd className="font-normal">{formatInr(exampleBreakup.total)}</dd>
            </div>
          </dl>
        </section>
      ) : null}
    </div>
  );
}
