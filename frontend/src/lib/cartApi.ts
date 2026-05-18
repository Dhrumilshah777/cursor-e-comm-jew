import type { CollectionProduct } from "@/data/collections";
import { customerFetch } from "@/lib/customerFetch";

export type CartItem = {
  id: string;
  quantity: number;
  size: string | null;
  lineTotalPaise: number;
  lineTotal: string;
  product: CollectionProduct;
};

export type Cart = {
  id: string;
  items: CartItem[];
  itemCount: number;
  subtotalPaise: number;
  subtotal: string;
};

type CartResponse = { cart: Cart };

export async function fetchCart(): Promise<Cart> {
  const data = await customerFetch<CartResponse>("/api/cart");
  return data.cart;
}

export async function addToCart(
  productId: string,
  options?: { size?: string },
): Promise<Cart> {
  try {
    const data = await customerFetch<CartResponse>("/api/cart/items", {
      method: "POST",
      body: JSON.stringify({
        productId,
        size: options?.size,
      }),
    });
    return data.cart;
  } catch (err) {
    if (err instanceof Error && err.message.includes("already in your bag")) {
      const e = new Error(err.message);
      (e as Error & { code: string }).code = "ALREADY_IN_CART";
      throw e;
    }
    throw err;
  }
}

export async function removeCartItem(itemId: string): Promise<Cart> {
  const data = await customerFetch<CartResponse>(`/api/cart/items/${itemId}`, {
    method: "DELETE",
  });
  return data.cart;
}
