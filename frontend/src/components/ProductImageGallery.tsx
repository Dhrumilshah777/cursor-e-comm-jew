"use client";

import { setProductLightboxOpen } from "@/lib/productLightbox";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { IoClose } from "react-icons/io5";

const ZOOM_LEVEL = 2.5;
const LIGHTBOX_TRANSITION_MS = 450;
const ZOOM_TRANSITION_MS = 400;

type ImageRect = {
  top: number;
  left: number;
  width: number;
  height: number;
};

function isExternalImage(src: string): boolean {
  return src.startsWith("http");
}

function getLightboxTargetRect(): ImageRect {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const size = Math.min(vw * 0.9, vh - 128);

  return {
    top: (vh - size) / 2,
    left: (vw - size) / 2,
    width: size,
    height: size,
  };
}

export default function ProductImageGallery({
  images,
  alt,
}: {
  images: string[];
  alt: string;
}) {
  const safe = images.length > 0 ? images : [];
  const [active, setActive] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxEntered, setLightboxEntered] = useState(false);
  const [flightComplete, setFlightComplete] = useState(false);
  const [openingRect, setOpeningRect] = useState<ImageRect | null>(null);
  const [targetRect, setTargetRect] = useState<ImageRect>(() =>
    getLightboxTargetRect(),
  );
  const mainSrc = safe[active] ?? safe[0];
  const lightboxSrc = mainSrc;

  const mainImageRef = useRef<HTMLButtonElement>(null);
  const closeTimerRef = useRef<number | null>(null);
  const lightboxOpenRef = useRef(false);

  const [zoomActive, setZoomActive] = useState(false);
  const [zoomExpanded, setZoomExpanded] = useState(false);
  const [viewport, setViewport] = useState({ width: 0, height: 0 });
  const [origin, setOrigin] = useState({ x: 50, y: 50 });

  const hasThumbs = safe.length > 1;
  const galleryFrame = lightboxEntered ? targetRect : openingRect ?? targetRect;
  const fullScreenFrame = {
    top: 0,
    left: 0,
    width: viewport.width,
    height: viewport.height,
  };
  const displayFrame =
    zoomExpanded || zoomActive ? fullScreenFrame : galleryFrame;
  lightboxOpenRef.current = lightboxOpen;

  useEffect(() => {
    return () => {
      if (closeTimerRef.current !== null) {
        window.clearTimeout(closeTimerRef.current);
      }
    };
  }, []);

  const closeLightbox = useCallback(() => {
    if (!lightboxOpenRef.current) return;

    if (closeTimerRef.current !== null) {
      window.clearTimeout(closeTimerRef.current);
    }

    setZoomActive(false);
    setZoomExpanded(false);
    setOrigin({ x: 50, y: 50 });
    setFlightComplete(false);

    const rect = mainImageRef.current?.getBoundingClientRect();
    if (rect) {
      setOpeningRect({
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
      });
    }

    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (prefersReduced) {
      setLightboxOpen(false);
      setLightboxEntered(false);
      setOpeningRect(null);
      return;
    }

    setLightboxEntered(false);
    closeTimerRef.current = window.setTimeout(() => {
      setLightboxOpen(false);
      setOpeningRect(null);
      closeTimerRef.current = null;
    }, LIGHTBOX_TRANSITION_MS);
  }, []);

  useEffect(() => {
    setProductLightboxOpen(lightboxOpen);
    return () => setProductLightboxOpen(false);
  }, [lightboxOpen]);

  useEffect(() => {
    if (!lightboxOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    setTargetRect(getLightboxTargetRect());
    setViewport({ width: window.innerWidth, height: window.innerHeight });
    setLightboxEntered(false);
    setFlightComplete(false);
    setZoomActive(false);
    setZoomExpanded(false);
    setOrigin({ x: 50, y: 50 });

    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    let rafId = 0;
    if (prefersReduced) {
      setLightboxEntered(true);
      setFlightComplete(true);
    } else {
      rafId = requestAnimationFrame(() => {
        requestAnimationFrame(() => setLightboxEntered(true));
      });
    }

    const onResize = () => {
      setTargetRect(getLightboxTargetRect());
      setViewport({ width: window.innerWidth, height: window.innerHeight });
    };
    window.addEventListener("resize", onResize);

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeLightbox();
      }
    };

    window.addEventListener("keydown", onKeyDown);

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [lightboxOpen, closeLightbox]);

  const updateOrigin = useCallback((clientX: number, clientY: number) => {
    setOrigin({
      x: (clientX / window.innerWidth) * 100,
      y: (clientY / window.innerHeight) * 100,
    });
  }, []);

  const toggleLightboxZoom = (event: React.MouseEvent<HTMLDivElement>) => {
    event.stopPropagation();

    if (zoomActive) {
      setZoomActive(false);
      return;
    }

    updateOrigin(event.clientX, event.clientY);
    setZoomExpanded(true);
    setZoomActive(true);
  };

  const handleZoomTransitionEnd = (
    event: React.TransitionEvent<HTMLDivElement>,
  ) => {
    if (event.propertyName !== "transform") return;

    if (!zoomActive && zoomExpanded) {
      setZoomExpanded(false);
      setOrigin({ x: 50, y: 50 });
    }
  };

  const openLightbox = () => {
    const rect = mainImageRef.current?.getBoundingClientRect();
    if (rect) {
      setOpeningRect({
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
      });
    } else {
      setOpeningRect(null);
    }

    setViewport({ width: window.innerWidth, height: window.innerHeight });
    setLightboxOpen(true);
    setZoomActive(false);
    setZoomExpanded(false);
    setOrigin({ x: 50, y: 50 });
  };

  const handleFlightTransitionEnd = (
    event: React.TransitionEvent<HTMLDivElement>,
  ) => {
    if (event.propertyName !== "width" || !lightboxEntered) return;
    setFlightComplete(true);
  };

  if (safe.length === 0 || !mainSrc) {
    return (
      <div className="flex aspect-square w-full items-center justify-center bg-zinc-100 text-sm text-zinc-500">
        No image
      </div>
    );
  }

  const frameTransition = `top ${LIGHTBOX_TRANSITION_MS}ms cubic-bezier(0.22, 1, 0.36, 1), left ${LIGHTBOX_TRANSITION_MS}ms cubic-bezier(0.22, 1, 0.36, 1), width ${LIGHTBOX_TRANSITION_MS}ms cubic-bezier(0.22, 1, 0.36, 1), height ${LIGHTBOX_TRANSITION_MS}ms cubic-bezier(0.22, 1, 0.36, 1)`;
  const zoomTransition = `transform ${ZOOM_TRANSITION_MS}ms cubic-bezier(0.22, 1, 0.36, 1)`;

  return (
    <>
      <div className="flex flex-col gap-3 sm:gap-4">
        <button
          ref={mainImageRef}
          type="button"
          onClick={openLightbox}
          className="relative aspect-square w-full cursor-zoom-in overflow-hidden bg-zinc-100"
          aria-label={`Open ${alt} image`}
        >
          <Image
            src={mainSrc}
            alt={alt}
            fill
            className="object-cover"
            sizes="(max-width: 1024px) 100vw, 45vw"
            priority
            unoptimized={!isExternalImage(mainSrc)}
          />
        </button>

        {hasThumbs ? (
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
                  unoptimized={!isExternalImage(src)}
                />
              </button>
            ))}
          </div>
        ) : null}
      </div>

      {lightboxOpen ? (
        <div
          className={`fixed inset-0 z-50 bg-white transition-opacity duration-300 ${
            lightboxEntered ? "opacity-100" : "opacity-0"
          }`}
          style={{ transitionDuration: `${LIGHTBOX_TRANSITION_MS}ms` }}
          role="dialog"
          aria-modal="true"
          aria-label={`${alt} image`}
          onClick={closeLightbox}
        >
          <button
            type="button"
            onClick={closeLightbox}
            className={`absolute right-4 top-4 z-[70] flex h-10 w-10 items-center justify-center rounded-full bg-zinc-100 text-zinc-900 transition hover:bg-zinc-200 ${
              lightboxEntered ? "opacity-100" : "pointer-events-none opacity-0"
            }`}
            style={{ transitionDuration: `${LIGHTBOX_TRANSITION_MS}ms` }}
            aria-label="Close image"
          >
            <IoClose className="h-6 w-6" />
          </button>

          <div onClick={(event) => event.stopPropagation()}>
            <div
              role="button"
              tabIndex={0}
              onClick={toggleLightboxZoom}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  if (zoomActive) {
                    setZoomActive(false);
                  } else {
                    updateOrigin(window.innerWidth / 2, window.innerHeight / 2);
                    setZoomExpanded(true);
                    setZoomActive(true);
                  }
                }
              }}
              onTransitionEnd={handleFlightTransitionEnd}
              className={`fixed z-[60] overflow-hidden bg-white ${
                zoomActive ? "cursor-zoom-out" : "cursor-zoom-in"
              }`}
              style={{
                top: displayFrame.top,
                left: displayFrame.left,
                width: displayFrame.width,
                height: displayFrame.height,
                transition: frameTransition,
              }}
              aria-label={zoomActive ? "Zoom out image" : "Zoom in image"}
            >
              {lightboxSrc ? (
                <div
                  className="absolute inset-0"
                  style={{
                    transform: zoomActive ? `scale(${ZOOM_LEVEL})` : "scale(1)",
                    transformOrigin: `${origin.x}% ${origin.y}%`,
                    transition: zoomTransition,
                  }}
                  onTransitionEnd={handleZoomTransitionEnd}
                >
                  <Image
                    src={lightboxSrc}
                    alt={alt}
                    fill
                    className={
                      flightComplete || zoomExpanded
                        ? "object-contain"
                        : "object-cover"
                    }
                    sizes="100vw"
                    unoptimized={!isExternalImage(lightboxSrc)}
                  />
                </div>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
