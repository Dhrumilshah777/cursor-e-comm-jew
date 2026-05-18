"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import AuthPageShell from "@/components/auth/AuthPageShell";
import OtpVerifyForm from "@/components/auth/OtpVerifyForm";
import { getPendingPhone } from "@/lib/customerAuth";

function VerifyPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") ?? "/account";
  const [phone, setPhone] = useState<string | null>(null);

  useEffect(() => {
    const pending = getPendingPhone();
    if (!pending) {
      router.replace(`/login?redirect=${encodeURIComponent(redirectTo)}`);
      return;
    }
    setPhone(pending);
  }, [redirectTo, router]);

  if (!phone) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center bg-[#faf8f5] text-sm font-light text-zinc-500">
        Loading…
      </div>
    );
  }

  return (
    <AuthPageShell
      title="Verify OTP"
      subtitle="Enter the 6-digit code we sent to your mobile number."
    >
      <OtpVerifyForm phone={phone} redirectTo={redirectTo} />
    </AuthPageShell>
  );
}

export default function VerifyPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[40vh] items-center justify-center bg-[#faf8f5] text-sm font-light text-zinc-500">
          Loading…
        </div>
      }
    >
      <VerifyPageContent />
    </Suspense>
  );
}
