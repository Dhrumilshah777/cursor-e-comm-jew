"use client";

import AnalyticsPageView from "@/components/analytics/AnalyticsPageView";
import { CartProvider } from "@/components/cart/CartProvider";
import { WishlistProvider } from "@/components/wishlist/WishlistProvider";
import type { ReactNode } from "react";

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <CartProvider>
      <WishlistProvider>
        <AnalyticsPageView />
        {children}
      </WishlistProvider>
    </CartProvider>
  );
}
