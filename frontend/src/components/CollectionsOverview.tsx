import Image from "next/image";
import Link from "next/link";
import { Jost, Playfair_Display } from "next/font/google";
import {
  collections,
  type CollectionConfig,
  type CollectionSlug,
} from "@/data/collections";

const jost = Jost({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});

const categorySlugs: CollectionSlug[] = [
  "necklaces",
  "bracelets",
  "rings",
  "earrings",
  "pendants",
  "mangalsutra",
];

const audienceSlugs: CollectionSlug[] = ["mens", "womens", "kids"];

function CollectionCard({ collection }: { collection: CollectionConfig }) {
  return (
    <Link
      href={`/collections/${collection.slug}`}
      className="group flex flex-col"
    >
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-zinc-200 lg:aspect-square">
        <Image
          src={collection.bannerImage}
          alt={collection.bannerAlt}
          fill
          className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
          sizes="(max-width: 1024px) 50vw, 25vw"
        />
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-black/60 to-transparent lg:hidden"
          aria-hidden="true"
        />
        <div className="absolute bottom-0 left-0 px-3 pb-3 lg:hidden">
          <p className="text-[11px] font-light uppercase tracking-[0.2em] text-white">
            {collection.name}
          </p>
        </div>
      </div>
      <div className="mt-3 hidden lg:block">
        <p className="text-[11px] font-light uppercase tracking-[0.22em] text-zinc-900">
          {collection.name}
        </p>
        <p className="mt-1 text-xs font-light tracking-wide text-zinc-500">
          {collection.tagline}
        </p>
      </div>
    </Link>
  );
}

function CollectionSection({
  id,
  title,
  description,
  slugs,
  className = "",
}: {
  id: string;
  title: string;
  description: string;
  slugs: CollectionSlug[];
  className?: string;
}) {
  const items = slugs.map((slug) => collections[slug]);

  return (
    <section
      className={`${jost.className} ${className}`}
      aria-labelledby={id}
    >
      <div className="px-4 text-center sm:px-6 lg:px-0">
        <h2
          id={id}
          className="text-2xl font-light tracking-wide text-zinc-950 min-[480px]:text-3xl sm:text-4xl md:text-[2.75rem]"
        >
          {title}
        </h2>
        <p className="mx-auto mt-3 max-w-md text-xs font-normal tracking-[0.1em] text-zinc-600 min-[480px]:text-sm sm:mt-4">
          {description}
        </p>
      </div>

      <div
        className={`mt-8 grid grid-cols-2 gap-2.5 sm:mt-10 sm:gap-4 md:mt-12 ${
          slugs.length === 3
            ? "lg:grid-cols-3"
            : "lg:grid-cols-3 xl:grid-cols-6"
        }`}
      >
        {items.map((collection) => (
          <CollectionCard key={collection.slug} collection={collection} />
        ))}
      </div>
    </section>
  );
}

export function CollectionsPageHero() {
  const featured = collections.necklaces;

  return (
    <section
      className={`${jost.className} relative w-full overflow-hidden bg-zinc-900`}
      aria-label="Collections"
    >
      <div className="relative aspect-[5/3] w-full sm:aspect-[3/1] lg:aspect-[4/1]">
        <Image
          src={featured.bannerImage}
          alt={featured.bannerAlt}
          fill
          className="object-cover object-center"
          sizes="100vw"
          priority
        />
        <div
          className="absolute inset-0 bg-gradient-to-r from-black/55 via-black/25 to-transparent"
          aria-hidden="true"
        />
        <div className="absolute inset-0 flex items-center px-6 sm:px-10 lg:px-16">
          <div className="max-w-xl text-white">
            <p className="text-[10px] font-light uppercase tracking-[0.35em] text-white/80 sm:text-xs">
              Wholesale Jewelry
            </p>
            <h1
              className={`${playfair.className} mt-3 text-4xl font-normal tracking-tight sm:text-5xl lg:text-6xl`}
            >
              Our Collections
            </h1>
            <p className="mt-3 max-w-md text-sm font-light tracking-wide text-white/90 sm:text-base">
              Explore hallmarked gold across categories and styles — rings,
              necklaces, earrings, and more.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function CollectionsOverview() {
  return (
    <div className={`${jost.className} flex flex-col`}>
      <div className="bg-[#faf8f5] px-4 py-10 sm:px-6 sm:py-14 md:py-20 lg:mx-auto lg:max-w-7xl lg:px-8 lg:py-24">
        <CollectionSection
          id="collections-by-category"
          title="Shop By Category"
          description="An ode to refined details and modern grace."
          slugs={categorySlugs}
        />
      </div>

      <div className="bg-white px-4 py-10 sm:px-6 sm:py-14 md:py-20 lg:mx-auto lg:max-w-7xl lg:px-8 lg:py-24">
        <CollectionSection
          id="collections-by-style"
          title="Shop By Style"
          description="Curated edits for him, her, and little ones."
          slugs={audienceSlugs}
        />
      </div>
    </div>
  );
}
