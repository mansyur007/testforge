import Link from "next/link";
import { BackLink } from "@/components/icons";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { memberScope } from "@/lib/projects";
import { caseDisplayId } from "@/lib/constants";
import { loadStatusDefs } from "@/lib/result-status-defs";
import { statusMeta, badgeStyle } from "@/lib/result-statuses";
import { isMuted } from "@/lib/mute";
import { deltaOf, type Delta } from "@/lib/run-compare";
import { ProjectTabs } from "@/components/ProjectTabs";

export const dynamic = "force-dynamic";

// F-17: side-by-side comparison of two runs. Rows are keyed by
// caseId + datasetName (F-13: a parameterized case has one row per dataset).
// Delta semantics live in src/lib/run-compare.ts (L-02 shares them with the
// quality-gate evaluator). Muted cases (F-21) are shown but excluded from
// the regression/fixed tallies, consistent with pass-rate math everywhere
// else.

const DELTA_ORDER: Delta[] = [
  "REGRESSION",
  "FIXED",
  "CHANGED",
  "ONLY_A",
  "ONLY_B",
  "SAME",
];

const DELTA_META: Record<Delta, { arrow: string; label: string; cls: string }> = {
  REGRESSION: { arrow: "↓", label: "Regressed", cls: "text-danger" },
  FIXED: { arrow: "↑", label: "Fixed", cls: "text-success" },
  CHANGED: { arrow: "→", label: "Changed", cls: "text-warning" },
  ONLY_A: { arrow: "−", label: "Only in A", cls: "text-content-subtle" },
  ONLY_B: { arrow: "+", label: "Only in B", cls: "text-content-subtle" },
  SAME: { arrow: "=", label: "Same", cls: "text-content-subtle" },
};

export default async function RunComparePage({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams: { a?: string; b?: string };
}) {
  const session = await requireSession();
  const project = await db.project.findFirst({
    where: { slug: params.slug, ...memberScope(session.userId) },
  });
  if (!project) notFound();

  const { a, b } = searchParams;
  if (!a || !b || a === b) {
    return (
      <div className="space-y-6">
        <ProjectTabs slug={project.slug} name={project.name} active="runs" />
        <div className="rounded-xl border border-dashed border-hairline-strong p-10 text-center text-sm text-content-subtle">
          Pick two different runs to compare — check &quot;Compare&quot; on two
          runs in the{" "}
          <Link
            href={`/projects/${project.slug}/runs`}
            className="text-accent-text hover:underline"
          >
            runs list
          </Link>
          .
        </div>
      </div>
    );
  }

  const [runA, runB] = await Promise.all(
    [a, b].map((id) =>
      db.testRun.findFirst({
        where: { id, projectId: project.id },
        include: {
          environment: true,
          results: {
            include: {
              testCase: { select: { id: true, seq: true, title: true, mutedAt: true } },
            },
          },
        },
      })
    )
  );
  if (!runA || !runB) notFound();

  const statusDefs = await loadStatusDefs(project.id);
  const { colorOf, labelOf, kindOf } = statusMeta(statusDefs);

  // Union of caseId::datasetName keys across both runs.
  type Row = {
    key: string;
    seq: number;
    title: string;
    datasetName: string | null;
    muted: boolean;
    statusA: string | null;
    statusB: string | null;
    delta: Delta;
  };
  const rows = new Map<string, Omit<Row, "delta">>();
  const collect = (run: typeof runA, side: "statusA" | "statusB") => {
    for (const r of run.results) {
      const key = `${r.caseId}::${r.datasetName ?? ""}`;
      const existing = rows.get(key) ?? {
        key,
        seq: r.testCase.seq,
        title: r.testCase.title,
        datasetName: r.datasetName,
        muted: isMuted(r.testCase.mutedAt),
        statusA: null,
        statusB: null,
      };
      existing[side] = r.status;
      rows.set(key, existing);
    }
  };
  collect(runA, "statusA");
  collect(runB, "statusB");

  const table: Row[] = Array.from(rows.values())
    .map((r) => ({ ...r, delta: deltaOf(r.statusA, r.statusB, kindOf) }))
    .sort(
      (x, y) =>
        DELTA_ORDER.indexOf(x.delta) - DELTA_ORDER.indexOf(y.delta) ||
        x.seq - y.seq ||
        (x.datasetName ?? "").localeCompare(y.datasetName ?? "")
    );

  // Muted cases don't count toward regression/fixed — same exclusion rule as
  // pass-rate math (F-21).
  const counted = table.filter((r) => !r.muted);
  const regressions = counted.filter((r) => r.delta === "REGRESSION").length;
  const fixes = counted.filter((r) => r.delta === "FIXED").length;
  const changed = counted.filter((r) => r.delta === "CHANGED").length;

  const runHeader = (run: NonNullable<typeof runA>, tag: "A" | "B") => (
    <div className="flex-1 rounded-xl border border-hairline bg-surface p-4">
      <p className="text-xs font-semibold uppercase text-content-subtle">Run {tag}</p>
      <Link
        href={`/projects/${project.slug}/runs/${run.id}`}
        className="font-medium text-accent-text hover:underline"
      >
        {run.name}
      </Link>
      <p className="mt-0.5 text-xs text-content-subtle">
        {run.createdAt.toLocaleDateString("en-US")}
        {run.environment && <> · {run.environment.name}</>}
        {" · "}
        {run.results.length} result{run.results.length === 1 ? "" : "s"}
      </p>
    </div>
  );

  const badge = (status: string | null) =>
    status == null ? (
      <span className="text-xs text-content-subtle">—</span>
    ) : (
      <span
        className="rounded-full px-2 py-0.5 text-xs font-medium"
        style={badgeStyle(colorOf(status))}
      >
        {labelOf(status)}
      </span>
    );

  return (
    <div className="space-y-6">
      <ProjectTabs slug={project.slug} name={project.name} active="runs" />

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Run Comparison</h2>
        <BackLink href={`/projects/${project.slug}/runs`}>Back to runs</BackLink>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        {runHeader(runA, "A")}
        {runHeader(runB, "B")}
      </div>

      {/* Summary of regressions & fixes */}
      <div className="flex flex-wrap gap-3 text-sm">
        <span
          className={`rounded-lg px-3 py-1.5 font-medium ${
            regressions > 0 ? "bg-danger-soft text-danger-soft-fg" : "bg-surface-muted text-content-muted"
          }`}
          data-testid="compare-regressions"
        >
          ↓ {regressions} regression{regressions === 1 ? "" : "s"}
        </span>
        <span
          className={`rounded-lg px-3 py-1.5 font-medium ${
            fixes > 0 ? "bg-success-soft text-success-soft-fg" : "bg-surface-muted text-content-muted"
          }`}
          data-testid="compare-fixes"
        >
          ↑ {fixes} fixed
        </span>
        <span className="rounded-lg bg-surface-muted px-3 py-1.5 font-medium text-content-muted" data-testid="compare-changed">
          → {changed} changed
        </span>
      </div>

      <div className="overflow-x-auto rounded-xl border border-hairline bg-surface">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-hairline text-left text-xs uppercase text-content-subtle">
              <th className="px-4 py-3">Case</th>
              <th className="px-4 py-3">Status in A</th>
              <th className="px-4 py-3 text-center">Δ</th>
              <th className="px-4 py-3">Status in B</th>
              <th className="px-4 py-3">Delta</th>
            </tr>
          </thead>
          <tbody>
            {table.map((r) => {
              const meta = DELTA_META[r.delta];
              return (
                <tr
                  key={r.key}
                  className="border-b border-hairline-subtle last:border-0"
                  data-testid={`compare-row-${caseDisplayId(project.slug, r.seq)}${r.datasetName ? `-${r.datasetName}` : ""}`}
                >
                  <td className="px-4 py-2.5">
                    <span className="font-mono text-xs text-content-subtle">
                      {caseDisplayId(project.slug, r.seq)}
                    </span>{" "}
                    {r.title}
                    {r.datasetName && (
                      <span className="ml-1 rounded bg-accent-soft px-1.5 py-0.5 text-xs text-accent-soft-fg">
                        {r.datasetName}
                      </span>
                    )}
                    {r.muted && (
                      <span className="ml-1 rounded bg-surface-muted px-1.5 py-0.5 text-xs text-content-muted">
                        muted
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2.5">{badge(r.statusA)}</td>
                  <td className={`px-4 py-2.5 text-center text-base font-bold ${meta.cls}`}>
                    {meta.arrow}
                  </td>
                  <td className="px-4 py-2.5">{badge(r.statusB)}</td>
                  <td className={`px-4 py-2.5 text-xs font-medium ${meta.cls}`}>
                    {meta.label}
                  </td>
                </tr>
              );
            })}
            {table.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-content-subtle">
                  Neither run has any results.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
