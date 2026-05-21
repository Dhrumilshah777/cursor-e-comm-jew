"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Jost } from "next/font/google";
import { useEffect, useState, type ReactNode } from "react";
import {
  adminLogout,
  fetchAdminMe,
  getAdminToken,
  type AdminUser,
} from "@/lib/adminApi";

const jost = Jost({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  display: "swap",
});

const navItems = [
  { href: "/admin", label: "Dashboard", exact: true },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/returns", label: "Returns" },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/coupons", label: "Coupons" },
  { href: "/admin/homepage", label: "Homepage" },
  { href: "/admin/customers", label: "Customers" },
];

export default function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const token = getAdminToken();
    if (!token) {
      router.replace("/admin/login");
      return;
    }

    fetchAdminMe()
      .then(setAdmin)
      .catch(() => router.replace("/admin/login"))
      .finally(() => setReady(true));
  }, [router]);

  const handleLogout = async () => {
    await adminLogout();
    router.replace("/admin/login");
  };

  if (!ready) {
    return (
      <div className={`${jost.className} flex min-h-[50vh] items-center justify-center bg-[#faf8f5]`}>
        <p className="text-sm font-light text-zinc-500">Loading admin…</p>
      </div>
    );
  }

  return (
    <div className={`${jost.className} bg-[#faf8f5]`}>
      <div className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <div>
            <p className="text-[10px] font-normal uppercase tracking-[0.28em] text-zinc-500">
              Wholesale Jewelry
            </p>
            <h1 className="text-lg font-light uppercase tracking-[0.14em] text-zinc-950">
              Admin
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <p className="text-xs font-light text-zinc-600">{admin?.email}</p>
            <Link
              href="/"
              className="text-[10px] font-light uppercase tracking-[0.16em] text-zinc-600 hover:text-zinc-900"
            >
              View store
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="cursor-pointer border border-zinc-300 px-3 py-2 text-[10px] font-light uppercase tracking-[0.16em] text-zinc-800 hover:border-zinc-500"
            >
              Log out
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-8 lg:flex-row lg:gap-12">
          <aside className="lg:w-52 lg:shrink-0">
            <nav className="flex flex-wrap gap-2 lg:flex-col lg:gap-1">
              {navItems.map((item) => {
                const active = item.exact
                  ? pathname === item.href
                  : pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`px-4 py-2.5 text-[11px] font-light uppercase tracking-[0.18em] transition ${
                      active
                        ? "bg-zinc-900 text-white"
                        : "border border-zinc-200 bg-white text-zinc-700 hover:border-zinc-400"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </aside>
          <main className="min-w-0 flex-1">{children}</main>
        </div>
      </div>
    </div>
  );
}
