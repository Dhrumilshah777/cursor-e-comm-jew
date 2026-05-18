"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { fetchCustomerMe, getCustomerToken } from "@/lib/customerAuth";

export default function AccountAuthGuard({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const token = getCustomerToken();
    if (!token) {
      const redirect = encodeURIComponent(pathname);
      router.replace(`/login?redirect=${redirect}`);
      return;
    }

    fetchCustomerMe()
      .then((user) => {
        if (!user) {
          const redirect = encodeURIComponent(pathname);
          router.replace(`/login?redirect=${redirect}`);
          return;
        }
        setReady(true);
      })
      .catch(() => {
        const redirect = encodeURIComponent(pathname);
        router.replace(`/login?redirect=${redirect}`);
      });
  }, [pathname, router]);

  if (!ready) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-sm font-light text-zinc-500">
        Checking your session…
      </div>
    );
  }

  return <>{children}</>;
}
