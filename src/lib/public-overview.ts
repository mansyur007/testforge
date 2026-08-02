import { db } from "@/lib/db";
import { CASE_TYPES, PRIORITIES, parseTags } from "@/lib/constants";
import { loadPublicRuns, type PublicRunSummary } from "@/lib/public-runs";

// F-42: the aggregate layer behind the public project overview.
//
// Two rules this module exists to keep:
//
//  1. **Aggregates only.** Every value below is a tally over the project — a
//     count per priority, a count per day, a pass rate. Nothing here reaches
//     into an individual case's body or an individual result. The one place a
//     name reaches the page is `latest.name` (a run name), which the Runs list
//     and the Reports trend chart already publish.
//  2. **Execution data still goes through `public-runs.ts`.** That module is
//     the documented field allow-list for anything run-shaped, so the overview
//     summons it rather than writing its own `testRun.findMany` — otherwise
//     the allow-list would have a second, undocumented copy to keep in sync.
//
// Both halves are gated by the owner's section toggles at the call site: the
// design panels need `showCases`, the execution panels need `showRuns ||
// showReports`. See src/app/public/[slug]/page.tsx.

/** A year of run activity, as whole Sunday-start weeks. 52 columns of 12px +
 * 4px gap is ~830px — it fills the overview's 1024px column without scrolling
 * on desktop, and scrolls inside its own container below that. */
const ACTIVITY_WEEKS = 52;
const TREND_RUNS = 12;
const TOP_TAGS = 12;

// Deliberately not `AUTOMATION_STATUSES` order: this bar is read as a coverage
// bar, so the automated slice leads and the untouched remainder trails.
const AUTOMATION_ORDER = [
  "AUTOMATED",
  "IN_PROGRESS",
  "TO_BE_UPDATED",
  "NOT_AUTOMATED",
] as const;

const DAY_MS = 86_400_000;

export type Tally = { key: string; count: number };

/** Order a groupBy result by a known enum, then append anything unrecognized
 * (custom values arrive through the REST API and the CSV importer). */
function ordered(
  rows: { key: string; count: number }[],
  order: readonly string[]
): Tally[] {
  const byKey = new Map(rows.map((r) => [r.key, r.count]));
  const known = order
    .filter((k) => byKey.has(k))
    .map((k) => ({ key: k, count: byKey.get(k) as number }));
  const extra = rows
    .filter((r) => !order.includes(r.key))
    .sort((a, b) => b.count - a.count);
  return [...known, ...extra].filter((t) => t.count > 0);
}

export type DesignInsights = {
  total: number;
  priority: Tally[];
  automation: Tally[];
  /** % of cases with automationStatus AUTOMATED; null when there are no cases. */
  automationCoverage: number | null;
  types: Tally[];
  tags: Tally[];
  /** How many distinct tags exist, so the page can say "+N more". */
  distinctTags: number;
};

/** Composition of the case catalogue. Requires the Test Cases section. */
export async function loadDesignInsights(
  projectId: string
): Promise<DesignInsights> {
  const where = { projectId, deletedAt: null };
  const [priority, automation, types, tagged, total] = await Promise.all([
    db.testCase.groupBy({ by: ["priority"], where, _count: { _all: true } }),
    db.testCase.groupBy({
      by: ["automationStatus"],
      where,
      _count: { _all: true },
    }),
    db.testCase.groupBy({ by: ["type"], where, _count: { _all: true } }),
    // `tags` is a comma-separated string column, so the split has to happen in
    // JS. Only rows that actually carry a tag are read.
    db.testCase.findMany({
      where: { ...where, NOT: { tags: "" } },
      select: { tags: true },
    }),
    db.testCase.count({ where }),
  ]);

  const tagCount = new Map<string, number>();
  for (const row of tagged)
    for (const tag of parseTags(row.tags))
      tagCount.set(tag, (tagCount.get(tag) ?? 0) + 1);
  const tags = Array.from(tagCount.entries())
    .map(([key, count]) => ({ key, count }))
    .sort((a, b) => b.count - a.count || a.key.localeCompare(b.key));

  const automated =
    automation.find((a) => a.automationStatus === "AUTOMATED")?._count._all ?? 0;

  return {
    total,
    priority: ordered(
      priority.map((p) => ({ key: p.priority, count: p._count._all })),
      PRIORITIES
    ),
    automation: ordered(
      automation.map((a) => ({
        key: a.automationStatus,
        count: a._count._all,
      })),
      AUTOMATION_ORDER
    ),
    automationCoverage: total ? Math.round((automated / total) * 100) : null,
    types: ordered(
      types.map((t) => ({ key: t.type, count: t._count._all })),
      CASE_TYPES
    ),
    tags: tags.slice(0, TOP_TAGS),
    distinctTags: tags.length,
  };
}

/** One cell of the activity grid. `future` days sit past today in the current
 * week — the grid is drawn in whole weeks, so they exist but stay blank. */
export type ActivityDay = { date: string; count: number; future: boolean };

export type ExecutionInsights = {
  totalRuns: number;
  /** Newest run, or null when the project has never been executed. */
  latest: PublicRunSummary | null;
  /** Oldest → newest, capped at TREND_RUNS — reads left to right. */
  trend: PublicRunSummary[];
  /** ACTIVITY_WEEKS × 7 cells, oldest first, Sunday-aligned. */
  activity: ActivityDay[];
  activityWeeks: number;
  activityRuns: number;
  activityMax: number;
  /** Pass rate across every executed result in the project's history. */
  passRate: number | null;
  barKeys: string[];
  colorOf: (key: string) => string;
  labelOf: (key: string) => string;
};

function utcDayStart(d: Date): number {
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}

function dayKey(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

/**
 * Health of the execution history. Requires the Runs *or* the Reports section.
 *
 * The activity grid is built in UTC rather than the server's local zone: these
 * pages are ISR-cached and shared by every viewer, so a deterministic day
 * boundary is the only one that means anything.
 */
export async function loadExecutionInsights(
  projectId: string
): Promise<ExecutionInsights> {
  const { runs, barKeys, colorOf, labelOf } = await loadPublicRuns(projectId);

  const executed = runs.reduce((n, r) => n + r.executed, 0);
  const passed = runs.reduce((n, r) => n + r.passed, 0);

  // Whole weeks ending with the Saturday of the current week, so every column
  // is a real Sun–Sat week and weekday rows line up.
  const today = utcDayStart(new Date());
  const gridEnd = today + (6 - new Date(today).getUTCDay()) * DAY_MS;
  const gridStart = gridEnd - (ACTIVITY_WEEKS * 7 - 1) * DAY_MS;

  const perDay = new Map<string, number>();
  for (const run of runs) {
    const key = dayKey(utcDayStart(run.createdAt));
    perDay.set(key, (perDay.get(key) ?? 0) + 1);
  }

  const activity: ActivityDay[] = [];
  let activityRuns = 0;
  let activityMax = 0;
  for (let ms = gridStart; ms <= gridEnd; ms += DAY_MS) {
    const key = dayKey(ms);
    const count = perDay.get(key) ?? 0;
    activity.push({ date: key, count, future: ms > today });
    activityRuns += count;
    if (count > activityMax) activityMax = count;
  }

  return {
    totalRuns: runs.length,
    latest: runs[0] ?? null,
    trend: [...runs].reverse().slice(-TREND_RUNS),
    activity,
    activityWeeks: ACTIVITY_WEEKS,
    activityRuns,
    activityMax,
    passRate: executed ? Math.round((passed / executed) * 100) : null,
    barKeys,
    colorOf,
    labelOf,
  };
}

/** Day-granular "3d ago" for the overview's freshness line. Deliberately never
 * finer than a day: the page is cached for 60s, so "2m ago" would be a lie. */
export function relativeDays(date: Date, now = new Date()): string {
  const days = Math.floor((utcDayStart(now) - utcDayStart(date)) / DAY_MS);
  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 30) return `${days} days ago`;
  const months = Math.round(days / 30);
  if (months < 12) return `${months} month${months === 1 ? "" : "s"} ago`;
  const years = Math.round(days / 365);
  return `${years} year${years === 1 ? "" : "s"} ago`;
}
