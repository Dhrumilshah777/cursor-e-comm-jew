import type { CollectionProduct } from "@/data/collections";

export const HEART_PENDANT_IMAGE =
  "https://ik.imagekit.io/dqel2bwws/Jewelry%20Images/Pendant%20gpt.png";

export const PENDANT_GPT_2 = "/images/pendants/pendant-gpt-2.png";
export const PENDANT_GPT_3 = "/images/pendants/pendant-gpt-3.png";

export const HEART_PENDANT_GALLERY = [
  HEART_PENDANT_IMAGE,
  PENDANT_GPT_2,
  PENDANT_GPT_3,
] as const;

export const PENDANT_IMAGE_OVERRIDES: Record<
  string,
  { image: string; gallery: string[] }
> = {
  "heart-pendant": {
    image: HEART_PENDANT_IMAGE,
    gallery: [...HEART_PENDANT_GALLERY],
  },
  "initial-pendant": {
    image: PENDANT_GPT_2,
    gallery: [PENDANT_GPT_2],
  },
  "solitaire-pendant": {
    image: PENDANT_GPT_3,
    gallery: [PENDANT_GPT_3],
  },
};

export function applyPendantImageOverrides(
  product: CollectionProduct,
): CollectionProduct {
  const override = PENDANT_IMAGE_OVERRIDES[product.slug];
  if (!override) return product;

  return {
    ...product,
    image: override.image,
    gallery: override.gallery,
  };
}
