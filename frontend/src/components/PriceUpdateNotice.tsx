"use client";

import { IoCloseOutline } from "react-icons/io5";

type PriceUpdateNoticeProps = {
  visible: boolean;
  onDismiss: () => void;
};

export default function PriceUpdateNotice({
  visible,
  onDismiss,
}: PriceUpdateNoticeProps) {
  if (!visible) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 top-[4.25rem] z-50 flex justify-center px-4 sm:top-[4.75rem]"
    >
      <div className="pointer-events-auto flex max-w-md items-start gap-2 rounded-md border border-amber-200/80 bg-amber-50/95 px-3 py-2 text-xs font-light text-amber-950 shadow-sm backdrop-blur-sm sm:text-sm">
        <p className="flex-1 leading-snug">
          Gold prices were updated. Product prices on this page have been refreshed.
        </p>
        <button
          type="button"
          onClick={onDismiss}
          className="shrink-0 rounded p-0.5 text-amber-800/70 transition hover:bg-amber-100 hover:text-amber-950"
          aria-label="Dismiss price update notice"
        >
          <IoCloseOutline className="h-4 w-4" aria-hidden />
        </button>
      </div>
    </div>
  );
}
