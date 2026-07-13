import { db } from "@/lib/db";
import { statusMeta } from "@/lib/result-statuses";
import { loadStatusDefs } from "@/lib/result-status-defs";

// F-18: requirements & traceability helpers. Coverage is DERIVED, never
// stored: a requirement is COVERED when it has ≥1 linked case that is not
// soft-deleted and not DEPRECATED. The stored `status` only carries the
// manual OPEN/OBSOLETE distinction.

export const MATRIX_BUCKETS = [
  "Pass",
  "Fail",
  "Blocked",
  "Untested",
  "No cases",
] as const;
export type MatrixBucket = (typeof MATRIX_BUCKETS)[number];

/** Next auto refId "REQ-NNN" for a project (max existing +1, 3-digit pad). */
export async function nextRefId(projectId: string): Promise<string> {
  const existing = await db.requirement.findMany({
    where: { projectId },
    select: { refId: true },
  });
  let max = 0;
  for (const r of existing) {
    const m = /^REQ-(\d+)$/.exec(r.refId);
    if (m) max = Math.max(max, parseInt(m[1], 10));
  }
  return `REQ-${String(max + 1).padStart(3, "0")}`;
}

// Coverage only needs status + deletedAt; the matrix bucketing also needs id.
type CoverageCase = { status: string; deletedAt: Date | null };
type CaseLite = CoverageCase & { id: string };

/** A linked case counts toward coverage when live and not deprecated. */
export function coversRequirement(cases: CoverageCase[]): boolean {
  return cases.some((c) => c.deletedAt == null && c.status !== "DEPRECATED");
}

export function derivedStatus(
  stored: string,
  cases: CoverageCase[]
): "OPEN" | "COVERED" | "OBSOLETE" {
  if (stored === "OBSOLETE") return "OBSOLETE";
  return coversRequirement(cases) ? "COVERED" : "OPEN";
}

/** The latest-result bucket for a single case across all its runs (kind-based
 * per F-14). Untested = no recorded pass/fail/blocked result yet. */
export function caseBucket(
  latestKind: string | null
): Exclude<MatrixBucket, "No cases"> {
  if (latestKind === "PASS") return "Pass";
  if (latestKind === "FAIL") return "Fail";
  if (latestKind === "BLOCKED") return "Blocked";
  return "Untested";
}

/** For every case id, the KIND of its most recent result (by result
 * createdAt), or null if it has none. Uses the project's status defs so
 * custom statuses map to the right kind. */
export async function latestKindByCase(
  projectId: string,
  caseIds: string[]
): Promise<Map<string, string | null>> {
  const out = new Map<string, string | null>();
  if (caseIds.length === 0) return out;
  const { kindOf } = statusMeta(await loadStatusDefs(projectId));
  const results = await db.testRunResult.findMany({
    where: { caseId: { in: caseIds } },
    select: { caseId: true, status: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });
  for (const r of results) {
    if (out.has(r.caseId)) continue; // first seen = latest (desc order)
    const kind = kindOf(r.status);
    out.set(r.caseId, ["PASS", "FAIL", "BLOCKED"].includes(kind) ? kind : null);
  }
  for (const id of caseIds) if (!out.has(id)) out.set(id, null);
  return out;
}

/** Bucket a requirement's linked cases into the matrix columns. A requirement
 * with no live cases lands in "No cases"; otherwise each case is counted in
 * Pass/Fail/Blocked/Untested by its latest result. */
export function bucketRequirement(
  cases: CaseLite[],
  latestKind: Map<string, string | null>
): Record<MatrixBucket, number> {
  const counts: Record<MatrixBucket, number> = {
    Pass: 0,
    Fail: 0,
    Blocked: 0,
    Untested: 0,
    "No cases": 0,
  };
  const live = cases.filter((c) => c.deletedAt == null);
  if (live.length === 0) {
    counts["No cases"] = 1;
    return counts;
  }
  for (const c of live) counts[caseBucket(latestKind.get(c.id) ?? null)]++;
  return counts;
}
