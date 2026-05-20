/** Customer-facing wording (Razorpay / website review). Internal codes unchanged. */

export const STORE_CATEGORY_LABEL = "Fashion jewelry";

export const METAL_DISPLAY: Record<string, string> = {
  "Yellow Gold": "Plated finish — warm tone",
  "Rose Gold": "Plated finish — rose tone",
  "White Gold": "Plated finish — silver tone",
  YELLOW_GOLD: "Plated finish — warm tone",
  ROSE_GOLD: "Plated finish — rose tone",
  WHITE_GOLD: "Plated finish — silver tone",
};

export function metalLabel(metal: string): string {
  return METAL_DISPLAY[metal] ?? "Plated jewelry";
}

export function purityLabel(purity: string): string {
  const key = purity.toLowerCase().replace(/\s/g, "");
  if (key.includes("14")) return "Standard plated";
  if (key.includes("22")) return "Deluxe plated";
  if (key.includes("18") || key.includes("kt_18")) return "Premium plated";
  if (key.includes("kt_14")) return "Standard plated";
  if (key.includes("kt_22")) return "Deluxe plated";
  return "Premium plated";
}

export const PRICE_BASE_LABEL = "Material value";
export const TRUST_BADGE_PLATING = "Quality plated finish";

/** Softens product titles/descriptions loaded from catalog (temporary review copy). */
export function softenPublicText(text: string): string {
  return text
    .replace(/\b22\s*kt\b/gi, "deluxe plated")
    .replace(/\b18\s*kt\b/gi, "premium plated")
    .replace(/\b14\s*kt\b/gi, "standard plated")
    .replace(/\bgold\b/gi, "plated")
    .replace(/\bbullion\b/gi, "accessories");
}
