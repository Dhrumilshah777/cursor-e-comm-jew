"use client";

import Navbar from "@/components/Navbar";
import { PRODUCT_LIGHTBOX_EVENT } from "@/lib/productLightbox";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const HIDE_NAVBAR_PREFIXES = ["/checkout", "/login"];

export default function ConditionalNavbar() {
  const pathname = usePathname();
  const [lightboxOpen, setLightboxOpen] = useState(false);

  useEffect(() => {
    const onLightboxChange = (event: Event) => {
      const detail = (event as CustomEvent<{ open: boolean }>).detail;
      setLightboxOpen(Boolean(detail?.open));
    };

    window.addEventListener(PRODUCT_LIGHTBOX_EVENT, onLightboxChange);
    return () => window.removeEventListener(PRODUCT_LIGHTBOX_EVENT, onLightboxChange);
  }, []);

  if (
    lightboxOpen ||
    HIDE_NAVBAR_PREFIXES.some((prefix) => pathname.startsWith(prefix))
  ) {
    return null;
  }

  return <Navbar />;
}
