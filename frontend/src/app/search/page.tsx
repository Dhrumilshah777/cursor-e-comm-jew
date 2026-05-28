import CollectionProductGrid from "@/components/CollectionProductGrid";
import { searchProducts } from "@/lib/productsApi";

type SearchPageProps = {
  searchParams: Promise<{ q?: string }>;
};

export async function generateMetadata({ searchParams }: SearchPageProps) {
  const { q } = await searchParams;
  const query = q?.trim();
  return {
    title: query ? `Search: ${query} | Jewelry` : "Search | Jewelry",
    description: query
      ? `Search results for ${query} in our gold jewelry collection.`
      : "Search gold jewelry by name or SKU.",
  };
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { q } = await searchParams;
  const query = q?.trim() ?? "";
  const products = query ? await searchProducts(query) : [];

  return (
    <CollectionProductGrid
      products={products}
      categoryName={query ? `Results for “${query}”` : "Search"}
      emptyMessage={
        query
          ? `No products found for “${query}”. Try another name or SKU.`
          : "Enter a search term above to find jewelry."
      }
      showToolbar={Boolean(query)}
    />
  );
}
