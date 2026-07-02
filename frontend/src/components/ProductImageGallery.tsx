"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";

const ZOOM_LEVEL = 2.5;

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
  const [origin, setOrigin] = useState({ x: 50, y: 50 });

  useEffect(() => {
    const media = window.matchMedia("(hover: hover) and (pointer: fine)");
    const update = () => setZoomEnabled(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  const updateOrigin = useCallback(
    (clientX: number, clientY: number) => {
      const container = containerRef.current;
      if (!container || !zoomEnabled) return;

      const rect = container.getBoundingClientRect();
      const x = ((clientX - rect.left) / rect.width) * 100;
      const y = ((clientY - rect.top) / rect.height) * 100;

      setOrigin({
        x: Math.max(0, Math.min(100, x)),
        y: Math.max(0, Math.min(100, y)),
      });
    },
    [zoomEnabled],
  );

  const handleMouseEnter = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!zoomEnabled) return;
    setZoomActive(true);
    updateOrigin(event.clientX, event.clientY);
  };

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!zoomEnabled || !zoomActive) return;
    updateOrigin(event.clientX, event.clientY);
  };

  const handleMouseLeave = () => {
    setZoomActive(false);
    setOrigin({ x: 50, y: 50 });
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
          className="object-cover transition-transform duration-300 ease-out"
          style={{
            transform: zoomActive ? `scale(${ZOOM_LEVEL})` : "scale(1)",
            transformOrigin: `${origin.x}% ${origin.y}%`,
          }}
          sizes="(max-width: 1024px) 100vw, 45vw"
          priority
        />
      </div>

      <div className="flex gap-2 overflow-x-auto pb-0.5 sm:gap-2.5">
        {safe.map((src, i) => (
          <button
            key={`${src}-${i}`}
            type="button"
            onClick={() => {
              setActive(i);
              setZoomActive(false);
              setOrigin({ x: 50, y: 50 });
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
