import Link from "next/link";
import { Jost } from "next/font/google";
import CustomizeDesignForm from "@/components/custom-design/CustomizeDesignForm";

const jost = Jost({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  display: "swap",
});

export const metadata = {
  title: "Customize Your Design | Jewelry",
  description:
    "Upload your jewellery design and tell us your metal, stone, and budget preferences.",
};

export default function CustomDesignDetailsPage() {
  return (
    <div className={`${jost.className} bg-[#faf9f7] min-h-full`}>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
        <nav aria-label="Breadcrumb">
          <ol className="flex flex-wrap items-center gap-2 text-[11px] font-light uppercase tracking-[0.18em] text-zinc-500 sm:text-xs">
            <li>
              <Link href="/" className="transition hover:text-zinc-900">
                Home
              </Link>
            </li>
            <li aria-hidden="true" className="text-zinc-400">
              /
            </li>
            <li>
              <Link
                href="/custom-design/details"
                className="transition hover:text-zinc-900"
              >
                Custom Design
              </Link>
            </li>
            <li aria-hidden="true" className="text-zinc-400">
              /
            </li>
            <li className="text-zinc-900" aria-current="page">
              Customize Details
            </li>
          </ol>
        </nav>

        <header className="mt-8 max-w-3xl">
          <h1 className="font-serif text-3xl font-light text-zinc-900 sm:text-4xl">
            Customize Your Design
          </h1>
          <p className="mt-3 text-sm font-light leading-relaxed text-zinc-600">
            Please provide the details below to help us understand your
            requirements better.
          </p>
        </header>

        <div className="mt-10">
          <CustomizeDesignForm />
        </div>
      </div>
    </div>
  );
}
