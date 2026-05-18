"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useEffect, useState } from "react";
import {
  formatPhoneDisplay,
  sendLoginOtp,
  verifyLoginOtp,
} from "@/lib/customerAuth";

type OtpVerifyFormProps = {
  phone: string;
  redirectTo?: string;
  onSuccess?: () => void;
};

export default function OtpVerifyForm({
  phone,
  redirectTo = "/account",
  onSuccess,
}: OtpVerifyFormProps) {
  const router = useRouter();
  const [otp, setOtp] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resendMessage, setResendMessage] = useState<string | null>(null);
  const [isResending, setIsResending] = useState(false);

  const displayDigits = formatPhoneDisplay(phone);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = window.setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [resendCooldown]);

  const phoneDigits = phone.replace(/\D/g, "").slice(-10);

  const handleResend = async () => {
    if (resendCooldown > 0 || isResending) return;

    setResendMessage(null);
    setIsResending(true);

    try {
      await sendLoginOtp(phoneDigits, { resend: true });
      setOtp("");
      setMessage(null);
      setResendMessage("New code sent. Enter the latest 6-digit code from SMS.");
      setResendCooldown(60);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to resend code";
      const match = msg.match(/wait (\d+) seconds/i);
      if (match) {
        setResendCooldown(Number(match[1]));
      }
      setResendMessage(msg);
    } finally {
      setIsResending(false);
    }
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    if (otp.length !== 6) {
      setMessage("Please enter the 6-digit OTP.");
      return;
    }

    setMessage(null);
    setIsSubmitting(true);

    try {
      await verifyLoginOtp(phone, otp);
      if (onSuccess) {
        onSuccess();
        return;
      }
      router.replace(redirectTo);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Verification failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <p className="text-sm font-light text-zinc-600">
        Code sent to <span className="text-zinc-900">+91 {displayDigits}</span>
      </p>

      <label
        htmlFor="login-otp"
        className="mt-6 block text-[10px] font-normal uppercase tracking-[0.2em] text-zinc-500"
      >
        OTP
      </label>
      <input
        id="login-otp"
        type="text"
        inputMode="numeric"
        autoComplete="one-time-code"
        maxLength={6}
        placeholder="6-digit code"
        value={otp}
        onChange={(e) => {
          setOtp(e.target.value.replace(/\D/g, "").slice(0, 6));
          if (message) setMessage(null);
        }}
        className="mt-2 w-full border border-zinc-300 px-3 py-3 text-center text-sm font-light tracking-[0.35em] text-zinc-900 placeholder:tracking-normal placeholder:text-zinc-400 focus:outline-none"
      />

      {message ? <p className="mt-2 text-sm font-light text-red-600">{message}</p> : null}

      <button
        type="submit"
        disabled={isSubmitting}
        className="mt-6 w-full cursor-pointer bg-zinc-900 px-6 py-3.5 text-[11px] font-normal uppercase tracking-[0.22em] text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? "Verifying…" : "Login"}
      </button>

      <div className="mt-4 flex flex-col gap-2 text-center">
        <Link
          href="/login"
          className="text-[11px] font-light uppercase tracking-[0.18em] text-zinc-600 hover:text-zinc-900"
        >
          Change number
        </Link>
        {resendMessage ? (
          <p
            className={`text-[11px] font-light ${
              resendMessage.includes("sent") || resendMessage.includes("latest")
                ? "text-emerald-700"
                : "text-red-600"
            }`}
          >
            {resendMessage}
          </p>
        ) : null}
        {resendCooldown > 0 ? (
          <p className="text-[11px] font-light text-zinc-400">
            Resend available in {resendCooldown}s
          </p>
        ) : (
          <button
            type="button"
            onClick={handleResend}
            disabled={isResending}
            className="cursor-pointer text-[11px] font-light uppercase tracking-[0.18em] text-zinc-600 hover:text-zinc-900 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isResending ? "Sending…" : "Resend code"}
          </button>
        )}
      </div>
    </form>
  );
}
