"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Logo, TFIcon } from "@/components/icons";
import { PwaRegistrar } from "@/components/PwaRegistrar";
import { FOCUS_RING_DARK } from "@/components/focus";

// F-36: responsive app shell. Desktop (≥md) is pixel-identical to before — the
// w-60 sidebar is fixed and main clears it with ml-60. Below md the sidebar
// becomes an off-canvas drawer behind a thin top bar's hamburger, so the mobile
// execution PWA (and every page) fits a phone without horizontal scroll.
export function AppShell({
  sidebar,
  children,
}: {
  sidebar: React.ReactNode;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  // Close the drawer whenever navigation happens.
  useEffect(() => setOpen(false), [pathname]);

  return (
    <div className="flex min-h-screen">
      <PwaRegistrar />

      {/* Mobile top bar: brand + hamburger. Hidden on desktop. */}
      <div className="fixed inset-x-0 top-0 z-30 flex h-12 items-center gap-3 border-b border-slate-800 bg-slate-900 px-3 text-white md:hidden">
        <button
          type="button"
          onClick={() => setOpen(true)}
          data-testid="mobile-nav-toggle"
          aria-label="Open menu"
          className={`grid h-9 w-9 place-items-center rounded-lg hover:bg-slate-800 ${FOCUS_RING_DARK}`}
        >
          <TFIcon name="menu" current className="h-5 w-5" />
        </button>
        <Logo href="/dashboard" size="sm" dark />
      </div>

      {/* Drawer backdrop (mobile only, when open). */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          onClick={() => setOpen(false)}
          aria-hidden
        />
      )}

      <aside
        className={`fixed inset-y-0 z-50 flex w-60 flex-col border-r border-slate-800 bg-slate-900 text-slate-300 motion-safe:transition-transform motion-safe:duration-panel motion-safe:ease-tf-drawer md:z-auto md:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
        data-testid="app-sidebar"
      >
        {sidebar}
      </aside>

      {/* min-w-0 lets this flex item shrink below its content's intrinsic
          width so wide children (tab rows, tables) scroll inside their own box
          instead of widening the page on a phone. */}
      <main className="ml-0 min-w-0 flex-1 p-4 pt-16 md:ml-60 md:p-8">
        {children}
      </main>
    </div>
  );
}
