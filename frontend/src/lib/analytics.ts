import type { AccountOrder } from "@/data/accountOrders";
import type { CollectionProduct } from "@/data/collections";
import type { Cart } from "@/lib/cartApi";

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
    fbq?: (...args: unknown[]) => void;
  }
}

export function getGaMeasurementId(): string {
  return process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim() ?? "";
}

export function getMetaPixelId(): string {
  return process.env.NEXT_PUBLIC_META_PIXEL_ID?.trim() ?? "";
}

export function isGaEnabled(): boolean {
  return getGaMeasurementId().length > 0;
}

export function isMetaEnabled(): boolean {
  return getMetaPixelId().length > 0;
}

export function isAnalyticsConfigured(): boolean {
  return isGaEnabled() || isMetaEnabled();
}

export function shouldTrackPath(pathname: string): boolean {
  return !pathname.startsWith("/admin");
}

function parseInrAmount(value: string): number {
  const normalized = value.replace(/[₹,\s]/g, "");
  const amount = Number.parseFloat(normalized);
  return Number.isFinite(amount) ? amount : 0;
}

export type AnalyticsProductInput = {
  id: string;
  name?: string;
  category?: string;
  price?: number;
};

function resolveProductPrice(
  product: Pick<CollectionProduct, "price" | "priceBreakup"> | AnalyticsProductInput,
): number {
  if ("priceBreakup" in product && product.priceBreakup) {
    return product.priceBreakup.total;
  }
  if ("price" in product) {
    if (typeof product.price === "number") return product.price;
    if (typeof product.price === "string") return parseInrAmount(product.price);
  }
  return 0;
}

function productToGaItem(
  product:
    | Pick<CollectionProduct, "id" | "name" | "category" | "price" | "priceBreakup">
    | AnalyticsProductInput,
  quantity = 1,
) {
  return {
    item_id: product.id,
    item_name: product.name ?? product.id,
    item_category: "category" in product ? product.category : undefined,
    price: resolveProductPrice(product),
    quantity,
  };
}

export function trackPageView(pathname: string): void {
  if (typeof window === "undefined" || !shouldTrackPath(pathname)) return;

  if (isGaEnabled() && typeof window.gtag === "function") {
    window.gtag("event", "page_view", {
      page_path: pathname,
    });
  }

  if (isMetaEnabled() && typeof window.fbq === "function") {
    window.fbq("track", "PageView");
  }
}

export function trackViewItem(product: CollectionProduct): void {
  if (typeof window === "undefined") return;

  const item = productToGaItem(product);
  const value = item.price;

  if (isGaEnabled() && typeof window.gtag === "function") {
    window.gtag("event", "view_item", {
      currency: "INR",
      value,
      items: [item],
    });
  }

  if (isMetaEnabled() && typeof window.fbq === "function") {
    window.fbq("track", "ViewContent", {
      content_ids: [product.id],
      content_name: product.name,
      content_type: "product",
      content_category: product.category,
      value,
      currency: "INR",
    });
  }
}

export function trackAddToCart(product: CollectionProduct, quantity = 1): void {
  if (typeof window === "undefined") return;

  const item = productToGaItem(product, quantity);
  const value = item.price * quantity;

  if (isGaEnabled() && typeof window.gtag === "function") {
    window.gtag("event", "add_to_cart", {
      currency: "INR",
      value,
      items: [item],
    });
  }

  if (isMetaEnabled() && typeof window.fbq === "function") {
    window.fbq("track", "AddToCart", {
      content_ids: [product.id],
      content_name: product.name,
      content_type: "product",
      value,
      currency: "INR",
    });
  }
}

export function trackBeginCheckout(cart: Cart): void {
  if (typeof window === "undefined") return;

  const items = cart.items.map((entry) => productToGaItem(entry.product, entry.quantity));
  const value = cart.subtotalPaise / 100;

  if (isGaEnabled() && typeof window.gtag === "function") {
    window.gtag("event", "begin_checkout", {
      currency: "INR",
      value,
      items,
    });
  }

  if (isMetaEnabled() && typeof window.fbq === "function") {
    window.fbq("track", "InitiateCheckout", {
      content_ids: cart.items.map((entry) => entry.product.id),
      num_items: cart.itemCount,
      value,
      currency: "INR",
    });
  }
}

export function trackPurchase(order: AccountOrder): void {
  if (typeof window === "undefined") return;

  const value = parseInrAmount(order.priceBreakdown?.total ?? order.total);
  const items = order.items.map((item) => ({
    item_id: item.slug,
    item_name: item.name,
    price: parseInrAmount(item.price),
    quantity: item.quantity,
  }));

  if (isGaEnabled() && typeof window.gtag === "function") {
    window.gtag("event", "purchase", {
      transaction_id: order.orderNumber,
      currency: "INR",
      value,
      items,
    });
  }

  if (isMetaEnabled() && typeof window.fbq === "function") {
    window.fbq("track", "Purchase", {
      content_ids: order.items.map((item) => item.slug),
      content_type: "product",
      num_items: order.items.reduce((sum, item) => sum + item.quantity, 0),
      value,
      currency: "INR",
    });
  }
}

export function trackAddToWishlist(product: AnalyticsProductInput): void {
  if (typeof window === "undefined") return;

  const item = productToGaItem(product);
  const value = item.price;

  if (isGaEnabled() && typeof window.gtag === "function") {
    window.gtag("event", "add_to_wishlist", {
      currency: "INR",
      value,
      items: [item],
    });
  }

  if (isMetaEnabled() && typeof window.fbq === "function") {
    window.fbq("track", "AddToWishlist", {
      content_ids: [product.id],
      content_name: product.name,
      content_type: "product",
      value,
      currency: "INR",
    });
  }
}
