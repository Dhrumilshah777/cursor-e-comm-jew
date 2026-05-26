import type { CollectionProduct } from "@/data/collections";
import { customerFetch } from "@/lib/customerFetch";

export type WishlistItem = {
  id: string;
  addedAt: string;
  product: CollectionProduct;
};

export type Wishlist = {
  items: WishlistItem[];
  productIds: string[];
};

type WishlistResponse = { wishlist: Wishlist };

export async function fetchWishlist(): Promise<Wishlist> {
  const data = await customerFetch<WishlistResponse>("/api/wishlist");
  return data.wishlist;
}

export async function toggleWishlistItem(productId: string): Promise<Wishlist> {
  const data = await customerFetch<WishlistResponse>("/api/wishlist/toggle", {
    method: "POST",
    body: JSON.stringify({ productId }),
  });
  return data.wishlist;
}

export async function removeWishlistItem(productId: string): Promise<Wishlist> {
  const data = await customerFetch<WishlistResponse>(
    `/api/wishlist/items/${encodeURIComponent(productId)}`,
    { method: "DELETE" },
  );
  return data.wishlist;
}
