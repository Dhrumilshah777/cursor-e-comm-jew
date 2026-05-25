import type { Product } from "../generated/prisma/client.js";
import { formatPaise, metalToDisplay, purityToDisplay } from "./format.js";
import {
  calculatePriceBreakup,
  calculateProductPricePaise,
  makingChargeFromDb,
  purityFromDb,
  type PriceBreakup,
  type ProductMakingCharge,
} from "./pricing.js";

export type ProductMakingChargeDto = {
  type: "percentage" | "fixed";
  value: number;
};

export type CollectionProductDto = {
  id: string;
  slug: string;
  name: string;
  category: string;
  image: string;
  alt: string;
  price: string;
  metal: string;
  sku: string;
  weight: string;
  purity: string;
  gallery: string[];
  description: string;
  makingCharge: ProductMakingChargeDto;
  gstPercent: number;
  priceBreakup: PriceBreakup;
  ringSize?: string;
  stockCount: number;
  lowStockThreshold: number;
  inStock: boolean;
};

function weightDisplay(grams: { toString(): string }): string {
  return `${Number.parseFloat(grams.toString()).toFixed(2)} g`;
}

export function mapProductToDto(product: Product): CollectionProductDto {
  const netWeightGrams = Number.parseFloat(product.weightGrams.toString());
  const purity = purityFromDb(product.purity);
  const makingCharge = makingChargeFromDb(
    product.makingChargeKind,
    product.makingChargeValue,
  );
  const priceBreakup = calculatePriceBreakup({
    netWeightGrams,
    purity,
    makingCharge,
    gstPercent: product.gstPercent,
  });
  const pricePaise = calculateProductPricePaise(product);

  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    category: product.category,
    image: product.image,
    alt: product.alt,
    price: formatPaise(pricePaise),
    metal: metalToDisplay(product.metal),
    sku: product.sku,
    weight: weightDisplay(product.weightGrams),
    purity: purityToDisplay(product.purity).toLowerCase(),
    gallery: product.gallery.length > 0 ? product.gallery : [product.image],
    description: product.description,
    makingCharge,
    gstPercent: product.gstPercent,
    priceBreakup,
    ringSize: product.ringSize ?? undefined,
    stockCount: product.stockCount,
    lowStockThreshold: product.lowStockThreshold,
    inStock: product.stockCount > 0,
  };
}
