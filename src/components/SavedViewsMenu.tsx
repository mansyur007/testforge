"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useFormState } from "react-dom";
import {
  createSavedView,
  deleteSavedView,
  toggleDefaultSavedView,
} from "@/app/actions/saved-views";
import { viewHref } from "@/lib/saved-views";

// F-10: the "Views" dropdown on the cases toolbar — apply, save, star-as-
// default, and delete saved filter combinations. Applying is plain navigation
// (filters live in the URL); `?v=<id>` marks the active view, `?v=all` is the
// "All cases" pseudo-view that suppresses the default-view redirect.

export type SavedViewItem = {
  id: string;
  name: string;
  shared: boolean;
  isDefault: boolean;
  mine: boolean;
  filters: Record<string, string>;
};

export function SavedViewsMenu({
  projectId,
  projectSlug,
  canShare,
  canManageShared,
  activeViewId,
  currentFilters,
  views,
}: {
  projectId: string;
  projectSlug: string;
  canShare: boolean;
  canManageShared: boolean;
  activeViewId?: string;
  currentFilters: Record<string, string>;
  views: SavedViewItem[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const [state, formAction] = useFormState(createSavedView, undefined);

  // Close on outside click.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("mousedown", onDown);
    return () => window.removeEventListener("mousedown", onDown);
  }, [open]);

  // A successful save closes the form (list refreshes via revalidatePath).
  useEffect(() => {
    if (state && "ok" in state && state.ok) setSaving(false);
  }, [state]);

  const active = views.find((v) => v.id === activeViewId);
  const hasFilters = Object.keys(currentFilters).length > 0;
  const personal = views.filter((v) => v.mine);
  const sharedViews = views.filter((v) => !v.mine || v.shared);

  const section = (label: string, items: SavedViewItem[]) =>
    items.length > 0 && (
      <>
        <p className="px-2 pb-1 pt-2 text-xs font-semibold uppercase text-slate-400">
          {label}
        </p>
        {items.map((v) => (
          <div
            key={`${label}-${v.id}`}
            className={`group flex items-center gap-1 rounded-lg px-2 py-1 ${
              v.id === activeViewId ? "bg-indigo-50" : "hover:bg-slate-100"
            }`}
          >
            <button
              type="button"
              data-testid="saved-view-item"
              onClick={() => {
                setOpen(false);
                router.push(viewHref(projectSlug, v.id, v.filters));
              }}
              className="flex-1 truncate text-left text-sm"
            >
              {v.name}
            </button>
            {v.mine && (
              <form action={toggleDefaultSavedView}>
                <input type="hidden" name="viewId" value={v.id} />
                <button
                  type="submit"
                  title={v.isDefault ? "Unset default" : "Make default"}
                  data-testid="saved-view-star"
                  className={`px-1 text-sm ${
                    v.isDefault ? "text-amber-500" : "text-slate-300 hover:text-amber-400"
                  }`}
                >
                  ★
                </button>
              </form>
            )}
            {(v.mine || (v.shared && canManageShared)) && (
              <form action={deleteSavedView}>
                <input type="hidden" name="viewId" value={v.id} />
                <button
                  type="submit"
                  title="Delete view"
                  className="hidden px-1 text-sm text-slate-300 hover:text-red-500 group-hover:block"
                >
                  ×
                </button>
              </form>
            )}
          </div>
        ))}
      </>
    );

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        data-testid="saved-views-trigger"
        onClick={() => setOpen((o) => !o)}
        className={`rounded-lg border px-3 py-2 text-sm hover:bg-slate-100 ${
          active ? "border-indigo-300 text-indigo-700" : "border-slate-300"
        }`}
      >
        ☰ {active ? active.name : "Views"}
      </button>

      {open && (
        <div
          data-testid="saved-views-panel"
          className="absolute left-0 z-40 mt-1 w-72 origin-top-left rounded-xl border border-slate-200 bg-white p-2 shadow-xl motion-safe:animate-tf-pop-in"
        >
          <button
            type="button"
            data-testid="saved-view-all"
            onClick={() => {
              setOpen(false);
              router.push(`/projects/${projectSlug}?v=all`);
            }}
            className={`w-full rounded-lg px-2 py-1.5 text-left text-sm ${
              !active ? "bg-slate-50 font-medium" : "hover:bg-slate-100"
            }`}
          >
            All cases
          </button>

          {section("My views", personal)}
          {section("Shared", sharedViews.filter((v) => !v.mine))}

          <div className="mt-2 border-t border-slate-200 pt-2">
            {saving ? (
              <form action={formAction} className="space-y-2 px-1">
                <input type="hidden" name="projectId" value={projectId} />
                <input
                  type="hidden"
                  name="filtersJson"
                  value={JSON.stringify(currentFilters)}
                />
                <input
                  name="name"
                  autoFocus
                  placeholder="View name…"
                  data-testid="saved-view-name"
                  className="w-full rounded-lg border border-slate-300 px-2 py-1.5 text-sm focus:border-indigo-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                />
                <div className="flex items-center gap-3 text-xs text-slate-600">
                  {canShare && (
                    <label className="flex items-center gap-1">
                      <input type="checkbox" name="shared" /> Shared
                    </label>
                  )}
                  <label className="flex items-center gap-1">
                    <input type="checkbox" name="isDefault" /> Default
                  </label>
                </div>
                {state && "error" in state && state.error && (
                  <p className="text-xs text-red-600">{state.error}</p>
                )}
                <div className="flex gap-2">
                  <button
                    type="submit"
                    data-testid="saved-view-save"
                    className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => setSaving(false)}
                    className="rounded-lg px-3 py-1.5 text-xs text-slate-500 hover:bg-slate-100"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <button
                type="button"
                data-testid="saved-view-new"
                disabled={!hasFilters}
                title={hasFilters ? "" : "Apply at least one filter first"}
                onClick={() => setSaving(true)}
                className="w-full rounded-lg px-2 py-1.5 text-left text-sm text-indigo-600 hover:bg-indigo-50 disabled:cursor-not-allowed disabled:text-slate-300"
              >
                + Save current as view…
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
