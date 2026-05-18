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
import { fetchCart, type Cart } from "@/lib/cartApi";
import { getCustomerToken } from "@/lib/customerAuth";

type CartContextValue = {
  cart: Cart | null;
  itemCount: number;
  loading: boolean;
  refreshCart: () => Promise<void>;
  setCart: (cart: Cart) => void;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshCart = useCallback(async () => {
    if (!getCustomerToken()) {
      setCart(null);
      setLoading(false);
      return;
    }

    try {
      const next = await fetchCart();
      setCart(next);
    } catch {
      setCart(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshCart();
  }, [refreshCart]);

  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key === "customer_token") {
        refreshCart();
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [refreshCart]);

  const value = useMemo(
    () => ({
      cart,
      itemCount: cart?.itemCount ?? 0,
      loading,
      refreshCart,
      setCart,
    }),
    [cart, loading, refreshCart],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error("useCart must be used within CartProvider");
  }
  return ctx;
}
