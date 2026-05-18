import Image from "next/image";
import Link from "next/link";

export default function PromoBanner({
  href = "/collections",
  image = "/promo-banner.jpg",
  alt = "Jewelry promotional banner",
}: {
  href?: string;
  image?: string;
  alt?: string;
}) {
  return (
    <section
      className="w-full bg-white py-6 sm:py-8"
      aria-label="Promotional banner"
    >
      <Link
        href={href}
        className="group relative block w-full overflow-hidden bg-zinc-200"
      >
        <div className="relative aspect-[4/3] w-full sm:aspect-[21/9] md:aspect-[3/1]">
          <Image
            src={image}
            alt={alt}
            fill
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.02]"
            sizes="(max-width: 1280px) 100vw, 1280px"
          />
        </div>
      </Link>
    </section>
  );
}
