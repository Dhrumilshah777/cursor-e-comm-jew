"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useCart } from "@/components/cart/CartProvider";
import { removeCartItem } from "@/lib/cartApi";
import { getCustomerToken } from "@/lib/customerAuth";

export default function CartPageContent() {
  const { cart, loading, setCart } = useCart();
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!getCustomerToken()) {
      window.location.href = "/login?redirect=%2Fcart";
    }
  }, []);

  const handleRemove = async (itemId: string) => {
    setUpdatingId(itemId);
    setError(null);
    try {
      const next = await removeCartItem(itemId);
      setCart(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove item");
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading) {
    return (
      <p className="text-sm font-light text-zinc-500">Loading your bag…</p>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="text-center">
        <p className="text-sm font-light text-zinc-600">Your bag is empty.</p>
        <Link
          href="/collections"
          className="mt-6 inline-block border border-zinc-900 px-8 py-3 text-[11px] font-normal uppercase tracking-[0.22em] text-zinc-900 transition hover:bg-zinc-900 hover:text-white"
        >
          Continue shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {error ? <p className="text-sm font-light text-red-600">{error}</p> : null}

      <ul className="divide-y divide-zinc-100 border-t border-zinc-100">
        {cart.items.map((item) => (
          <li key={item.id} className="flex gap-4 py-6 sm:gap-6">
            <Link
              href={`/products/${item.product.slug}`}
              className="relative h-24 w-24 shrink-0 overflow-hidden bg-zinc-100 sm:h-28 sm:w-28"
            >
              <Image
                src={item.product.image}
                alt={item.product.alt}
                fill
                className="object-cover"
                sizes="112px"
              />
            </Link>
            <div className="min-w-0 flex-1">
              <Link
                href={`/products/${item.product.slug}`}
                className="text-sm font-normal uppercase tracking-[0.12em] text-zinc-900 hover:text-zinc-600"
              >
                {item.product.name}
              </Link>
              <p className="mt-1 text-xs font-light text-zinc-500">
                {item.product.metal}
                {item.size ? ` · Size ${item.size}` : null}
                {" · "}
                <span className="text-zinc-700">Qty {item.quantity}</span>
              </p>
              <p className="mt-2 text-sm font-light text-zinc-900">{item.lineTotal}</p>

              <div className="mt-3">
                <button
                  type="button"
                  disabled={updatingId === item.id}
                  onClick={() => handleRemove(item.id)}
                  className="text-[10px] font-light uppercase tracking-[0.16em] text-zinc-500 underline-offset-2 hover:text-zinc-900 hover:underline disabled:opacity-50"
                >
                  Remove
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>

      <div className="border-t border-zinc-100 pt-6">
        <div className="flex items-center justify-between text-sm">
          <span className="font-light uppercase tracking-[0.14em] text-zinc-600">
            Subtotal
          </span>
          <span className="font-normal text-zinc-900">{cart.subtotal}</span>
        </div>
        <p className="mt-2 text-xs font-light text-zinc-500">
          Shipping and taxes calculated at checkout.
        </p>
        <Link
          href="/checkout"
          className="mt-6 inline-block w-full bg-zinc-900 px-8 py-3.5 text-center text-[11px] font-normal uppercase tracking-[0.22em] text-white transition hover:bg-zinc-800 sm:w-auto"
        >
          Proceed to checkout
        </Link>
      </div>
    </div>
  );
}
