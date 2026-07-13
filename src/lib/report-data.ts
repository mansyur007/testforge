// F-17: shared metric computations for dashboard widgets. Mirrors the math on
// the Reports page (F-14 kind-based aggregates, F-21 muted bucketing) so a
// widget and the Reports page never disagree on a number.

import { db } from "@/lib/db";
import { loadStatusDefs } from "@/lib/result-status-defs";
import { statusMeta, type StatusDefLite } from "@/lib/result-statuses";
import { bucketStatus, NON_EXECUTED_BUCKETS } from "@/lib/mute";

export type ReportData = {
  cases: {
    id: string;
    seq: number;
    title: string;
    automationStatus: string;
    mutedAt: Date | null;
  }[];
  runs: {
    id: string;
    name: string;
    createdAt: Date;
    results: { caseId: string; status: string }[];
  }[]; // newest first
  statusDefs: StatusDefLite[];
};

export async function loadReportData(projectId: string): Promise<ReportData> {
  const [cases, runs, statusDefs] = await Promise.all([
    db.testCase.findMany({
      where: { projectId, deletedAt: null },
      select: {
        id: true,
        seq: true,
        title: true,
        automationStatus: true,
        mutedAt: true,
      },
    }),
    db.testRun.findMany({
      where: { projectId },
      select: {
        id: true,
        name: true,
        createdAt: true,
        results: { select: { caseId: true, status: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    loadStatusDefs(projectId),
  ]);
  return { cases, runs, statusDefs };
}

function helpers(data: ReportData) {
  const mutedCaseIds = new Set(
    data.cases.filter((c) => c.mutedAt).map((c) => c.id)
  );
  const meta = statusMeta(data.statusDefs);
  const bucket = (r: { caseId: string; status: string }) =>
    bucketStatus(r.status, mutedCaseIds.has(r.caseId));
  return { mutedCaseIds, bucket, ...meta };
}

/** Last `limit` runs, oldest first: pass rate over executed results. */
export function passRateTrend(data: ReportData, limit = 12) {
  const { bucket, kindOf } = helpers(data);
  return [...data.runs]
    .reverse()
    .slice(-limit)
    .map((run) => {
      const ex = run.results.filter(
        (r) => !NON_EXECUTED_BUCKETS.includes(bucket(r))
      );
      const p = ex.filter((r) => kindOf(r.status) === "PASS").length;
      return {
        name: run.name,
        rate: ex.length ? Math.round((p / ex.length) * 100) : 0,
        executed: ex.length,
      };
    });
}

/** Bucketed status distribution across every result in every run. */
export function statusDistribution(data: ReportData) {
  const { bucket, colorOf, labelOf } = helpers(data);
  const counts = new Map<string, number>();
  for (const run of data.runs)
    for (const r of run.results) {
      const b = bucket(r);
      counts.set(b, (counts.get(b) ?? 0) + 1);
    }
  const order = [...data.statusDefs.map((d) => d.key), "MUTED"];
  return order
    .filter((k) => counts.get(k))
    .map((k) => ({
      key: k,
      label: labelOf(k),
      color: colorOf(k),
      count: counts.get(k)!,
    }));
}

/** Automation coverage: AUTOMATED cases over all non-deleted cases. */
export function automationCoverage(data: ReportData) {
  const automated = data.cases.filter(
    (c) => c.automationStatus === "AUTOMATED"
  ).length;
  const total = data.cases.length;
  return {
    automated,
    total,
    pct: total ? Math.round((automated / total) * 100) : 0,
  };
}

/** Top flaky cases: ≥2 PASS/FAIL-kind flips across run history, muted excluded. */
export function flakyList(data: ReportData, limit = 5) {
  const { mutedCaseIds, kindOf } = helpers(data);
  const byCase = new Map<string, string[]>();
  for (const run of [...data.runs].reverse())
    for (const r of run.results) {
      const kind = kindOf(r.status);
      if (!["PASS", "FAIL"].includes(kind)) continue;
      byCase.set(r.caseId, [...(byCase.get(r.caseId) ?? []), kind]);
    }
  return Array.from(byCase.entries())
    .filter(([caseId]) => !mutedCaseIds.has(caseId))
    .map(([caseId, kinds]) => {
      let flips = 0;
      for (let i = 1; i < kinds.length; i++)
        if (kinds[i] !== kinds[i - 1]) flips++;
      return {
        flips,
        total: kinds.length,
        testCase: data.cases.find((c) => c.id === caseId),
      };
    })
    .filter((f) => f.flips >= 2 && f.testCase)
    .sort((a, b) => b.flips - a.flips)
    .slice(0, limit);
}

/** Runs created per week for the last `weeks` weeks, oldest first. */
export function runVelocity(data: ReportData, weeks = 8) {
  const now = new Date();
  const out: { label: string; count: number }[] = [];
  for (let i = weeks - 1; i >= 0; i--) {
    const start = new Date(now);
    start.setDate(start.getDate() - start.getDay() - i * 7); // week starts Sunday
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 7);
    out.push({
      label: `${start.getMonth() + 1}/${start.getDate()}`,
      count: data.runs.filter(
        (r) => r.createdAt >= start && r.createdAt < end
      ).length,
    });
  }
  return out;
}
