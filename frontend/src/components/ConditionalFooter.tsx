"use client";

import { usePathname } from "next/navigation";
import Footer from "@/components/Footer";

const HIDE_FOOTER_PREFIXES = ["/cart", "/checkout", "/login"];

export default function ConditionalFooter() {
  const pathname = usePathname();
  if (HIDE_FOOTER_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return null;
  }
  return <Footer />;
}
