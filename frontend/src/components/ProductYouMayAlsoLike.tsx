"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import type { CollectionProduct } from "@/data/collections";
import WishlistButton from "@/components/wishlist/WishlistButton";

const PRODUCTS_PER_SLIDE = 2;
const DESKTOP_BREAKPOINT = 1024;

function chunkItems(items: CollectionProduct[], size: number) {
  const chunks: CollectionProduct[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

function ProductCard({ product }: { product: CollectionProduct }) {
  return (
    <Link
      href={`/products/${product.slug}`}
      className="group flex w-full flex-col gap-3"
    >
      <div className="relative aspect-square w-full overflow-hidden bg-zinc-100">
        <Image
          src={product.image}
          alt={product.alt}
          fill
          className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
          sizes="(max-width: 1024px) 45vw, 22vw"
        />
        <WishlistButton
          productId={product.id}
          analyticsProduct={{
            id: product.id,
            name: product.name,
            category: product.category,
            price: product.priceBreakup.total,
          }}
        />
      </div>
      <div className="space-y-1 text-left">
        <p className="text-xs font-normal uppercase tracking-[0.14em] text-zinc-900 sm:text-[13px]">
          {product.name}
        </p>
        <p className="text-[11px] font-light tracking-[0.08em] text-zinc-500 sm:text-xs">
          {product.metal}
        </p>
        <p className="text-xs font-normal text-zinc-600 sm:text-sm">
          {product.price}
        </p>
      </div>
    </Link>
  );
}

function MobileSlider({ items }: { items: CollectionProduct[] }) {
  const slides = chunkItems(items, PRODUCTS_PER_SLIDE);
  const maxIndex = Math.max(0, slides.length - 1);
  const [index, setIndex] = useState(0);
  const [stepPx, setStepPx] = useState(0);
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIndex((i) => Math.min(i, maxIndex));
  }, [maxIndex]);

  useEffect(() => {
    const measure = () => {
      const first = trackRef.current?.firstElementChild as HTMLElement | undefined;
      if (!first) return;
      setStepPx(first.offsetWidth);
    };

    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [slides.length]);

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= DESKTOP_BREAKPOINT) setIndex(0);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const goPrev = useCallback(() => {
    setIndex((i) => Math.max(0, i - 1));
  }, []);

  const goNext = useCallback(() => {
    setIndex((i) => Math.min(maxIndex, i + 1));
  }, [maxIndex]);

  if (items.length === 0) return null;

  return (
    <div className="lg:hidden">
      <div className="overflow-hidden">
        <div
          ref={trackRef}
          className="flex transition-transform duration-500 ease-out"
          style={{ transform: `translateX(-${index * stepPx}px)` }}
        >
          {slides.map((slideItems, slideIndex) => (
            <div
              key={`slide-${slideIndex}`}
              className="grid w-full shrink-0 grid-cols-2 gap-x-3 gap-y-6 sm:gap-x-4"
            >
              {slideItems.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ))}
        </div>
      </div>

      {maxIndex > 0 ? (
        <div className="mt-8 flex items-center justify-center gap-6">
          <button
            type="button"
            onClick={goPrev}
            disabled={index === 0}
            className="flex h-9 w-9 cursor-pointer items-center justify-center text-2xl font-light text-zinc-800 transition-opacity hover:opacity-70 disabled:cursor-not-allowed disabled:opacity-25"
            aria-label="Previous products"
          >
            <span aria-hidden="true">‹</span>
          </button>
          <button
            type="button"
            onClick={goNext}
            disabled={index >= maxIndex}
            className="flex h-9 w-9 cursor-pointer items-center justify-center text-2xl font-light text-zinc-800 transition-opacity hover:opacity-70 disabled:cursor-not-allowed disabled:opacity-25"
            aria-label="Next products"
          >
            <span aria-hidden="true">›</span>
          </button>
        </div>
      ) : null}
    </div>
  );
}

function DesktopGrid({ items }: { items: CollectionProduct[] }) {
  if (items.length === 0) return null;

  return (
    <div className="hidden gap-x-5 gap-y-8 lg:grid lg:grid-cols-4">
      {items.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}

type ProductYouMayAlsoLikeProps = {
  products: CollectionProduct[];
};

export default function ProductYouMayAlsoLike({
  products,
}: ProductYouMayAlsoLikeProps) {
  const items = products.slice(0, 4);
  if (items.length === 0) return null;

  return (
    <section
      className="mt-12 border-t border-zinc-100 pt-10 sm:mt-14 sm:pt-12"
      aria-labelledby="you-may-also-like-heading"
    >
      <h2
        id="you-may-also-like-heading"
        className="text-center text-xl font-light uppercase tracking-[0.14em] text-zinc-950 sm:text-2xl sm:tracking-[0.16em]"
      >
        You may also like
      </h2>

      <div className="mt-6 sm:mt-8">
        <MobileSlider items={items} />
        <DesktopGrid items={items} />
      </div>
    </section>
  );
}
