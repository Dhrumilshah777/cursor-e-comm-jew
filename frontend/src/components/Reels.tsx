"use client";

import Image from "next/image";
import Link from "next/link";
import { Jost } from "next/font/google";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

const jost = Jost({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  display: "swap",
});

export type ReelItem = {
  id: string;
  href: string;
  image: string;
  alt: string;
  caption?: string;
  videoUrl?: string;
};

const reels: ReelItem[] = [
  {
    id: "reel-1",
    href: "/products/pearl-drop-earrings",
    image:
      "https://i.pinimg.com/736x/57/21/fc/5721fc3ccfc5381ff09c753bc11692d1.jpg",
    alt: "Diamond earring styled for everyday wear",
    caption: "From desk to dinner and beyond..",
  },
  {
    id: "reel-2",
    href: "/products/solitaire-ring",
    image:
      "https://i.pinimg.com/736x/bb/94/5f/bb945fbfb6d5a5c16647ad1f97b03ac5.jpg",
    alt: "Classic ring designs",
    caption: "Classic Designs",
  },
  {
    id: "reel-3",
    href: "/products/gold-chain-necklace",
    image:
      "https://i.pinimg.com/1200x/76/a4/5a/76a45a09a561e900917c4ee660f27e45.jpg",
    alt: "Personalized gold charm jewelry",
  },
  {
    id: "reel-4",
    href: "/products/diamond-pendant",
    image:
      "https://i.pinimg.com/736x/91/7b/6b/917b6b5f464c44229dcc2bbfa2a954d7.jpg",
    alt: "Square-cut diamond ring",
  },
  {
    id: "reel-5",
    href: "/products/layered-bracelet-set",
    image:
      "https://i.pinimg.com/1200x/47/17/32/4717327a9027cc7f683ae86644b18905.jpg",
    alt: "Layered bracelet stack",
    caption: "Stack & shine",
  },
  {
    id: "reel-6",
    href: "/products/mangalsutra-chain",
    image:
      "https://i.pinimg.com/736x/49/7f/69/497f699de95ec3c83a814eeb1be0ecee.jpg",
    alt: "Bridal mangalsutra necklace",
    caption: "Wedding essentials",
  },
  {
    id: "reel-7",
    href: "/products/classic-hoop-earrings",
    image:
      "https://i.pinimg.com/1200x/89/46/14/8946149ece712e63fd4cd89e3d051dbc.jpg",
    alt: "Gold hoop earrings",
  },
  {
    id: "reel-8",
    href: "/products/charm-anklet",
    image:
      "https://i.pinimg.com/736x/83/25/35/832535b7d7324df0308d6e62ff04df67.jpg",
    alt: "Delicate charm anklet",
    caption: "Everyday elegance",
  },
];

function getVisibleCount(width: number) {
  if (width >= 1280) return 4;
  if (width >= 1024) return 4;
  if (width >= 768) return 3;
  if (width >= 640) return 2;
  return 1.28;
}

function useVisibleCount() {
  const [visibleCount, setVisibleCount] = useState(() =>
    typeof window !== "undefined" ? getVisibleCount(window.innerWidth) : 1.28,
  );

  useEffect(() => {
    const update = () => setVisibleCount(getVisibleCount(window.innerWidth));
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  return visibleCount;
}

function ReelCard({ item }: { item: ReelItem }) {
  return (
    <Link
      href={item.href}
      className="group relative block w-full shrink-0 overflow-hidden bg-zinc-200"
    >
      <div className="relative aspect-[3/4] w-full sm:aspect-[9/16]">
        {item.videoUrl ? (
          <video
            src={item.videoUrl}
            poster={item.image || undefined}
            className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.02]"
            muted
            loop
            playsInline
            autoPlay
            preload="metadata"
          />
        ) : (
          <Image
            src={item.image}
            alt={item.alt}
            fill
            className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.02]"
            sizes="(max-width: 640px) 70vw, (max-width: 768px) 42vw, (max-width: 1024px) 30vw, 22vw"
          />
        )}
        {item.caption ? (
          <p className="absolute inset-x-0 bottom-4 px-3 text-center text-xs font-light leading-snug text-white drop-shadow-sm sm:bottom-5 sm:px-4 sm:text-sm">
            {item.caption}
          </p>
        ) : null}
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/50 to-transparent"
          aria-hidden="true"
        />
      </div>
    </Link>
  );
}

function getGapPx(width: number) {
  return width >= 640 ? 12 : 10;
}

function ReelsCarousel({ items }: { items: ReelItem[] }) {
  const visibleCount = useVisibleCount();
  const [index, setIndex] = useState(0);
  const [slideWidthPx, setSlideWidthPx] = useState(0);
  const [gapPx, setGapPx] = useState(10);
  const containerRef = useRef<HTMLDivElement>(null);

  const slotsVisible = Math.ceil(visibleCount);
  const maxIndex = Math.max(0, items.length - slotsVisible);

  useEffect(() => {
    setIndex((i) => Math.min(i, maxIndex));
  }, [maxIndex]);

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const measure = () => {
      const width = container.getBoundingClientRect().width;
      if (width <= 0) return;

      const gap = getGapPx(window.innerWidth);
      const gaps = gap * (Math.ceil(visibleCount) - 1);
      setGapPx(gap);
      setSlideWidthPx((width - gaps) / visibleCount);
    };

    measure();

    const observer = new ResizeObserver(measure);
    observer.observe(container);
    window.addEventListener("resize", measure);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [items.length, visibleCount]);

  const goPrev = useCallback(() => {
    setIndex((i) => Math.max(0, i - 1));
  }, []);

  const goNext = useCallback(() => {
    setIndex((i) => Math.min(maxIndex, i + 1));
  }, [maxIndex]);

  const stepPx = slideWidthPx > 0 ? slideWidthPx + gapPx : 0;
  const gapClass = "gap-2.5 sm:gap-3";

  return (
    <div
      className="relative w-full"
      aria-roledescription="carousel"
      aria-label="Elegance in Motion"
    >
      <div ref={containerRef} className="w-full overflow-hidden">
        <div
          className={`flex ${gapClass} transition-transform duration-500 ease-out`}
          style={{
            transform: stepPx > 0 ? `translateX(-${index * stepPx}px)` : undefined,
          }}
        >
          {items.map((item) => (
            <div
              key={item.id}
              className="w-[76vw] max-w-[280px] shrink-0 min-[640px]:w-auto min-[640px]:max-w-none"
              style={slideWidthPx > 0 ? { width: slideWidthPx } : undefined}
            >
              <ReelCard item={item} />
            </div>
          ))}
        </div>
      </div>

      <button
        type="button"
        onClick={goPrev}
        disabled={index === 0}
        className="absolute left-1 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-zinc-100 text-lg text-zinc-800 shadow-md transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-40 sm:left-2 sm:h-10 sm:w-10 md:left-0"
        aria-label="Previous reel"
      >
        <span aria-hidden="true">‹</span>
      </button>
      <button
        type="button"
        onClick={goNext}
        disabled={index >= maxIndex}
        className="absolute right-1 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-zinc-100 text-lg text-zinc-800 shadow-md transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-40 sm:right-2 sm:h-10 sm:w-10 md:right-0"
        aria-label="Next reel"
      >
        <span aria-hidden="true">›</span>
      </button>
    </div>
  );
}

export default function Reels({ items = reels }: { items?: ReelItem[] }) {
  return (
    <section
      className={`${jost.className} w-full overflow-x-hidden bg-white px-0 py-10 sm:py-14 md:py-20 lg:px-8 lg:py-24`}
      aria-labelledby="elegance-in-motion-heading"
    >
      <div className="w-full lg:mx-auto lg:max-w-7xl">
        <div className="px-4 text-center sm:px-6 lg:px-0">
          <h2
            id="elegance-in-motion-heading"
            className="text-2xl font-light tracking-wide text-zinc-950 min-[480px]:text-3xl sm:text-4xl lg:text-5xl"
          >
            Elegance in Motion
          </h2>
        </div>

        <div className="relative mt-8 px-4 sm:mt-10 sm:px-6 md:mt-12 lg:mt-14 lg:px-0">
          <ReelsCarousel items={items} />
        </div>
      </div>
    </section>
  );
}

