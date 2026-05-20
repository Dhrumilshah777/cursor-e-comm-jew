import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import "dotenv/config";
import { prisma } from "../src/lib/prisma.js";
import { calculatePriceBreakup, purityFromDb } from "../src/lib/pricing.js";

const MIN_GRAMS = 0.5;
const MAX_GRAMS = 0.6;

function weightForIndex(index: number, total: number): number {
  if (total <= 1) return MIN_GRAMS;
  const t = index / (total - 1);
  return Math.round((MIN_GRAMS + t * (MAX_GRAMS - MIN_GRAMS)) * 1000) / 1000;
}

function formatWeight(grams: number): string {
  return `${grams.toFixed(2)} g`;
}

type CatalogProduct = {
  weight: string;
  purity: string;
  makingCharge: { type: "percentage" | "fixed"; value: number };
  gstPercent: number;
  priceBreakup?: {
    netWeightGrams: number;
    pricePerGram: number;
    purity: string;
    goldValue: number;
    makingCharge: number;
    makingChargeDisplay: string;
    subtotal: number;
    gst: number;
    gstPercent: number;
    total: number;
  };
  price: string;
  [key: string]: unknown;
};

async function main() {
  const catalogPath = resolve(import.meta.dirname, "../src/data/catalog-products.json");
  const catalog = JSON.parse(readFileSync(catalogPath, "utf8")) as CatalogProduct[];
  const total = catalog.length;

  for (let i = 0; i < catalog.length; i++) {
    const grams = weightForIndex(i, total);
    const product = catalog[i]!;
    product.weight = formatWeight(grams);

    const purity = (product.purity?.toLowerCase() ?? "18kt") as "14kt" | "18kt" | "22kt";
    const makingCharge = product.makingCharge;
    const breakup = calculatePriceBreakup({
      netWeightGrams: grams,
      purity,
      makingCharge,
      gstPercent: product.gstPercent ?? 3,
    });

    product.priceBreakup = {
      netWeightGrams: grams,
      pricePerGram: breakup.pricePerGram,
      purity,
      goldValue: breakup.goldValue,
      makingCharge: breakup.makingCharge,
      makingChargeDisplay: breakup.makingChargeDisplay,
      subtotal: breakup.subtotal,
      gst: breakup.gst,
      gstPercent: breakup.gstPercent,
      total: breakup.total,
    };
    product.price = `₹${Math.round(breakup.total).toLocaleString("en-IN")}`;
  }

  writeFileSync(catalogPath, `${JSON.stringify(catalog, null, 2)}\n`, "utf8");
  console.log(`Updated ${total} products in catalog-products.json (${MIN_GRAMS}–${MAX_GRAMS} g).`);

  const dbProducts = await prisma.product.findMany({ orderBy: { slug: "asc" } });
  const dbTotal = dbProducts.length;

  for (let i = 0; i < dbProducts.length; i++) {
    const product = dbProducts[i]!;
    const grams = weightForIndex(i, dbTotal);
    const makingCharge =
      product.makingChargeKind === "PERCENTAGE"
        ? {
            type: "percentage" as const,
            value: Number.parseFloat(product.makingChargeValue.toString()),
          }
        : {
            type: "fixed" as const,
            value: Number.parseFloat(product.makingChargeValue.toString()),
          };

    const breakup = calculatePriceBreakup({
      netWeightGrams: grams,
      purity: purityFromDb(product.purity),
      makingCharge,
      gstPercent: product.gstPercent,
    });

    await prisma.product.update({
      where: { id: product.id },
      data: {
        weightGrams: grams.toFixed(2),
        pricePaise: Math.round(breakup.total * 100),
      },
    });
  }

  console.log(`Updated ${dbTotal} products in database and recalculated prices.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
