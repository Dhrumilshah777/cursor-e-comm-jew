import Image from "next/image";
import Link from "next/link";
import { Jost } from "next/font/google";

const jost = Jost({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  display: "swap",
});

export type CategoryItem = {
  id: string;
  name: string;
  href: string;
  image: string;
  alt: string;
};

const categories: CategoryItem[] = [
  {
    id: "necklaces",
    name: "Necklaces",
    href: "/collections/necklaces",
    image:
      "https://i.pinimg.com/1200x/76/a4/5a/76a45a09a561e900917c4ee660f27e45.jpg",
    alt: "Plated pendant necklace — fashion jewelry",
  },
  {
    id: "bracelets",
    name: "Bracelets",
    href: "/collections/bracelets",
    image:
      "https://i.pinimg.com/1200x/47/17/32/4717327a9027cc7f683ae86644b18905.jpg",
    alt: "Plated bracelet with pearls — luxury accessories",
  },
  {
    id: "rings",
    name: "Rings",
    href: "/collections/rings",
    image:
      "https://i.pinimg.com/736x/bb/94/5f/bb945fbfb6d5a5c16647ad1f97b03ac5.jpg",
    alt: "Solitaire diamond ring",
  },
  {
    id: "earrings",
    name: "Earrings",
    href: "/collections/earrings",
    image:
      "https://i.pinimg.com/736x/57/21/fc/5721fc3ccfc5381ff09c753bc11692d1.jpg",
    alt: "Diamond stud earrings",
  },
  {
    id: "pendants",
    name: "Pendants",
    href: "/collections/pendants",
    image:
      "https://i.pinimg.com/736x/91/7b/6b/917b6b5f464c44229dcc2bbfa2a954d7.jpg",
    alt: "Diamond pendant necklace",
  },
  {
    id: "mangalsutra",
    name: "Mangalsutra",
    href: "/collections/mangalsutra",
    image:
      "https://i.pinimg.com/736x/49/7f/69/497f699de95ec3c83a814eeb1be0ecee.jpg",
    alt: "Plated mangalsutra necklace — fashion jewelry",
  },
];

function CategoryCard({ category }: { category: CategoryItem }) {
  return (
    <Link
      href={category.href}
      className={`group relative block w-full lg:flex lg:flex-col lg:items-center lg:gap-8${category.id === "mangalsutra" ? " lg:mt-10" : ""}`}
    >
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-zinc-200 lg:aspect-square lg:max-w-none">
        <Image
          src={category.image}
          alt={category.alt}
          fill
          className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
          sizes="(max-width: 1024px) 50vw, 18vw"
        />
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-black/55 to-transparent lg:hidden"
          aria-hidden="true"
        />
        <span className="absolute bottom-0 left-0 px-3 pb-3 text-[11px] font-light uppercase tracking-[0.2em] text-white lg:hidden">
          {category.name}
        </span>
      </div>
      <span className="hidden text-center text-[11px] font-light uppercase tracking-[0.22em] text-zinc-900 lg:mt-0.5 lg:block">
        {category.name}
      </span>
    </Link>
  );
}

function CategoryGrid({ items }: { items: CategoryItem[] }) {
  return (
    <div className="grid w-full grid-cols-2 gap-2.5 lg:grid-cols-5 lg:justify-items-center lg:gap-x-3 lg:gap-y-0 xl:gap-x-4">
      {items.map((category) => (
        <CategoryCard key={category.id} category={category} />
      ))}
    </div>
  );
}

export default function ShopByCategory({
  items = categories,
}: {
  items?: CategoryItem[];
}) {
  return (
    <section
      className={`${jost.className} w-full bg-[#faf8f5] px-0 py-10 sm:py-14 md:py-20 lg:px-8 lg:py-24`}
      aria-labelledby="shop-by-category-heading"
    >
      <div className="w-full text-center lg:mx-auto lg:max-w-7xl">
        <div className="px-4 sm:px-6 lg:px-0">
          <h2
            id="shop-by-category-heading"
            className="text-2xl font-light tracking-wide text-zinc-950 min-[480px]:text-3xl sm:text-4xl md:text-[2.75rem] lg:text-5xl"
          >
            Shop By Category
          </h2>
          <p className="mx-auto mt-3 max-w-md px-2 text-xs font-normal tracking-[0.1em] text-zinc-600 min-[480px]:mt-4 min-[480px]:max-w-xl min-[480px]:text-sm min-[480px]:tracking-[0.12em] sm:mt-5 sm:text-base">
            An Ode To Refined Details And Modern Grace.
          </p>
        </div>

        <div className="mt-8 px-4 sm:mt-12 md:mt-14 lg:mt-16 lg:px-0">
          <CategoryGrid items={items} />
        </div>
      </div>
    </section>
  );
}
