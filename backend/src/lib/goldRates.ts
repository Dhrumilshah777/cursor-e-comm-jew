import type { GoldPurity } from "./pricing.js";

export type { GoldPurity };

/** Fraction of 24KT fine gold content by karat. */
export const PURITY_FACTOR_FROM_24KT: Record<GoldPurity, number> = {
  "22kt": 0.916,
  "18kt": 0.75,
  "14kt": 14 / 24,
};

/** Fallback when DB settings are not loaded yet (matches pre-migration 22KT ≈ ₹8,200/g). */
export const DEFAULT_RATE_24KT_RUPEES_PER_GRAM = 8952;

let cachedRate24kt: number | null = null;

export function deriveGoldRatesFrom24kt(
  rate24ktRupeesPerGram: number,
): Record<GoldPurity, number> {
  return {
    "22kt": rate24ktRupeesPerGram * PURITY_FACTOR_FROM_24KT["22kt"],
    "18kt": rate24ktRupeesPerGram * PURITY_FACTOR_FROM_24KT["18kt"],
    "14kt": rate24ktRupeesPerGram * PURITY_FACTOR_FROM_24KT["14kt"],
  };
}

export function getGoldRate24ktRupeesPerGram(): number {
  return cachedRate24kt ?? DEFAULT_RATE_24KT_RUPEES_PER_GRAM;
}

export function getGoldRatesPerGram(): Record<GoldPurity, number> {
  return deriveGoldRatesFrom24kt(getGoldRate24ktRupeesPerGram());
}

export function getGoldRatePerGramForPurity(purity: GoldPurity): number {
  return getGoldRatesPerGram()[purity];
}

export function setCachedGoldRate24kt(rate24ktRupeesPerGram: number): void {
  cachedRate24kt = rate24ktRupeesPerGram;
}

export function clearCachedGoldRate24kt(): void {
  cachedRate24kt = null;
}

export type GoldRatesDto = {
  rate24ktPerGram: number;
  derivedRates: Record<GoldPurity, number>;
  purityFactors: Record<GoldPurity, number>;
};

export function buildGoldRatesDto(rate24ktPerGram: number): GoldRatesDto {
  return {
    rate24ktPerGram,
    derivedRates: deriveGoldRatesFrom24kt(rate24ktPerGram),
    purityFactors: { ...PURITY_FACTOR_FROM_24KT },
  };
}
