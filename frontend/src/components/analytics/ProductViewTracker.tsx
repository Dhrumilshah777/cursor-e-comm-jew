"use client";

import { useEffect } from "react";
import type { CollectionProduct } from "@/data/collections";
import { isAnalyticsConfigured, trackViewItem } from "@/lib/analytics";

export default function ProductViewTracker({
  product,
}: {
  product: CollectionProduct;
}) {
  useEffect(() => {
    if (!isAnalyticsConfigured()) return;
    trackViewItem(product);
  }, [product]);

  return null;
}
