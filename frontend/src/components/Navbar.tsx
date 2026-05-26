"use client";

import Link from "next/link";
import { Great_Vibes } from "next/font/google";
import { useCallback, useEffect, useState } from "react";
import CartNavLink from "@/components/cart/CartNavLink";
import LoginModal from "@/components/LoginModal";

const logoScript = Great_Vibes({
  weight: "400",
  subsets: ["latin"],
});

const utilityLinks = [
  { href: "#", label: "INDIA" },
  { href: "/contact", label: "CONTACT US" },
  { href: "/services", label: "SERVICES" },
] as const;

const mainNavLinks = [
  { href: "/", label: "HOME" },
  { href: "/collections", label: "COLLECTIONS" },
  { href: "/new-arrivals", label: "NEW ARRIVALS" },
  { href: "/about", label: "ABOUT US" },
  { href: "/contact", label: "CONTACT" },
] as const;

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);

  const waNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER?.replace(/\D/g, "");
  const whatsappHref = waNumber
    ? `https://wa.me/${waNumber}`
    : "https://wa.me/";

  const linkTop =
    "text-[11px] font-light uppercase tracking-[0.22em] text-zinc-800 transition-colors hover:text-zinc-500";
  const linkMain =
    "whitespace-nowrap text-[11px] font-light uppercase tracking-[0.18em] text-zinc-800 transition-colors hover:text-zinc-500 sm:text-xs";
  const linkMobile =
    "block py-3 text-sm font-light uppercase tracking-[0.2em] text-zinc-800 transition-colors hover:text-zinc-500";

  const closeMenu = useCallback(() => setMenuOpen(false), []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeMenu();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [closeMenu]);

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 1024) closeMenu();
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [closeMenu]);

  return (
    <header className="sticky top-0 z-[70] bg-white pt-4 sm:pt-5">
      {/* Top tier — hamburger | logo (center) | WhatsApp + retailer */}
      <div className="border-b border-zinc-200 lg:border-b-0">
        <div className="relative mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:grid lg:grid-cols-[1fr_auto_1fr] lg:px-8">
          {/* Left — hamburger (mobile) / utility links (desktop) */}
          <div className="flex min-w-0 flex-1 items-center justify-start lg:min-w-0">
            <button
              type="button"
              className="flex h-10 w-10 items-center justify-center text-xl text-zinc-800 transition-opacity hover:opacity-70 lg:hidden"
              onClick={() => setMenuOpen((open) => !open)}
              aria-expanded={menuOpen}
              aria-controls="mobile-nav-menu"
              aria-label={menuOpen ? "Close menu" : "Open menu"}
            >
              <i
                className={`leading-none ${menuOpen ? "fa-solid fa-xmark" : "fa-solid fa-bars"}`}
                aria-hidden="true"
              />
            </button>

            <nav
              className="hidden flex-wrap items-center gap-x-4 gap-y-1 lg:flex"
              aria-label="Utility"
            >
              {utilityLinks.map(({ href, label }) => (
                <Link key={label} href={href} className={linkTop}>
                  {label}
                </Link>
              ))}
            </nav>
          </div>

          {/* Logo — always centered */}
          <Link
            href="/"
            className="absolute left-1/2 shrink-0 -translate-x-1/2 px-3 text-center sm:px-6 lg:static lg:translate-x-0 lg:justify-self-center"
            aria-label="Home"
            onClick={closeMenu}
          >
            <span
              className={`${logoScript.className} block text-[1.75rem] leading-tight text-zinc-950 sm:text-[2.25rem]`}
            >
              Jewelry
            </span>
          </Link>

          {/* Right — WhatsApp + login */}
          <div className="flex min-w-0 flex-1 items-center justify-end">
            <div className="flex shrink-0 items-center gap-2 sm:gap-3 lg:gap-4">
              <a
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className={`flex items-center gap-2 ${linkTop}`}
              >
                <i
                  className="fa-brands fa-whatsapp text-base leading-none sm:text-[inherit]"
                  aria-hidden="true"
                />
                <span className="hidden min-[400px]:inline">WHATSAPP</span>
              </a>
              <span
                className="h-7 w-px shrink-0 bg-zinc-300"
                aria-hidden="true"
              />
              <CartNavLink />
              <span
                className="h-7 w-px shrink-0 bg-zinc-300"
                aria-hidden="true"
              />
              <button
                type="button"
                onClick={() => setLoginOpen(true)}
                className={`flex cursor-pointer items-center gap-2 ${linkTop}`}
                aria-haspopup="dialog"
                aria-expanded={loginOpen}
              >
                <i
                  className="fa-regular fa-user text-base leading-none sm:text-[inherit]"
                  aria-hidden="true"
                />
                <span className="hidden min-[400px]:inline">LOGIN</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop main nav */}
      <div className="hidden border-b border-zinc-200 lg:block">
        <nav
          className="mx-auto flex max-w-7xl items-center justify-center gap-9 px-6 pt-3.5 pb-7 lg:px-8"
          aria-label="Main"
        >
          {mainNavLinks.map(({ href, label }) => (
            <Link key={href} href={href} className={linkMain}>
              {label}
            </Link>
          ))}
        </nav>
      </div>

      {/* Mobile / tablet menu overlay */}
      <div
        className={`fixed inset-0 z-[60] bg-black/30 transition-opacity duration-300 lg:hidden ${
          menuOpen
            ? "visible opacity-100"
            : "invisible opacity-0 pointer-events-none"
        }`}
        onClick={closeMenu}
        aria-hidden={!menuOpen}
      />

      <nav
        id="mobile-nav-menu"
        className={`fixed inset-y-0 left-0 z-[65] w-[min(20rem,88vw)] overflow-y-auto border-r border-zinc-200 bg-white px-6 pb-8 pt-24 shadow-xl transition-transform duration-300 ease-out lg:hidden ${
          menuOpen
            ? "translate-x-0"
            : "-translate-x-full pointer-events-none"
        }`}
        aria-label="Mobile"
        aria-hidden={!menuOpen}
      >
        <div className="mx-auto max-w-md">
          <p className="mb-2 text-[10px] font-light uppercase tracking-[0.28em] text-zinc-400">
            Explore
          </p>
          <ul className="border-b border-zinc-100 pb-4">
            {mainNavLinks.map(({ href, label }) => (
              <li key={href}>
                <Link href={href} className={linkMobile} onClick={closeMenu}>
                  {label}
                </Link>
              </li>
            ))}
          </ul>

          <p className="mb-2 mt-6 text-[10px] font-light uppercase tracking-[0.28em] text-zinc-400">
            More
          </p>
          <ul>
            {utilityLinks.map(({ href, label }) => (
              <li key={label}>
                <Link href={href} className={linkMobile} onClick={closeMenu}>
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </nav>

      <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} />
    </header>
  );
}
