import {
  deriveGoldRatesFrom24kt,
  DEFAULT_RATE_24KT_RUPEES_PER_GRAM,
  type GoldPurity,
} from "./goldRates";

export type { GoldPurity };

export type MakingChargeType = "percentage" | "fixed";

export type ProductMakingCharge = {
  type: MakingChargeType;
  value: number;
};

export type PriceBreakup = {
  netWeightGrams: number;
  pricePerGram: number;
  purity: GoldPurity;
  goldValue: number;
  makingCharge: number;
  makingChargeDisplay: string;
  subtotal: number;
  gst: number;
  gstPercent: number;
  total: number;
};

/** Live rates — use deriveGoldRatesFrom24kt() with admin-configured 24KT rate when available. */
export function getGoldRatesFor24kt(rate24ktPerGram: number): Record<GoldPurity, number> {
  return deriveGoldRatesFrom24kt(rate24ktPerGram);
}

export const goldRatePerGram: Record<GoldPurity, number> =
  deriveGoldRatesFrom24kt(DEFAULT_RATE_24KT_RUPEES_PER_GRAM);

export const DEFAULT_GST_PERCENT = 3;

/** Drops the final rupee digit (e.g. 366708 → 36670). */
export function removeLastPriceDigit(amount: number): number {
  const whole = Math.round(amount);
  if (whole < 10) return whole;
  return Math.floor(whole / 10);
}

export function parseNetWeightGrams(weight: string): number {
  const grams = parseFloat(weight.replace(/[^\d.]/g, ""));
  return Number.isFinite(grams) ? grams : 0;
}

export function calculatePriceBreakup(input: {
  netWeightGrams: number;
  purity: GoldPurity;
  makingCharge: ProductMakingCharge;
  gstPercent?: number;
  pricePerGram?: number;
}): PriceBreakup {
  const pricePerGram = input.pricePerGram ?? goldRatePerGram[input.purity];
  const gstPercent = input.gstPercent ?? DEFAULT_GST_PERCENT;

  const goldValue = input.netWeightGrams * pricePerGram;

  let makingCharge: number;
  let makingChargeDisplay: string;

  if (input.makingCharge.type === "percentage") {
    makingCharge = goldValue * (input.makingCharge.value / 100);
    const pct =
      Math.round(input.makingCharge.value * 1000) / 1000;
    makingChargeDisplay = `${pct}%`;
  } else {
    makingCharge = input.makingCharge.value;
    makingChargeDisplay = formatINR(input.makingCharge.value);
  }

  const subtotal = goldValue + makingCharge;
  const gst = subtotal * (gstPercent / 100);
  const total = subtotal + gst;

  return {
    netWeightGrams: input.netWeightGrams,
    pricePerGram: removeLastPriceDigit(pricePerGram),
    purity: input.purity,
    goldValue: removeLastPriceDigit(goldValue),
    makingCharge: removeLastPriceDigit(makingCharge),
    makingChargeDisplay,
    subtotal: removeLastPriceDigit(subtotal),
    gst: removeLastPriceDigit(gst),
    gstPercent,
    total: removeLastPriceDigit(total),
  };
}

export function formatINR(amount: number): string {
  return `₹${Math.round(amount).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

export function formatPaise(paise: number): string {
  return formatINR(paise / 100);
}

export function formatPurityLabel(purity: GoldPurity): string {
  return `${purity.toUpperCase()} Gold`;
}

export function formatRatePerGram(pricePerGram: number): string {
  return `${formatINR(pricePerGram)}/g`;
}
