"use client";

import Image from "next/image";
import Link from "next/link";
import { Jost } from "next/font/google";
import { useCallback, useEffect, useState } from "react";

const jost = Jost({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  display: "swap",
});

const slides = [
  {
    id: "slide-1",
    image:
      "https://i.pinimg.com/1200x/c0/42/c4/c042c4a5ef67184bb6cd2d59110af506.jpg",
    alt: "Featured jewelry",
    title: "Luxury Jewellery Without Paying For Diamonds",
    subtitle: "",
    collectionHref: "/collections",
  },
  {
    id: "slide-2",
    image:
      "https://i.pinimg.com/1200x/6d/61/ed/6d61edaa4a69a1d21635f172eb548361.jpg",
    alt: "Featured jewelry",
    title: "Luxury Gold Jewellery. Designed for Everyday Elegance.",
    subtitle: "",
    collectionHref: "/new-arrivals",
  },
] as const;

const INTERVAL_MS = 6500;

const btnBase =
  "inline-flex shrink-0 items-center justify-center min-h-11 px-6 py-3 text-center text-xs font-light uppercase leading-snug tracking-[0.15em] transition-opacity sm:min-h-0 sm:px-6 sm:py-2.5 sm:text-[11px] sm:tracking-[0.18em]";

export default function HeroBanner() {
  const [index, setIndex] = useState(0);
  const count = slides.length;
  const current = slides[index];

  const goNext = useCallback(() => {
    setIndex((i) => (i + 1) % count);
  }, [count]);

  const goPrev = useCallback(() => {
    setIndex((i) => (i - 1 + count) % count);
  }, [count]);

  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }
    const id = window.setInterval(goNext, INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [goNext]);

  return (
    <section
      className={`${jost.className} w-full bg-white px-4 pb-4 sm:px-6 sm:pb-6 lg:px-8`}
      aria-roledescription="carousel"
      aria-label="Featured higihlights"
    >
      <div className="relative overflow-hidden bg-zinc-900">
        <div className="relative aspect-[4/5] w-full max-h-[90vh] sm:aspect-[21/9] sm:min-h-[min(72vh,640px)]">
          {slides.map((slide, i) => {
            const active = i === index;
            return (
              <div
                key={slide.id}
                className={`absolute inset-0 transition-opacity duration-700 ease-out ${
                  active
                    ? "z-10 opacity-100"
                    : "z-0 opacity-0 pointer-events-none"
                }`}
                aria-hidden={!active}
              >
                <Image
                  src={slide.image}
                  alt={slide.alt}
                  fill
                  className="object-cover"
                  sizes="100vw"
                  priority={i === 0}
                />
              </div>
            );
          })}

          <div
            className="pointer-events-none absolute inset-0 z-20 flex flex-col items-start justify-end px-8 pb-28 text-left md:justify-center md:pb-0 md:pl-12 lg:pl-20"
            aria-live="polite"
          >
            <div className="pointer-events-auto max-w-lg">
              <h2 className="max-w-xl text-3xl font-light leading-tight tracking-wide text-white sm:text-4xl md:max-w-2xl md:text-5xl lg:text-6xl">
                {current.title}
              </h2>
              {current.subtitle ? (
                <p className="mt-4 text-[11px] font-light uppercase tracking-[0.28em] text-white sm:text-xs">
                  {current.subtitle}
                </p>
              ) : null}
              <div className="mt-7 flex flex-row flex-wrap items-center gap-3 sm:gap-4">
                <Link
                  href={current.collectionHref}
                  className={`${btnBase} border border-white text-white hover:bg-white/10`}
                >
                  View collection
                </Link>
              </div>
            </div>
          </div>

          <div className="pointer-events-none absolute inset-0 z-30">
            <div className="pointer-events-auto absolute bottom-14 right-6 flex items-center gap-1 sm:bottom-20 sm:right-8 sm:gap-1.5 md:bottom-24">
              <button
                type="button"
                onClick={goPrev}
                className="flex min-h-12 min-w-10 items-center justify-center text-4xl font-light leading-none text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.65)] transition-opacity hover:opacity-80 sm:min-h-14 sm:min-w-12 sm:text-5xl md:text-6xl"
                aria-label="Previous slide"
              >
                <span aria-hidden="true">‹</span>
              </button>
              <button
                type="button"
                onClick={goNext}
                className="flex min-h-12 min-w-10 items-center justify-center text-4xl font-light leading-none text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.65)] transition-opacity hover:opacity-80 sm:min-h-14 sm:min-w-12 sm:text-5xl md:text-6xl"
                aria-label="Next slide"
              >
                <span aria-hidden="true">›</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
