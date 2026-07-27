import { db } from "@/lib/db";
import { loadStatusDefs } from "@/lib/result-status-defs";
import { statusMeta } from "@/lib/result-statuses";
import { bucketStatus, isMuted, NON_EXECUTED_BUCKETS } from "@/lib/mute";

// F-38 Part B: the data layer behind the public Runs and Reports sections.
//
// This file is the field allow-list for everything execution-related that a
// stranger can see. The authenticated pages (app/(app)/.../runs, .../reports)
// load runs with `include: { results: true, createdBy: true, ... }`; the public
// pages must never do that, so they go through here instead and the select
// below is written out column by column.
//
// Deliberately NOT selected, and why:
//   TestRunResult.comment        free-text tester notes / JUnit failure
//                                messages — stack traces, internal URLs, creds
//   TestRunResult.defectUrl      links into a private Jira/GitHub tracker
//   TestRunResult.customJson     arbitrary per-project fields (F-03)
//   TestRunResult.assigneeId     who tested what — member identity
//   TestRunResult.elapsedSeconds per-case timing, plus datasetName (F-13)
//   TestRun.createdById          run author; no person's name is on any public
//                                page, and this section must not be the first
//   TestRun.description          free-text release/scope notes
//   TestRun.origin               "CI · GitHub Actions (Linux)" / "Local · macOS"
//                                — CI topology and contributor machines
//   TestRun.environment          Environment.url is an internal/staging host
//   TestRun.configJson, planId, milestoneId, baselineId
//                                internal test-planning structure
// Attachments (screenshots on results) are never joined here at all; their
// download route is session-guarded independently.

/** The only TestRun columns any /public page may read. */
const PUBLIC_RUN_SELECT = {
  id: true,
  name: true,
  status: true,
  source: true,
  createdAt: true,
  completedAt: true,
  results: {
    select: {
      // caseId never reaches the DOM unless the Test Cases section is also on
      // (see loadPublicReport) — here it only keys the per-case flip series.
      caseId: true,
      status: true,
      testCase: { select: { mutedAt: true } },
    },
  },
} as const;

export type PublicRunSummary = {
  id: string;
  name: string;
  status: string;
  source: string;
  createdAt: Date;
  completedAt: Date | null;
  /** bucket key -> count, muted results bucketed as "MUTED" (F-21). */
  counts: Record<string, number>;
  total: number;
  executed: number;
  passed: number;
  /** null when nothing in the run was executed — render as "—", not 0%. */
  passRate: number | null;
};

type RunRow = {
  id: string;
  name: string;
  status: string;
  source: string;
  createdAt: Date;
  completedAt: Date | null;
  results: { caseId: string; status: string; testCase: { mutedAt: Date | null } }[];
};

async function fetchRuns(projectId: string) {
  const [runs, defs] = await Promise.all([
    db.testRun.findMany({
      where: { projectId },
      orderBy: { createdAt: "desc" },
      select: PUBLIC_RUN_SELECT,
    }) as Promise<RunRow[]>,
    loadStatusDefs(projectId),
  ]);
  return { runs, defs, meta: statusMeta(defs) };
}

function summarize(
  run: RunRow,
  kindOf: (key: string) => string
): PublicRunSummary {
  const counts: Record<string, number> = {};
  let executed = 0;
  let passed = 0;
  for (const r of run.results) {
    const bucket = bucketStatus(r.status, isMuted(r.testCase.mutedAt));
    counts[bucket] = (counts[bucket] ?? 0) + 1;
    if (NON_EXECUTED_BUCKETS.includes(bucket)) continue;
    executed++;
    if (kindOf(r.status) === "PASS") passed++;
  }
  return {
    id: run.id,
    name: run.name,
    status: run.status,
    source: run.source,
    createdAt: run.createdAt,
    completedAt: run.completedAt,
    counts,
    total: run.results.length,
    executed,
    passed,
    passRate: executed ? Math.round((passed / executed) * 100) : null,
  };
}

/** Public Runs section: one summarized row per run, newest first. */
export async function loadPublicRuns(projectId: string) {
  const { runs, defs, meta } = await fetchRuns(projectId);
  // Same bar order the authenticated list uses: every defined status except
  // UNTESTED (it is the empty remainder of the bar), then the MUTED bucket.
  const barKeys = [
    ...defs.filter((d) => d.key !== "UNTESTED").map((d) => d.key),
    "MUTED",
  ];
  return {
    runs: runs.map((r) => summarize(r, meta.kindOf)),
    barKeys,
    colorOf: meta.colorOf,
    labelOf: meta.labelOf,
  };
}

export type PublicReport = Awaited<ReturnType<typeof loadPublicReport>>;

/**
 * Public Reports section: aggregates only.
 *
 * `withCaseTitles` must be the project's showCases flag. The flaky-test panel
 * is the one place a report would name individual cases, so when the Test
 * Cases section is off the panel degrades to a count — publishing Reports can
 * never become a side channel for the case catalogue the owner kept private.
 */
export async function loadPublicReport(
  projectId: string,
  withCaseTitles: boolean
) {
  const { runs, meta } = await fetchRuns(projectId);
  const summaries = runs.map((r) => summarize(r, meta.kindOf));

  const executed = summaries.reduce((n, r) => n + r.executed, 0);
  const passed = summaries.reduce((n, r) => n + r.passed, 0);
  const failed = runs
    .flatMap((r) => r.results)
    .filter(
      (r) =>
        !NON_EXECUTED_BUCKETS.includes(
          bucketStatus(r.status, isMuted(r.testCase.mutedAt))
        ) && meta.kindOf(r.status) === "FAIL"
    ).length;

  const [caseCount, automated] = await Promise.all([
    db.testCase.count({ where: { projectId, deletedAt: null } }),
    db.testCase.count({
      where: { projectId, deletedAt: null, automationStatus: "AUTOMATED" },
    }),
  ]);

  // Oldest -> newest so the trend reads left to right; last 12 like the
  // authenticated report.
  const trend = [...summaries].reverse().slice(-12);

  // Flakiness = PASS/FAIL flips across runs, muted cases excluded (they are
  // already acknowledged and sit outside every pass-rate above).
  const series = new Map<string, string[]>();
  for (const run of [...runs].reverse()) {
    for (const r of run.results) {
      if (isMuted(r.testCase.mutedAt)) continue;
      const kind = meta.kindOf(r.status);
      if (kind !== "PASS" && kind !== "FAIL") continue;
      const list = series.get(r.caseId) ?? [];
      list.push(kind);
      series.set(r.caseId, list);
    }
  }
  const flakyIds = Array.from(series.entries())
    .map(([caseId, kinds]) => {
      let flips = 0;
      for (let i = 1; i < kinds.length; i++)
        if (kinds[i] !== kinds[i - 1]) flips++;
      return { caseId, flips, total: kinds.length };
    })
    .filter((f) => f.flips >= 2)
    .sort((a, b) => b.flips - a.flips)
    .slice(0, 10);

  const titles = withCaseTitles && flakyIds.length
    ? await db.testCase.findMany({
        // Re-scoped by projectId even though the ids came from this project's
        // own runs — same discipline as the public case detail query.
        where: { projectId, deletedAt: null, id: { in: flakyIds.map((f) => f.caseId) } },
        select: { id: true, seq: true, title: true },
      })
    : [];
  const titleById = new Map(titles.map((t) => [t.id, t]));
  const flaky = flakyIds.map((f) => ({
    ...f,
    testCase: titleById.get(f.caseId) ?? null,
  }));

  return {
    runs: summaries,
    trend,
    totals: {
      executed,
      failed,
      passRate: executed ? Math.round((passed / executed) * 100) : null,
      automationCoverage: caseCount
        ? Math.round((automated / caseCount) * 100)
        : null,
    },
    flaky,
    namesCases: withCaseTitles,
    colorOf: meta.colorOf,
    labelOf: meta.labelOf,
  };
}
