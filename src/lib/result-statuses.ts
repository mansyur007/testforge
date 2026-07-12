// F-14: per-project result-status definitions — PURE helpers only (client
// components import these; DB loaders live in lib/result-status-defs.ts).
// A project with no rows runs on DEFAULT_STATUS_DEFS (identical to the
// historical hard-coded set); rows are seeded the first time the project edits
// its statuses — never on a read path.
//
// Aggregate math keys off `kind`, never `key`: pass rate = kind PASS over
// executed, "failure-ish" = kind FAIL/BLOCKED. The only key-based rules left
// are the two immutable system keys UNTESTED / IN_PROGRESS (the not-executed
// bucket — a custom status is always a recorded outcome) and RETEST in the
// rerun-failed selection.

export const STATUS_KINDS = ["PASS", "FAIL", "NEUTRAL", "BLOCKED"] as const;
export type StatusKind = (typeof STATUS_KINDS)[number];

export type StatusDefLite = {
  key: string;
  label: string;
  color: string; // hex
  kind: string;
  order: number;
  active: boolean;
  system: boolean;
};

// Hexes match the previous Tailwind palette (green/red/orange/gray/blue/purple).
export const DEFAULT_STATUS_DEFS: StatusDefLite[] = [
  { key: "PASSED", label: "Pass", color: "#22c55e", kind: "PASS", order: 0, active: true, system: true },
  { key: "FAILED", label: "Fail", color: "#ef4444", kind: "FAIL", order: 1, active: true, system: true },
  { key: "BLOCKED", label: "Blocked", color: "#f97316", kind: "BLOCKED", order: 2, active: true, system: true },
  { key: "SKIPPED", label: "Skip", color: "#9ca3af", kind: "NEUTRAL", order: 3, active: true, system: true },
  { key: "RETEST", label: "Retest", color: "#a855f7", kind: "NEUTRAL", order: 4, active: true, system: true },
  { key: "IN_PROGRESS", label: "In Progress", color: "#3b82f6", kind: "NEUTRAL", order: 5, active: true, system: true },
  { key: "UNTESTED", label: "Untested", color: "#e5e7eb", kind: "NEUTRAL", order: 6, active: true, system: true },
];

// Statuses that are set by the app, not by an executor button.
export const NON_SUBMITTABLE_KEYS = ["UNTESTED", "IN_PROGRESS"];

// The F-21 "MUTED" aggregate bucket is not a real status; fixed slate.
const MUTED_COLOR = "#cbd5e1";

/** Lookup helpers with safe fallbacks for unknown keys (deleted-def data,
 * the MUTED bucket, pre-F-14 rows). */
export function statusMeta(defs: StatusDefLite[]) {
  const byKey = new Map(defs.map((d) => [d.key, d]));
  return {
    colorOf: (key: string): string =>
      key === "MUTED" ? MUTED_COLOR : byKey.get(key)?.color ?? "#94a3b8",
    kindOf: (key: string): string => byKey.get(key)?.kind ?? "NEUTRAL",
    labelOf: (key: string): string =>
      key === "MUTED" ? "Muted" : byKey.get(key)?.label ?? key.replace(/_/g, " "),
  };
}

/** Inline style for a pastel status badge from an arbitrary hex; very light
 * colors (e.g. UNTESTED's gray) get readable slate text + a border. */
export function badgeStyle(color: string): {
  backgroundColor: string;
  color: string;
  border?: string;
} {
  const hex = color.replace("#", "");
  const n = parseInt(hex.length === 3 ? hex.split("").map((c) => c + c).join("") : hex, 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return {
    backgroundColor: `${color}26`, // ~15% alpha
    color: luminance > 0.72 ? "#64748b" : color,
    ...(luminance > 0.72 ? { border: "1px solid #e2e8f0" } : {}),
  };
}

/** Keyboard shortcuts for executor buttons: first letter of the label; when
 * two labels share a letter, the one earlier in `order` keeps it and the later
 * one gets none (spec: conflicts resolved by order, shown in tooltip). */
export function assignShortcuts(defs: StatusDefLite[]): Map<string, string> {
  const taken = new Set<string>();
  const map = new Map<string, string>();
  for (const d of defs) {
    const letter = d.label.trim().charAt(0).toLowerCase();
    if (!letter || taken.has(letter)) continue;
    taken.add(letter);
    map.set(d.key, letter);
  }
  return map;
}

/** Executor submit buttons: active defs minus the app-managed keys. */
export function submittableDefs(defs: StatusDefLite[]): StatusDefLite[] {
  return defs.filter((d) => d.active && !NON_SUBMITTABLE_KEYS.includes(d.key));
}

/** Allowed values for a submitted result status. */
export function allowedStatusKeys(defs: StatusDefLite[]): Set<string> {
  return new Set(defs.filter((d) => d.active).map((d) => d.key));
}
