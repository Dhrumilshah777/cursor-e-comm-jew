import Link from "next/link";
import { Jost } from "next/font/google";
import type { ReactNode } from "react";

const jost = Jost({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  display: "swap",
});

export default function AuthPageShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <div className={`${jost.className} bg-[#faf8f5] py-12 sm:py-16`}>
      <div className="mx-auto w-full max-w-md px-4 sm:px-6">
        <p className="text-center text-[10px] font-normal uppercase tracking-[0.28em] text-zinc-500">
          Wholesale Jewelry
        </p>
        <h1 className="mt-3 text-center text-2xl font-light uppercase tracking-[0.12em] text-zinc-950">
          {title}
        </h1>
        <p className="mt-2 text-center text-sm font-light text-zinc-600">{subtitle}</p>

        <div className="mt-8 border border-zinc-200 bg-white px-6 py-8 shadow-sm sm:px-8">
          {children}
        </div>

        <p className="mt-6 text-center text-xs font-light text-zinc-500">
          <Link href="/" className="hover:text-zinc-800">
            ← Continue shopping
          </Link>
        </p>
      </div>
    </div>
  );
}

