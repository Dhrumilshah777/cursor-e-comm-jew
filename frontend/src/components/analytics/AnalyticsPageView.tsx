"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { isAnalyticsConfigured, shouldTrackPath, trackPageView } from "@/lib/analytics";

export default function AnalyticsPageView() {
  const pathname = usePathname();
  const lastTrackedPath = useRef<string | null>(null);

  useEffect(() => {
    if (!isAnalyticsConfigured() || !pathname || !shouldTrackPath(pathname)) {
      return;
    }

    if (lastTrackedPath.current === pathname) {
      return;
    }

    lastTrackedPath.current = pathname;
    trackPageView(pathname);
  }, [pathname]);

  return null;
}
