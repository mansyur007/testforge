import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { caseDisplayId } from "@/lib/constants";
import { loadStatusDefs } from "@/lib/result-status-defs";
import { statusMeta, badgeStyle } from "@/lib/result-statuses";
import { bucketStatus, isMuted, NON_EXECUTED_BUCKETS } from "@/lib/mute";
import { loadReportData } from "@/lib/report-data";
import { GRID_COLS } from "@/lib/dashboards";
import { WidgetBody, widgetTypeLabel } from "@/components/DashboardWidgets";
import { NOINDEX } from "@/lib/seo";

export const dynamic = "force-dynamic";

// F-17: public, read-only, no-auth report behind an unguessable token.
// Absolutely no mutations and no links into the app from this page; noindex.
export const metadata: Metadata = {
  title: "Shared report — TestForge",
  robots: NOINDEX,
};

async function loadLink(token: string) {
  const link = await db.shareLink.findUnique({ where: { token } });
  if (
    !link ||
    link.revokedAt ||
    (link.expiresAt != null && link.expiresAt < new Date())
  )
    return null;
  return link;
}

export default async function SharePage({
  params,
}: {
  params: { token: string };
}) {
  const link = await loadLink(params.token);
  if (!link) notFound();

  const body =
    link.entityType === "RUN" ? (
      await runReport(link.entityId)
    ) : link.entityType === "DASHBOARD" ? (
      await dashboardReport(link.entityId)
    ) : null;
  if (!body) notFound();

  return (
    <div className="min-h-screen bg-canvas">
      <div className="mx-auto max-w-5xl space-y-6 px-4 py-10">
        {body}
        <footer className="border-t border-hairline pt-4 text-center text-xs text-content-subtle">
          Powered by TestForge
        </footer>
      </div>
    </div>
  );
}

async function runReport(runId: string) {
  const run = await db.testRun.findUnique({
    where: { id: runId },
    include: {
      project: { select: { slug: true, name: true } },
      environment: true,
      results: {
        include: {
          testCase: { select: { seq: true, title: true, mutedAt: true } },
        },
        orderBy: { testCase: { seq: "asc" } },
      },
    },
  });
  if (!run) return null;

  const statusDefs = await loadStatusDefs(run.projectId);
  const { colorOf, labelOf } = statusMeta(statusDefs);
  const total = run.results.length || 1;
  const counts: Record<string, number> = {};
  run.results.forEach((r) => {
    const b = bucketStatus(r.status, isMuted(r.testCase.mutedAt));
    counts[b] = (counts[b] ?? 0) + 1;
  });
  const legendKeys = [...statusDefs.map((d) => d.key), "MUTED"];
  const executed = run.results.filter(
    (r) =>
      !NON_EXECUTED_BUCKETS.includes(
        bucketStatus(r.status, isMuted(r.testCase.mutedAt))
      )
  ).length;

  return (
    <>
      <header>
        <p className="text-xs font-semibold uppercase text-content-subtle">
          {run.project.name} · Test run report
        </p>
        <h1 className="text-2xl font-bold">{run.name}</h1>
        <p className="mt-1 text-sm text-content-subtle">
          {run.createdAt.toLocaleDateString("en-US")}
          {run.environment && <> · {run.environment.name}</>}
          {" · "}
          {executed}/{run.results.length} executed
        </p>
      </header>

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
                  className="inline-block h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: colorOf(st) }}
                />
                {labelOf(st)} <b>{counts[st]}</b>
                <span className="text-content-subtle">
                  ({Math.round((counts[st] / total) * 100)}%)
                </span>
              </span>
            ) : null
          )}
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-hairline bg-surface">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-hairline text-left text-xs uppercase text-content-subtle">
              <th className="px-4 py-3">Case</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Comment</th>
            </tr>
          </thead>
          <tbody>
            {run.results.map((r) => (
              <tr key={r.id} className="border-b border-hairline-subtle last:border-0">
                <td className="px-4 py-2.5">
                  <span className="font-mono text-xs text-content-subtle">
                    {caseDisplayId(run.project.slug, r.testCase.seq)}
                  </span>{" "}
                  {r.testCase.title}
                  {r.datasetName && (
                    <span className="ml-1 rounded bg-accent-soft px-1.5 py-0.5 text-xs text-accent-soft-fg">
                      {r.datasetName}
                    </span>
                  )}
                  {isMuted(r.testCase.mutedAt) && (
                    <span className="ml-1 rounded bg-surface-muted px-1.5 py-0.5 text-xs text-content-muted">
                      muted
                    </span>
                  )}
                </td>
                <td className="px-4 py-2.5">
                  <span
                    className="rounded-full px-2 py-0.5 text-xs font-medium"
                    style={badgeStyle(colorOf(r.status))}
                  >
                    {labelOf(r.status)}
                  </span>
                </td>
                <td className="max-w-64 truncate px-4 py-2.5 text-xs text-content-muted">
                  {r.comment}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

async function dashboardReport(dashboardId: string) {
  const dashboard = await db.dashboard.findUnique({
    where: { id: dashboardId },
    include: {
      project: { select: { slug: true, name: true } },
      widgets: { orderBy: [{ y: "asc" }, { x: "asc" }] },
    },
  });
  if (!dashboard) return null;
  const data = await loadReportData(dashboard.projectId);

  return (
    <>
      <header>
        <p className="text-xs font-semibold uppercase text-content-subtle">
          {dashboard.project.name} · Dashboard
        </p>
        <h1 className="text-2xl font-bold">{dashboard.name}</h1>
      </header>
      <div
        className="grid gap-4"
        style={{ gridTemplateColumns: `repeat(${GRID_COLS}, minmax(0, 1fr))` }}
      >
        {dashboard.widgets.map((w) => (
          <section
            key={w.id}
            className="rounded-xl border border-hairline bg-surface p-5"
            style={{
              gridColumn: `${w.x + 1} / span ${Math.min(w.w, GRID_COLS - w.x)}`,
              gridRow: `${w.y + 1} / span ${w.h}`,
            }}
          >
            <h3 className="mb-3 font-semibold">
              {w.title || widgetTypeLabel(w.type)}
            </h3>
            <WidgetBody
              widget={w}
              data={data}
              slug={dashboard.project.slug}
              noLinks
            />
          </section>
        ))}
      </div>
    </>
  );
}
