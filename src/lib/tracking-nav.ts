import type { IconName } from "@/components/icons";

// Client-safe half of the tracking registry: keys, labels, icons and hrefs and
// nothing else. Kept apart from lib/tracking-sections.tsx, which pulls in the
// server-only section components (db, next/headers) — a client component like
// ProjectTabs importing that file drags the whole server tree into the browser
// bundle. Same split as settings-nav (pure) vs settings-sections (loader).

export type TrackingKey =
  | "requirements"
  | "sessions"
  | "defects"
  | "baselines";

export type TrackingNavItem = {
  key: TrackingKey;
  label: string;
  icon: IconName;
};

export const TRACKING_NAV: TrackingNavItem[] = [
  { key: "requirements", label: "Requirements", icon: "target" },
  { key: "sessions", label: "Sessions", icon: "review" },
  { key: "defects", label: "Defects", icon: "bug" },
  { key: "baselines", label: "Baselines", icon: "nav-tree" },
];

/** The section the Tracking control opens by default — the top of the list,
 * so "what you land on" always matches "what's highlighted first". */
export const DEFAULT_TRACKING_KEY: TrackingKey = TRACKING_NAV[0].key;

export function trackingHref(
  slug: string,
  key: TrackingKey = DEFAULT_TRACKING_KEY
) {
  return `/projects/${slug}/tracking/${key}`;
}

export function isTrackingKey(key: string): key is TrackingKey {
  return TRACKING_NAV.some((s) => s.key === key);
}
