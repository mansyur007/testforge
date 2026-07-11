import type { TestPlan, TestRun, TestRunResult } from "@prisma/client";
import { db } from "@/lib/db";
import { serializeRun } from "@/lib/api";
import { bucketStatus, isMuted } from "@/lib/mute";

// F-06: test plans. A plan owns the runs generated from one case selection ×
// a configuration matrix. Everything combinatorial lives here so the server
// action, the API route, and the preview in the form agree on the math.

/** One run's worth of configuration: {"Browser":"Chrome","OS":"Windows"}.
 * Group/option NAMES, copied at creation — see the schema comment on
 * TestRun.configJson for why these are not FK ids. */
export type RunConfig = Record<string, string>;

export const MAX_COMBINATIONS = 50;

export function parseRunConfig(configJson: string | null): RunConfig | null {
  if (!configJson) return null;
  try {
    const parsed = JSON.parse(configJson);
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

/** "Chrome / Windows" — the human form of a combo, in group order. */
export function configLabel(config: RunConfig | null): string {
  if (!config) return "";
  return Object.values(config).join(" / ");
}

/**
 * Cartesian product across groups, preserving group order. Groups with no
 * selected options simply don't participate (they are not an axis of this
 * plan). No groups at all → one combination with no config (a single plain
 * run), which callers encode as configJson = null.
 */
export function buildCombinations(
  groups: { name: string; options: string[] }[]
): RunConfig[] {
  const axes = groups.filter((g) => g.options.length > 0);
  if (axes.length === 0) return [{}];
  let combos: RunConfig[] = [{}];
  for (const axis of axes) {
    const next: RunConfig[] = [];
    for (const combo of combos)
      for (const option of axis.options)
        next.push({ ...combo, [axis.name]: option });
    combos = next;
  }
  return combos;
}

type ResultWithMute = Pick<TestRunResult, "status"> & {
  testCase?: { mutedAt: Date | null } | null;
};

/** Aggregate result counts across a set of runs (the plan progress bar).
 * F-21: a result whose case is muted buckets as "MUTED" instead of its raw
 * status — callers that didn't join `testCase` just get the old behavior. */
export function aggregateResults(
  runs: { results: ResultWithMute[] }[]
): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const run of runs)
    for (const r of run.results) {
      const b = bucketStatus(r.status, isMuted(r.testCase?.mutedAt));
      counts[b] = (counts[b] ?? 0) + 1;
    }
  return counts;
}

/** API shape for a plan. Child runs (when included) use the run serializer so
 * planId/config appear exactly as they do on the runs endpoints. */
export function serializePlan(
  plan: TestPlan,
  runs?: (TestRun & { results?: Pick<TestRunResult, "status">[] })[]
) {
  return {
    id: plan.id,
    name: plan.name,
    description: plan.description,
    status: plan.status,
    milestoneId: plan.milestoneId,
    createdById: plan.createdById,
    createdAt: plan.createdAt.toISOString(),
    completedAt: plan.completedAt ? plan.completedAt.toISOString() : null,
    ...(runs
      ? {
          runs: runs.map((r) =>
            serializeRun(
              r,
              r.results ? countByStatus(r.results) : undefined
            )
          ),
          stats: aggregateResults(
            runs.map((r) => ({ results: r.results ?? [] }))
          ),
        }
      : {}),
  };
}

function countByStatus(
  results: Pick<TestRunResult, "status">[]
): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const r of results) counts[r.status] = (counts[r.status] ?? 0) + 1;
  return counts;
}

/** A project's config groups with options, in display order. */
export async function loadConfigGroups(projectId: string) {
  return db.configGroup.findMany({
    where: { projectId },
    orderBy: { order: "asc" },
    include: { options: { orderBy: { order: "asc" } } },
  });
}
