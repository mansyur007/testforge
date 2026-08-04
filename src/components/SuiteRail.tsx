"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";

/**
 * The suite rail on the project overview, as a disclosure below `md`.
 *
 * F-43 stacked the rail above the case list (side by side left the list ~63px
 * wide on a phone). That fixed the overflow but pushed the cases table ~630px
 * down, below the fold. Collapsed-by-default puts the table back on the first
 * screen and leaves the tree one tap away.
 *
 * Two deliberate calls, per the F-43 follow-up note:
 * - **Collapsed by default**, not open: the table is the reason the page exists.
 * - **State is not persisted.** Tapping a suite navigates, and arriving at the
 *   filtered cases with the rail shut is the wanted end state — a remembered
 *   "open" would put the user back below the fold on every navigation.
 *
 * From `md` up the toggle is `display:none` and the panel is forced open, so
 * the desktop box tree is exactly what it was before this component existed
 * (guarded by TC-E2E-85).
 */
export function SuiteRail({
  slug,
  children,
}: {
  slug: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <aside className="w-full shrink-0 space-y-4 md:w-64">
      <div className="rounded-xl border border-hairline bg-surface p-4">
        {/* Toggle and heading are separate nodes on purpose: at ≥md the button
            is display:none and the <h3> is the old markup, unchanged. */}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls="suite-rail-panel"
          data-testid="suite-rail-toggle"
          className="flex min-h-[44px] w-full items-center justify-between gap-2 text-xs font-semibold uppercase text-content-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-ring md:hidden"
        >
          Test Suites
          {/* Same chevron glyph as the per-suite toggles in SuiteTree. */}
          <svg
            viewBox="0 0 20 20"
            aria-hidden
            fill="currentColor"
            className={`h-3.5 w-3.5 motion-safe:transition-transform motion-safe:duration-panel motion-safe:ease-tf-out ${
              open ? "rotate-90" : ""
            }`}
          >
            <path d="M7 5l6 5-6 5V5z" />
          </svg>
        </button>
        <h3 className="mb-3 hidden text-xs font-semibold uppercase text-content-subtle md:block">
          Test Suites
        </h3>
        <div
          id="suite-rail-panel"
          className={`${open ? "block" : "hidden"} mt-3 md:mt-0 md:block`}
        >
          {children}
        </div>
      </div>
      {/* F-04: reusable step blocks library */}
      <Link
        href={`/projects/${slug}/cases/shared-steps`}
        data-testid="shared-steps-link"
        className={`${open ? "block" : "hidden"} rounded-xl border border-hairline bg-surface px-4 py-3 text-sm text-content hover:border-accent-ring hover:text-accent-soft-fg md:block`}
      >
        ⛓ Shared Steps
      </Link>
    </aside>
  );
}
