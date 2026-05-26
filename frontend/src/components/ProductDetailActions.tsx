"use client";

import { useState } from "react";
import type { CollectionProduct } from "@/data/collections";
import type { AnalyticsProductInput } from "@/lib/analytics";
import WishlistButton from "@/components/wishlist/WishlistButton";

type ProductDetailActionsProps = {
  productId: string;
  productName: string;
  slug: string;
  analyticsProduct?: AnalyticsProductInput;
};

const iconButtonClass =
  "flex h-8 w-8 cursor-pointer items-center justify-center text-zinc-700 transition-colors hover:text-zinc-900 sm:h-9 sm:w-9";

export default function ProductDetailActions({
  productId,
  productName,
  slug,
  analyticsProduct,
}: ProductDetailActionsProps) {
  const [shareHint, setShareHint] = useState<string | null>(null);

  const handleShare = async () => {
    const url =
      typeof window !== "undefined"
        ? `${window.location.origin}/products/${slug}`
        : `/products/${slug}`;

    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({ title: productName, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setShareHint("Link copied");
    } catch {
      setShareHint(null);
    }

    window.setTimeout(() => setShareHint(null), 2000);
  };

  return (
    <div className="relative flex shrink-0 items-center gap-1 sm:gap-1.5">
      {shareHint ? (
        <span className="absolute right-0 top-full z-10 mt-1.5 whitespace-nowrap bg-zinc-900 px-2.5 py-1 text-[10px] font-light uppercase tracking-wider text-white">
          {shareHint}
        </span>
      ) : null}
      <button
        type="button"
        onClick={handleShare}
        className={iconButtonClass}
        aria-label="Share product"
      >
        <i className="fa-solid fa-share-nodes text-sm sm:text-base" aria-hidden="true" />
      </button>
      <WishlistButton
        productId={productId}
        redirectPath={`/products/${slug}`}
        variant="icon"
        analyticsProduct={analyticsProduct}
      />
    </div>
  );
}
