"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";

const LENS_SIZE = 140;
const ZOOM_LEVEL = 2.5;

type LensPosition = {
  x: number;
  y: number;
  backgroundX: number;
  backgroundY: number;
  backgroundWidth: number;
  backgroundHeight: number;
};

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
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoomEnabled, setZoomEnabled] = useState(false);
  const [zoomActive, setZoomActive] = useState(false);
  const [lens, setLens] = useState<LensPosition | null>(null);

  useEffect(() => {
    const media = window.matchMedia("(hover: hover) and (pointer: fine)");
    const update = () => setZoomEnabled(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  const updateLens = useCallback(
    (clientX: number, clientY: number) => {
      const container = containerRef.current;
      if (!container || !zoomEnabled) return;

      const rect = container.getBoundingClientRect();
      const localX = clientX - rect.left;
      const localY = clientY - rect.top;

      const half = LENS_SIZE / 2;
      const clampedX = Math.max(half, Math.min(rect.width - half, localX));
      const clampedY = Math.max(half, Math.min(rect.height - half, localY));

      const backgroundWidth = rect.width * ZOOM_LEVEL;
      const backgroundHeight = rect.height * ZOOM_LEVEL;

      setLens({
        x: clampedX - half,
        y: clampedY - half,
        backgroundX: -(clampedX * ZOOM_LEVEL - half),
        backgroundY: -(clampedY * ZOOM_LEVEL - half),
        backgroundWidth,
        backgroundHeight,
      });
    },
    [zoomEnabled],
  );

  const handleMouseEnter = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!zoomEnabled) return;
    setZoomActive(true);
    updateLens(event.clientX, event.clientY);
  };

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!zoomEnabled || !zoomActive) return;
    updateLens(event.clientX, event.clientY);
  };

  const handleMouseLeave = () => {
    setZoomActive(false);
    setLens(null);
  };

  if (safe.length === 0 || !mainSrc) {
    return (
      <div className="flex aspect-square w-full items-center justify-center bg-zinc-100 text-sm text-zinc-500">
        No image
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 sm:gap-4">
      <div
        ref={containerRef}
        className={`relative aspect-square w-full overflow-hidden bg-zinc-100 ${
          zoomEnabled ? "cursor-zoom-in" : ""
        }`}
        onMouseEnter={handleMouseEnter}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <Image
          src={mainSrc}
          alt={alt}
          fill
          className="object-cover"
          sizes="(max-width: 1024px) 100vw, 45vw"
          priority
        />

        {zoomEnabled && zoomActive && lens ? (
          <div
            className="pointer-events-none absolute z-10 rounded-full border-2 border-white/90 shadow-[0_8px_24px_rgba(0,0,0,0.18)] ring-1 ring-zinc-900/10"
            style={{
              width: LENS_SIZE,
              height: LENS_SIZE,
              left: lens.x,
              top: lens.y,
            }}
            aria-hidden
          >
            <div
              className="h-full w-full rounded-full"
              style={{
                backgroundImage: `url(${mainSrc})`,
                backgroundRepeat: "no-repeat",
                backgroundSize: `${lens.backgroundWidth}px ${lens.backgroundHeight}px`,
                backgroundPosition: `${lens.backgroundX}px ${lens.backgroundY}px`,
              }}
            />
          </div>
        ) : null}
      </div>

      <div className="flex gap-2 overflow-x-auto pb-0.5 sm:gap-2.5">
        {safe.map((src, i) => (
          <button
            key={`${src}-${i}`}
            type="button"
            onClick={() => {
              setActive(i);
              setZoomActive(false);
              setLens(null);
            }}
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
