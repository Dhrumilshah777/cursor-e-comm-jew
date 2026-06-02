"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  accountNavGroups,
  accountSectionPath,
  defaultAccountSectionId,
  getActiveSectionIdFromPathname,
} from "@/data/accountSections";
import { customerLogout } from "@/lib/customerAuth";

export default function AccountNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);
  const activeId = getActiveSectionIdFromPathname(pathname);

  const navLinkClass = (id: string) =>
    `block w-full cursor-pointer px-3 py-2.5 text-left text-[11px] font-light uppercase tracking-[0.14em] transition sm:text-xs sm:tracking-[0.16em] ${
      activeId === id
        ? "bg-zinc-100 text-zinc-900"
        : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900"
    }`;

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await customerLogout();
      router.replace("/login");
    } catch {
      setLoggingOut(false);
    }
  };

  return (
    <nav className="space-y-8" aria-label="Account sections">
      <div>
        <Link
          href="/account"
          className={navLinkClass(defaultAccountSectionId)}
          scroll
        >
          Overview
        </Link>
        <Link
          href="/account/my-orders"
          className={`${navLinkClass("my-orders")} mt-0.5`}
          scroll
        >
          My Orders
        </Link>
      </div>

      {accountNavGroups.map((group) => (
        <div key={group.id}>
          <p className="mb-2 px-3 text-[10px] font-normal uppercase tracking-[0.22em] text-zinc-500">
            {group.title}
          </p>
          <ul className="space-y-0.5">
            {group.items
              .filter((item) => item.id !== "my-orders")
              .map((item) => (
              <li key={item.id}>
                <Link
                  href={accountSectionPath(item.id)}
                  className={navLinkClass(item.id)}
                  scroll
                >
                  {item.label}
                  {item.optional ? (
                    <span className="ml-1 normal-case tracking-normal text-zinc-400">
                      (Optional)
                    </span>
                  ) : null}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}

      <div className="border-t border-zinc-100 pt-6">
        <p className="mb-2 px-3 text-[10px] font-normal uppercase tracking-[0.22em] text-zinc-500">
          Utility
        </p>
        <button
          type="button"
          onClick={handleLogout}
          disabled={loggingOut}
          className="w-full cursor-pointer border border-zinc-300 px-3 py-2.5 text-left text-[11px] font-light uppercase tracking-[0.14em] text-zinc-600 transition hover:border-zinc-500 hover:bg-zinc-50 hover:text-zinc-900 disabled:cursor-not-allowed disabled:opacity-50 sm:text-xs"
        >
          {loggingOut ? "Logging out…" : "Logout"}
        </button>
      </div>
    </nav>
  );
}
