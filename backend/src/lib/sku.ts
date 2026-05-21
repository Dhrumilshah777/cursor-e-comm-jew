import { prisma } from "./prisma.js";

const SKU_PATTERN = /^JL-[A-Z]{2}(\d+)$/;

export function categorySkuPrefix(category: string): string {
  const normalized = category.trim().toLowerCase();
  if (normalized.length >= 2) {
    return normalized.slice(0, 2).toUpperCase();
  }
  return "PR";
}

export async function generateNextProductSku(category: string): Promise<string> {
  const prefix = categorySkuPrefix(category);
  const products = await prisma.product.findMany({ select: { sku: true } });

  let maxNumber = 0;
  for (const product of products) {
    const match = product.sku.match(SKU_PATTERN);
    if (match?.[1]) {
      maxNumber = Math.max(maxNumber, Number.parseInt(match[1], 10));
    }
  }

  return `JL-${prefix}${String(maxNumber + 1).padStart(4, "0")}`;
}
