import { db } from "@/lib/db";
import { statusMeta } from "@/lib/result-statuses";
import { loadStatusDefs } from "@/lib/result-status-defs";

// F-32: case dependencies. `case` requires `dependsOn` (its prerequisite) to
// pass first. In a run, when a prerequisite's result is FAILED/BLOCKED
// (kind-based, F-14-aware), a dependent result gets a one-click BLOCKED
// *suggestion* — never applied silently, the tester always accepts it.

export type CaseLite = { id: string; seq: number; title: string };

/** Would adding `case_ -> dependsOn` close a cycle? DFS from `dependsOn`
 * over what IT (transitively) depends on, looking for `caseId`. */
export async function wouldCreateCycle(
  caseId: string,
  dependsOnCaseId: string
): Promise<boolean> {
  if (caseId === dependsOnCaseId) return true;
  const visited = new Set<string>();
  const stack = [dependsOnCaseId];
  while (stack.length) {
    const current = stack.pop()!;
    if (current === caseId) return true;
    if (visited.has(current)) continue;
    visited.add(current);
    const edges = await db.caseDependency.findMany({
      where: { caseId: current },
      select: { dependsOnCaseId: true },
    });
    for (const e of edges) stack.push(e.dependsOnCaseId);
  }
  return false;
}

export async function loadPrerequisites(caseId: string): Promise<
  { linkId: string; case: CaseLite }[]
> {
  const rows = await db.caseDependency.findMany({
    where: { caseId },
    include: { dependsOn: { select: { id: true, seq: true, title: true, deletedAt: true } } },
    orderBy: { createdAt: "asc" },
  });
  return rows
    .filter((r) => !r.dependsOn.deletedAt)
    .map((r) => ({ linkId: r.id, case: r.dependsOn }));
}

export async function loadDependents(caseId: string): Promise<
  { linkId: string; case: CaseLite }[]
> {
  const rows = await db.caseDependency.findMany({
    where: { dependsOnCaseId: caseId },
    include: { case: { select: { id: true, seq: true, title: true, deletedAt: true } } },
    orderBy: { createdAt: "asc" },
  });
  return rows
    .filter((r) => !r.case.deletedAt)
    .map((r) => ({ linkId: r.id, case: r.case }));
}

export type BlockedSuggestion = { prereqCaseId: string; prereqSeq: number; prereqTitle: string };

/** For every result in a run whose case has prerequisites, check whether any
 * prerequisite's result IN THE SAME RUN has a FAIL/BLOCKED kind — if so and
 * this result isn't already FAIL/BLOCKED itself, surface a suggestion. */
export async function computeBlockedSuggestions(
  projectId: string,
  runId: string
): Promise<Map<string, BlockedSuggestion>> {
  const results = await db.testRunResult.findMany({
    where: { runId },
    select: { id: true, caseId: true, status: true },
  });
  if (results.length === 0) return new Map();

  const caseIds = results.map((r) => r.caseId);
  const deps = await db.caseDependency.findMany({
    where: { caseId: { in: caseIds } },
    include: { dependsOn: { select: { id: true, seq: true, title: true } } },
  });
  if (deps.length === 0) return new Map();

  const { kindOf } = statusMeta(await loadStatusDefs(projectId));
  const resultByCaseId = new Map(results.map((r) => [r.caseId, r]));
  const depsByCaseId = new Map<string, typeof deps>();
  for (const d of deps) {
    const list = depsByCaseId.get(d.caseId) ?? [];
    list.push(d);
    depsByCaseId.set(d.caseId, list);
  }

  const suggestions = new Map<string, BlockedSuggestion>();
  for (const result of results) {
    if (["FAIL", "BLOCKED"].includes(kindOf(result.status))) continue; // already reflects the problem
    const prereqEdges = depsByCaseId.get(result.caseId);
    if (!prereqEdges) continue;
    for (const edge of prereqEdges) {
      const prereqResult = resultByCaseId.get(edge.dependsOnCaseId);
      if (!prereqResult) continue; // prerequisite not in this run — nothing to suggest from
      if (["FAIL", "BLOCKED"].includes(kindOf(prereqResult.status))) {
        suggestions.set(result.id, {
          prereqCaseId: edge.dependsOn.id,
          prereqSeq: edge.dependsOn.seq,
          prereqTitle: edge.dependsOn.title,
        });
        break; // one suggestion is enough even with multiple failing prerequisites
      }
    }
  }
  return suggestions;
}
