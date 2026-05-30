"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useEffect, useRef, useState } from "react";
import { IoCloseOutline, IoSearchOutline } from "react-icons/io5";
import type { CollectionProduct } from "@/data/collections";
import { getApiBaseUrl } from "@/lib/api";
import {
  getMockProducts,
  isMockDataEnabled,
  searchMockProducts,
} from "@/lib/mockData";

const CLIENT_FETCH_TIMEOUT_MS = 4_000;

const popularSearches = [
  { label: "Rings", href: "/collections/rings" },
  { label: "Necklaces", href: "/collections/necklaces" },
  { label: "Earrings", href: "/collections/earrings" },
  { label: "Bracelets", href: "/collections/bracelets" },
] as const;

const SUGGESTED_COUNT = 5;

function pickRandomProducts(
  products: CollectionProduct[],
  count: number,
): CollectionProduct[] {
  const shuffled = [...products];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.slice(0, count);
}

type SearchOverlayProps = {
  open: boolean;
  onClose: () => void;
};

export default function SearchOverlay({ open, onClose }: SearchOverlayProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<CollectionProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [randomProducts, setRandomProducts] = useState<CollectionProduct[]>([]);
  const [loadingRandom, setLoadingRandom] = useState(true);

  useEffect(() => {
    if (!open) {
      setQuery("");
      setSuggestions([]);
      return;
    }

    inputRef.current?.focus();
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  useEffect(() => {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), CLIENT_FETCH_TIMEOUT_MS);

    (async () => {
      setLoadingRandom(true);
      try {
        if (isMockDataEnabled()) {
          setRandomProducts(
            pickRandomProducts(getMockProducts(), SUGGESTED_COUNT),
          );
          return;
        }

        const url = new URL("/api/products", getApiBaseUrl());
        const response = await fetch(url.toString(), {
          signal: controller.signal,
        });
        if (!response.ok) {
          setRandomProducts(
            pickRandomProducts(getMockProducts(), SUGGESTED_COUNT),
          );
          return;
        }
        const data = (await response.json()) as { products: CollectionProduct[] };
        setRandomProducts(pickRandomProducts(data.products, SUGGESTED_COUNT));
      } catch {
        if (!controller.signal.aborted) {
          setRandomProducts(
            pickRandomProducts(getMockProducts(), SUGGESTED_COUNT),
          );
        }
      } finally {
        window.clearTimeout(timeoutId);
        if (!controller.signal.aborted) {
          setLoadingRandom(false);
        }
      }
    })();

    return () => {
      controller.abort();
      window.clearTimeout(timeoutId);
    };
  }, []);

  useEffect(() => {
    const trimmed = query.trim();
    if (!open || trimmed.length < 2) {
      setSuggestions([]);
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), CLIENT_FETCH_TIMEOUT_MS);
    const searchTimeoutId = window.setTimeout(async () => {
      setLoading(true);
      try {
        if (isMockDataEnabled()) {
          setSuggestions(searchMockProducts(trimmed).slice(0, 6));
          return;
        }

        const url = new URL("/api/products", getApiBaseUrl());
        url.searchParams.set("q", trimmed);
        const response = await fetch(url.toString(), {
          signal: controller.signal,
        });
        if (!response.ok) {
          setSuggestions(searchMockProducts(trimmed).slice(0, 6));
          return;
        }
        const data = (await response.json()) as { products: CollectionProduct[] };
        setSuggestions(data.products.slice(0, 6));
      } catch {
        if (!controller.signal.aborted) {
          setSuggestions(searchMockProducts(trimmed).slice(0, 6));
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }, 300);

    return () => {
      controller.abort();
      window.clearTimeout(timeoutId);
      window.clearTimeout(searchTimeoutId);
    };
  }, [open, query]);

  const goToSearch = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return;
    onClose();
    router.push(`/search?q=${encodeURIComponent(trimmed)}`);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    goToSearch(query);
  };

  return (
    <>
      <div
        id="search-overlay"
        className={`fixed inset-0 z-[80] min-h-[100dvh] overflow-y-auto bg-[#f5f1ed] transition-transform duration-300 ease-out ${
          open ? "translate-y-0" : "-translate-y-full pointer-events-none"
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Search products"
        aria-hidden={!open}
      >
        <div className="mx-auto w-full max-w-xl px-6 pb-10 pt-8 sm:px-8 sm:pt-10">
          <form onSubmit={handleSubmit} role="search">
            <div className="flex items-center gap-3 border-b border-zinc-300/80 pb-3">
              <input
                ref={inputRef}
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search products..."
                className="min-w-0 flex-1 bg-transparent text-base font-light text-zinc-800 placeholder:text-zinc-400 focus:outline-none sm:text-lg"
                aria-label="Search products"
              />
              <button
                type="button"
                onClick={onClose}
                className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center text-zinc-700 transition hover:text-zinc-900"
                aria-label="Close search"
              >
                <IoCloseOutline className="text-xl" aria-hidden="true" />
              </button>
              <button
                type="submit"
                className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center text-zinc-700 transition hover:text-zinc-900"
                aria-label="Search"
              >
                <IoSearchOutline className="text-xl" aria-hidden="true" />
              </button>
            </div>
          </form>

          <div className="mt-10">
            <p className="text-[11px] font-normal uppercase tracking-[0.24em] text-zinc-800">
              Popular searches
            </p>
            <div className="mt-4 flex flex-wrap gap-x-8 gap-y-2">
              {popularSearches.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  className="text-sm font-light text-zinc-700 transition hover:text-zinc-900"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="mt-10">
            <p className="text-[11px] font-normal uppercase tracking-[0.24em] text-zinc-800">
              Suggested for you
            </p>

            {query.trim().length < 2 ? (
              loadingRandom ? (
                <p className="mt-4 text-sm font-light text-zinc-500">Loading…</p>
              ) : randomProducts.length > 0 ? (
                <ul className="mt-4 space-y-3">
                  {randomProducts.map((product) => (
                    <li key={product.id}>
                      <Link
                        href={`/products/${product.slug}`}
                        onClick={onClose}
                        className="flex items-center gap-3 transition hover:opacity-80"
                      >
                        <div className="relative h-12 w-12 shrink-0 overflow-hidden bg-zinc-200">
                          <Image
                            src={product.image}
                            alt={product.alt}
                            fill
                            className="object-cover"
                            sizes="48px"
                          />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-light text-zinc-800">
                            {product.name}
                          </p>
                          <p className="text-xs font-light text-zinc-500">
                            {product.price}
                          </p>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-4 text-sm font-light text-zinc-500">
                  No products available right now.
                </p>
              )
            ) : loading ? (
              <p className="mt-4 text-sm font-light text-zinc-500">Searching…</p>
            ) : suggestions.length > 0 ? (
              <ul className="mt-4 space-y-3">
                {suggestions.map((product) => (
                  <li key={product.id}>
                    <Link
                      href={`/products/${product.slug}`}
                      onClick={onClose}
                      className="flex items-center gap-3 transition hover:opacity-80"
                    >
                      <div className="relative h-12 w-12 shrink-0 overflow-hidden bg-zinc-200">
                        <Image
                          src={product.image}
                          alt={product.alt}
                          fill
                          className="object-cover"
                          sizes="48px"
                        />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-light text-zinc-800">
                          {product.name}
                        </p>
                        <p className="text-xs font-light text-zinc-500">{product.price}</p>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-4 text-sm font-light text-zinc-500">
                No suggestions found. Press search to view all results.
              </p>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
