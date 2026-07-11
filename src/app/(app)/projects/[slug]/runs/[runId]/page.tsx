import { notFound } from "next/navigation";
import { TFIcon } from "@/components/icons";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { caseDisplayId, RESULT_COLORS, type TestStep } from "@/lib/constants";
import { expandSteps, loadStepGroups } from "@/lib/steps";
import { parseDatasets, substituteVars } from "@/lib/datasets";
import { loadIssueLinks } from "@/lib/issues";
import { ProjectTabs } from "@/components/ProjectTabs";
import { RunExecutor } from "@/components/RunExecutor";
import { completeRun, rerunFailed } from "@/app/actions/runs";

export const dynamic = "force-dynamic";

export default async function RunDetailPage({
  params,
}: {
  params: { slug: string; runId: string };
}) {
  const session = await requireSession();
  const run = await db.testRun.findFirst({
    where: {
      id: params.runId,
      project: { members: { some: { userId: session.userId } } },
    },
    include: {
      project: true,
      milestone: true,
      results: {
        include: { testCase: true, assignee: true },
        orderBy: { testCase: { seq: "asc" } },
      },
    },
  });
  if (!run || run.project.slug !== params.slug) notFound();

  // F-01: evidence attachments per result, grouped for the executor panel.
  const resultAttachments = await db.attachment.findMany({
    where: {
      entityType: "RESULT",
      entityId: { in: run.results.map((r) => r.id) },
    },
    orderBy: { createdAt: "asc" },
  });
  const attachmentsByResult = new Map<string, typeof resultAttachments>();
  for (const a of resultAttachments) {
    const list = attachmentsByResult.get(a.entityId) ?? [];
    list.push(a);
    attachmentsByResult.set(a.entityId, list);
  }
  const maxUploadMb = parseInt(process.env.TF_MAX_UPLOAD_MB ?? "10", 10) || 10;

  // F-04: executor renders shared references expanded.
  const stepGroups = await loadStepGroups(run.projectId);

  // F-07: issue links per result + whether a tracker is connected at all.
  const issueLinks = await loadIssueLinks(
    "RESULT",
    run.results.map((r) => r.id)
  );
  const hasIntegration =
    (await db.integration.count({
      where: { projectId: run.projectId, active: true },
    })) > 0;

  // F-03: RESULT custom fields rendered in the executor's submit panel.
  const resultDefs = await db.customFieldDef.findMany({
    where: { projectId: run.projectId, entity: "RESULT", active: true },
    orderBy: { order: "asc" },
  });
  const members = await db.projectMember.findMany({
    where: { projectId: run.projectId },
    include: { user: { select: { id: true, name: true } } },
  });

  const total = run.results.length || 1;
  const counts: Record<string, number> = {};
  run.results.forEach((r) => (counts[r.status] = (counts[r.status] ?? 0) + 1));
  const failedish =
    (counts.FAILED ?? 0) + (counts.BLOCKED ?? 0) + (counts.RETEST ?? 0);

  return (
    <div className="space-y-6">
      <ProjectTabs slug={run.project.slug} name={run.project.name} active="runs" />

      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold">{run.name}</h2>
          <p className="text-sm text-slate-400">
            {run.description}
            {run.milestone && <> · {run.milestone.name}</>}
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <a
            href={`/api/export/run?id=${run.id}`}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-100"
          >
            <span className="inline-flex items-center gap-1.5"><TFIcon name="download" className="h-4 w-4" /> Export CSV</span>
          </a>
          {failedish > 0 && (
            <form action={rerunFailed}>
              <input type="hidden" name="runId" value={run.id} />
              <button className="rounded-lg border border-purple-300 px-3 py-1.5 text-sm text-purple-700 hover:bg-purple-50">
                ↻ Rerun Failed ({failedish})
              </button>
            </form>
          )}
          {run.status === "ACTIVE" && (
            <form action={completeRun}>
              <input type="hidden" name="runId" value={run.id} />
              <button className="rounded-lg bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-700">
                ✓ Mark Complete
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Summary bar */}
      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <div className="flex h-3 overflow-hidden rounded-full bg-gray-100">
          {Object.entries(counts).map(([st, count]) => (
            <div
              key={st}
              className={RESULT_COLORS[st]}
              style={{ width: `${(count / total) * 100}%` }}
            />
          ))}
        </div>
        <div className="mt-3 flex flex-wrap gap-4 text-sm">
          {["PASSED", "FAILED", "BLOCKED", "SKIPPED", "RETEST", "IN_PROGRESS", "UNTESTED"].map(
            (st) =>
              counts[st] ? (
                <span key={st} className="flex items-center gap-1.5">
                  <span className={`inline-block h-2.5 w-2.5 rounded-full ${RESULT_COLORS[st]} ${st === "UNTESTED" ? "border border-gray-300" : ""}`} />
                  {st} <b>{counts[st]}</b>
                  <span className="text-slate-400">
                    ({Math.round((counts[st] / total) * 100)}%)
                  </span>
                </span>
              ) : null
          )}
        </div>
      </div>

      <RunExecutor
        runStatus={run.status}
        projectSlug={run.project.slug}
        canWrite={session.role !== "VIEWER"}
        maxUploadMb={maxUploadMb}
        hasIntegration={hasIntegration}
        customDefs={resultDefs.map((d) => ({
          key: d.key,
          label: d.label,
          type: d.type,
          options: JSON.parse(d.optionsJson || "[]"),
          required: d.required,
        }))}
        members={members.map((m) => m.user)}
        results={run.results.map((r) => {
          // F-13: substitute {{var}} -> this result's dataset row values;
          // cases without datasets (datasetName null) render unchanged.
          const expanded = expandSteps(
            JSON.parse(r.testCase.stepsJson || "[]") as TestStep[],
            stepGroups
          );
          const datasetValues = r.datasetName
            ? parseDatasets(r.testCase.datasetJson).find(
                (d) => d.name === r.datasetName
              )?.values ?? {}
            : null;
          const title = datasetValues
            ? substituteVars(r.testCase.title, datasetValues)
            : r.testCase.title;
          const preconditions = datasetValues
            ? substituteVars(r.testCase.preconditions, datasetValues)
            : r.testCase.preconditions ?? "";
          const expectedResult = datasetValues
            ? substituteVars(r.testCase.expectedResult, datasetValues)
            : r.testCase.expectedResult ?? "";
          const steps = datasetValues
            ? expanded.map((s) => ({
                ...s,
                action: substituteVars(s.action, datasetValues),
                expected: substituteVars(s.expected, datasetValues),
              }))
            : expanded;
          return {
          id: r.id,
          status: r.status,
          comment: r.comment ?? "",
          defectUrl: r.defectUrl ?? "",
          elapsedSeconds: r.elapsedSeconds,
          assigneeName: r.assignee?.name ?? null,
          displayId: caseDisplayId(run.project.slug, r.testCase.seq),
          title,
          priority: r.testCase.priority,
          caseRev: r.caseRev,
          currentRev: r.testCase.rev,
          datasetName: r.datasetName,
          preconditions,
          expectedResult,
          steps,
          attachments: (attachmentsByResult.get(r.id) ?? []).map((a) => ({
            id: a.id,
            filename: a.filename,
            mimeType: a.mimeType,
            sizeBytes: a.sizeBytes,
            url: `/api/attachments/${a.id}`,
          })),
          custom: JSON.parse(r.customJson || "{}"),
          issueLinks: (issueLinks.get(r.id) ?? []).map((l) => ({
            id: l.id,
            provider: l.provider,
            issueKey: l.issueKey,
            issueUrl: l.issueUrl,
            title: l.title,
            status: l.status,
          })),
          };
        })}
      />
    </div>
  );
}
