"use client";

import Link from "next/link";
import { Jost } from "next/font/google";
import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import AccountNav from "@/components/account/AccountNav";
import {
  getOrderDetailPath,
  getOrderIdFromPathname,
  isOrderDetailPath,
} from "@/data/accountOrders";
import { useOrderSummary } from "@/hooks/useOrderSummary";
import { isReturnRequestPath } from "@/data/returnRequest";
import {
  getAccountItemById,
  getActiveSectionIdFromPathname,
} from "@/data/accountSections";

const jost = Jost({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  display: "swap",
});

export default function AccountShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const activeId = getActiveSectionIdFromPathname(pathname);
  const activeItem = getAccountItemById(activeId);
  const orderId = getOrderIdFromPathname(pathname);
  const orderNumber = useOrderSummary(orderId);
  const isReturnRequest = isReturnRequestPath(pathname);
  const isOrderDetail = isOrderDetailPath(pathname) && !isReturnRequest;

  const breadcrumbCurrent = isReturnRequest
    ? "Return Request"
    : isOrderDetail
      ? `Order #${orderNumber ?? ""}`
      : activeId === "overview"
        ? "My Account"
        : (activeItem?.item.label ?? "My Account");

  const isOverview = activeId === "overview" && !isOrderDetail && !isReturnRequest;
  const mobileBackHref = isReturnRequest
    ? orderId
      ? getOrderDetailPath(orderId)
      : "/account/my-orders"
    : isOrderDetail
      ? "/account/my-orders"
      : "/account";
  const mobileBackLabel = isReturnRequest
    ? "Order details"
    : isOrderDetail
      ? "My Orders"
      : "My Account";
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const isMobile = window.matchMedia("(max-width: 1023px)").matches;
    if (!isMobile) return;

    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [pathname]);

  return (
    <div className={`${jost.className} bg-white`}>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8 lg:py-14">
        <nav aria-label="Breadcrumb">
          <ol className="flex flex-wrap items-center gap-2 text-[11px] font-light uppercase tracking-[0.18em] text-zinc-500 sm:text-xs sm:tracking-[0.2em]">
            <li>
              <Link
                href="/"
                className="cursor-pointer transition-colors hover:text-zinc-900"
              >
                Home
              </Link>
            </li>
            <li aria-hidden="true" className="text-zinc-400">
              /
            </li>
            {activeId !== "overview" || isOrderDetail || isReturnRequest ? (
              <>
                <li>
                  <Link
                    href="/account"
                    className="cursor-pointer transition-colors hover:text-zinc-900"
                  >
                    My Account
                  </Link>
                </li>
                <li aria-hidden="true" className="text-zinc-400">
                  /
                </li>
              </>
            ) : null}
            {isOrderDetail || isReturnRequest ? (
              <>
                <li>
                  <Link
                    href="/account/my-orders"
                    className="cursor-pointer transition-colors hover:text-zinc-900"
                  >
                    My Orders
                  </Link>
                </li>
                <li aria-hidden="true" className="text-zinc-400">
                  /
                </li>
              </>
            ) : null}
            {isReturnRequest && orderId ? (
              <>
                <li>
                  <Link
                    href={getOrderDetailPath(orderId)}
                    className="cursor-pointer transition-colors hover:text-zinc-900"
                  >
                    Order #{orderNumber ?? ""}
                  </Link>
                </li>
                <li aria-hidden="true" className="text-zinc-400">
                  /
                </li>
              </>
            ) : null}
            <li className="text-zinc-900" aria-current="page">
              {breadcrumbCurrent}
            </li>
          </ol>
        </nav>

        <h1 className="mt-6 text-2xl font-light uppercase tracking-[0.12em] text-zinc-950 sm:text-3xl">
          My Account
        </h1>

        <div className="mt-8 flex flex-col gap-8 lg:mt-10 lg:grid lg:grid-cols-[minmax(0,280px)_1fr] lg:gap-12 xl:gap-16">
          <div
            id="account-main-content"
            ref={contentRef}
            className="min-w-0 scroll-mt-24 lg:col-start-2 lg:row-start-1"
          >
            {!isOverview ? (
              <Link
                href={mobileBackHref}
                className="mb-6 inline-flex cursor-pointer items-center gap-2 text-[11px] font-light uppercase tracking-[0.16em] text-zinc-600 transition hover:text-zinc-900 lg:hidden"
              >
                <span aria-hidden="true">←</span>
                {mobileBackLabel}
              </Link>
            ) : null}
            {children}
          </div>

          <aside className="hidden lg:col-start-1 lg:row-start-1 lg:block lg:border-r lg:border-zinc-100 lg:pr-8">
            <AccountNav />
          </aside>

          {isOverview ? (
            <div className="border-t border-zinc-100 pt-8 lg:hidden">
              <AccountNav />
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
