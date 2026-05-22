"use client";

import { useEffect, useState } from "react";
import { formatCancellationCountdown } from "@/lib/cancellation";

type CancellationCountdownProps = {
  windowEndsAt: string;
  cancellable: boolean;
  className?: string;
};

export default function CancellationCountdown({
  windowEndsAt,
  cancellable,
  className = "",
}: CancellationCountdownProps) {
  const [remainingMs, setRemainingMs] = useState(() =>
    Math.max(0, new Date(windowEndsAt).getTime() - Date.now()),
  );

  useEffect(() => {
    if (!cancellable) return;

    const tick = () => {
      setRemainingMs(Math.max(0, new Date(windowEndsAt).getTime() - Date.now()));
    };

    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [windowEndsAt, cancellable]);

  if (!cancellable) return null;

  const withinWindow = remainingMs > 0;

  return (
    <p className={`text-sm font-light ${withinWindow ? "text-emerald-800" : "text-amber-800"} ${className}`}>
      {withinWindow ? (
        <>
          Full-refund window:{" "}
          <span className="font-normal tabular-nums">
            {formatCancellationCountdown(remainingMs)}
          </span>{" "}
          remaining (1% gateway fee applies)
        </>
      ) : (
        <>24-hour full-refund window ended — later cancellations deduct ₹1,000 + 1% gateway fee</>
      )}
    </p>
  );
}
