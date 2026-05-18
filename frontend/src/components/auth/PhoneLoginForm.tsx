"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useRef, useState } from "react";
import { sendLoginOtp } from "@/lib/customerAuth";

type PhoneLoginFormProps = {
  redirectTo?: string;
  onSuccess?: (phone: string, devOtp?: string) => void;
  showPageLink?: boolean;
};

export default function PhoneLoginForm({
  redirectTo = "/account",
  onSuccess,
  showPageLink = false,
}: PhoneLoginFormProps) {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [devHint, setDevHint] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submitLock = useRef(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (submitLock.current || isSubmitting) return;

    const digits = phone.replace(/\D/g, "").slice(-10);

    if (digits.length !== 10) {
      setMessage("Please enter a valid 10-digit mobile number.");
      return;
    }

    setMessage(null);
    setDevHint(null);
    submitLock.current = true;
    setIsSubmitting(true);

    try {
      const result = await sendLoginOtp(digits);
      if (result.devOtp) {
        setDevHint(`Dev mode OTP: ${result.devOtp}`);
      }

      if (onSuccess) {
        onSuccess(result.phone ?? `+91${digits}`, result.devOtp);
        return;
      }

      const verifyUrl = new URL("/login/verify", window.location.origin);
      verifyUrl.searchParams.set("redirect", redirectTo);
      router.push(verifyUrl.pathname + verifyUrl.search);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Failed to send OTP");
    } finally {
      submitLock.current = false;
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <label
        htmlFor="login-phone"
        className="text-[10px] font-normal uppercase tracking-[0.2em] text-zinc-500"
      >
        Phone number
      </label>
      <div className="mt-2 flex border border-zinc-300">
        <span className="flex items-center border-r border-zinc-300 bg-zinc-50 px-3 text-sm font-light text-zinc-700">
          +91
        </span>
        <input
          id="login-phone"
          type="tel"
          inputMode="numeric"
          autoComplete="tel"
          placeholder="10-digit mobile"
          value={phone}
          onChange={(e) => {
            setPhone(e.target.value.replace(/\D/g, "").slice(0, 10));
            if (message) setMessage(null);
          }}
          className="min-w-0 flex-1 px-3 py-3 text-sm font-light tracking-wide text-zinc-900 placeholder:text-zinc-400 focus:outline-none"
        />
      </div>

      {message ? <p className="mt-2 text-sm font-light text-red-600">{message}</p> : null}
      {devHint ? (
        <p className="mt-2 text-xs font-light text-amber-800">{devHint}</p>
      ) : null}

      <button
        type="submit"
        disabled={isSubmitting}
        className="mt-6 w-full cursor-pointer bg-zinc-900 px-6 py-3.5 text-[11px] font-normal uppercase tracking-[0.22em] text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? "Sending code…" : "Continue"}
      </button>

      {showPageLink ? (
        <p className="mt-4 text-center text-[11px] font-light text-zinc-500">
          Prefer full page?{" "}
          <Link href="/login" className="text-zinc-800 underline-offset-2 hover:underline">
            Open login page
          </Link>
        </p>
      ) : null}
    </form>
  );
}
