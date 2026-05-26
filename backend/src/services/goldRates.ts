import { invalidateCachedProducts } from "../lib/cache.js";
import {
  buildGoldRatesDto,
  DEFAULT_RATE_24KT_RUPEES_PER_GRAM,
  setCachedGoldRate24kt,
  type GoldRatesDto,
} from "../lib/goldRates.js";
import { prisma } from "../lib/prisma.js";
import {
  calculateProductPricePaise,
  makingChargeFromDb,
  purityFromDb,
} from "../lib/pricing.js";

const SETTINGS_ID = "default";

async function readRate24FromDb(): Promise<number> {
  const settings = await prisma.goldRateSettings.findUnique({
    where: { id: SETTINGS_ID },
  });

  if (!settings) {
    return DEFAULT_RATE_24KT_RUPEES_PER_GRAM;
  }

  return Number.parseFloat(settings.rate24ktRupeesPerGram.toString());
}

export async function loadGoldRatesFromDb(): Promise<GoldRatesDto> {
  const rate24 = await readRate24FromDb();
  setCachedGoldRate24kt(rate24);
  return buildGoldRatesDto(rate24);
}

export async function getGoldRateSettings(): Promise<GoldRatesDto> {
  return buildGoldRatesDto(await readRate24FromDb());
}

export async function recalculateAllProductPrices(): Promise<number> {
  const products = await prisma.product.findMany();

  for (const product of products) {
    const pricePaise = calculateProductPricePaise({
      weightGrams: product.weightGrams,
      purity: product.purity,
      makingChargeKind: product.makingChargeKind,
      makingChargeValue: product.makingChargeValue,
      gstPercent: product.gstPercent,
    });

    await prisma.product.update({
      where: { id: product.id },
      data: { pricePaise },
    });
  }

  await invalidateCachedProducts();
  return products.length;
}

export async function updateGoldRate24kt(
  rate24ktPerGram: number,
): Promise<{ rates: GoldRatesDto; productsUpdated: number }> {
  if (!Number.isFinite(rate24ktPerGram) || rate24ktPerGram <= 0) {
    throw new Error("INVALID_RATE");
  }

  await prisma.goldRateSettings.upsert({
    where: { id: SETTINGS_ID },
    create: {
      id: SETTINGS_ID,
      rate24ktRupeesPerGram: rate24ktPerGram,
    },
    update: {
      rate24ktRupeesPerGram: rate24ktPerGram,
    },
  });

  setCachedGoldRate24kt(rate24ktPerGram);
  const productsUpdated = await recalculateAllProductPrices();

  return {
    rates: buildGoldRatesDto(rate24ktPerGram),
    productsUpdated,
  };
}
