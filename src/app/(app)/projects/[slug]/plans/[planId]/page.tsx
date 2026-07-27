import Link from "next/link";
import { BackLink } from "@/components/icons";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { aggregateResults, parseRunConfig, configLabel } from "@/lib/plans";
import { loadStatusDefs } from "@/lib/result-status-defs";
import { statusMeta } from "@/lib/result-statuses";
import { bucketStatus, isMuted } from "@/lib/mute";
import { computeRunEstimates, projectMedianEstimate, sumRunEstimates } from "@/lib/estimates";
import { formatDuration, formatRemaining } from "@/lib/duration";
import { ProjectTabs } from "@/components/ProjectTabs";
import { CompletePlanButton } from "@/components/CompletePlanButton";
import { loadPerms } from "@/lib/permissions";

export const dynamic = "force-dynamic";

// F-06: plan detail — child runs with config chips + per-run progress, and the
// matrix view (rows = combo, columns = status counts).
export default async function PlanDetailPage({
  params,
}: {
  params: { slug: string; planId: string };
}) {
  const session = await requireSession();
  const plan = await db.testPlan.findFirst({
    where: {
      id: params.planId,
      project: { members: { some: { userId: session.userId } } },
    },
    include: {
      project: true,
      milestone: true,
      createdBy: true,
      runs: {
        include: {
          results: {
            select: {
              status: true,
              elapsedSeconds: true,
              assigneeId: true,
              testCase: { select: { mutedAt: true, estimateSeconds: true } },
            },
          },
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });
  if (!plan || plan.project.slug !== params.slug) notFound();

  // F-14: permission-derived access (covers custom roles).
  const perms = await loadPerms(session.userId, plan.projectId);

  const counts = aggregateResults(plan.runs);
  const totalRaw = Object.values(counts).reduce((n, c) => n + c, 0);
  const total = totalRaw || 1;
  const activeRuns = plan.runs.filter((r) => r.status === "ACTIVE").length;

  // F-14: colors/labels + kind-based matrix come from the status defs.
  const statusDefs = await loadStatusDefs(plan.projectId);
  const { colorOf, labelOf, kindOf } = statusMeta(statusDefs);
  const legendKeys = [...statusDefs.map((d) => d.key), "MUTED"];
  const barKeys = [
    ...statusDefs.filter((d) => d.key !== "UNTESTED").map((d) => d.key),
    "MUTED",
  ];

  // F-23: roll-up = sum of each child run's own estimate/elapsed/forecast
  // (each run's forecast uses its own per-tester medians).
  const projectEstimates = await db.testCase.findMany({
    where: { projectId: plan.projectId, deletedAt: null },
    select: { estimateSeconds: true },
  });
  const projectDefault = projectMedianEstimate(
    projectEstimates.map((c) => c.estimateSeconds)
  );
  const planEstimates = sumRunEstimates(
    plan.runs.map((run) =>
      computeRunEstimates(
        run.results.map((r) => ({
          status: r.status,
          elapsedSeconds: r.elapsedSeconds,
          assigneeId: r.assigneeId,
          estimateSeconds: r.testCase.estimateSeconds,
        })),
        projectDefault
      )
    )
  );

  // F-14: matrix columns bucket by KIND (custom statuses land in the right
  // column), except Untested which is the one key-based pending state.
  const MATRIX_COLS = ["PASS", "FAIL", "BLOCKED", "UNTESTED"] as const;
  const rowCount = (
    results: { status: string }[],
    col: (typeof MATRIX_COLS)[number]
  ) =>
    results.filter((r) =>
      col === "UNTESTED" ? r.status === "UNTESTED" : kindOf(r.status) === col
    ).length;

  return (
    <div className="space-y-6">
      <ProjectTabs slug={plan.project.slug} name={plan.project.name} active="plans" />

      <BackLink href={`/projects/${plan.project.slug}/plans`}>Back to test plans</BackLink>

      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold">{plan.name}</h2>
          <p className="text-sm text-content-subtle">
            {plan.description}
            {plan.description && " · "}
            {plan.createdBy.name} · {plan.createdAt.toLocaleDateString("en-US")}
            {plan.milestone && <> · {plan.milestone.name}</>}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span
            className={`rounded-full px-2.5 py-1 text-xs font-medium ${
              plan.status === "COMPLETED"
                ? "bg-success-soft text-success-soft-fg"
                : "bg-info-soft text-info-soft-fg"
            }`}
          >
            {plan.status === "COMPLETED" ? "Completed" : "Active"}
          </span>
          {plan.status === "ACTIVE" && perms.has("run.manage") && (
            <CompletePlanButton planId={plan.id} activeRuns={activeRuns} />
          )}
        </div>
      </div>

      {/* Aggregate bar across every child run */}
      <div className="rounded-xl border border-hairline bg-surface p-5">
        <div className="flex h-3 overflow-hidden rounded-full bg-surface-muted">
          {Object.entries(counts).map(([st, count]) => (
            <div
              key={st}
              style={{
                backgroundColor: colorOf(st),
                width: `${(count / total) * 100}%`,
              }}
            />
          ))}
        </div>
        <div className="mt-3 flex flex-wrap gap-4 text-sm">
          {legendKeys.map((st) =>
            counts[st] ? (
              <span key={st} className="flex items-center gap-1.5">
                <span
                  className={`inline-block h-2.5 w-2.5 rounded-full ${st === "UNTESTED" ? "border border-hairline-strong" : ""}`}
                  style={{ backgroundColor: colorOf(st) }}
                />
                {labelOf(st)} <b>{counts[st]}</b>
                <span className="text-content-subtle">
                  ({Math.round((counts[st] / total) * 100)}%)
                </span>
              </span>
            ) : null
          )}
          {totalRaw === 0 && (
            <span className="text-content-subtle">No results yet.</span>
          )}
        </div>
        {(planEstimates.totalEstimateSeconds > 0 ||
          planEstimates.actualElapsedSeconds > 0) && (
          <div
            className="mt-3 flex flex-wrap gap-4 border-t border-hairline-subtle pt-3 text-sm text-content-muted"
            data-testid="plan-estimate-summary"
          >
            {planEstimates.totalEstimateSeconds > 0 && (
              <span>
                Estimate: <b>{formatDuration(planEstimates.totalEstimateSeconds)}</b>
              </span>
            )}
            {planEstimates.actualElapsedSeconds > 0 && (
              <span>
                Elapsed: <b>{formatDuration(planEstimates.actualElapsedSeconds)}</b>
              </span>
            )}
            {planEstimates.remainingCount > 0 && (
              <span data-testid="plan-forecast">
                {formatRemaining(planEstimates.forecastSeconds)}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Child runs */}
      <section className="overflow-hidden rounded-xl border border-hairline bg-surface">
        <table className="w-full text-sm">
          <thead className="bg-canvas text-left text-xs uppercase text-content-muted">
            <tr>
              <th className="px-4 py-3">Run</th>
              <th className="px-4 py-3">Configuration</th>
              <th className="px-4 py-3">Progress</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-hairline-subtle">
            {plan.runs.map((run) => {
              const runTotal = run.results.length || 1;
              const config = parseRunConfig(run.configJson);
              return (
                <tr key={run.id} data-testid="plan-run-row">
                  <td className="px-4 py-3">
                    <Link
                      href={`/projects/${plan.project.slug}/runs/${run.id}`}
                      className="font-medium text-accent-text hover:underline"
                    >
                      {run.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    {config ? (
                      <span className="flex flex-wrap gap-1">
                        {Object.entries(config).map(([group, option]) => (
                          <span
                            key={group}
                            title={group}
                            className="rounded-full bg-accent-soft px-2 py-0.5 text-xs font-medium text-accent-soft-fg"
                          >
                            {option}
                          </span>
                        ))}
                      </span>
                    ) : (
                      <span className="text-xs text-content-subtle">—</span>
                    )}
                  </td>
                  <td className="w-1/3 px-4 py-3">
                    <div className="flex h-2 overflow-hidden rounded-full bg-surface-muted">
                      {barKeys.map((st) => {
                        const c = run.results.filter(
                          (r) => bucketStatus(r.status, isMuted(r.testCase?.mutedAt)) === st
                        ).length;
                        return c ? (
                          <div
                            key={st}
                            style={{
                              backgroundColor: colorOf(st),
                              width: `${(c / runTotal) * 100}%`,
                            }}
                            title={`${labelOf(st)}: ${c}`}
                          />
                        ) : null;
                      })}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        run.status === "COMPLETED"
                          ? "bg-success-soft text-success-soft-fg"
                          : "bg-info-soft text-info-soft-fg"
                      }`}
                    >
                      {run.status === "COMPLETED" ? "Completed" : "Active"}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      {/* Matrix view — intentionally NOT mute-bucketed: this is a per-status
          detail breakdown, not a pass-rate aggregate, so a muted case's real
          status stays visible here (same "still showing" principle as the
          run detail executor). */}
      <section className="rounded-xl border border-hairline bg-surface p-6">
        <h3 className="mb-3 text-sm font-semibold uppercase text-content-subtle">
          Result Matrix
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm" data-testid="plan-matrix">
            <thead className="text-left text-xs uppercase text-content-muted">
              <tr>
                <th className="py-2 pr-4">Configuration</th>
                <th className="px-3 py-2 text-center text-success-soft-fg">Passed</th>
                <th className="px-3 py-2 text-center text-danger-soft-fg">Failed</th>
                <th className="px-3 py-2 text-center text-warning-soft-fg">Blocked</th>
                <th className="px-3 py-2 text-center text-content-muted">Untested</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline-subtle">
              {plan.runs.map((run) => {
                const config = parseRunConfig(run.configJson);
                return (
                  <tr key={run.id}>
                    <td className="py-2 pr-4 font-medium">
                      {config ? configLabel(config) : "(no configuration)"}
                    </td>
                    {MATRIX_COLS.map((col) => (
                      <td key={col} className="px-3 py-2 text-center">
                        {rowCount(run.results, col) || (
                          <span className="text-content-subtle">·</span>
                        )}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
