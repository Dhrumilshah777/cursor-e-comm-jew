"use client";

import { useCart } from "@/components/cart/CartProvider";
import PriceUpdateNotice from "@/components/PriceUpdateNotice";
import {
  fetchGoldRateSnapshot,
  type GoldRateSnapshot,
} from "@/lib/goldRatesApi";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

/** Ignore quick alt-tabs; only refresh after the tab was hidden this long. */
const MIN_HIDDEN_MS = 1_000;
/** Avoid hammering the API if the user switches tabs frequently. */
const MIN_REFRESH_INTERVAL_MS = 30_000;
const NOTICE_AUTO_DISMISS_MS = 6_000;
const GOLD_RATE_STORAGE_KEY = "wj-gold-rate-snapshot";

const SKIP_PREFIXES = ["/admin", "/checkout"];

function readStoredGoldRateSnapshot(): GoldRateSnapshot | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(GOLD_RATE_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as GoldRateSnapshot;
    if (
      typeof parsed.updatedAt !== "string" ||
      typeof parsed.rate24ktPerGram !== "number"
    ) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function storeGoldRateSnapshot(snapshot: GoldRateSnapshot): void {
  sessionStorage.setItem(GOLD_RATE_STORAGE_KEY, JSON.stringify(snapshot));
}

function goldRatesChanged(
  previous: GoldRateSnapshot | null,
  current: GoldRateSnapshot,
): boolean {
  if (!previous) return false;
  return (
    previous.updatedAt !== current.updatedAt ||
    previous.rate24ktPerGram !== current.rate24ktPerGram
  );
}

/**
 * When the customer returns to the store tab, re-fetch server-rendered product
 * prices (router.refresh) and cart totals (refreshCart) so gold-rate updates
 * show without a manual full page reload.
 */
export default function TabFocusRefresh() {
  const router = useRouter();
  const pathname = usePathname();
  const { refreshCart } = useCart();
  const hiddenAtRef = useRef<number | null>(null);
  const lastRefreshRef = useRef(0);
  const noticeTimerRef = useRef<number | null>(null);
  const [showPriceNotice, setShowPriceNotice] = useState(false);

  const dismissNotice = useCallback(() => {
    if (noticeTimerRef.current !== null) {
      window.clearTimeout(noticeTimerRef.current);
      noticeTimerRef.current = null;
    }
    setShowPriceNotice(false);
  }, []);

  const showNotice = useCallback(() => {
    dismissNotice();
    setShowPriceNotice(true);
    noticeTimerRef.current = window.setTimeout(() => {
      setShowPriceNotice(false);
      noticeTimerRef.current = null;
    }, NOTICE_AUTO_DISMISS_MS);
  }, [dismissNotice]);

  useEffect(() => {
    void fetchGoldRateSnapshot().then((snapshot) => {
      if (snapshot) storeGoldRateSnapshot(snapshot);
    });
  }, []);

  useEffect(() => {
    return () => {
      if (noticeTimerRef.current !== null) {
        window.clearTimeout(noticeTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const shouldSkip = () =>
      SKIP_PREFIXES.some((prefix) => pathname.startsWith(prefix));

    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        hiddenAtRef.current = Date.now();
        return;
      }

      if (document.visibilityState !== "visible" || shouldSkip()) {
        return;
      }

      const hiddenAt = hiddenAtRef.current;
      hiddenAtRef.current = null;
      if (hiddenAt === null) {
        return;
      }

      const hiddenMs = Date.now() - hiddenAt;
      if (hiddenMs < MIN_HIDDEN_MS) {
        return;
      }

      const sinceLastRefresh = Date.now() - lastRefreshRef.current;
      if (sinceLastRefresh < MIN_REFRESH_INTERVAL_MS) {
        return;
      }

      lastRefreshRef.current = Date.now();

      void (async () => {
        const previous = readStoredGoldRateSnapshot();
        const current = await fetchGoldRateSnapshot();

        router.refresh();
        await refreshCart();

        if (current) {
          if (goldRatesChanged(previous, current)) {
            showNotice();
          }
          storeGoldRateSnapshot(current);
        }
      })();
    };

    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => document.removeEventListener("visibilitychange", onVisibilityChange);
  }, [pathname, router, refreshCart, showNotice]);

  return (
    <PriceUpdateNotice visible={showPriceNotice} onDismiss={dismissNotice} />
  );
}
