import { db } from "@/lib/db";
import { buildSnapshot, diffSnapshots, type CaseSnapshot } from "@/lib/case-revisions";
import { loadStepGroups } from "@/lib/steps";

// F-28: suite baselines — a named snapshot of a suite tree + the case
// revisions (F-05) each case was at when captured. TestRail Enterprise
// feature: lets a team test an older release in parallel with current work
// without losing track of what "release 2.3's suite" actually looked like.

export type BaselineEntryStatus = "UNCHANGED" | "CHANGED" | "DELETED" | "MOVED";

export type BaselineComparisonRow = {
  caseId: string;
  title: string; // current title, or the pinned snapshot's title if deleted
  pinnedRev: number;
  currentRev: number | null; // null = case no longer exists
  suitePathThen: string;
  suitePathNow: string | null; // null = case no longer exists
  status: BaselineEntryStatus;
  changedFields: string[];
};

/** "Auth > Login" for a suite id, "" for project root (null). Cheap to call
 * per-case since the whole tree fits comfortably in memory. */
export function buildSuitePathMap(
  suites: { id: string; name: string; parentId: string | null }[]
): Map<string, string> {
  const byId = new Map(suites.map((s) => [s.id, s]));
  const cache = new Map<string, string>();
  function pathOf(id: string | null): string {
    if (!id) return "";
    const cached = cache.get(id);
    if (cached !== undefined) return cached;
    const s = byId.get(id);
    if (!s) return "";
    const path = s.parentId ? `${pathOf(s.parentId)} > ${s.name}` : s.name;
    const clean = path.replace(/^ > /, "");
    cache.set(id, clean);
    return clean;
  }
  const out = new Map<string, string>();
  for (const s of suites) out.set(s.id, pathOf(s.id));
  return out;
}

/** Every live case under `suiteId` (recursive) — or the whole project when
 * `suiteId` is null. */
async function casesInScope(projectId: string, suiteId: string | null) {
  if (!suiteId) {
    return db.testCase.findMany({ where: { projectId, deletedAt: null } });
  }
  const suites = await db.testSuite.findMany({ where: { projectId } });
  const inScope = new Set<string>([suiteId]);
  // Suites load in creation order, not tree order — loop until no growth
  // instead of a single top-down pass.
  let grew = true;
  while (grew) {
    grew = false;
    for (const s of suites) {
      if (s.parentId && inScope.has(s.parentId) && !inScope.has(s.id)) {
        inScope.add(s.id);
        grew = true;
      }
    }
  }
  return db.testCase.findMany({
    where: { projectId, deletedAt: null, suiteId: { in: Array.from(inScope) } },
  });
}

/** Snapshot the suite tree + current case revisions as a named baseline. */
export async function createBaseline(
  projectId: string,
  name: string,
  suiteId: string | null,
  userId: string
): Promise<{ id: string } | { error: string }> {
  const cases = await casesInScope(projectId, suiteId);
  if (cases.length === 0) return { error: "No test cases in scope for this baseline." };

  const suites = await db.testSuite.findMany({ where: { projectId } });
  const pathOf = buildSuitePathMap(suites);

  const baseline = await db.suiteBaseline.create({
    data: {
      projectId,
      name,
      suiteId,
      createdById: userId,
      entries: {
        create: cases.map((c) => ({
          caseId: c.id,
          caseRev: c.rev,
          suitePath: c.suiteId ? pathOf.get(c.suiteId) ?? "" : "",
        })),
      },
    },
    select: { id: true },
  });
  return baseline;
}

/** For every entry, compare the pinned revision's snapshot to the case's
 * current state. A case that's gone (hard-deleted or soft-deleted) is DELETED;
 * one whose suite path changed is MOVED (even if content is identical);
 * otherwise CHANGED/UNCHANGED per F-05's field-level diff. */
export async function compareBaselineToCurrent(
  baselineId: string
): Promise<BaselineComparisonRow[]> {
  const baseline = await db.suiteBaseline.findUniqueOrThrow({
    where: { id: baselineId },
    include: { entries: { orderBy: { suitePath: "asc" } } },
  });

  const caseIds = baseline.entries.map((e) => e.caseId);
  const [cases, revisions, suites] = await Promise.all([
    db.testCase.findMany({ where: { id: { in: caseIds } } }),
    db.testCaseRevision.findMany({
      where: {
        OR: baseline.entries.map((e) => ({ caseId: e.caseId, rev: e.caseRev })),
      },
    }),
    db.testSuite.findMany({ where: { projectId: baseline.projectId } }),
  ]);
  const caseById = new Map(cases.map((c) => [c.id, c]));
  const revByKey = new Map(revisions.map((r) => [`${r.caseId}:${r.rev}`, r]));
  const pathOf = buildSuitePathMap(suites);
  const stepGroups = await loadStepGroups(baseline.projectId);

  return baseline.entries.map((entry) => {
    const current = caseById.get(entry.caseId);
    const pinnedRev = revByKey.get(`${entry.caseId}:${entry.caseRev}`);
    const pinnedSnapshot: CaseSnapshot | null = pinnedRev
      ? (JSON.parse(pinnedRev.snapshotJson) as CaseSnapshot)
      : null;

    if (!current || current.deletedAt) {
      return {
        caseId: entry.caseId,
        title: pinnedSnapshot?.title ?? "(deleted)",
        pinnedRev: entry.caseRev,
        currentRev: null,
        suitePathThen: entry.suitePath,
        suitePathNow: null,
        status: "DELETED" as const,
        changedFields: [],
      };
    }

    const suitePathNow = current.suiteId ? pathOf.get(current.suiteId) ?? "" : "";
    const currentSnapshot = buildSnapshot(current, stepGroups);
    const changedFields = pinnedSnapshot ? diffSnapshots(pinnedSnapshot, currentSnapshot) : [];
    const moved = suitePathNow !== entry.suitePath;

    let status: BaselineEntryStatus = "UNCHANGED";
    if (changedFields.length > 0) status = "CHANGED";
    else if (moved) status = "MOVED";

    return {
      caseId: entry.caseId,
      title: current.title,
      pinnedRev: entry.caseRev,
      currentRev: current.rev,
      suitePathThen: entry.suitePath,
      suitePathNow,
      status,
      changedFields,
    };
  });
}
