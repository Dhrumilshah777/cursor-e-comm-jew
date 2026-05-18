"use client";

import Image from "next/image";
import Link from "next/link";
import { Jost } from "next/font/google";
import { useCallback, useEffect, useRef, useState } from "react";

const jost = Jost({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  display: "swap",
});
export type CollectionItem = {
  id: string;
  sublabel: string;
  label: string;
  href: string;
  image: string;
  alt: string;
};

const collections: CollectionItem[] = [
  {
    id: "day-out",
    sublabel: "EVERYDAY LUXURY",
    label: "DAY OUT",
    href: "/collections/day-out",
    image:
      "https://i.pinimg.com/736x/57/21/fc/5721fc3ccfc5381ff09c753bc11692d1.jpg",
    alt: "Everyday luxury jewelry for a day out",
  },
  {
    id: "date-night",
    sublabel: "BOLD & ELEGANT",
    label: "DATE NIGHT",
    href: "/collections/date-night",
    image:
      "https://i.pinimg.com/736x/bb/94/5f/bb945fbfb6d5a5c16647ad1f97b03ac5.jpg",
    alt: "Bold and elegant jewelry for date night",
  },
  {
    id: "wedding-wear",
    sublabel: "BRIDAL COLLECTION",
    label: "WEDDING WEAR",
    href: "/collections/wedding-wear",
    image:
      "https://i.pinimg.com/736x/49/7f/69/497f699de95ec3c83a814eeb1be0ecee.jpg",
    alt: "Bridal jewelry for wedding wear",
  },
  {
    id: "party-wear",
    sublabel: "GLAM & CHIC",
    label: "PARTY WEAR",
    href: "/collections/party-wear",
    image:
      "https://i.pinimg.com/1200x/89/46/14/8946149ece712e63fd4cd89e3d051dbc.jpg",
    alt: "Glam jewelry for party wear",
  },
  {
    id: "office-wear",
    sublabel: "REFINED MINIMAL",
    label: "OFFICE WEAR",
    href: "/collections/office-wear",
    image:
      "https://i.pinimg.com/1200x/76/a4/5a/76a45a09a561e900917c4ee660f27e45.jpg",
    alt: "Minimal jewelry for office wear",
  },
  {
    id: "festive-wear",
    sublabel: "SEASONAL SPARKLE",
    label: "FESTIVE WEAR",
    href: "/collections/festive-wear",
    image:
      "https://i.pinimg.com/736x/91/7b/6b/917b6b5f464c44229dcc2bbfa2a954d7.jpg",
    alt: "Festive jewelry for celebrations",
  },
  {
    id: "casual-edit",
    sublabel: "EFFORTLESS STYLE",
    label: "CASUAL EDIT",
    href: "/collections/casual-edit",
    image:
      "https://i.pinimg.com/1200x/47/17/32/4717327a9027cc7f683ae86644b18905.jpg",
    alt: "Casual everyday jewelry edit",
  },
];

const DESKTOP_BREAKPOINT = 1024;
const MOBILE_VISIBLE_COUNT = 3;
const DESKTOP_VISIBLE_COUNT = 5;

function useVisibleCount() {
  const [visibleCount, setVisibleCount] = useState(MOBILE_VISIBLE_COUNT);

  useEffect(() => {
    const update = () => {
      setVisibleCount(
        window.innerWidth >= DESKTOP_BREAKPOINT
          ? DESKTOP_VISIBLE_COUNT
          : MOBILE_VISIBLE_COUNT,
      );
    };

    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  return visibleCount;
}

const TRANSITION_MS = 700;

type CardAnimation = "none" | "enter-right" | "enter-left";

const SLIDE_EASING =
  "opacity 700ms cubic-bezier(0.22, 1, 0.36, 1), transform 700ms cubic-bezier(0.22, 1, 0.36, 1)";

function CollectionCard({
  item,
  position,
  isLast,
  animation,
}: {
  item: CollectionItem;
  position: number;
  isLast: boolean;
  animation: CardAnimation;
}) {
  const isCenter = position === 0;
  const absPosition = Math.abs(position);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = contentRef.current;
    if (!node) return;

    if (animation === "none") {
      node.style.transition = "";
      node.style.opacity = "1";
      node.style.transform = "";
      return;
    }

    const fromX = animation === "enter-right" ? 88 : -88;

    node.style.transition = "none";
    node.style.opacity = "0";
    node.style.transform = `translate3d(${fromX}px, 0, 0)`;

    const frame = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        node.style.transition = SLIDE_EASING;
        node.style.opacity = "1";
        node.style.transform = "translate3d(0, 0, 0)";
      });
    });

    return () => cancelAnimationFrame(frame);
  }, [animation, item.id]);

  return (
    <Link
      href={item.href}
      className={`group relative block shrink-0 overflow-hidden bg-zinc-200 transition-all duration-500 ease-in-out ${
        isCenter
          ? "z-20 aspect-[3/3.52] w-[80vw] max-w-[540px] shadow-[0_14px_44px_rgba(0,0,0,0.16)] sm:w-[460px] md:w-[540px] lg:w-[400px] lg:max-w-none xl:w-[455px] 2xl:w-[505px]"
          : absPosition === 1
            ? "z-10 aspect-[3/3.55] w-[70vw] max-w-[460px] sm:w-[415px] md:w-[460px] lg:w-[345px] lg:max-w-none xl:w-[392px] 2xl:w-[418px]"
            : "z-[5] aspect-[3/3.48] w-[62vw] max-w-[400px] lg:w-[300px] lg:max-w-none xl:w-[342px] 2xl:w-[368px]"
      } ${!isLast ? "-mr-8 sm:-mr-10 md:-mr-12 lg:-mr-5 xl:-mr-7 2xl:-mr-9" : ""}`}
      aria-hidden={!isCenter && absPosition > 1}
      tabIndex={isCenter || absPosition <= 1 ? 0 : -1}
    >
      <div ref={contentRef} className="absolute inset-0 will-change-transform">
        <Image
          src={item.image}
          alt={item.alt}
          fill
          className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
          sizes={
            isCenter
              ? "(max-width: 1024px) 80vw, 505px"
              : absPosition === 1
                ? "(max-width: 1024px) 70vw, 418px"
                : "(max-width: 1024px) 62vw, 368px"
          }
          priority={isCenter}
        />
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/65 via-black/25 to-transparent px-4 pb-7 pt-20 text-center sm:px-5 sm:pb-8 sm:pt-24"
        aria-hidden="true"
      >
        <p className={`${jost.className} text-[9px] font-light uppercase tracking-[0.3em] text-white/90 sm:text-[10px] sm:tracking-[0.34em]`}>
          {item.sublabel}
        </p>
        <p
          className={`${jost.className} mt-2 text-xl font-light uppercase tracking-[0.12em] text-white sm:mt-2.5 sm:text-2xl sm:tracking-[0.16em] md:text-[1.7rem]`}
        >
          {item.label}
        </p>
        <div className="mx-auto mt-3 h-px w-9 bg-white/85 sm:mt-3.5 sm:w-10" />
      </div>
      </div>
    </Link>
  );
}

function CollectionCarousel({ items }: { items: CollectionItem[] }) {
  const [activeIndex, setActiveIndex] = useState(1);
  const [animatedSlot, setAnimatedSlot] = useState<number | null>(null);
  const [animation, setAnimation] = useState<CardAnimation>("none");
  const [isBusy, setIsBusy] = useState(false);
  const visibleCount = useVisibleCount();
  const half = Math.floor(visibleCount / 2);

  const navigate = useCallback(
    (dir: -1 | 1) => {
      if (isBusy) return;

      const enterSlot = 0;

      setIsBusy(true);
      setActiveIndex((i) => (i + dir + items.length) % items.length);
      setAnimatedSlot(enterSlot);

      requestAnimationFrame(() => {
        setAnimation(dir === 1 ? "enter-right" : "enter-left");
      });

      window.setTimeout(() => {
        setAnimation("none");
        setAnimatedSlot(null);
        setIsBusy(false);
      }, TRANSITION_MS);
    },
    [isBusy, items.length],
  );

  const goPrev = useCallback(() => navigate(-1), [navigate]);
  const goNext = useCallback(() => navigate(1), [navigate]);

  const offsets = Array.from({ length: visibleCount }, (_, i) => i - half);
  const visible = offsets.map((offset) => {
    const index = (activeIndex + offset + items.length) % items.length;
    return {
      item: items[index],
      position: offset,
    };
  });

  return (
    <div
      className="relative mx-auto w-full overflow-hidden px-2 sm:px-4"
      aria-roledescription="carousel"
      aria-label="Shop by collection"
    >
      <div className="flex items-center justify-center">
        {visible.map(({ item, position }, index) => (
          <CollectionCard
            key={`slot-${position}`}
            item={item}
            position={position}
            isLast={index === visible.length - 1}
            animation={position === animatedSlot ? animation : "none"}
          />
        ))}
      </div>

      <button
        type="button"
        onClick={goPrev}
        disabled={isBusy}
        className="absolute left-2 top-1/2 z-30 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white text-lg text-zinc-900 shadow-md transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50 sm:left-4 sm:h-10 sm:w-10 md:left-6 lg:left-10"
        aria-label="Previous collection"
      >
        <span aria-hidden="true">‹</span>
      </button>

      <button
        type="button"
        onClick={goNext}
        disabled={isBusy}
        className="absolute right-2 top-1/2 z-30 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white text-lg text-zinc-900 shadow-md transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50 sm:right-4 sm:h-10 sm:w-10 md:right-6 lg:right-10"
        aria-label="Next collection"
      >
        <span aria-hidden="true">›</span>
      </button>
    </div>
  );
}

export default function ShopByCollection({
  items = collections,
}: {
  items?: CollectionItem[];
}) {
  return (
    <section
      className={`${jost.className} w-full overflow-x-hidden bg-[#f5f1ed] px-0 py-10 sm:py-14 md:py-20 lg:py-24`}
      aria-labelledby="shop-by-collection-heading"
    >
      <div className="w-full px-4 text-center sm:px-6 lg:mx-auto lg:max-w-7xl lg:px-8">
        <h2
          id="shop-by-collection-heading"
          className="text-2xl font-light tracking-wide text-zinc-950 min-[480px]:text-3xl sm:text-4xl md:text-[2.75rem] lg:text-5xl"
        >
          Shop By Collection
        </h2>
      </div>

      <div className="mt-8 w-full overflow-hidden sm:mt-10 md:mt-12 lg:mt-14">
        <CollectionCarousel items={items} />
      </div>
    </section>
  );
}
