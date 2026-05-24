import { notFound } from "next/navigation";
import CategoryBanner from "@/components/CategoryBanner";
import CollectionProductGrid from "@/components/CollectionProductGrid";
import {
  collectionSlugs,
  getCollection,
  isCollectionSlug,
} from "@/data/collections";
import { fetchProducts } from "@/lib/productsApi";

export const revalidate = 60;

type PageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return collectionSlugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  if (!isCollectionSlug(slug)) return { title: "Collection" };

  const collection = getCollection(slug);
  return {
    title: `${collection.name} | Jewelry`,
    description: collection.tagline,
  };
}

export default async function CollectionPage({ params }: PageProps) {
  const { slug } = await params;

  if (!isCollectionSlug(slug)) {
    notFound();
  }

  const collection = getCollection(slug);
  let products: Awaited<ReturnType<typeof fetchProducts>> = [];

  try {
    products = await fetchProducts(slug);
  } catch {
    products = [];
  }

  return (
    <>
      <CategoryBanner collection={collection} />
      <CollectionProductGrid
        products={products}
        categoryName={collection.name}
      />
    </>
  );
}
