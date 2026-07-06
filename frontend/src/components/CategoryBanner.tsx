import Image from "next/image";
import { Jost, Playfair_Display } from "next/font/google";
import type { CollectionConfig } from "@/data/collections";
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

const imageOnlyBannerSlugs = new Set(["rings", "earrings", "mens"]);

export default function CategoryBanner({
  collection,
}: {
  collection: CollectionConfig;
}) {
  const hasBuiltInText = imageOnlyBannerSlugs.has(collection.slug);

  return (
    <section
      className={`${jost.className} relative w-full overflow-hidden bg-zinc-900`}
      aria-label={`${collection.name} collection banner`}
    >
      <div className="relative aspect-[2/1] w-full sm:aspect-[3/1] lg:aspect-[4/1]">
        <Image
          src={collection.bannerImage}
          alt={collection.bannerAlt}
          fill
          className="object-cover object-center"
          sizes="100vw"
          priority
        />        {!hasBuiltInText ? (
          <>
            <div
              className="absolute inset-0 bg-gradient-to-r from-black/45 via-black/20 to-transparent"
              aria-hidden="true"
            />
            <div className="absolute inset-0 flex items-center px-6 sm:px-10 lg:px-16">
              <div className="max-w-md text-white">
                <h1
                  className={`${playfair.className} text-4xl font-normal tracking-tight sm:text-5xl lg:text-6xl`}
                >
                  {collection.name}
                </h1>
                <p className="mt-2 text-sm font-light tracking-wide text-white/90 sm:mt-3 sm:text-base">
                  {collection.tagline}
                </p>
              </div>
            </div>
          </>
        ) : null}
      </div>
    </section>
  );
}

