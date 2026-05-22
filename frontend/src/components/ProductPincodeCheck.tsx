"use client";

import { FormEvent, useState } from "react";
import { fetchDeliveryEstimate } from "@/lib/deliveryApi";

type ProductPincodeCheckProps = {
  weightKg?: number;
};

export default function ProductPincodeCheck({ weightKg = 0.1 }: ProductPincodeCheckProps) {
  const [pincode, setPincode] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (pincode.length !== 6) {
      setIsError(true);
      setMessage("Please enter a valid 6-digit PIN code.");
      return;
    }

    setLoading(true);
    setMessage(null);
    setIsError(false);

    try {
      const result = await fetchDeliveryEstimate(pincode, weightKg);
      if (!result.available) {
        setIsError(true);
        setMessage(result.message);
        return;
      }

      setMessage(
        `Estimated delivery by ${result.estimatedDelivery}.`,
      );
    } catch (error) {
      setIsError(true);
      setMessage(
        error instanceof Error
          ? error.message
          : "Could not check delivery for this PIN code.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-8">
      <p className="text-[11px] font-normal uppercase tracking-[0.2em] text-zinc-900">
        Check delivery
      </p>
      <form onSubmit={handleSubmit} className="mt-3 flex flex-wrap items-center gap-3">
        <label htmlFor="product-pincode" className="sr-only">
          PIN code
        </label>
        <input
          id="product-pincode"
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          autoComplete="postal-code"
          maxLength={6}
          placeholder="PIN code"
          value={pincode}
          onChange={(ev) => {
            setPincode(ev.target.value.replace(/\D/g, "").slice(0, 6));
            if (message) setMessage(null);
          }}
          className="w-44 border border-zinc-300 px-4 py-3.5 text-sm font-light tracking-widest text-zinc-900 placeholder:tracking-normal placeholder:text-zinc-400 focus:border-zinc-500 focus:outline-none sm:w-48"
        />
        <button
          type="submit"
          disabled={loading}
          className="cursor-pointer shrink-0 border border-zinc-900 bg-zinc-900 px-7 py-3.5 text-[11px] font-normal uppercase tracking-[0.22em] text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Checking…" : "Check"}
        </button>
      </form>
      {message ? (
        <p
          className={`mt-2 text-sm font-light ${
            isError ? "text-red-700" : "text-emerald-800"
          }`}
        >
          {message}
        </p>
      ) : null}
    </div>
  );
}
