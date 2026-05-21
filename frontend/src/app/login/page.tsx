"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";
import AuthPageShell from "@/components/auth/AuthPageShell";
import PhoneLoginForm from "@/components/auth/PhoneLoginForm";
import { fetchCustomerMe } from "@/lib/customerAuth";

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") ?? "/account";

  useEffect(() => {
    fetchCustomerMe()
      .then((user) => {
        if (user) router.replace(redirectTo);
      })
      .catch(() => undefined);
  }, [redirectTo, router]);

  return (
    <AuthPageShell
      title="Login"
      subtitle="Enter your mobile number. We will send a one-time code to verify you."
    >
      <PhoneLoginForm redirectTo={redirectTo} />
    </AuthPageShell>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[40vh] items-center justify-center bg-[#faf8f5] text-sm font-light text-zinc-500">
          Loading…
        </div>
      }
    >
      <LoginPageContent />
    </Suspense>
  );
}
