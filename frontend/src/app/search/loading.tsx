import { ProductGridSkeleton } from "@/components/skeletons/ProductSkeletons";

export default function SearchLoading() {
  return <ProductGridSkeleton showToolbar={false} count={8} />;
}
