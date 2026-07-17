"use client";

import { useEffect, useRef, useState } from "react";
import { TFIcon } from "@/components/icons";

// F-30: a single "Export ▾" button revealing every export format as a plain
// link (browser handles the download) — replaces a row of separate per-
// format buttons on the cases list and run detail pages.

export function ExportMenu({
  items,
}: {
  items: { label: string; href: string; testid?: string }[];
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("mousedown", onDown);
    return () => window.removeEventListener("mousedown", onDown);
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        data-testid="export-menu-trigger"
        className="rounded-lg border border-slate-300 px-3 py-2 text-sm hover:bg-slate-100"
      >
        <span className="inline-flex items-center gap-1.5">
          <TFIcon name="download" className="h-4 w-4" /> Export ▾
        </span>
      </button>
      {open && (
        <div
          data-testid="export-menu-panel"
          className="absolute right-0 z-40 mt-1 w-44 rounded-xl border border-slate-200 bg-white p-1 shadow-xl"
        >
          {items.map((item) => (
            <a
              key={item.href}
              href={item.href}
              data-testid={item.testid}
              onClick={() => setOpen(false)}
              className="block rounded-lg px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-100"
            >
              {item.label}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
