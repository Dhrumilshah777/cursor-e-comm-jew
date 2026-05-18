"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import AdminShell from "@/components/admin/AdminShell";

export default function AdminLayoutClient({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isLogin = pathname === "/admin/login";

  if (isLogin) {
    return (
      <div className="min-h-[60vh] bg-[#faf8f5] py-12">
        {children}
      </div>
    );
  }

  return <AdminShell>{children}</AdminShell>;
}
