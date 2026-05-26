import type { Product, WishlistItem } from "../generated/prisma/client.js";
import { mapProductToDto, type CollectionProductDto } from "./productMapper.js";

export type WishlistItemDto = {
  id: string;
  addedAt: string;
  product: CollectionProductDto;
};

export type WishlistDto = {
  items: WishlistItemDto[];
  productIds: string[];
};

type WishlistRow = WishlistItem & { product: Product };

export function mapWishlistToDto(rows: WishlistRow[]): WishlistDto {
  const items = rows.map((row) => ({
    id: row.id,
    addedAt: row.createdAt.toISOString(),
    product: mapProductToDto(row.product),
  }));

  return {
    items,
    productIds: items.map((item) => item.product.id),
  };
}
