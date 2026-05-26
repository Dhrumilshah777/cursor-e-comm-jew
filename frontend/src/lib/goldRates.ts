export type GoldPurity = "14kt" | "18kt" | "22kt";

export const PURITY_FACTOR_FROM_24KT: Record<GoldPurity, number> = {
  "22kt": 0.916,
  "18kt": 0.75,
  "14kt": 14 / 24,
};

export const DEFAULT_RATE_24KT_RUPEES_PER_GRAM = 8952;

function roundRatePerGram(value: number): number {
  return Math.round(value);
}

export function deriveGoldRatesFrom24kt(
  rate24ktRupeesPerGram: number,
): Record<GoldPurity, number> {
  const rate24 = roundRatePerGram(rate24ktRupeesPerGram);
  return {
    "22kt": roundRatePerGram(rate24 * PURITY_FACTOR_FROM_24KT["22kt"]),
    "18kt": roundRatePerGram(rate24 * PURITY_FACTOR_FROM_24KT["18kt"]),
    "14kt": roundRatePerGram(rate24 * PURITY_FACTOR_FROM_24KT["14kt"]),
  };
}

export type GoldRates = {
  rate24ktPerGram: number;
  derivedRates: Record<GoldPurity, number>;
  purityFactors: Record<GoldPurity, number>;
};

export function buildGoldRates(rate24ktPerGram: number): GoldRates {
  return {
    rate24ktPerGram: roundRatePerGram(rate24ktPerGram),
    derivedRates: deriveGoldRatesFrom24kt(rate24ktPerGram),
    purityFactors: { ...PURITY_FACTOR_FROM_24KT },
  };
}

export function getDefaultGoldRates(): GoldRates {
  return buildGoldRates(DEFAULT_RATE_24KT_RUPEES_PER_GRAM);
}
