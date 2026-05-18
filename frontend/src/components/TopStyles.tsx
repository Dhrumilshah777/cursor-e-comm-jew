"use client";

import Image from "next/image";
import Link from "next/link";
import { Great_Vibes, Jost } from "next/font/google";
import { useState } from "react";
import type { MetalType } from "@/data/collections";

const jost = Jost({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  display: "swap",
});

const logoScript = Great_Vibes({
  weight: "400",
  subsets: ["latin"],
});

export type TopStyleProduct = {
  id: string;
  name: string;
  href: string;
  image: string;
  alt: string;
  price: string;
  metal: MetalType;
};

const products: TopStyleProduct[] = [
  {
    id: "top-style-1",
    name: "Pearl Drop Earrings",
    href: "/products/pearl-drop-earrings",
    image:
      "https://i.pinimg.com/736x/57/21/fc/5721fc3ccfc5381ff09c753bc11692d1.jpg",
    alt: "Pearl drop earrings",
    price: "₹4,850",
    metal: "Yellow Gold",
  },
  {
    id: "top-style-2",
    name: "Gold Chain Necklace",
    href: "/products/gold-chain-necklace",
    image:
      "https://i.pinimg.com/1200x/76/a4/5a/76a45a09a561e900917c4ee660f27e45.jpg",
    alt: "Gold chain necklace",
    price: "₹6,200",
    metal: "Rose Gold",
  },
  {
    id: "top-style-3",
    name: "Layered Bracelet Set",
    href: "/products/layered-bracelet-set",
    image:
      "https://i.pinimg.com/1200x/47/17/32/4717327a9027cc7f683ae86644b18905.jpg",
    alt: "Layered bracelet set",
    price: "₹3,450",
    metal: "White Gold",
  },
  {
    id: "top-style-4",
    name: "Solitaire Ring",
    href: "/products/solitaire-ring",
    image:
      "https://i.pinimg.com/736x/bb/94/5f/bb945fbfb6d5a5c16647ad1f97b03ac5.jpg",
    alt: "Solitaire diamond ring",
    price: "₹12,900",
    metal: "Yellow Gold",
  },
];

function ProductCard({ product }: { product: TopStyleProduct }) {
  const [wishlisted, setWishlisted] = useState(false);

  return (
    <Link href={product.href} className="group flex w-full flex-col gap-3">
      <div className="relative aspect-square w-full overflow-hidden bg-zinc-100">
        <Image
          src={product.image}
          alt={product.alt}
          fill
          className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
          sizes="(max-width: 1024px) 50vw, 22vw"
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
        <p className="text-xs font-normal uppercase tracking-[0.14em] text-zinc-900 sm:text-[13px] lg:tracking-[0.18em]">
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

export default function TopStyles({
  items = products,
  brandName = "Jewelry",
}: {
  items?: TopStyleProduct[];
  brandName?: string;
}) {
  return (
    <section
      className={`${jost.className} w-full bg-white px-0 py-10 sm:py-14 md:py-20 lg:px-8 lg:py-24`}
      aria-labelledby="top-styles-heading"
    >
      <div className="w-full lg:mx-auto lg:max-w-7xl">
        <div className="px-4 text-center sm:px-6 lg:px-0">
          <p
            className={`${logoScript.className} text-3xl text-zinc-950 sm:text-4xl md:text-[2.5rem]`}
          >
            {brandName}
          </p>
          <h2
            id="top-styles-heading"
            className="mt-2 text-2xl font-light tracking-wide text-zinc-950 min-[480px]:text-3xl sm:mt-3 sm:text-4xl md:text-[2.75rem] lg:text-5xl"
          >
            Top Styles
          </h2>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-x-3 gap-y-8 px-4 sm:mt-12 sm:gap-x-4 sm:gap-y-10 md:mt-14 lg:mt-16 lg:grid-cols-4 lg:gap-x-5 lg:px-0">
          {items.slice(0, 4).map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
}
