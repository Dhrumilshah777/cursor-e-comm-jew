"use client";

import { usePathname } from "next/navigation";
import Navbar from "@/components/Navbar";

const HIDE_NAVBAR_PREFIXES = ["/checkout", "/login"];

export default function ConditionalNavbar() {
  const pathname = usePathname();
  if (HIDE_NAVBAR_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return null;
  }
  return <Navbar />;
}
