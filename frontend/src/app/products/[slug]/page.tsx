import Link from "next/link";
import { notFound } from "next/navigation";
import { Jost } from "next/font/google";
import AddToBagButton from "@/components/cart/AddToBagButton";
import ProductDetailActions from "@/components/ProductDetailActions";
import ProductImageGallery from "@/components/ProductImageGallery";
import ProductPincodeCheck from "@/components/ProductPincodeCheck";
import ProductPriceBreakup from "@/components/ProductPriceBreakup";
import ProductYouMayAlsoLike from "@/components/ProductYouMayAlsoLike";
import { getCollection } from "@/data/collections";
import { fetchProductBySlug, fetchRelatedProducts } from "@/lib/productsApi";

export const dynamic = "force-dynamic";

const jost = Jost({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  display: "swap",
});

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const product = await fetchProductBySlug(slug);
  return {
    title: product ? `${product.name} | Jewelry` : "Product | Jewelry",
    description: product?.description,
  };
}

export default async function ProductPage({ params }: PageProps) {
  const { slug } = await params;
  const product = await fetchProductBySlug(slug);

  if (!product) {
    notFound();
  }

  const collection = getCollection(product.category);
  const collectionHref = `/collections/${product.category}`;
  const relatedProducts = await fetchRelatedProducts(slug, 4);

  return (
    <div className={`${jost.className} bg-white`}>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8 lg:py-16">
        <nav aria-label="Breadcrumb">
          <ol className="flex flex-wrap items-center gap-2 text-[11px] font-light uppercase tracking-[0.18em] text-zinc-500 sm:text-xs sm:tracking-[0.2em]">
            <li>
              <Link
                href="/"
                className="cursor-pointer transition-colors hover:text-zinc-900"
              >
                Home
              </Link>
            </li>
            <li aria-hidden="true" className="text-zinc-400">
              /
            </li>
            <li>
              <Link
                href={collectionHref}
                className="cursor-pointer transition-colors hover:text-zinc-900"
              >
                {collection.name}
              </Link>
            </li>
            <li aria-hidden="true" className="text-zinc-400">
              /
            </li>
            <li className="text-zinc-900" aria-current="page">
              {product.name}
            </li>
          </ol>
        </nav>

        <div className="mt-8 grid gap-10 lg:grid-cols-2 lg:items-start lg:gap-16">
          <div className="min-w-0">
            <ProductImageGallery images={product.gallery} alt={product.alt} />
          </div>

          <div className="flex min-w-0 flex-col lg:pt-0">
            <div className="flex items-center justify-between gap-4">
              <p className="text-[11px] font-light uppercase tracking-[0.22em] text-zinc-500">
                SKU{" "}
                <span className="font-normal tracking-[0.14em] text-zinc-900">
                  {product.sku}
                </span>
              </p>
              <ProductDetailActions
                productName={product.name}
                slug={product.slug}
              />
            </div>
            <h1 className="mt-3 text-2xl font-light uppercase tracking-[0.12em] text-zinc-950 sm:text-3xl lg:mt-2">
              {product.name}
            </h1>
            <p className="mt-4 text-lg font-normal text-zinc-700">
              {product.price}
            </p>
            <p className="mt-1.5 text-[11px] font-normal capitalize tracking-[0.08em] text-zinc-500">
              (Inclusive all taxes)
            </p>

            <p className="mt-4 text-sm font-light leading-relaxed text-zinc-600">
              Crafted with precision and finished for everyday elegance. A
              timeless piece from our {collection.name.toLowerCase()} collection.
            </p>

            <dl
              className={`mt-6 grid gap-x-3 gap-y-4 sm:max-w-xl sm:gap-x-6 ${
                product.category === "rings"
                  ? "grid-cols-2 sm:grid-cols-4"
                  : "grid-cols-3"
              }`}
            >
              <div>
                <dt className="text-[10px] font-normal uppercase tracking-[0.2em] text-zinc-500">
                  Weight
                </dt>
                <dd className="mt-1 text-sm font-light text-zinc-900">
                  {product.weight}
                </dd>
              </div>
              <div>
                <dt className="text-[10px] font-normal uppercase tracking-[0.2em] text-zinc-500">
                  Purity
                </dt>
                <dd className="mt-1 text-sm font-light text-zinc-900">
                  {product.purity.toUpperCase()}
                </dd>
              </div>
              <div>
                <dt className="text-[10px] font-normal uppercase tracking-[0.2em] text-zinc-500">
                  Color
                </dt>
                <dd className="mt-1 text-sm font-light capitalize text-zinc-900">
                  {product.metal}
                </dd>
              </div>
              {product.category === "rings" && product.ringSize ? (
                <div>
                  <dt className="text-[10px] font-normal uppercase tracking-[0.2em] text-zinc-500">
                    Ring size
                  </dt>
                  <dd className="mt-1 text-sm font-light text-zinc-900">
                    {product.ringSize}
                  </dd>
                </div>
              ) : null}
            </dl>

            <AddToBagButton
              productId={product.id}
              productSlug={product.slug}
              ringSize={product.ringSize}
            />

            <ProductPincodeCheck />
          </div>
        </div>

        <section className="mt-12 border-t border-zinc-100 pt-10 sm:mt-14 sm:pt-12">
          <h2 className="text-sm font-normal uppercase tracking-[0.2em] text-zinc-900 sm:text-base">
            Product description
          </h2>
          <p className="mt-4 max-w-none text-sm font-light leading-[1.75] text-zinc-600 sm:text-[15px]">
            {product.description}
          </p>
        </section>

        <ProductPriceBreakup breakup={product.priceBreakup} />

        <ProductYouMayAlsoLike products={relatedProducts} />
      </div>
    </div>
  );
}
