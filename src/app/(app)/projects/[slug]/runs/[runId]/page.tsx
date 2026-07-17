import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { caseDisplayId, type TestStep } from "@/lib/constants";
import { loadStatusDefs } from "@/lib/result-status-defs";
import { statusMeta } from "@/lib/result-statuses";
import { expandSteps, loadStepGroups } from "@/lib/steps";
import { parseDatasets, substituteVars } from "@/lib/datasets";
import { bucketStatus, isMuted } from "@/lib/mute";
import { loadIssueLinks } from "@/lib/issues";
import { loadDefectLinks, defectDisplayId } from "@/lib/defects";
import { computeBlockedSuggestions } from "@/lib/case-dependencies";
import type { CaseSnapshot } from "@/lib/case-revisions";
import { computeRunEstimates, projectMedianEstimate } from "@/lib/estimates";
import { formatDuration, formatRemaining } from "@/lib/duration";
import { ProjectTabs } from "@/components/ProjectTabs";
import { RunExecutor } from "@/components/RunExecutor";
import { CommentPanel } from "@/components/CommentPanel";
import { ShareLinkPanel } from "@/components/ShareLinkPanel";
import { ExportMenu } from "@/components/ExportMenu";
import { completeRun, rerunFailed } from "@/app/actions/runs";
import { loadPerms } from "@/lib/permissions";

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
      environment: true,
      baseline: { select: { id: true, name: true } }, // F-28
      results: {
        include: { testCase: true, assignee: true },
        orderBy: { testCase: { seq: "asc" } },
      },
    },
  });
  if (!run || run.project.slug !== params.slug) notFound();

  // F-28: a run "from baseline" tests the case content the baseline pinned,
  // not whatever the case looks like today — load that snapshot per result.
  const snapshotByResult = new Map<string, CaseSnapshot>();
  if (run.baseline) {
    const revisions = await db.testCaseRevision.findMany({
      where: {
        OR: run.results.map((r) => ({ caseId: r.caseId, rev: r.caseRev ?? undefined })),
      },
    });
    const byKey = new Map(revisions.map((rv) => [`${rv.caseId}:${rv.rev}`, rv]));
    for (const r of run.results) {
      const rv = r.caseRev != null ? byKey.get(`${r.caseId}:${r.caseRev}`) : undefined;
      if (rv) snapshotByResult.set(r.id, JSON.parse(rv.snapshotJson) as CaseSnapshot);
    }
  }

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

  // F-26: built-in defects linked to each result, plus the project's open
  // defects for the "link existing" picker.
  const defectLinks = await loadDefectLinks(
    "RESULT",
    run.results.map((r) => r.id)
  );
  const projectDefects = await db.defect.findMany({
    where: { projectId: run.projectId, status: { notIn: ["CLOSED", "WONT_FIX"] } },
    select: { id: true, seq: true, title: true },
    orderBy: { seq: "desc" },
  });

  // F-32: a dependent whose prerequisite is FAILED/BLOCKED in this run gets
  // a one-click BLOCKED suggestion — never applied automatically.
  const blockedSuggestions = await computeBlockedSuggestions(run.projectId, run.id);

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
  // F-14: permission-derived access (covers custom roles).
  const perms = await loadPerms(session.userId, run.projectId);
  // F-14: the project's status defs drive colors, labels, and kind-based math.
  const statusDefs = await loadStatusDefs(run.projectId);
  const { colorOf, labelOf, kindOf } = statusMeta(statusDefs);
  // F-21: a muted case's results bucket as "MUTED" in the summary bar/legend,
  // excluded from pass-rate math, while the executor below still shows their
  // real status per-result.
  const counts: Record<string, number> = {};
  run.results.forEach((r) => {
    const b = bucketStatus(r.status, isMuted(r.testCase.mutedAt));
    counts[b] = (counts[b] ?? 0) + 1;
  });
  // Legend/bar order: def order, then the MUTED bucket.
  const legendKeys = [...statusDefs.map((d) => d.key), "MUTED"];
  // F-14: failure-ish = FAIL/BLOCKED kinds + the system RETEST key.
  const failedish = run.results.filter(
    (r) => ["FAIL", "BLOCKED"].includes(kindOf(r.status)) || r.status === "RETEST"
  ).length;

  // F-23: total estimate, actual elapsed, forecast-to-complete.
  const projectEstimates = await db.testCase.findMany({
    where: { projectId: run.projectId, deletedAt: null },
    select: { estimateSeconds: true },
  });
  const projectDefault = projectMedianEstimate(
    projectEstimates.map((c) => c.estimateSeconds)
  );
  const estimates = computeRunEstimates(
    run.results.map((r) => ({
      status: r.status,
      elapsedSeconds: r.elapsedSeconds,
      assigneeId: r.assigneeId,
      estimateSeconds: r.testCase.estimateSeconds,
    })),
    projectDefault
  );

  return (
    <div className="space-y-6">
      <ProjectTabs slug={run.project.slug} name={run.project.name} active="runs" />

      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold">{run.name}</h2>
          <p className="text-sm text-slate-400">
            {run.description}
            {run.milestone && <> · {run.milestone.name}</>}
            {run.environment && (
              <>
                {" "}
                ·{" "}
                <span
                  className="rounded bg-teal-50 px-1.5 py-0.5 text-xs text-teal-700"
                  data-testid="run-detail-env-badge"
                >
                  {run.environment.name}
                </span>
              </>
            )}
            {run.baseline && (
              <>
                {" "}
                ·{" "}
                <span
                  className="rounded bg-purple-50 px-1.5 py-0.5 text-xs text-purple-700"
                  data-testid="run-detail-baseline-badge"
                  title="Cases render the content pinned by this baseline, not their current content."
                >
                  📌 Baseline: {run.baseline.name}
                </span>
              </>
            )}
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <ExportMenu
            items={[
              { label: "CSV", href: `/api/export/run?id=${run.id}`, testid: "export-csv-link" },
              { label: "XLSX", href: `/api/export/run-xlsx?id=${run.id}`, testid: "export-xlsx-link" },
              { label: "JSON", href: `/api/export/run-json?id=${run.id}`, testid: "export-json-link" },
            ]}
          />
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
                  className={`inline-block h-2.5 w-2.5 rounded-full ${st === "UNTESTED" ? "border border-gray-300" : ""}`}
                  style={{ backgroundColor: colorOf(st) }}
                />
                {labelOf(st)} <b>{counts[st]}</b>
                <span className="text-slate-400">
                  ({Math.round((counts[st] / total) * 100)}%)
                </span>
              </span>
            ) : null
          )}
        </div>
        {(estimates.totalEstimateSeconds > 0 ||
          estimates.actualElapsedSeconds > 0) && (
          <div
            className="mt-3 flex flex-wrap gap-4 border-t border-slate-100 pt-3 text-sm text-slate-500"
            data-testid="run-estimate-summary"
          >
            {estimates.totalEstimateSeconds > 0 && (
              <span>
                Estimate: <b>{formatDuration(estimates.totalEstimateSeconds)}</b>
              </span>
            )}
            {estimates.actualElapsedSeconds > 0 && (
              <span>
                Elapsed: <b>{formatDuration(estimates.actualElapsedSeconds)}</b>
              </span>
            )}
            {estimates.remainingCount > 0 && (
              <span data-testid="run-forecast">
                {formatRemaining(estimates.forecastSeconds)}
              </span>
            )}
          </div>
        )}
      </div>

      <RunExecutor
        runId={run.id} // L-04
        currentUser={{ id: session.userId, name: session.name }} // L-04
        runStatus={run.status}
        projectSlug={run.project.slug}
        canWrite={perms.has("run.execute")} // F-14
        maxUploadMb={maxUploadMb}
        hasIntegration={hasIntegration}
        projectDefects={projectDefects.map((d) => ({
          id: d.id,
          displayId: defectDisplayId(run.project.slug, d.seq),
          title: d.title,
        }))}
        statusDefs={statusDefs}
        customDefs={resultDefs.map((d) => ({
          key: d.key,
          label: d.label,
          type: d.type,
          options: JSON.parse(d.optionsJson || "[]"),
          required: d.required,
        }))}
        members={members.map((m) => m.user)}
        results={run.results.map((r) => {
          // F-28: a baseline run renders the PINNED snapshot's content, not
          // the case's current content — that's the whole point of pinning.
          const snapshot = snapshotByResult.get(r.id);
          const expanded = snapshot
            ? snapshot.steps
            : expandSteps(JSON.parse(r.testCase.stepsJson || "[]") as TestStep[], stepGroups);
          const baseTitle = snapshot?.title ?? r.testCase.title;
          const basePreconditions = snapshot ? snapshot.preconditions : r.testCase.preconditions;
          const baseExpectedResult = snapshot ? snapshot.expectedResult : r.testCase.expectedResult;

          // F-13: substitute {{var}} -> this result's dataset row values;
          // cases without datasets (datasetName null) render unchanged.
          const datasetValues = r.datasetName
            ? parseDatasets(r.testCase.datasetJson).find(
                (d) => d.name === r.datasetName
              )?.values ?? {}
            : null;
          const title = datasetValues ? substituteVars(baseTitle, datasetValues) : baseTitle;
          const preconditions = datasetValues
            ? substituteVars(basePreconditions, datasetValues)
            : basePreconditions ?? "";
          const expectedResult = datasetValues
            ? substituteVars(baseExpectedResult, datasetValues)
            : baseExpectedResult ?? "";
          const steps = datasetValues
            ? expanded.map((s) => ({
                ...s,
                action: substituteVars(s.action, datasetValues),
                expected: substituteVars(s.expected, datasetValues),
              }))
            : expanded;
          return {
          id: r.id,
          caseId: r.caseId, // L-04
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
          muted: isMuted(r.testCase.mutedAt), // F-21

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
          defectLinks: (defectLinks.get(r.id) ?? []).map((l) => ({
            id: l.id,
            defectId: l.defectId,
            displayId: defectDisplayId(run.project.slug, l.defect.seq),
            title: l.defect.title,
            status: l.defect.status,
          })),
          blockedSuggestion: (() => {
            const s = blockedSuggestions.get(r.id);
            return s
              ? { prereqDisplayId: caseDisplayId(run.project.slug, s.prereqSeq), prereqTitle: s.prereqTitle }
              : null;
          })(),
          };
        })}
      />

      {/* F-17: public share links (run.manage only). */}
      {perms.has("run.manage") && (
        <ShareLinkPanel entityType="RUN" entityId={run.id} />
      )}

      {/* F-16: run-level discussion thread. */}
      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <CommentPanel entityType="RUN" entityId={run.id} projectSlug={run.project.slug} />
      </div>
    </div>
  );
}
