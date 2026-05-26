"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { CUSTOMER_AUTH_CHANGED_EVENT } from "@/lib/customerAuth";
import {
  fetchWishlist,
  toggleWishlistItem as toggleWishlistItemApi,
  type Wishlist,
} from "@/lib/wishlistApi";

type WishlistContextValue = {
  wishlist: Wishlist;
  productIds: Set<string>;
  loading: boolean;
  refreshWishlist: () => Promise<void>;
  isWishlisted: (productId: string) => boolean;
  toggleWishlist: (productId: string) => Promise<boolean>;
};

const emptyWishlist: Wishlist = { items: [], productIds: [] };

const WishlistContext = createContext<WishlistContextValue | null>(null);

export function WishlistProvider({ children }: { children: ReactNode }) {
  const [wishlist, setWishlist] = useState<Wishlist | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshWishlist = useCallback(async () => {
    try {
      const next = await fetchWishlist();
      setWishlist(next);
    } catch {
      setWishlist(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshWishlist();
  }, [refreshWishlist]);

  useEffect(() => {
    const onAuthChanged = () => {
      refreshWishlist();
    };
    window.addEventListener(CUSTOMER_AUTH_CHANGED_EVENT, onAuthChanged);
    return () => window.removeEventListener(CUSTOMER_AUTH_CHANGED_EVENT, onAuthChanged);
  }, [refreshWishlist]);

  const resolvedWishlist = wishlist ?? emptyWishlist;

  const productIds = useMemo(
    () => new Set(resolvedWishlist.productIds),
    [resolvedWishlist.productIds],
  );

  const isWishlisted = useCallback(
    (productId: string) => productIds.has(productId),
    [productIds],
  );

  const toggleWishlist = useCallback(async (productId: string) => {
    const next = await toggleWishlistItemApi(productId);
    setWishlist(next);
    return next.productIds.includes(productId);
  }, []);

  const value = useMemo(
    () => ({
      wishlist: resolvedWishlist,
      productIds,
      loading,
      refreshWishlist,
      isWishlisted,
      toggleWishlist,
    }),
    [resolvedWishlist, productIds, loading, refreshWishlist, isWishlisted, toggleWishlist],
  );

  return (
    <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>
  );
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) {
    throw new Error("useWishlist must be used within WishlistProvider");
  }
  return ctx;
}
