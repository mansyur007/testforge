import "server-only";
import { db } from "@/lib/db";
import { SANDBOX_CASES, getSandboxTask } from "@/content/academy/sandbox";
import type { CheckResult } from "./types";
import {
  CASE_CHECKERS,
  DEFECT_CHECKERS,
  SHARE_CHECKERS,
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
