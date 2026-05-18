"use client";

import Image from "next/image";
import { useState } from "react";

export default function ProductImageGallery({
  images,
  alt,
}: {
  images: string[];
  alt: string;
}) {
  const safe = images.length > 0 ? images : [];
  const [active, setActive] = useState(0);
  const mainSrc = safe[active] ?? safe[0];

  if (safe.length === 0 || !mainSrc) {
    return (
      <div className="flex aspect-square w-full items-center justify-center bg-zinc-100 text-sm text-zinc-500">
        No image
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 sm:gap-4">
      <div className="relative aspect-square w-full bg-zinc-100">
        <Image
          src={mainSrc}
          alt={alt}
          fill
          className="object-cover"
          sizes="(max-width: 1024px) 100vw, 45vw"
          priority
        />
      </div>
      <div className="flex gap-2 overflow-x-auto pb-0.5 sm:gap-2.5">
        {safe.map((src, i) => (
          <button
            key={`${src}-${i}`}
            type="button"
            onClick={() => setActive(i)}
            className={`relative h-14 w-14 shrink-0 cursor-pointer overflow-hidden bg-zinc-100 sm:h-[4.75rem] sm:w-[4.75rem] ${
              active === i
                ? "border-2 border-zinc-900"
                : "border border-zinc-200 hover:border-zinc-400"
            }`}
            aria-label={i === 0 ? alt : `${alt} — view ${i + 1}`}
            aria-pressed={active === i}
          >
            <Image
              src={src}
              alt=""
              fill
              className="object-cover"
              sizes="76px"
            />
          </button>
        ))}
      </div>
    </div>
  );
}
