"use client";

import AnalyticsPageView from "@/components/analytics/AnalyticsPageView";
import TabFocusRefresh from "@/components/TabFocusRefresh";
import { CartProvider } from "@/components/cart/CartProvider";
import { WishlistProvider } from "@/components/wishlist/WishlistProvider";
import type { ReactNode } from "react";

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <CartProvider>
      <WishlistProvider>
        <AnalyticsPageView />
        <TabFocusRefresh />
        {children}
      </WishlistProvider>
    </CartProvider>
  );
}
