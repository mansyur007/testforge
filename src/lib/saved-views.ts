// F-10 shared helpers for saved views.

// Whitelist of cases-list filter params a view may store/restore. Unknown or
// stale keys inside filtersJson are silently dropped on both save and apply,
// so a view never breaks when a filter is removed later.
export const CASE_FILTER_KEYS = ["suite", "priority", "type", "q", "tag"] as const;

export function sanitizeCaseFilters(input: unknown): Record<string, string> {
  const out: Record<string, string> = {};
  if (input && typeof input === "object") {
    for (const key of CASE_FILTER_KEYS) {
      const v = (input as Record<string, unknown>)[key];
      if (typeof v === "string" && v.trim()) out[key] = v.trim();
    }
  }
  return out;
}

/** URL for the cases list with a view's filters applied (`v` marks it active). */
export function viewHref(
  projectSlug: string,
  viewId: string,
  filters: Record<string, string>
): string {
  const p = new URLSearchParams(filters);
  p.set("v", viewId);
  return `/projects/${projectSlug}?${p.toString()}`;
}
