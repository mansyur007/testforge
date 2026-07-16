"use client";

import { useEffect, useRef, useState } from "react";

// L-04 (+§7.4 rules): bottom-center toast, slide-up 200 ms ease-out
// (translate/opacity only, gated behind prefers-reduced-motion),
// role="status" aria-live="polite". The caller owns the message state —
// newest wins, no queue.

export function Toast({
  message,
  actionLabel,
  onAction,
  onClose,
  durationMs = 8000,
}: {
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  onClose: () => void;
  durationMs?: number;
}) {
  const [entered, setEntered] = useState(false);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    const raf = requestAnimationFrame(() => setEntered(true));
    const timer = setTimeout(() => closeRef.current(), durationMs);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(timer);
    };
  }, [durationMs, message]);

  return (
    <div
      role="status"
      aria-live="polite"
      data-testid="toast"
      className={`fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 rounded-lg bg-slate-900 px-4 py-2.5 text-sm text-white shadow-lg motion-safe:transition-all motion-safe:duration-200 motion-safe:ease-out ${
        entered
          ? "opacity-100 motion-safe:translate-y-0"
          : "opacity-0 motion-safe:translate-y-2"
      }`}
    >
      <span>{message}</span>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          data-testid="toast-action"
          className="rounded bg-white/15 px-2 py-0.5 font-medium hover:bg-white/25"
        >
          {actionLabel}
        </button>
      )}
      <button
        onClick={onClose}
        aria-label="Dismiss"
        className="text-white/50 hover:text-white"
      >
        ✕
      </button>
    </div>
  );
}
