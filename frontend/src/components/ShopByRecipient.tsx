import Image from "next/image";
import Link from "next/link";
import { Jost } from "next/font/google";

const jost = Jost({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  display: "swap",
});

export type RecipientItem = {
  id: string;
  label: string;
  href: string;
  image: string;
  alt: string;
};

const recipients: RecipientItem[] = [
  {
    id: "her",
    label: "Gifts for her",
    href: "/collections/gifts-for-her",
    image:
      "https://i.pinimg.com/736x/57/21/fc/5721fc3ccfc5381ff09c753bc11692d1.jpg",
    alt: "Jewelry gift for her",
  },
  {
    id: "him",
    label: "Gifts for him",
    href: "/collections/gifts-for-him",
    image:
      "https://i.pinimg.com/736x/bb/94/5f/bb945fbfb6d5a5c16647ad1f97b03ac5.jpg",
    alt: "Jewelry gift for him",
  },
];

function RecipientCard({ item }: { item: RecipientItem }) {
  return (
    <Link
      href={item.href}
      className="group flex w-full flex-col items-center gap-4 sm:gap-5 lg:gap-6"
    >
      <div className="relative aspect-[6/6.5] w-full overflow-hidden bg-zinc-200 sm:aspect-[6/6.4] lg:aspect-[5/4.5]">
        <Image
          src={item.image}
          alt={item.alt}
          fill
          className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
          sizes="(max-width: 1024px) 50vw, 24vw"
        />
      </div>
      <span className="text-center text-xs font-normal uppercase tracking-[0.18em] text-zinc-900 sm:text-base lg:text-lg lg:tracking-[0.22em]">
        {item.label}
      </span>
    </Link>
  );
}

export default function ShopByRecipient({
  items = recipients,
}: {
  items?: RecipientItem[];
}) {
  return (
    <section
      className={`${jost.className} w-full bg-white px-0 py-10 sm:py-14 md:py-20 lg:px-8 lg:py-24`}
      aria-labelledby="shop-by-recipient-heading"
    >
      <div className="w-full lg:mx-auto lg:max-w-7xl">
        <div className="px-4 text-center sm:px-6 lg:px-0">
          <h2
            id="shop-by-recipient-heading"
            className="text-2xl font-light tracking-wide text-zinc-950 min-[480px]:text-3xl sm:text-4xl md:text-[2.75rem] lg:text-5xl"
          >
            Shop By Recipient
          </h2>
          <p className="mx-auto mt-3 max-w-md text-xs font-normal tracking-[0.1em] text-zinc-600 min-[480px]:text-sm sm:mt-4 sm:text-base">
            Curated gifts for every special someone.
          </p>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-3 px-4 sm:mt-12 sm:gap-5 md:gap-6 lg:mt-16 lg:gap-8 lg:px-0">
          {items.map((item) => (
            <RecipientCard key={item.id} item={item} />
          ))}
        </div>
      </div>
    </section>
  );
}
