import {
  COVERAGE_KINDS,
  COVERAGE_LABELS,
  type Coverage,
} from "@/lib/templates/schema";

// F-47: the coverage distribution of a template, rendered as a stacked bar.
//
// This is the feature's argument made visible. A pack that only demonstrates
// the happy path shows one long green band, and a reader can see that before
// they apply it — which is the point of requiring a coverage tag per case.
//
// Colour comes from the token layer only (F-39, §7.6): no raw palette classes,
// so both themes stay tuned from globals.css.
const BAR: Record<Coverage, string> = {
  positive: "bg-success",
  negative: "bg-danger",
  boundary: "bg-warning",
  security: "bg-accent",
  permission: "bg-info",
  usability: "bg-content-subtle",
  compatibility: "bg-content-muted",
};

const DOT: Record<Coverage, string> = BAR;

export function CoverageBar({
  coverage,
  className = "",
}: {
  coverage: Record<Coverage, number>;
  className?: string;
}) {
  const total = COVERAGE_KINDS.reduce((n, k) => n + (coverage[k] ?? 0), 0);
  if (total === 0) return null;

  return (
    <div
      className={`flex h-1.5 w-full overflow-hidden rounded-full bg-surface-muted ${className}`}
      role="img"
      aria-label={COVERAGE_KINDS.filter((k) => coverage[k] > 0)
        .map((k) => `${coverage[k]} ${COVERAGE_LABELS[k].toLowerCase()}`)
        .join(", ")}
    >
      {COVERAGE_KINDS.filter((k) => coverage[k] > 0).map((k) => (
        <span
          key={k}
          className={BAR[k]}
          style={{ width: `${(coverage[k] / total) * 100}%` }}
        />
      ))}
    </div>
  );
}

/** The same numbers as a readable legend, for the preview page. */
export function CoverageLegend({
  coverage,
}: {
  coverage: Record<Coverage, number>;
}) {
  const present = COVERAGE_KINDS.filter((k) => (coverage[k] ?? 0) > 0);
  if (present.length === 0) return null;

  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-content-muted">
      {present.map((k) => (
        <li key={k} className="inline-flex items-center gap-1.5">
          <span className={`h-2 w-2 shrink-0 rounded-full ${DOT[k]}`} />
          <span className="text-content">{coverage[k]}</span>
          <span>{COVERAGE_LABELS[k]}</span>
        </li>
      ))}
    </ul>
  );
}
