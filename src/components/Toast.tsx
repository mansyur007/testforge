"use client";

import { useEffect, useRef, useState } from "react";

// L-04 (+§7.4 rules): bottom-center toast, slide-up 200 ms ease-out.
// Translate is gated behind prefers-reduced-motion; the opacity fade remains
// so reduced-motion users still receive a gentle state acknowledgement.
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
  const [leaving, setLeaving] = useState(false);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    setEntered(false);
    setLeaving(false);
    const raf = requestAnimationFrame(() =>
      requestAnimationFrame(() => setEntered(true))
    );
    const timer = setTimeout(() => setLeaving(true), durationMs);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(timer);
    };
  }, [durationMs, message]);

  useEffect(() => {
    if (!leaving) return;
    const timer = setTimeout(() => closeRef.current(), 200);
    return () => clearTimeout(timer);
  }, [leaving]);

  const visible = entered && !leaving;

  return (
    <div
      role="status"
      aria-live="polite"
      data-testid="toast"
      className={`fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 rounded-lg bg-slate-900 px-4 py-2.5 text-sm text-white shadow-lg transition-[opacity,transform] duration-panel ease-tf-out ${
        visible
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
        onClick={() => setLeaving(true)}
        aria-label="Dismiss"
        className="text-white/50 hover:text-white"
      >
        ✕
      </button>
    </div>
  );
}
