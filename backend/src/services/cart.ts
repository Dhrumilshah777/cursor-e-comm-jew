import { prisma } from "../lib/prisma.js";
import { mapCartToDto } from "../lib/cartMapper.js";

const cartInclude = {
  items: {
    include: { product: true },
    orderBy: { createdAt: "asc" as const },
  },
} as const;

async function getOrCreateCart(userId: string) {
  const existing = await prisma.cart.findUnique({
    where: { userId },
    include: cartInclude,
  });

  if (existing) return existing;

  return prisma.cart.create({
    data: { userId },
    include: cartInclude,
  });
}

function normalizeSize(size: unknown): string {
  if (typeof size !== "string") return "";
  return size.trim();
}

export async function getCartForUser(userId: string) {
  const cart = await getOrCreateCart(userId);
  return mapCartToDto(cart);
}

export async function addCartItem(
  userId: string,
  productId: string,
  size?: string,
) {
  const sizeKey = normalizeSize(size);

  const product = await prisma.product.findFirst({
    where: { id: productId, isActive: true },
  });

  if (!product) {
    return { error: "PRODUCT_NOT_FOUND" as const };
  }

  const effectiveSize =
    sizeKey || (product.category === "rings" && product.ringSize ? product.ringSize : "");

  const cart = await getOrCreateCart(userId);

  const existing = await prisma.cartItem.findUnique({
    where: {
      cartId_productId_size: {
        cartId: cart.id,
        productId,
        size: effectiveSize,
      },
    },
  });

  if (existing) {
    return { error: "ALREADY_IN_CART" as const };
  }

  await prisma.cartItem.create({
    data: {
      cartId: cart.id,
      productId,
      quantity: 1,
      size: effectiveSize,
    },
  });

  await prisma.cart.update({
    where: { id: cart.id },
    data: { updatedAt: new Date() },
  });

  const updated = await prisma.cart.findUniqueOrThrow({
    where: { id: cart.id },
    include: cartInclude,
  });

  return { cart: mapCartToDto(updated) };
}

export async function removeCartItem(userId: string, itemId: string) {
  const item = await prisma.cartItem.findFirst({
    where: { id: itemId, cart: { userId } },
  });

  if (!item) {
    return { error: "ITEM_NOT_FOUND" as const };
  }

  await prisma.cartItem.delete({ where: { id: itemId } });

  const cart = await getOrCreateCart(userId);
  return { cart: mapCartToDto(cart) };
}
