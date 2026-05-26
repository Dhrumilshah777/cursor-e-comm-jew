"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import AddToBagButton from "@/components/cart/AddToBagButton";
import { useWishlist } from "@/components/wishlist/WishlistProvider";
import WishlistButton from "@/components/wishlist/WishlistButton";
import type { CollectionProduct } from "@/data/collections";
import { removeWishlistItem } from "@/lib/wishlistApi";

function WishlistProductCard({ product }: { product: CollectionProduct }) {
  const { refreshWishlist } = useWishlist();
  const [removing, setRemoving] = useState(false);
  const soldOut = product.inStock === false;

  async function handleRemove() {
    setRemoving(true);
    try {
      await removeWishlistItem(product.id);
      await refreshWishlist();
    } catch {
      // ignore
    } finally {
      setRemoving(false);
    }
  }

  return (
    <article className="flex flex-col gap-3 border border-zinc-100 bg-white p-4">
      <div className="relative aspect-square w-full overflow-hidden bg-zinc-100">
        <Link href={`/products/${product.slug}`} className="block h-full w-full">
          <Image
            src={product.image}
            alt={product.alt}
            fill
            className={`object-cover ${soldOut ? "opacity-60 grayscale" : ""}`}
            sizes="(max-width: 768px) 50vw, 25vw"
          />
        </Link>
        <WishlistButton productId={product.id} redirectPath="/account/wishlist" />
      </div>
      <div className="space-y-1">
        <Link
          href={`/products/${product.slug}`}
          className="text-xs font-normal uppercase tracking-[0.14em] text-zinc-900 transition hover:text-zinc-600"
        >
          {product.name}
        </Link>
        <p className="text-[11px] font-light text-zinc-500">{product.metal}</p>
        <p className="text-sm font-normal text-zinc-700">{product.price}</p>
      </div>
      <div className="mt-auto flex flex-col gap-2 pt-2">
        <AddToBagButton
          productId={product.id}
          productSlug={product.slug}
          ringSize={product.ringSize}
          soldOut={soldOut}
          className="w-full cursor-pointer bg-zinc-900 px-4 py-2.5 text-[10px] font-normal uppercase tracking-[0.18em] text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
        />
        <button
          type="button"
          onClick={handleRemove}
          disabled={removing}
          className="cursor-pointer text-[10px] font-light uppercase tracking-[0.16em] text-zinc-500 underline-offset-2 hover:text-zinc-900 hover:underline disabled:opacity-50"
        >
          {removing ? "Removing…" : "Remove"}
        </button>
      </div>
    </article>
  );
}

export default function MyWishlistContent() {
  const { wishlist, loading } = useWishlist();

  if (loading) {
    return (
      <p className="mt-8 text-sm font-light text-zinc-600">Loading your saved pieces…</p>
    );
  }

  if (wishlist.items.length === 0) {
    return (
      <div className="mt-8 border border-zinc-100 bg-zinc-50/40 px-5 py-10 text-center sm:px-8">
        <p className="text-sm font-light text-zinc-600">
          You have not saved any pieces yet. Tap the heart on a product to add it here.
        </p>
        <Link
          href="/collections/rings"
          className="mt-5 inline-flex cursor-pointer border border-zinc-900 px-5 py-2.5 text-[10px] font-light uppercase tracking-[0.16em] text-zinc-900 transition hover:bg-zinc-900 hover:text-white"
        >
          Browse collections
        </Link>
      </div>
    );
  }

  return (
    <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-4">
      {wishlist.items.map((item) => (
        <WishlistProductCard key={item.id} product={item.product} />
      ))}
    </div>
  );
}
