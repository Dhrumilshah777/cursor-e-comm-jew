"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useCart } from "@/components/cart/CartProvider";
import { addToCart } from "@/lib/cartApi";

type AddToBagButtonProps = {
  productId: string;
  productSlug: string;
  ringSize?: string;
  className?: string;
  soldOut?: boolean;
};

export default function AddToBagButton({
  productId,
  productSlug,
  ringSize,
  className = "mt-8 w-full cursor-pointer bg-zinc-900 px-8 py-3.5 text-[11px] font-normal uppercase tracking-[0.22em] text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto",
  soldOut = false,
}: AddToBagButtonProps) {
  const router = useRouter();
  const { setCart, refreshCart } = useCart();
  const [status, setStatus] = useState<"idle" | "loading" | "added" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);

  const handleClick = async () => {
    if (soldOut) return;
    setStatus("loading");
    setMessage(null);

    try {
      const cart = await addToCart(productId, { size: ringSize });
      setCart(cart);
      setStatus("added");
      setMessage("Added to your bag");
      window.setTimeout(() => {
        setStatus("idle");
        setMessage(null);
      }, 2500);
    } catch (err) {
      if (err instanceof Error && err.message === "LOGIN_REQUIRED") {
        const redirect = encodeURIComponent(`/products/${productSlug}`);
        router.push(`/login?redirect=${redirect}`);
        return;
      }
      if (
        err instanceof Error &&
        (err.message.includes("already in your bag") ||
          (err as Error & { code?: string }).code === "ALREADY_IN_CART")
      ) {
        setStatus("error");
        setMessage("This item is already in your bag");
        return;
      }
      setStatus("error");
      setMessage(err instanceof Error ? err.message : "Could not add to bag");
    } finally {
      await refreshCart();
    }
  };

  if (soldOut) {
    return (
      <div>
        <button
          type="button"
          disabled
          aria-disabled
          className={className}
        >
          Sold out
        </button>
        <p className="mt-2 text-sm font-light text-zinc-600">
          This piece is currently out of stock. Check back soon — restocks happen often.
        </p>
      </div>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleClick}
        disabled={status === "loading"}
        className={className}
      >
        {status === "loading"
          ? "Adding…"
          : status === "added"
            ? "Added to bag"
            : "Add to bag"}
      </button>
      {message ? (
        <p
          className={`mt-2 text-sm font-light ${
            status === "error" ? "text-red-600" : "text-emerald-700"
          }`}
        >
          {message}
        </p>
      ) : null}
    </div>
  );
}
