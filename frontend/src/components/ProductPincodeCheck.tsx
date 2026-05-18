"use client";

import { FormEvent, useState } from "react";

export default function ProductPincodeCheck() {
  const [pincode, setPincode] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (pincode.length !== 6) {
      setMessage("Please enter a valid 6-digit PIN code.");
      return;
    }
    setMessage("Delivery available to this PIN code.");
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
          className="cursor-pointer shrink-0 border border-zinc-900 bg-zinc-900 px-7 py-3.5 text-[11px] font-normal uppercase tracking-[0.22em] text-white transition hover:bg-zinc-800"
        >
          Check
        </button>
      </form>
      {message ? (
        <p className="mt-2 text-sm font-light text-zinc-600">{message}</p>
      ) : null}
    </div>
  );
}
