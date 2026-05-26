import { mapWishlistToDto } from "../lib/wishlistMapper.js";
import { prisma } from "../lib/prisma.js";

const wishlistInclude = {
  product: true,
} as const;

export async function getWishlistForUser(userId: string) {
  const rows = await prisma.wishlistItem.findMany({
    where: { userId },
    include: wishlistInclude,
    orderBy: { createdAt: "desc" },
  });

  return mapWishlistToDto(rows);
}

export async function addWishlistItem(userId: string, productId: string) {
  const product = await prisma.product.findFirst({
    where: { id: productId, isActive: true },
  });

  if (!product) {
    return { error: "PRODUCT_NOT_FOUND" as const };
  }

  await prisma.wishlistItem.upsert({
    where: {
      userId_productId: { userId, productId },
    },
    create: { userId, productId },
    update: {},
  });

  return getWishlistForUser(userId);
}

export async function removeWishlistItem(userId: string, productId: string) {
  const existing = await prisma.wishlistItem.findUnique({
    where: {
      userId_productId: { userId, productId },
    },
  });

  if (!existing) {
    return { error: "NOT_FOUND" as const };
  }

  await prisma.wishlistItem.delete({
    where: { id: existing.id },
  });

  return getWishlistForUser(userId);
}

export async function toggleWishlistItem(userId: string, productId: string) {
  const existing = await prisma.wishlistItem.findUnique({
    where: {
      userId_productId: { userId, productId },
    },
  });

  if (existing) {
    await prisma.wishlistItem.delete({ where: { id: existing.id } });
  } else {
    const product = await prisma.product.findFirst({
      where: { id: productId, isActive: true },
    });
    if (!product) {
      return { error: "PRODUCT_NOT_FOUND" as const };
    }
    await prisma.wishlistItem.create({ data: { userId, productId } });
  }

  return getWishlistForUser(userId);
}
