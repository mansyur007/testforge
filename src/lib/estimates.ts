// F-23: run-level total estimate, actual elapsed so far, and a forecast for
// time remaining. Per-case duration used for a not-yet-executed result:
// 1. the assignee's median actual (this run) when they already have >=5
//    executed results with a recorded elapsedSeconds — most trustworthy signal;
// 2. else the case's own estimateSeconds;
// 3. else the project-wide median of set estimates (120s default fallback).

function median(nums: number[]): number | null {
  if (!nums.length) return null;
  const sorted = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2
    ? sorted[mid]
    : (sorted[mid - 1] + sorted[mid]) / 2;
}

export const PROJECT_DEFAULT_ESTIMATE_SECONDS = 120;

export function projectMedianEstimate(estimates: (number | null)[]): number {
  const values = estimates.filter((n): n is number => n != null && n > 0);
  return median(values) ?? PROJECT_DEFAULT_ESTIMATE_SECONDS;
}

export type EstimateInputResult = {
  status: string;
  elapsedSeconds: number | null;
  assigneeId: string | null;
  estimateSeconds: number | null;
};

export type RunEstimates = {
  totalEstimateSeconds: number;
  actualElapsedSeconds: number;
  forecastSeconds: number;
  remainingCount: number;
};

export function computeRunEstimates(
  results: EstimateInputResult[],
  projectDefaultEstimate: number
): RunEstimates {
  const totalEstimateSeconds = results.reduce(
    (sum, r) => sum + (r.estimateSeconds ?? 0),
    0
  );
  const actualElapsedSeconds = results.reduce(
    (sum, r) => sum + (r.elapsedSeconds ?? 0),
    0
  );

  const byTester = new Map<string, number[]>();
  for (const r of results) {
    if (r.elapsedSeconds == null || !r.assigneeId) continue;
    const list = byTester.get(r.assigneeId) ?? [];
    list.push(r.elapsedSeconds);
    byTester.set(r.assigneeId, list);
  }
  const testerMedians = new Map<string, number>();
  byTester.forEach((elapsed, assigneeId) => {
    if (elapsed.length >= 5) {
      const m = median(elapsed);
      if (m != null) testerMedians.set(assigneeId, m);
    }
  });

  const remaining = results.filter((r) => r.status === "UNTESTED");
  const forecastSeconds = remaining.reduce((sum, r) => {
    const testerMedian = r.assigneeId ? testerMedians.get(r.assigneeId) : undefined;
    const perCase = testerMedian ?? r.estimateSeconds ?? projectDefaultEstimate;
    return sum + perCase;
  }, 0);

  return {
    totalEstimateSeconds,
    actualElapsedSeconds,
    forecastSeconds,
    remainingCount: remaining.length,
  };
}

export function sumRunEstimates(runs: RunEstimates[]): RunEstimates {
  return runs.reduce(
    (acc, r) => ({
      totalEstimateSeconds: acc.totalEstimateSeconds + r.totalEstimateSeconds,
      actualElapsedSeconds: acc.actualElapsedSeconds + r.actualElapsedSeconds,
      forecastSeconds: acc.forecastSeconds + r.forecastSeconds,
      remainingCount: acc.remainingCount + r.remainingCount,
    }),
    { totalEstimateSeconds: 0, actualElapsedSeconds: 0, forecastSeconds: 0, remainingCount: 0 }
  );
}
