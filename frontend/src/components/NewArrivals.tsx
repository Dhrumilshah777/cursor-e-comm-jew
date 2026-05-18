"use client";

import Image from "next/image";
import Link from "next/link";
import { Jost } from "next/font/google";
import { useCallback, useEffect, useRef, useState } from "react";
import type { MetalType } from "@/data/collections";

const jost = Jost({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  display: "swap",
});

export type ProductItem = {
  id: string;
  name: string;
  href: string;
  image: string;
  alt: string;
  price: string;
  metal: MetalType;
};

const products: ProductItem[] = [
  {
    id: "product-1",
    name: "Pearl Drop Earrings",
    href: "/products/pearl-drop-earrings",
    image:
      "https://i.pinimg.com/736x/57/21/fc/5721fc3ccfc5381ff09c753bc11692d1.jpg",
    alt: "Pearl drop earrings",
    price: "₹4,850",
    metal: "Yellow Gold",
  },
  {
    id: "product-2",
    name: "Gold Chain Necklace",
    href: "/products/gold-chain-necklace",
    image:
      "https://i.pinimg.com/1200x/76/a4/5a/76a45a09a561e900917c4ee660f27e45.jpg",
    alt: "Gold chain necklace",
    price: "₹6,200",
    metal: "Rose Gold",
  },
  {
    id: "product-3",
    name: "Layered Bracelet Set",
    href: "/products/layered-bracelet-set",
    image:
      "https://i.pinimg.com/1200x/47/17/32/4717327a9027cc7f683ae86644b18905.jpg",
    alt: "Layered bracelet set",
    price: "₹3,450",
    metal: "White Gold",
  },
  {
    id: "product-4",
    name: "Solitaire Ring",
    href: "/products/solitaire-ring",
    image:
      "https://i.pinimg.com/736x/bb/94/5f/bb945fbfb6d5a5c16647ad1f97b03ac5.jpg",
    alt: "Solitaire diamond ring",
    price: "₹12,900",
    metal: "Yellow Gold",
  },
  {
    id: "product-5",
    name: "Diamond Pendant",
    href: "/products/diamond-pendant",
    image:
      "https://i.pinimg.com/736x/91/7b/6b/917b6b5f464c44229dcc2bbfa2a954d7.jpg",
    alt: "Diamond pendant necklace",
    price: "₹8,750",
    metal: "Rose Gold",
  },
  {
    id: "product-6",
    name: "Mangalsutra Chain",
    href: "/products/mangalsutra-chain",
    image:
      "https://i.pinimg.com/736x/49/7f/69/497f699de95ec3c83a814eeb1be0ecee.jpg",
    alt: "Gold mangalsutra necklace",
    price: "₹9,400",
    metal: "White Gold",
  },
  {
    id: "product-7",
    name: "Classic Hoop Earrings",
    href: "/products/classic-hoop-earrings",
    image:
      "https://i.pinimg.com/1200x/89/46/14/8946149ece712e63fd4cd89e3d051dbc.jpg",
    alt: "Classic gold hoop earrings",
    price: "₹5,100",
    metal: "Yellow Gold",
  },
  {
    id: "product-8",
    name: "Charm Anklet",
    href: "/products/charm-anklet",
    image:
      "https://i.pinimg.com/736x/83/25/35/832535b7d7324df0308d6e62ff04df67.jpg",
    alt: "Gold charm anklet",
    price: "₹2,980",
    metal: "Rose Gold",
  },
];

const PRODUCTS_PER_SLIDE = 4;
const DESKTOP_BREAKPOINT = 1024;

function chunkItems(items: ProductItem[], size: number) {
  const chunks: ProductItem[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

function ProductCard({ product }: { product: ProductItem }) {
  const [wishlisted, setWishlisted] = useState(false);

  return (
    <Link href={product.href} className="group flex w-full flex-col gap-3">
      <div className="relative aspect-square w-full overflow-hidden bg-zinc-100">
        <Image
          src={product.image}
          alt={product.alt}
          fill
          className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
          sizes="(max-width: 1024px) 45vw, 12vw"
        />
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setWishlisted((active) => !active);
          }}
          className="absolute right-2.5 top-2.5 z-10 flex h-8 w-8 cursor-pointer items-center justify-center bg-white/90 text-zinc-800 transition-colors hover:bg-white sm:right-3 sm:top-3 sm:h-9 sm:w-9"
          aria-label={
            wishlisted ? "Remove from wishlist" : "Add to wishlist"
          }
          aria-pressed={wishlisted}
        >
          <i
            className={`text-sm leading-none sm:text-base ${wishlisted ? "fa-solid fa-heart" : "fa-regular fa-heart"}`}
            aria-hidden="true"
          />
        </button>
      </div>
      <div className="space-y-1 text-left">
        <p className="text-xs font-normal uppercase tracking-[0.14em] text-zinc-900 sm:text-[13px] lg:text-[11px] lg:tracking-[0.18em]">
          {product.name}
        </p>
        <p className="text-[11px] font-light tracking-[0.08em] text-zinc-500 sm:text-xs">
          {product.metal}
        </p>
        <p className="text-xs font-normal text-zinc-600 sm:text-sm lg:text-[13px]">
          {product.price}
        </p>
      </div>
    </Link>
  );
}

function DesktopProductGrid({ items }: { items: ProductItem[] }) {
  return (
    <div className="hidden grid-cols-4 gap-x-4 gap-y-10 lg:grid xl:gap-x-5">
      {items.slice(0, 8).map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}

function MobileProductSlider({ items }: { items: ProductItem[] }) {
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

  const showNav = maxIndex > 0;

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
              className="w-full shrink-0 grid grid-cols-2 gap-x-2.5 gap-y-6"
            >
              {slideItems.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ))}
        </div>
      </div>

      {showNav && (
        <div className="mt-8 flex items-center justify-center gap-6">
          <button
            type="button"
            onClick={goPrev}
            disabled={index === 0}
            className="flex h-9 w-9 items-center justify-center text-2xl font-light text-zinc-800 transition-opacity hover:opacity-70 disabled:cursor-not-allowed disabled:opacity-25"
            aria-label="Previous products"
          >
            <span aria-hidden="true">‹</span>
          </button>
          <button
            type="button"
            onClick={goNext}
            disabled={index >= maxIndex}
            className="flex h-9 w-9 items-center justify-center text-2xl font-light text-zinc-800 transition-opacity hover:opacity-70 disabled:cursor-not-allowed disabled:opacity-25"
            aria-label="Next products"
          >
            <span aria-hidden="true">›</span>
          </button>
        </div>
      )}
    </div>
  );
}

export default function NewArrivals({
  items = products,
}: {
  items?: ProductItem[];
}) {
  return (
    <section
      className={`${jost.className} w-full bg-[#faf8f5] px-0 py-10 sm:py-14 lg:px-8 lg:py-20`}
      aria-labelledby="new-arrivals-heading"
    >
      <div className="w-full lg:mx-auto lg:max-w-7xl">
        <div className="px-4 text-center sm:px-6 lg:px-0">
          <h2
            id="new-arrivals-heading"
            className="text-2xl font-light tracking-wide text-zinc-950 min-[480px]:text-3xl sm:text-4xl lg:text-5xl"
          >
            New Arrivals
          </h2>
          <p className="mx-auto mt-3 max-w-md text-xs font-normal tracking-[0.1em] text-zinc-600 min-[480px]:text-sm sm:mt-4 sm:text-base">
            Fresh pieces, just landed.
          </p>
        </div>

        <div className="mt-8 px-4 sm:mt-10 lg:mt-14 lg:px-0">
          <MobileProductSlider items={items} />
          <DesktopProductGrid items={items} />
        </div>
      </div>
    </section>
  );
}
