import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { prisma } from "../src/lib/prisma.js";
import type { GoldPurity, MakingChargeKind, MetalType } from "../src/generated/prisma/client.js";

type CatalogProduct = {
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
  makingCharge: { type: "percentage" | "fixed"; value: number };
  gstPercent: number;
  ringSize?: string;
};

function parseRupeeToPaise(value: string): number {
  return Number.parseInt(value.replace(/[^\d]/g, ""), 10) * 100;
}

function parseWeightGrams(weight: string): string {
  const grams = Number.parseFloat(weight.replace(/[^\d.]/g, ""));
  return grams.toFixed(2);
}

function toMetal(metal: string): MetalType {
  const map: Record<string, MetalType> = {
    "Yellow Gold": "YELLOW_GOLD",
    "Rose Gold": "ROSE_GOLD",
    "White Gold": "WHITE_GOLD",
  };
  const value = map[metal];
  if (!value) throw new Error(`Unknown metal: ${metal}`);
  return value;
}

function toPurity(purity: string): GoldPurity {
  const normalized = purity.toLowerCase();
  const map: Record<string, GoldPurity> = {
    "14kt": "KT_14",
    "18kt": "KT_18",
    "22kt": "KT_22",
  };
  const value = map[normalized];
  if (!value) throw new Error(`Unknown purity: ${purity}`);
  return value;
}

function toMakingChargeKind(type: "percentage" | "fixed"): MakingChargeKind {
  return type === "percentage" ? "PERCENTAGE" : "FIXED";
}

export async function seedCatalogProducts() {
  const catalogPath = resolve(
    import.meta.dirname,
    "../src/data/catalog-products.json",
  );
  const catalog = JSON.parse(readFileSync(catalogPath, "utf8")) as CatalogProduct[];

  await prisma.product.deleteMany();

  for (const product of catalog) {
    await prisma.product.create({
      data: {
        id: product.id,
        slug: product.slug,
        name: product.name,
        category: product.category,
        image: product.image,
        alt: product.alt,
        pricePaise: parseRupeeToPaise(product.price),
        metal: toMetal(product.metal),
        purity: toPurity(product.purity),
        weightGrams: parseWeightGrams(product.weight),
        sku: product.sku,
        ringSize: product.ringSize ?? null,
        description: product.description,
        gallery: product.gallery,
        makingChargeKind: toMakingChargeKind(product.makingCharge.type),
        makingChargeValue: product.makingCharge.value,
        gstPercent: product.gstPercent,
      },
    });
  }

  return catalog.length;
}
