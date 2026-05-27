"use client";

import Link from "next/link";
import { IoBagHandleOutline } from "react-icons/io5";
import { useCart } from "@/components/cart/CartProvider";

const linkClass =
  "relative flex items-center gap-2 text-[11px] font-light uppercase tracking-[0.22em] text-zinc-800 transition-colors hover:text-zinc-500";

export default function CartNavLink({ onNavigate }: { onNavigate?: () => void }) {
  const { itemCount } = useCart();

  return (
    <Link href="/cart" className={linkClass} onClick={onNavigate}>
      <IoBagHandleOutline className="text-base leading-none" aria-hidden="true" />
      <span className="hidden min-[400px]:inline">Bag</span>
      {itemCount > 0 ? (
        <span className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-zinc-900 px-1 text-[9px] font-normal text-white">
          {itemCount > 99 ? "99+" : itemCount}
        </span>
      ) : null}
    </Link>
  );
}
