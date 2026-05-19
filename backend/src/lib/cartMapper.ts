import type { Cart, CartItem, Product } from "../generated/prisma/client.js";
import { formatPaise } from "./format.js";
import { calculateProductPricePaise } from "./pricing.js";
import { mapProductToDto } from "./productMapper.js";

export type CartItemDto = {
  id: string;
  quantity: number;
  size: string | null;
  lineTotalPaise: number;
  lineTotal: string;
  product: ReturnType<typeof mapProductToDto>;
};

export type CartDto = {
  id: string;
  items: CartItemDto[];
  itemCount: number;
  subtotalPaise: number;
  subtotal: string;
};

type CartWithItems = Cart & {
  items: (CartItem & { product: Product })[];
};

export function mapCartToDto(cart: CartWithItems): CartDto {
  const items: CartItemDto[] = cart.items.map((item) => {
    const productDto = mapProductToDto(item.product);
    const unitPaise = calculateProductPricePaise(item.product);
    const lineTotalPaise = unitPaise * item.quantity;

    return {
      id: item.id,
      quantity: item.quantity,
      size: item.size || null,
      lineTotalPaise,
      lineTotal: formatPaise(lineTotalPaise),
      product: productDto,
    };
  });

  const subtotalPaise = items.reduce((sum, item) => sum + item.lineTotalPaise, 0);
  const itemCount = items.length;

  return {
    id: cart.id,
    items,
    itemCount,
    subtotalPaise,
    subtotal: formatPaise(subtotalPaise),
  };
}
