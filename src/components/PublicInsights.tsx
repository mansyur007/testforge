import { TFIcon, type IconName } from "@/components/icons";
import type {
  DesignInsights,
  ExecutionInsights,
  Tally,
} from "@/lib/public-overview";
import { relativeDays } from "@/lib/public-overview";

// F-42: the panels on the public project overview. Server components with no
// interactivity — the public pages carry no client JS beyond the theme
// switcher, and nothing here may become a mutation surface.
//
// Every value arrives pre-aggregated from lib/public-overview.ts; this file
// owns only presentation. Colour classes live here rather than in the lib
// because Tailwind's content scan covers src/components and src/app, not
// src/lib — a class that only ever appears in a lib module gets purged.

/** ENUM_VALUE -> "Enum value". */
function humanize(key: string): string {
  const words = key.toLowerCase().replace(/_/g, " ");
  return words.charAt(0).toUpperCase() + words.slice(1);
}

const PRIORITY_FILL: Record<string, string> = {
  CRITICAL: "bg-danger",
  HIGH: "bg-warning",
  MEDIUM: "bg-info",
  LOW: "bg-content-subtle",
};

const AUTOMATION_FILL: Record<string, string> = {
  AUTOMATED: "bg-success",
  IN_PROGRESS: "bg-warning",
  TO_BE_UPDATED: "bg-info",
  NOT_AUTOMATED: "bg-content-subtle",
};

const FALLBACK_FILL = "bg-accent";

/** Pass-rate colour, same thresholds the authenticated report uses. */
function rateFill(rate: number): string {
  return rate >= 80 ? "bg-success" : rate >= 50 ? "bg-warning" : "bg-danger";
}

function Card({
  title,
  icon,
  testid,
  className = "",
  children,
}: {
  title: string;
  icon: IconName;
  testid?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      data-testid={testid}
      className={`flex flex-col rounded-xl border border-hairline bg-surface p-5 ${className}`}
    >
      <h2 className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-content-subtle">
        <TFIcon name={icon} className="h-4 w-4" />
        {title}
      </h2>
      {children}
    </section>
  );
}

type Segment = { key: string; label: string; count: number; fill: string };

function toSegments(
  tallies: Tally[],
  fills: Record<string, string>
): Segment[] {
  return tallies.map((t) => ({
    key: t.key,
    label: humanize(t.key),
    count: t.count,
    fill: fills[t.key] ?? FALLBACK_FILL,
  }));
}

/** One proportional bar plus a wrapped legend. Zero-count segments are already
 * filtered out upstream, so every colour in the bar has a legend entry. */
function Distribution({ segments }: { segments: Segment[] }) {
  const total = segments.reduce((n, s) => n + s.count, 0) || 1;
  return (
    <>
      <div className="flex h-2.5 overflow-hidden rounded-full bg-surface-muted">
        {segments.map((s) => (
          <div
            key={s.key}
            className={s.fill}
            style={{ width: `${(s.count / total) * 100}%` }}
            title={`${s.label}: ${s.count}`}
          />
        ))}
      </div>
      <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-content-muted">
        {segments.map((s) => (
          <li key={s.key} className="flex items-center gap-1.5">
            <span className={`h-2 w-2 shrink-0 rounded-full ${s.fill}`} />
            {s.label}
            <span className="font-medium text-content-strong">{s.count}</span>
          </li>
        ))}
      </ul>
    </>
  );
}

/* ------------------------------ execution ------------------------------ */

/** Newest run: headline pass rate, the same status bar the Runs list draws,
 * and a per-status legend. Run names are already public wherever this panel
 * is (the Runs list, the Reports trend labels). */
export function LatestRunPanel({
  execution,
}: {
  execution: ExecutionInsights;
}) {
  const run = execution.latest;
  if (!run) return null;
  const rate = run.passRate;
  return (
    <Card
      title="Latest run"
      icon="cicd"
      testid="public-latest-run"
      className="lg:col-span-2"
    >
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <p className="truncate font-medium text-content-strong">{run.name}</p>
          <p className="mt-0.5 text-xs text-content-subtle">
            {relativeDays(run.createdAt)} ·{" "}
            {run.status === "COMPLETED" ? "Completed" : "In progress"} ·{" "}
            {run.executed}/{run.total} executed
          </p>
        </div>
        <p
          className="font-display text-3xl font-bold leading-none"
          data-testid="public-latest-run-rate"
        >
          {rate === null ? "—" : `${rate}%`}
          <span className="ml-1.5 align-middle text-xs font-medium uppercase text-content-subtle">
            pass
          </span>
        </p>
      </div>

      {/* mt-auto: this panel shares a row with the taller trend chart, so the
          status bar settles against the bottom of the card instead of leaving
          a hole under it. */}
      <div className="mt-auto pt-4">
        <div className="flex h-2.5 overflow-hidden rounded-full bg-surface-muted">
          {execution.barKeys.map((key) => {
            const count = run.counts[key];
            if (!count) return null;
            return (
              <div
                key={key}
                style={{
                  backgroundColor: execution.colorOf(key),
                  width: `${(count / (run.total || 1)) * 100}%`,
                }}
                title={`${execution.labelOf(key)}: ${count}`}
              />
            );
          })}
        </div>
        <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-content-muted">
          {execution.barKeys
            .filter((key) => run.counts[key])
            .map((key) => (
              <li key={key} className="flex items-center gap-1.5">
                <span
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{ backgroundColor: execution.colorOf(key) }}
                />
                {execution.labelOf(key)}
                <span className="font-medium text-content-strong">
                  {run.counts[key]}
                </span>
              </li>
            ))}
        </ul>
      </div>
    </Card>
  );
}

/** Sparkline of the last dozen runs. Bars are the aggregate pass rate only —
 * no run names, which would repeat the Runs list at an unreadable width. */
export function TrendPanel({ execution }: { execution: ExecutionInsights }) {
  if (execution.trend.length === 0) return null;
  return (
    <Card title="Pass rate trend" icon="trend" testid="public-trend">
      <div className="flex h-24 items-end gap-1">
        {execution.trend.map((run) => {
          const rate = run.passRate ?? 0;
          return (
            <div
              key={run.id}
              className={`min-w-0 flex-1 rounded-t ${
                run.passRate === null ? "bg-surface-muted" : rateFill(rate)
              }`}
              style={{ height: `${Math.max(rate, 4)}%` }}
              title={
                run.passRate === null
                  ? "Not executed"
                  : `${rate}% (${run.executed} executed)`
              }
            />
          );
        })}
      </div>
      <p className="mt-3 text-xs text-content-subtle">
        Last {execution.trend.length}{" "}
        {execution.trend.length === 1 ? "run" : "runs"}
        {execution.passRate !== null && (
          <>
            {" "}
            · {execution.passRate}% all-time
          </>
        )}
      </p>
    </Card>
  );
}

const ACTIVITY_LEVELS = [
  "bg-surface-muted",
  "bg-accent/30",
  "bg-accent/55",
  "bg-accent/80",
  "bg-accent",
];

/** Runs per day over the last few months, one column per Sun–Sat week. Only
 * dates and tallies — the same information the Runs list already carries, in
 * the shape that makes a portfolio look alive. */
export function ActivityPanel({ execution }: { execution: ExecutionInsights }) {
  if (execution.activityRuns === 0) return null;
  const levelOf = (count: number) =>
    count === 0
      ? 0
      : Math.min(
          4,
          Math.ceil((count / Math.max(execution.activityMax, 1)) * 4)
        );
  return (
    <Card title="Run activity" icon="dashboard" testid="public-activity">
      <div className="overflow-x-auto pb-1">
        <div
          className="grid w-max gap-1"
          style={{
            gridTemplateRows: "repeat(7, minmax(0, 1fr))",
            gridAutoFlow: "column",
          }}
        >
          {execution.activity.map((day) => (
            <span
              key={day.date}
              title={
                day.future
                  ? undefined
                  : `${day.date}: ${day.count} ${day.count === 1 ? "run" : "runs"}`
              }
              className={`h-3 w-3 rounded-[3px] ${
                day.future
                  ? "bg-transparent"
                  : ACTIVITY_LEVELS[levelOf(day.count)]
              }`}
            />
          ))}
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-xs text-content-subtle">
        <span data-testid="public-activity-total">
          {execution.activityRuns}{" "}
          {execution.activityRuns === 1 ? "run" : "runs"} in the last{" "}
          {execution.activityWeeks >= 52
            ? "12 months"
            : `${execution.activityWeeks} weeks`}
        </span>
        <span className="flex items-center gap-1">
          Less
          {ACTIVITY_LEVELS.map((cls) => (
            <span key={cls} className={`h-3 w-3 rounded-[3px] ${cls}`} />
          ))}
          More
        </span>
      </div>
    </Card>
  );
}

/* -------------------------------- design -------------------------------- */

/** Composition of the catalogue: how the cases are prioritized and what kinds
 * of testing they cover. */
export function DesignPanel({ design }: { design: DesignInsights }) {
  return (
    <Card title="Test design" icon="manual" testid="public-design">
      <Distribution segments={toSegments(design.priority, PRIORITY_FILL)} />
      {design.types.length > 0 && (
        <ul className="mt-4 flex flex-wrap gap-1.5 border-t border-hairline-subtle pt-4">
          {design.types.map((t) => (
            <li
              key={t.key}
              className="rounded-full bg-surface-muted px-2.5 py-1 text-xs text-content-muted"
            >
              {humanize(t.key)}{" "}
              <span className="font-medium text-content-strong">{t.count}</span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

/** Automation coverage — the number a QA portfolio is actually read for. */
export function AutomationPanel({ design }: { design: DesignInsights }) {
  return (
    <Card title="Automation" icon="automation" testid="public-automation">
      <div className="mb-4 flex items-end gap-2">
        <p
          className="font-display text-3xl font-bold leading-none"
          data-testid="public-automation-coverage"
        >
          {design.automationCoverage === null
            ? "—"
            : `${design.automationCoverage}%`}
        </p>
        <p className="text-xs text-content-subtle">of cases automated</p>
      </div>
      <Distribution segments={toSegments(design.automation, AUTOMATION_FILL)} />
    </Card>
  );
}

/** What the suite actually covers, in the owner's own vocabulary. */
export function TagsPanel({ design }: { design: DesignInsights }) {
  if (design.tags.length === 0) return null;
  const hidden = design.distinctTags - design.tags.length;
  return (
    <Card title="Coverage tags" icon="target" testid="public-tags">
      <ul className="flex flex-wrap gap-1.5">
        {design.tags.map((t) => (
          <li
            key={t.key}
            className="rounded-full bg-accent-soft px-2.5 py-1 text-xs text-accent-soft-fg"
          >
            {t.key}{" "}
            <span className="font-medium">{t.count}</span>
          </li>
        ))}
        {hidden > 0 && (
          <li className="px-1 py-1 text-xs text-content-subtle">
            +{hidden} more
          </li>
        )}
      </ul>
    </Card>
  );
}
