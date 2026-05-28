"use client";

import Link from "next/link";
import { Great_Vibes } from "next/font/google";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
  IoCloseOutline,
  IoMenuOutline,
  IoPersonOutline,
  IoSearchOutline,
} from "react-icons/io5";
import CartNavLink from "@/components/cart/CartNavLink";
import SearchOverlay from "@/components/SearchOverlay";
import {
  CUSTOMER_AUTH_CHANGED_EVENT,
  fetchCustomerMe,
  type CustomerUser,
} from "@/lib/customerAuth";

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
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [customer, setCustomer] = useState<CustomerUser | null>(null);

  const linkTop =
    "text-[11px] font-light uppercase tracking-[0.22em] text-zinc-800 transition-colors hover:text-zinc-500";
  const linkMain =
    "whitespace-nowrap text-[11px] font-light uppercase tracking-[0.18em] text-zinc-800 transition-colors hover:text-zinc-500 sm:text-xs";
  const linkMobile =
    "block py-3 text-sm font-light uppercase tracking-[0.2em] text-zinc-800 transition-colors hover:text-zinc-500";

  const closeMenu = useCallback(() => setMenuOpen(false), []);
  const closeSearch = useCallback(() => setSearchOpen(false), []);

  useEffect(() => {
    let cancelled = false;

    const loadCustomer = () => {
      fetchCustomerMe()
        .then((user) => {
          if (!cancelled) setCustomer(user);
        })
        .catch(() => {
          if (!cancelled) setCustomer(null);
        });
    };

    loadCustomer();
    window.addEventListener(CUSTOMER_AUTH_CHANGED_EVENT, loadCustomer);

    return () => {
      cancelled = true;
      window.removeEventListener(CUSTOMER_AUTH_CHANGED_EVENT, loadCustomer);
    };
  }, []);

  const handleAccountClick = useCallback(() => {
    closeMenu();
    router.push(customer ? "/account" : "/login");
  }, [closeMenu, customer, router]);

  useEffect(() => {
    if (searchOpen) return;
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen, searchOpen]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (searchOpen) {
          closeSearch();
          return;
        }
        closeMenu();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [closeMenu, closeSearch, searchOpen]);

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 1024) closeMenu();
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [closeMenu]);

  return (
    <header className="sticky top-0 z-[70] bg-white pt-4 sm:pt-5">
      <div className="border-b border-zinc-200 lg:border-b-0">
        <div className="relative mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:grid lg:grid-cols-[1fr_auto_1fr] lg:px-8">
          <div className="flex min-w-0 flex-1 items-center justify-start lg:min-w-0">
            <button
              type="button"
              className="flex h-10 w-10 items-center justify-center text-xl text-zinc-800 transition-opacity hover:opacity-70 lg:hidden"
              onClick={() => setMenuOpen((open) => !open)}
              aria-expanded={menuOpen}
              aria-controls="mobile-nav-menu"
              aria-label={menuOpen ? "Close menu" : "Open menu"}
            >
              {menuOpen ? (
                <IoCloseOutline className="text-[1.35rem]" aria-hidden="true" />
              ) : (
                <IoMenuOutline className="text-[1.35rem]" aria-hidden="true" />
              )}
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

          <div className="flex min-w-0 flex-1 items-center justify-end">
            <div className="flex shrink-0 items-center gap-2 sm:gap-3 lg:gap-4">
              <button
                type="button"
                onClick={() => {
                  closeMenu();
                  setSearchOpen(true);
                }}
                className={`flex cursor-pointer items-center gap-2 ${linkTop}`}
                aria-expanded={searchOpen}
                aria-controls="search-overlay"
                aria-label="Open search"
              >
                <IoSearchOutline
                  className="text-base leading-none sm:text-[inherit]"
                  aria-hidden="true"
                />
                <span className="hidden min-[400px]:inline">SEARCH</span>
              </button>
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
                onClick={handleAccountClick}
                className={`flex cursor-pointer items-center gap-2 ${linkTop}`}
                aria-label={customer ? "Account" : "Login"}
              >
                <IoPersonOutline
                  className="text-base leading-none sm:text-[inherit]"
                  aria-hidden="true"
                />
                <span className="hidden min-[400px]:inline">
                  {customer ? "ACCOUNT" : "LOGIN"}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

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
        className={`fixed inset-y-0 left-0 z-[65] w-[min(20rem,88vw)] overflow-y-auto border-r border-zinc-200 bg-white shadow-xl transition-transform duration-300 ease-out lg:hidden ${
          menuOpen
            ? "translate-x-0"
            : "-translate-x-full pointer-events-none"
        }`}
        aria-label="Mobile"
        aria-hidden={!menuOpen}
      >
        <div className="sticky top-0 z-10 flex items-center justify-end border-b border-zinc-100 bg-white px-4 py-3">
          <button
            type="button"
            onClick={closeMenu}
            className="flex h-10 w-10 items-center justify-center text-xl text-zinc-800 transition-opacity hover:opacity-70"
            aria-label="Close menu"
          >
            <IoCloseOutline className="text-[1.35rem]" aria-hidden="true" />
          </button>
        </div>

        <div className="px-6 pb-8 pt-6">
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

      <SearchOverlay open={searchOpen} onClose={closeSearch} />
    </header>
  );
}
