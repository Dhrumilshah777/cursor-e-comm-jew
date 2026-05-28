"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { type FormEvent, useEffect, useState } from "react";
import { IoSearchOutline } from "react-icons/io5";

type NavbarSearchProps = {
  className?: string;
};

export default function NavbarSearch({ className = "" }: NavbarSearchProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (pathname === "/search") {
      setQuery(searchParams.get("q") ?? "");
    }
  }, [pathname, searchParams]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;
    router.push(`/search?q=${encodeURIComponent(trimmed)}`);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={`relative ${className}`}
      role="search"
      aria-label="Search products"
    >
      <IoSearchOutline
        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400"
        aria-hidden="true"
      />
      <input
        type="search"
        name="q"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search rings, necklaces, earrings…"
        className="w-full border border-zinc-300 bg-white py-2.5 pl-10 pr-4 text-sm font-light text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-500 focus:outline-none"
        aria-label="Search products"
      />
    </form>
  );
}
