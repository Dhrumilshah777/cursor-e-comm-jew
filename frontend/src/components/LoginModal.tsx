"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import OtpVerifyForm from "@/components/auth/OtpVerifyForm";
import PhoneLoginForm from "@/components/auth/PhoneLoginForm";

type LoginModalProps = {
  open: boolean;
  onClose: () => void;
};

type Step = "phone" | "otp";

export default function LoginModal({ open, onClose }: LoginModalProps) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [devHint, setDevHint] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setStep("phone");
      setPhone("");
      setDevHint(null);
      return;
    }

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      role="presentation"
    >
      <button
        type="button"
        className="absolute inset-0 cursor-pointer bg-black/40"
        onClick={onClose}
        aria-label="Close login"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="login-modal-title"
        className="relative z-10 w-full max-w-md bg-white px-6 py-8 shadow-xl sm:px-8 sm:py-10"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 flex h-8 w-8 cursor-pointer items-center justify-center text-lg text-zinc-500 transition hover:text-zinc-900"
          aria-label="Close"
        >
          <i className="fa-solid fa-xmark" aria-hidden="true" />
        </button>

        <p className="text-[10px] font-light uppercase tracking-[0.28em] text-zinc-500">
          Login
        </p>
        <h2
          id="login-modal-title"
          className="mt-2 text-xl font-light uppercase tracking-[0.12em] text-zinc-950 sm:text-2xl"
        >
          {step === "phone" ? "Login with phone" : "Verify OTP"}
        </h2>

        {step === "phone" ? (
          <>
            <p className="mt-2 text-sm font-light text-zinc-600">
              Enter your mobile number to continue.
            </p>
            <div className="mt-8">
              <PhoneLoginForm
                showPageLink
                onSuccess={(normalizedPhone, devOtp) => {
                  setPhone(normalizedPhone);
                  setDevHint(devOtp ? `Dev mode OTP: ${devOtp}` : null);
                  setStep("otp");
                }}
              />
            </div>
          </>
        ) : (
          <>
            {devHint ? (
              <p className="mt-2 text-xs font-light text-amber-800">{devHint}</p>
            ) : null}
            <div className="mt-6">
              <OtpVerifyForm
                phone={phone}
                onSuccess={() => {
                  onClose();
                  router.push("/account");
                }}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
