"use client";

import { useRouter } from "next/navigation";
import { useState, type MouseEvent } from "react";
import { IoHeart, IoHeartOutline } from "react-icons/io5";
import { isAnalyticsConfigured, trackAddToWishlist, type AnalyticsProductInput } from "@/lib/analytics";
import { useWishlist } from "@/components/wishlist/WishlistProvider";

type WishlistButtonProps = {
  productId: string;
  redirectPath?: string;
  variant?: "card" | "icon";
  className?: string;
  analyticsProduct?: AnalyticsProductInput;
};

const cardClassName =
  "absolute right-2.5 top-2.5 z-10 flex h-8 w-8 cursor-pointer items-center justify-center bg-white/90 text-zinc-800 transition-colors hover:bg-white sm:right-3 sm:top-3 sm:h-9 sm:w-9";

const iconClassName =
  "flex h-8 w-8 cursor-pointer items-center justify-center text-zinc-700 transition-colors hover:text-zinc-900 sm:h-9 sm:w-9";

export default function WishlistButton({
  productId,
  redirectPath,
  variant = "card",
  className,
  analyticsProduct,
}: WishlistButtonProps) {
  const router = useRouter();
  const { isWishlisted, toggleWishlist } = useWishlist();
  const [busy, setBusy] = useState(false);
  const active = isWishlisted(productId);

  const handleClick = async (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();

    if (busy) return;
    setBusy(true);

    try {
      await toggleWishlist(productId);
      if (!active && isAnalyticsConfigured()) {
        trackAddToWishlist(
          analyticsProduct ?? {
            id: productId,
          },
        );
      }
    } catch (error) {
      if (error instanceof Error && error.message === "LOGIN_REQUIRED") {
        const redirect = encodeURIComponent(
          redirectPath ??
            (typeof window !== "undefined"
              ? `${window.location.pathname}${window.location.search}`
              : "/"),
        );
        router.push(`/login?redirect=${redirect}`);
        return;
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={busy}
      className={className ?? (variant === "card" ? cardClassName : iconClassName)}
      aria-label={active ? "Remove from wishlist" : "Add to wishlist"}
      aria-pressed={active}
    >
      {active ? (
        <IoHeart className="text-sm text-zinc-900 sm:text-base" aria-hidden="true" />
      ) : (
        <IoHeartOutline className="text-sm sm:text-base" aria-hidden="true" />
      )}
    </button>
  );
}
