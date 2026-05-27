"use client";

import { Great_Vibes } from "next/font/google";
import { useEffect, useState } from "react";

const logoScript = Great_Vibes({
  weight: "400",
  subsets: ["latin"],
});

const MIN_DISPLAY_MS = 700;
const FADE_OUT_MS = 500;

export default function InitialSiteLoader() {
  const [fadeOut, setFadeOut] = useState(false);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const startedAt = Date.now();

    const finish = () => {
      const remaining = Math.max(0, MIN_DISPLAY_MS - (Date.now() - startedAt));
      window.setTimeout(() => {
        setFadeOut(true);
        document.body.style.overflow = "";
        window.setTimeout(() => setHidden(true), FADE_OUT_MS);
      }, remaining);
    };

    document.body.style.overflow = "hidden";

    if (document.readyState === "complete") {
      finish();
      return () => {
        document.body.style.overflow = "";
      };
    }

    window.addEventListener("load", finish, { once: true });
    return () => {
      window.removeEventListener("load", finish);
      document.body.style.overflow = "";
    };
  }, []);

  if (hidden) {
    return null;
  }

  return (
    <div
      className={`fixed inset-0 z-[9999] flex items-center justify-center bg-white transition-opacity duration-500 ease-out ${
        fadeOut ? "pointer-events-none opacity-0" : "opacity-100"
      }`}
      role="status"
      aria-live="polite"
      aria-busy={!fadeOut}
      aria-label="Loading website"
    >
      <span
        className={`${logoScript.className} animate-pulse text-[2.25rem] leading-none text-zinc-950 sm:text-[3rem]`}
      >
        Jewelry
      </span>
    </div>
  );
}
