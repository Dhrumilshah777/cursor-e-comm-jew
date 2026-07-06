export const PRODUCT_LIGHTBOX_EVENT = "product-lightbox-change";

export function setProductLightboxOpen(open: boolean) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent(PRODUCT_LIGHTBOX_EVENT, { detail: { open } }),
  );
}
