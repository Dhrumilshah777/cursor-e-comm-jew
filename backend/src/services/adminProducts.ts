import { prisma } from "../lib/prisma.js";
import { mapProductToDto } from "../lib/productMapper.js";
import type { GoldPurity, MakingChargeKind, MetalType } from "../generated/prisma/client.js";

export async function listAdminProducts(filters: { category?: string; includeInactive?: boolean }) {
  const products = await prisma.product.findMany({
    where: {
      ...(filters.category ? { category: filters.category } : {}),
      ...(filters.includeInactive === false ? { isActive: true } : {}),
    },
    orderBy: { updatedAt: "desc" },
  });

  return products.map((product) => ({
    ...mapProductToDto(product),
    isActive: product.isActive,
    makingChargeKind: product.makingChargeKind,
    makingChargeValue: product.makingChargeValue,
    gstPercent: product.gstPercent,
    pricePaise: product.pricePaise,
  }));
}

export async function getAdminProductById(id: string) {
  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) return null;
  return {
    ...mapProductToDto(product),
    isActive: product.isActive,
    makingChargeKind: product.makingChargeKind,
    makingChargeValue: product.makingChargeValue,
    gstPercent: product.gstPercent,
    pricePaise: product.pricePaise,
  };
}

export async function createAdminProduct(data: {
  id?: string;
  slug: string;
  name: string;
  category: string;
  image: string;
  alt: string;
  pricePaise: number;
  metal: MetalType;
  purity: GoldPurity;
  weightGrams: string;
  sku: string;
  ringSize?: string | null;
  description: string;
  gallery?: string[];
  makingChargeKind?: MakingChargeKind;
  makingChargeValue?: number;
  gstPercent?: number;
  isActive?: boolean;
}) {
  const product = await prisma.product.create({
    data: {
      id: data.id,
      slug: data.slug,
      name: data.name,
      category: data.category,
      image: data.image,
      alt: data.alt,
      pricePaise: data.pricePaise,
      metal: data.metal,
      purity: data.purity,
      weightGrams: data.weightGrams,
      sku: data.sku,
      ringSize: data.ringSize ?? null,
      description: data.description,
      gallery: data.gallery ?? [data.image],
      makingChargeKind: data.makingChargeKind ?? "PERCENTAGE",
      makingChargeValue: data.makingChargeValue ?? 0.1,
      gstPercent: data.gstPercent ?? 3,
      isActive: data.isActive ?? true,
    },
  });
  return mapProductToDto(product);
}

export async function updateAdminProduct(
  id: string,
  data: Partial<{
    slug: string;
    name: string;
    category: string;
    image: string;
    alt: string;
    pricePaise: number;
    metal: MetalType;
    purity: GoldPurity;
    weightGrams: string;
    sku: string;
    ringSize: string | null;
    description: string;
    gallery: string[];
    makingChargeKind: MakingChargeKind;
    makingChargeValue: number;
    gstPercent: number;
    isActive: boolean;
  }>,
) {
  const product = await prisma.product.update({ where: { id }, data });
  return mapProductToDto(product);
}

export async function deleteAdminProduct(id: string) {
  const product = await prisma.product.update({
    where: { id },
    data: { isActive: false },
  });
  return mapProductToDto(product);
}
