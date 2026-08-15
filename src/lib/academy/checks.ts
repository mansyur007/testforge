import "server-only";
import { db } from "@/lib/db";
import { SANDBOX_CASES, getSandboxTask } from "@/content/academy/sandbox";
import type { CheckResult } from "./types";
import {
  CASE_CHECKERS,
  DEFECT_CHECKERS,
  SHARE_CHECKERS,
  SESSION_CHECKERS,
  PLAN_CHECKERS,
  DASHBOARD_CHECKERS,
  RUN_CHECKERS,
} from "./checks-core.mjs";

export type { CheckResult };

// A-04b: the typed half of the checker boundary. `checks-core.mjs` holds the
// actual grading logic as pure functions (unit-tested by
// scripts/academy-checks-selftest.mjs with no database); this file is the only
// thing that touches Prisma, fetching real rows from the learner's sandbox and
// handing them to the matching pure function. See docs/QA-ACADEMY.md §6.2.
//
// The registries come out of a plain .mjs file with no types of their own, so
// TS infers exact literal object types (no index signature) for them — hence
// the casts below. The shapes are still checked: each cast pins down exactly
// the fields a checker may read, matching the `select` a few lines down.
type CaseSubmission = {
  title: string;
  preconditions: string | null;
  stepsJson: string;
  expectedResult: string | null;
};
type DefectSubmission = { title: string; bodyMd: string | null };
type ShareSubmission = {
  enabled: boolean;
  showCases: boolean;
  showRuns: boolean;
  showReports: boolean;
} | null;
type SessionSubmission = {
  charter: string;
  timeboxMinutes: number | null;
  status: string;
  notes: { kind: string; convertedType: string | null }[];
};
type PlanSubmission = { description: string | null; linkedCaseIds: string[] };
type DashboardSubmission = { name: string; widgetCount: number };
type RunSubmission = { source: string; origin: string | null; resultCount: number };

const caseCheckers = CASE_CHECKERS as Record<
  string,
  (cases: CaseSubmission[]) => CheckResult
>;
const defectCheckers = DEFECT_CHECKERS as Record<
  string,
  (defects: DefectSubmission[]) => CheckResult
>;
const shareCheckers = SHARE_CHECKERS as Record<
  string,
  (share: ShareSubmission) => CheckResult
>;
const sessionCheckers = SESSION_CHECKERS as Record<
  string,
  (sessions: SessionSubmission[]) => CheckResult
>;
const planCheckers = PLAN_CHECKERS as Record<
  string,
  (plans: PlanSubmission[]) => CheckResult
>;
const dashboardCheckers = DASHBOARD_CHECKERS as Record<
  string,
  (dashboards: DashboardSubmission[]) => CheckResult
>;
const runCheckers = RUN_CHECKERS as Record<
  string,
  (runs: RunSubmission[]) => CheckResult
>;

const FIXTURE_TITLES = new Set(SANDBOX_CASES.map((c) => c.title));

/**
 * Run the checker for a lesson against the learner's sandbox.
 *
 * `since` is when the coach panel was opened for this lesson (captured
 * client-side, in sessionStorage, so it survives the redirect a saved case
 * causes) — it stands in for "the attempt started" from docs/QA-ACADEMY.md
 * §2.3's exam design, applied here: only rows created after the learner
 * opened the exercise count, so the seeded reference cases (excluded again by
 * title, belt-and-braces) and anything left over from a previous attempt
 * can't accidentally pass the check for them.
 */
export async function runChecker(
  lessonSlug: string,
  projectId: string,
  since: Date,
): Promise<CheckResult | { error: string }> {
  const task = getSandboxTask(lessonSlug);
  if (!task) return { error: "That lesson has no sandbox exercise." };

  // A-11a: `share` deliberately ignores `since`. `PublicShare` is one row per
  // project (`@unique projectId`) that is upserted rather than appended, so a
  // learner who turned sharing on before opening the coach panel — reading
  // ahead, or coming back to the lesson — would be failed for having done the
  // exercise early. There is also nothing a stale row could replay: the
  // exercise *is* the row's current state, not an event.
  if (task.target.kind === "share") {
    const checker = shareCheckers[lessonSlug];
    if (!checker) return { error: "That lesson has no checker yet." };
    const share = await db.publicShare.findUnique({
      where: { projectId },
      select: { enabled: true, showCases: true, showRuns: true, showReports: true },
    });
    return checker(share);
  }

  // A-11b. `Session` dates its start as `startedAt`, not `createdAt` — the
  // `since` rule is the same, the column is not.
  if (task.target.kind === "session") {
    const checker = sessionCheckers[lessonSlug];
    if (!checker) return { error: "That lesson has no checker yet." };
    const sessions = await db.session.findMany({
      where: { projectId, startedAt: { gte: since } },
      select: {
        charter: true,
        timeboxMinutes: true,
        status: true,
        notes: { select: { kind: true, convertedType: true } },
      },
      orderBy: { startedAt: "desc" },
    });
    return checker(sessions);
  }

  // A plan's cases are two hops away — `TestPlan` has no case relation, only
  // `runs`, and a run's `results` carry the `caseId`. Distinct because the same
  // case can appear in more than one run under the plan.
  if (task.target.kind === "plan") {
    const checker = planCheckers[lessonSlug];
    if (!checker) return { error: "That lesson has no checker yet." };
    const plans = await db.testPlan.findMany({
      where: { projectId, createdAt: { gte: since } },
      select: {
        description: true,
        runs: { select: { results: { select: { caseId: true } } } },
      },
      orderBy: { createdAt: "desc" },
    });
    return checker(
      plans.map((p) => ({
        description: p.description,
        linkedCaseIds: Array.from(
          new Set(p.runs.flatMap((r) => r.results.map((x) => x.caseId))),
        ),
      })),
    );
  }

  // A-11b's `since` exception. `Dashboard` has `createdAt` and **no
  // `updatedAt`**, so a learner who edits an existing dashboard — which is
  // exactly what the exercise's "delete until removing one more would cost you
  // a decision" asks for — produces no timestamp to filter a revision by. The
  // alternative was adding `updatedAt` to the model; this is cheaper and safe
  // here because `seedSandbox` creates no dashboards, so anything in a sandbox
  // was built by its owner.
  if (task.target.kind === "dashboard") {
    const checker = dashboardCheckers[lessonSlug];
    if (!checker) return { error: "That lesson has no checker yet." };
    const dashboards = await db.dashboard.findMany({
      where: { projectId },
      select: { name: true, _count: { select: { widgets: true } } },
      orderBy: { createdAt: "desc" },
    });
    return checker(
      dashboards.map((d) => ({ name: d.name, widgetCount: d._count.widgets })),
    );
  }

  // A-11c. `source` is the discriminant: the UI's own create action sets none,
  // so a hand-made run takes the schema default `MANUAL`, while anything
  // through `/api/v1/junit` carries the endpoint's. The status of the results
  // is deliberately not selected — see `checkIngestedRun`.
  if (task.target.kind === "run") {
    const checker = runCheckers[lessonSlug];
    if (!checker) return { error: "That lesson has no checker yet." };
    const runs = await db.testRun.findMany({
      where: { projectId, createdAt: { gte: since } },
      select: {
        source: true,
        origin: true,
        _count: { select: { results: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    return checker(
      runs.map((r) => ({
        source: r.source,
        origin: r.origin,
        resultCount: r._count.results,
      })),
    );
  }

  if (task.target.kind === "defect") {
    const checker = defectCheckers[lessonSlug];
    if (!checker) return { error: "That lesson has no checker yet." };
    const defects = await db.defect.findMany({
      where: { projectId, createdAt: { gte: since } },
      select: { title: true, bodyMd: true },
      orderBy: { createdAt: "desc" },
    });
    return checker(defects);
  }

  const checker = caseCheckers[lessonSlug];
  if (!checker) return { error: "That lesson has no checker yet." };

  const suite = await db.testSuite.findFirst({
    where: { projectId, name: task.target.suite },
    select: { id: true },
  });
  if (!suite) return { error: `Sandbox suite "${task.target.suite}" is missing — try resetting your sandbox.` };

  const rows = await db.testCase.findMany({
    where: {
      projectId,
      suiteId: suite.id,
      createdAt: { gte: since },
      deletedAt: null,
    },
    select: { title: true, preconditions: true, stepsJson: true, expectedResult: true },
    orderBy: { createdAt: "asc" },
  });
  const cases = rows.filter((c) => !FIXTURE_TITLES.has(c.title));
  return checker(cases);
}
