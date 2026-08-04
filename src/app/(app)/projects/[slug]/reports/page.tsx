import { notFound } from "next/navigation";
import { TFIcon } from "@/components/icons";
import Link from "next/link";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { memberScope } from "@/lib/projects";
import { caseDisplayId } from "@/lib/constants";
import { parseRunConfig, configLabel } from "@/lib/plans";
import { loadEnvironments } from "@/lib/environments";
import { loadStatusDefs } from "@/lib/result-status-defs";
import { statusMeta } from "@/lib/result-statuses";
import { bucketStatus, NON_EXECUTED_BUCKETS } from "@/lib/mute";
import { ProjectTabs } from "@/components/ProjectTabs";
import { MuteButton, UnmuteButton } from "@/components/MuteControls";

export const dynamic = "force-dynamic";

export default async function ReportsPage({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams: { env?: string };
}) {
  const session = await requireSession();
  const project = await db.project.findFirst({
    where: { slug: params.slug, ...memberScope(session.userId) },
    include: {
      cases: { where: { deletedAt: null } },
      runs: {
        include: { results: true },
        orderBy: { createdAt: "desc" },
      },
    },
  });
  if (!project) notFound();

  // F-19: every metric below is scoped to the selected environment when set.
  const environments = await loadEnvironments(project.id);
  const activeEnv = searchParams.env ?? "";
  const scopedRuns = activeEnv
    ? project.runs.filter((r) => r.environmentId === activeEnv)
    : project.runs;
  project.runs = scopedRuns;

  // F-21: a muted case's results keep their real status but bucket as
  // "MUTED" for every aggregate below — never UNTESTED/IN_PROGRESS/MUTED
  // counts toward "executed".
  const mutedCaseIds = new Set(
    project.cases.filter((c) => c.mutedAt).map((c) => c.id)
  );
  const bucket = (r: { caseId: string; status: string }) =>
    bucketStatus(r.status, mutedCaseIds.has(r.caseId));

  // F-14: aggregate math keys off each status's kind, never its key — a custom
  // "Known Issue" (NEUTRAL) never skews the pass rate.
  const { colorOf, kindOf } = statusMeta(await loadStatusDefs(project.id));

  const allResults = project.runs.flatMap((r) => r.results);
  const executed = allResults.filter(
    (r) => !NON_EXECUTED_BUCKETS.includes(bucket(r))
  );
  const passed = executed.filter((r) => kindOf(r.status) === "PASS").length;
  const failed = executed.filter((r) => kindOf(r.status) === "FAIL").length;
  const passRate = executed.length
    ? Math.round((passed / executed.length) * 100)
    : 0;

  // Automation coverage (PRD §4.5.3)
  const automated = project.cases.filter(
    (c) => c.automationStatus === "AUTOMATED"
  ).length;
  const automationCoverage = project.cases.length
    ? Math.round((automated / project.cases.length) * 100)
    : 0;

  // Flaky test report (PRD §4.5.3): case yang status pass/fail-nya berganti-ganti.
  // Muted cases are excluded — they're already acknowledged/quarantined.
  const byCase = new Map<string, { statuses: string[] }>();
  for (const run of [...project.runs].reverse()) {
    for (const r of run.results) {
      // F-14: flakiness = flips between PASS-kind and FAIL-kind outcomes.
      const kind = kindOf(r.status);
      if (!["PASS", "FAIL"].includes(kind)) continue;
      const entry = byCase.get(r.caseId) ?? { statuses: [] };
      entry.statuses.push(kind);
      byCase.set(r.caseId, entry);
    }
  }
  const flaky = Array.from(byCase.entries())
    .filter(([caseId]) => !mutedCaseIds.has(caseId))
    .map(([caseId, { statuses }]) => {
      let flips = 0;
      for (let i = 1; i < statuses.length; i++)
        if (statuses[i] !== statuses[i - 1]) flips++;
      return { caseId, flips, total: statuses.length };
    })
    .filter((f) => f.flips >= 2)
    .sort((a, b) => b.flips - a.flips)
    .slice(0, 10);

  const flakyCases = flaky.map((f) => ({
    ...f,
    testCase: project.cases.find((c) => c.id === f.caseId),
  }));

  // F-21: muted tests panel — name, reason, days muted, last-10 sparkline.
  const mutedCases = project.cases
    .filter((c) => c.mutedAt)
    .map((c) => ({
      ...c,
      daysMuted: Math.floor(
        (Date.now() - c.mutedAt!.getTime()) / (1000 * 60 * 60 * 24)
      ),
      last10: (byCase.get(c.id)?.statuses ?? []).slice(-10),
    }));

  // Pass rate trend per run (proxy mingguan untuk MVP)
  const trend = [...project.runs]
    .reverse()
    .slice(-12)
    .map((run) => {
      const ex = run.results.filter(
        (r) => !NON_EXECUTED_BUCKETS.includes(bucket(r))
      );
      const p = ex.filter((r) => kindOf(r.status) === "PASS").length;
      // F-06: plan child runs carry their config combo into the tooltip.
      const config = parseRunConfig(run.configJson);
      return {
        name: run.name,
        config: run.planId && config ? configLabel(config) : null,
        rate: ex.length ? Math.round((p / ex.length) * 100) : 0,
        executed: ex.length,
      };
    });

  // Bug correlation (PRD §4.5.2): case dengan defect terbanyak
  const defectCounts = new Map<string, number>();
  allResults.forEach((r) => {
    if (r.defectUrl)
      defectCounts.set(r.caseId, (defectCounts.get(r.caseId) ?? 0) + 1);
  });
  const buggy = Array.from(defectCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([caseId, count]) => ({
      count,
      testCase: project.cases.find((c) => c.id === caseId),
    }));

  return (
    <div className="space-y-6">
      <ProjectTabs slug={project.slug} name={project.name} active="reports" />

      {environments.length > 0 && (
        <div className="flex flex-wrap gap-2" data-testid="env-filter-chips">
          <Link
            href={`/projects/${project.slug}/reports`}
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              !activeEnv
                ? "bg-accent text-white"
                : "bg-surface-muted text-content hover:bg-surface-muted"
            }`}
          >
            All environments
          </Link>
          {environments.map((e) => (
            <Link
              key={e.id}
              href={`/projects/${project.slug}/reports?env=${e.id}`}
              data-testid={`env-filter-${e.name}`}
              className={`rounded-full px-3 py-1 text-xs font-medium ${
                activeEnv === e.id
                  ? "bg-accent text-white"
                  : "bg-surface-muted text-content hover:bg-surface-muted"
              }`}
            >
              {e.name}
            </Link>
          ))}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: "Overall Pass Rate", value: `${passRate}%` },
          { label: "Total Executions", value: executed.length },
          { label: "Failed", value: failed },
          { label: "Automation Coverage", value: `${automationCoverage}%` },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-hairline bg-surface p-5">
            <p className="text-sm text-content-muted">{s.label}</p>
            <p className="mt-1 text-3xl font-bold">{s.value}</p>
          </div>
        ))}
      </div>

      <section className="rounded-xl border border-hairline bg-surface p-6">
        <h3 className="mb-4 flex items-center gap-2 font-semibold"><TFIcon name="trend" className="h-5 w-5" /> Pass Rate Trend per Run</h3>
        {trend.length === 0 ? (
          <p className="text-sm text-content-subtle">No run data yet.</p>
        ) : (
          // overflow-x-auto: each column can't shrink below its "100%" label, so
          // a project with many runs needs more width than a phone has. The
          // chart scrolls instead of widening the page; no scrollbar on desktop,
          // where the columns still divide the card evenly.
          <div className="flex h-44 items-end gap-2 overflow-x-auto">
            {trend.map((t, i) => (
              // h-full + justify-end: the bar's `height: N%` needs a parent with a
              // definite height to resolve against, or it collapses to 0px. Same fix
              // as the dashboard trend widget (DashboardWidgets.tsx).
              // min-w-0: a flex item defaults to min-width:auto, so the truncated run
              // name below sets a floor the column can't shrink past and the chart
              // overflows its card once a project has more than a handful of runs.
              <div key={i} className="group flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1">
                <span className="text-xs font-medium text-content">{t.rate}%</span>
                <div
                  className={`w-full rounded-t ${t.rate >= 80 ? "bg-success" : t.rate >= 50 ? "bg-warning" : "bg-danger"}`}
                  style={{ height: `${Math.max(t.rate, 3)}%` }}
                  title={`${t.name}${t.config ? ` [${t.config}]` : ""}: ${t.rate}% (${t.executed} executed)`}
                />
                <span className="w-full truncate text-center text-[10px] text-content-subtle">
                  {t.name}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-hairline bg-surface p-6">
          <h3 className="mb-4 flex items-center gap-2 font-semibold"><TFIcon name="flaky" className="h-5 w-5" /> Flaky Tests</h3>
          <p className="mb-3 text-xs text-content-subtle">
            Test cases whose pass/fail status flips between runs (≥2 changes).
          </p>
          {flakyCases.length === 0 ? (
            <p className="text-sm text-content-subtle">No flaky tests detected. 🎉</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {flakyCases.map((f) => (
                <li key={f.caseId} className="flex items-center justify-between">
                  <Link
                    href={`/projects/${project.slug}/cases/${f.caseId}`}
                    className="w-0 flex-1 truncate text-content hover:text-accent-text"
                  >
                    <span className="font-mono text-xs text-content-subtle">
                      {f.testCase && caseDisplayId(project.slug, f.testCase.seq)}
                    </span>{" "}
                    {f.testCase?.title}
                  </Link>
                  <span className="flex shrink-0 items-center">
                    <span className="rounded-full bg-accent-soft px-2 py-0.5 text-xs font-medium text-accent-soft-fg">
                      {f.flips} flip / {f.total} run
                    </span>
                    <MuteButton caseId={f.caseId} />
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-xl border border-hairline bg-surface p-6">
          <h3 className="mb-4 flex items-center gap-2 font-semibold"><TFIcon name="bug" className="h-5 w-5" /> Bug Correlation</h3>
          <p className="mb-3 text-xs text-content-subtle">
            Test cases that most often produce bug reports.
          </p>
          {buggy.length === 0 ? (
            <p className="text-sm text-content-subtle">No defects recorded yet.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {buggy.map((b, i) => (
                <li key={i} className="flex items-center justify-between">
                  <Link
                    href={`/projects/${project.slug}/cases/${b.testCase?.id}`}
                    className="truncate text-content hover:text-accent-text"
                  >
                    {b.testCase?.title}
                  </Link>
                  <span className="ml-2 shrink-0 rounded-full bg-danger-soft px-2 py-0.5 text-xs font-medium text-danger-soft-fg">
                    {b.count} defect
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {/* F-21: muted/quarantined cases — excluded from every pass-rate above. */}
      <section className="rounded-xl border border-hairline bg-surface p-6">
        <h3 className="mb-4 flex items-center gap-2 font-semibold">
          <TFIcon name="flaky" className="h-5 w-5" /> Muted Tests
        </h3>
        <p className="mb-3 text-xs text-content-subtle">
          Quarantined cases — results still recorded, but excluded from pass-rate math everywhere.
        </p>
        {mutedCases.length === 0 ? (
          <p className="text-sm text-content-subtle">No muted tests.</p>
        ) : (
          <ul className="space-y-3 text-sm">
            {mutedCases.map((c) => (
              <li key={c.id} className="flex items-center justify-between gap-3" data-testid={`muted-row-${c.id}`}>
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/projects/${project.slug}/cases/${c.id}`}
                    className="truncate text-content hover:text-accent-text"
                  >
                    <span className="font-mono text-xs text-content-subtle">
                      {caseDisplayId(project.slug, c.seq)}
                    </span>{" "}
                    {c.title}
                  </Link>
                  <p className="mt-0.5 truncate text-xs text-content-subtle">
                    {c.mutedReason} · muted {c.daysMuted}d ago
                  </p>
                </div>
                {c.last10.length > 0 && (
                  <div className="flex shrink-0 gap-0.5" title="Last 10 outcomes">
                    {c.last10.map((kind, i) => (
                      <span
                        key={i}
                        className={`h-3 w-1.5 rounded-sm ${kind === "PASS" ? "bg-success" : "bg-danger"}`}
                      />
                    ))}
                  </div>
                )}
                <UnmuteButton caseId={c.id} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-xl border border-hairline bg-surface p-6">
        <h3 className="mb-4 flex items-center gap-2 font-semibold"><TFIcon name="breakdown" className="h-5 w-5" /> Breakdown per Run</h3>
        <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-xs uppercase text-content-muted">
            <tr>
              <th className="py-2">Run</th>
              <th className="py-2">Progress</th>
              <th className="py-2 text-right">Pass Rate</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-hairline-subtle">
            {project.runs.map((run) => {
              const total = run.results.length || 1;
              const ex = run.results.filter(
                (r) => !NON_EXECUTED_BUCKETS.includes(bucket(r))
              );
              const p = ex.filter((r) => kindOf(r.status) === "PASS").length;
              return (
                <tr key={run.id}>
                  <td className="py-2">
                    <Link
                      href={`/projects/${project.slug}/runs/${run.id}`}
                      className="text-accent-text hover:underline"
                    >
                      {run.name}
                    </Link>
                    {run.origin && (
                      <span className="ml-2 rounded bg-surface-muted px-1.5 py-0.5 text-xs text-content">
                        {run.origin}
                      </span>
                    )}
                  </td>
                  <td className="w-1/2 py-2">
                    <div className="flex h-2 overflow-hidden rounded-full bg-surface-muted">
                      {Object.entries(
                        run.results.reduce<Record<string, number>>((acc, r) => {
                          const b = bucket(r);
                          acc[b] = (acc[b] ?? 0) + 1;
                          return acc;
                        }, {})
                      ).map(([st, count]) => (
                        <div
                          key={st}
                          style={{
                            backgroundColor: colorOf(st),
                            width: `${(count / total) * 100}%`,
                          }}
                          title={st === "MUTED" ? "Muted" : st}
                        />
                      ))}
                    </div>
                  </td>
                  <td className="py-2 text-right font-medium">
                    {ex.length ? `${Math.round((p / ex.length) * 100)}%` : "—"}
                  </td>
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
