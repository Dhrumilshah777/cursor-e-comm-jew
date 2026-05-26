"use client";

import Image from "next/image";
import Link from "next/link";
import { Jost } from "next/font/google";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CollectionProduct } from "@/data/collections";
import WishlistButton from "@/components/wishlist/WishlistButton";

const jost = Jost({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  display: "swap",
});

type SortOption = "featured" | "price-asc" | "price-desc" | "name-asc";
type PriceFilter = "under-5000" | "5000-10000" | "above-10000";

const sortOptions: { value: SortOption; label: string }[] = [
  { value: "featured", label: "Featured" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
  { value: "name-asc", label: "Name: A to Z" },
];

const priceFilters: { value: PriceFilter; label: string }[] = [
  { value: "under-5000", label: "Under ₹5,000" },
  { value: "5000-10000", label: "₹5,000 – ₹10,000" },
  { value: "above-10000", label: "Above ₹10,000" },
];

const toolbarButtonClass =
  "flex flex-1 cursor-pointer items-center justify-center gap-2 border border-zinc-300 bg-white px-4 py-2.5 text-[11px] font-normal uppercase tracking-[0.2em] text-zinc-800 transition hover:border-zinc-500 sm:min-w-[148px] sm:flex-none";

function parsePrice(price: string) {
  return Number(price.replace(/[^\d]/g, "")) || 0;
}

function matchesPriceFilter(amount: number, filter: PriceFilter) {
  if (filter === "under-5000") return amount < 5000;
  if (filter === "5000-10000") return amount >= 5000 && amount <= 10000;
  return amount > 10000;
}

function ProductCard({ product }: { product: CollectionProduct }) {
  const soldOut = product.inStock === false;

  return (
    <Link
      href={`/products/${product.slug}`}
      className="group flex w-full flex-col gap-3"
    >
      <div className="relative aspect-square w-full overflow-hidden bg-zinc-100">
        <Image
          src={product.image}
          alt={product.alt}
          fill
          className={`object-cover transition-transform duration-500 ease-out group-hover:scale-105 ${
            soldOut ? "opacity-60 grayscale" : ""
          }`}
          sizes="(max-width: 1024px) 50vw, 22vw"
        />
        {soldOut ? (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-white/30">
            <span className="bg-zinc-900/85 px-3 py-1.5 text-[10px] font-medium uppercase tracking-[0.22em] text-white sm:text-[11px]">
              Sold out
            </span>
          </div>
        ) : null}
        <WishlistButton productId={product.id} />
      </div>
      <div className={`space-y-1 text-left ${soldOut ? "opacity-70" : ""}`}>
        <p className="text-xs font-normal uppercase tracking-[0.14em] text-zinc-900 sm:text-[13px] lg:tracking-[0.18em]">
          {product.name}
        </p>
        <p className="text-[11px] font-light tracking-[0.08em] text-zinc-500 sm:text-xs">
          {product.metal}
        </p>
        <p className="text-xs font-normal text-zinc-600 sm:text-sm">
          {product.price}
        </p>
      </div>
    </Link>
  );
}

function CollectionBreadcrumbs({ categoryName }: { categoryName: string }) {
  return (
    <nav aria-label="Breadcrumb" className="mt-3 sm:mt-4">
      <ol className="flex flex-wrap items-center justify-center gap-2 text-[11px] font-light uppercase tracking-[0.18em] text-zinc-500 sm:text-xs sm:tracking-[0.2em]">
        <li>
          <Link href="/" className="transition-colors hover:text-zinc-900">
            Home
          </Link>
        </li>
        <li aria-hidden="true" className="text-zinc-400">
          /
        </li>
        <li className="text-zinc-900" aria-current="page">
          {categoryName}
        </li>
      </ol>
    </nav>
  );
}

function CollectionToolbar({
  sort,
  onSortChange,
  activeFilters,
  onToggleFilter,
  onClearFilters,
  filterOpen,
  sortOpen,
  onToggleFilterPanel,
  onToggleSortPanel,
}: {
  sort: SortOption;
  onSortChange: (value: SortOption) => void;
  activeFilters: PriceFilter[];
  onToggleFilter: (value: PriceFilter) => void;
  onClearFilters: () => void;
  filterOpen: boolean;
  sortOpen: boolean;
  onToggleFilterPanel: () => void;
  onToggleSortPanel: () => void;
}) {
  const activeSortLabel =
    sortOptions.find((option) => option.value === sort)?.label ?? "Featured";

  return (
    <div className="relative mt-8 sm:mt-10">
      <div className="flex gap-3">
        <button
          type="button"
          className={toolbarButtonClass}
          onClick={onToggleFilterPanel}
          aria-expanded={filterOpen}
          aria-controls="collection-filter-panel"
        >
          <i className="fa-solid fa-sliders text-sm" aria-hidden="true" />
          Filter
          {activeFilters.length > 0 ? (
            <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-zinc-900 px-1 text-[9px] text-white">
              {activeFilters.length}
            </span>
          ) : null}
        </button>
        <button
          type="button"
          className={toolbarButtonClass}
          onClick={onToggleSortPanel}
          aria-expanded={sortOpen}
          aria-controls="collection-sort-panel"
        >
          <i className="fa-solid fa-arrow-down-wide-short text-sm" aria-hidden="true" />
          Sort
          <i
            className={`fa-solid fa-chevron-down text-[10px] transition-transform ${sortOpen ? "rotate-180" : ""}`}
            aria-hidden="true"
          />
        </button>
      </div>

      {filterOpen ? (
        <div
          id="collection-filter-panel"
          className="mt-3 border border-zinc-200 bg-[#faf8f5] p-4 sm:p-5"
        >
          <div className="flex items-center justify-between gap-4">
            <p className="text-[11px] font-normal uppercase tracking-[0.2em] text-zinc-900">
              Price
            </p>
            {activeFilters.length > 0 ? (
              <button
                type="button"
                onClick={onClearFilters}
                className="text-[11px] font-light uppercase tracking-[0.16em] text-zinc-600 underline-offset-2 hover:text-zinc-900 hover:underline"
              >
                Clear all
              </button>
            ) : null}
          </div>
          <div className="mt-3 flex flex-col gap-2.5 sm:mt-4">
            {priceFilters.map((filter) => {
              const checked = activeFilters.includes(filter.value);
              return (
                <label
                  key={filter.value}
                  className="flex cursor-pointer items-center gap-3 text-sm font-light text-zinc-700"
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => onToggleFilter(filter.value)}
                    className="h-4 w-4 accent-zinc-900"
                  />
                  {filter.label}
                </label>
              );
            })}
          </div>
        </div>
      ) : null}

      {sortOpen ? (
        <div
          id="collection-sort-panel"
          className="mt-3 border border-zinc-200 bg-white p-2 sm:absolute sm:right-0 sm:z-20 sm:mt-2 sm:min-w-[220px] sm:shadow-md"
          role="listbox"
          aria-label="Sort options"
        >
          {sortOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              role="option"
              aria-selected={sort === option.value}
              onClick={() => onSortChange(option.value)}
              className={`flex w-full items-center justify-between px-3 py-2.5 text-left text-sm font-light transition ${
                sort === option.value
                  ? "bg-zinc-100 text-zinc-900"
                  : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900"
              }`}
            >
              {option.label}
              {sort === option.value ? (
                <i className="fa-solid fa-check text-xs" aria-hidden="true" />
              ) : null}
            </button>
          ))}
        </div>
      ) : null}

      <p className="mt-3 text-center text-[11px] font-light uppercase tracking-[0.16em] text-zinc-500 sm:text-left">
        Sorted by: {activeSortLabel}
      </p>
    </div>
  );
}

export default function CollectionProductGrid({
  products,
  categoryName,
}: {
  products: CollectionProduct[];
  categoryName: string;
}) {
  const [sort, setSort] = useState<SortOption>("featured");
  const [activeFilters, setActiveFilters] = useState<PriceFilter[]>([]);
  const [filterOpen, setFilterOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const toolbarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!toolbarRef.current?.contains(event.target as Node)) {
        setFilterOpen(false);
        setSortOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const displayedProducts = useMemo(() => {
    let list = [...products];

    if (activeFilters.length > 0) {
      list = list.filter((product) => {
        const amount = parsePrice(product.price);
        return activeFilters.some((filter) =>
          matchesPriceFilter(amount, filter),
        );
      });
    }

    switch (sort) {
      case "price-asc":
        list.sort((a, b) => parsePrice(a.price) - parsePrice(b.price));
        break;
      case "price-desc":
        list.sort((a, b) => parsePrice(b.price) - parsePrice(a.price));
        break;
      case "name-asc":
        list.sort((a, b) => a.name.localeCompare(b.name));
        break;
      default:
        break;
    }

    return list;
  }, [products, sort, activeFilters]);

  const handleToggleFilter = (value: PriceFilter) => {
    setActiveFilters((current) =>
      current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value],
    );
  };

  return (
    <section
      className={`${jost.className} w-full bg-white py-10 sm:py-12 lg:py-16`}
      aria-labelledby="collection-heading"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1
            id="collection-heading"
            className="text-2xl font-light tracking-wide text-zinc-950 min-[480px]:text-3xl sm:text-4xl lg:text-5xl"
          >
            {categoryName}
          </h1>
          <CollectionBreadcrumbs categoryName={categoryName} />
        </div>

        <div ref={toolbarRef} className="relative">
          <CollectionToolbar
            sort={sort}
            onSortChange={(value) => {
              setSort(value);
              setSortOpen(false);
            }}
            activeFilters={activeFilters}
            onToggleFilter={handleToggleFilter}
            onClearFilters={() => setActiveFilters([])}
            filterOpen={filterOpen}
            sortOpen={sortOpen}
            onToggleFilterPanel={() => {
              setFilterOpen((open) => !open);
              setSortOpen(false);
            }}
            onToggleSortPanel={() => {
              setSortOpen((open) => !open);
              setFilterOpen(false);
            }}
          />
        </div>

        {displayedProducts.length > 0 ? (
          <div className="mt-6 grid grid-cols-2 gap-x-3 gap-y-8 sm:mt-8 sm:gap-x-4 sm:gap-y-10 lg:grid-cols-4 lg:gap-x-5">
            {displayedProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <p className="mt-10 text-center text-sm font-light text-zinc-600">
            No products match your filters. Try adjusting or clearing filters.
          </p>
        )}
      </div>
    </section>
  );
}


