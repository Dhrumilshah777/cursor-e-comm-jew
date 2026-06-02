"use client";

import { usePathname } from "next/navigation";
import Footer from "@/components/Footer";

const HIDE_FOOTER_PREFIXES = ["/cart", "/checkout", "/login", "/account", "/admin"];
/** Footer is rendered at the bottom of these pages directly. */
const PAGE_FOOTER_PREFIXES = ["/collections"];

export default function ConditionalFooter() {
  const pathname = usePathname();
  if (HIDE_FOOTER_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return null;
  }
  if (PAGE_FOOTER_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return null;
  }
  return <Footer />;
}
