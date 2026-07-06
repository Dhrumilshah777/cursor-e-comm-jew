import type { CollectionProduct } from "@/data/collections";

export const DOLPHIN_EARRING_IMAGE =
  "https://ik.imagekit.io/dqel2bwws/Jewelry%20Images/new-pen-dol.png";

const EARRING_IMAGE_OVERRIDES: Record<
  string,
  { image: string; gallery: string[] }
> = {
  "pearl-drop-earrings": {
    image: DOLPHIN_EARRING_IMAGE,
    gallery: [DOLPHIN_EARRING_IMAGE],
  },
};

export function applyEarringImageOverrides(
  product: CollectionProduct,
): CollectionProduct {
  const override = EARRING_IMAGE_OVERRIDES[product.slug];
  if (!override) return product;

  return {
    ...product,
    image: override.image,
    gallery: override.gallery,
  };
}
