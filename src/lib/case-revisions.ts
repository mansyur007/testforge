import type { TestCase, TestCaseRevision } from "@prisma/client";
import { db } from "@/lib/db";
import type { TestStep } from "@/lib/constants";
import { expandSteps, loadStepGroups, type ExpandedStep } from "@/lib/steps";

// F-05: case history & versioning. Every meaningful change to a case is stored
// as an immutable numbered snapshot (TestCaseRevision). recordRevision is the
// ONLY writer — call it after every mutation of a case's content.

/** Snapshot shape stored in TestCaseRevision.snapshotJson — everything a human
 * would diff. Steps are stored EXPANDED (shared refs resolved at write time)
 * so the snapshot stays truthful even if a shared group is edited or deleted
 * later. Restoring therefore writes plain inline steps back. */
export type CaseSnapshot = {
  title: string;
  description: string | null;
  preconditions: string | null;
  steps: ExpandedStep[];
  expectedResult: string | null;
  priority: string;
  type: string;
  status: string;
  automationStatus: string;
  tags: string;
  suiteId: string | null;
  assigneeId: string | null;
  linkedIssues: string | null;
  custom: Record<string, unknown>;
};

/** Field order drives both the changeSummary and the UI diff. */
export const SNAPSHOT_FIELDS = [
  "title",
  "description",
  "preconditions",
  "steps",
  "expectedResult",
  "priority",
  "type",
  "status",
  "automationStatus",
  "tags",
  "suiteId",
  "assigneeId",
  "linkedIssues",
  "custom",
] as const satisfies readonly (keyof CaseSnapshot)[];

export function buildSnapshot(
  c: TestCase,
  stepGroups: Awaited<ReturnType<typeof loadStepGroups>>
): CaseSnapshot {
  let steps: TestStep[] = [];
  try {
    steps = JSON.parse(c.stepsJson || "[]");
  } catch {
    steps = [];
  }
  let custom: Record<string, unknown> = {};
  try {
    custom = JSON.parse(c.customJson || "{}");
  } catch {
    custom = {};
  }
  return {
    title: c.title,
    description: c.description,
    preconditions: c.preconditions,
    steps: expandSteps(steps, stepGroups),
    expectedResult: c.expectedResult,
    priority: c.priority,
    type: c.type,
    status: c.status,
    automationStatus: c.automationStatus,
    tags: c.tags,
    suiteId: c.suiteId,
    assigneeId: c.assigneeId,
    linkedIssues: c.linkedIssues,
    custom,
  };
}

/** Changed field names between two snapshots (order of SNAPSHOT_FIELDS).
 * Objects/arrays compare by JSON — snapshots are built the same way on both
 * sides, so key order is stable. */
export function diffSnapshots(a: CaseSnapshot, b: CaseSnapshot): string[] {
  return SNAPSHOT_FIELDS.filter(
    (f) => JSON.stringify(a[f] ?? null) !== JSON.stringify(b[f] ?? null)
  );
}

/**
 * Record the case's current state as a new revision.
 * - First revision for a case is numbered `case.rev` (1 for new cases) with
 *   summary "created" — legacy cases get their baseline on first edit.
 * - Otherwise diffs vs the latest snapshot; a no-op change writes nothing.
 * - `summaryOverride` replaces the computed field list (e.g. "restored from rev 1").
 * Never throws for the common flows; caller decides what "case missing" means.
 */
export async function recordRevision(
  caseId: string,
  authorId: string | null,
  summaryOverride?: string
): Promise<void> {
  const c = await db.testCase.findUnique({ where: { id: caseId } });
  if (!c) return;

  const snapshot = buildSnapshot(c, await loadStepGroups(c.projectId));
  const latest = await db.testCaseRevision.findFirst({
    where: { caseId },
    orderBy: { rev: "desc" },
  });

  if (!latest) {
    await db.testCaseRevision.create({
      data: {
        caseId,
        rev: c.rev,
        authorId,
        snapshotJson: JSON.stringify(snapshot),
        changeSummary: summaryOverride ?? "created",
      },
    });
    return;
  }

  const changed = diffSnapshots(
    JSON.parse(latest.snapshotJson) as CaseSnapshot,
    snapshot
  );
  if (changed.length === 0 && !summaryOverride) return;

  const rev = latest.rev + 1;
  await db.$transaction([
    db.testCaseRevision.create({
      data: {
        caseId,
        rev,
        authorId,
        snapshotJson: JSON.stringify(snapshot),
        changeSummary: summaryOverride ?? changed.join(", "),
      },
    }),
    db.testCase.update({ where: { id: caseId }, data: { rev } }),
  ]);
}

/** Current rev per case id — used to stamp TestRunResult.caseRev at run time. */
export async function loadCaseRevs(
  caseIds: string[]
): Promise<Map<string, number>> {
  if (!caseIds.length) return new Map();
  const rows = await db.testCase.findMany({
    where: { id: { in: caseIds } },
    select: { id: true, rev: true },
  });
  return new Map(rows.map((r) => [r.id, r.rev]));
}

/** API shape for a revision (lives here — Next.js route files may only export
 * HTTP handlers). */
export function serializeRevision(
  r: TestCaseRevision & { author?: { name: string } | null }
) {
  return {
    id: r.id,
    rev: r.rev,
    authorId: r.authorId,
    ...(r.author !== undefined ? { authorName: r.author?.name ?? null } : {}),
    changeSummary: r.changeSummary,
    snapshot: JSON.parse(r.snapshotJson) as CaseSnapshot,
    createdAt: r.createdAt.toISOString(),
  };
}
