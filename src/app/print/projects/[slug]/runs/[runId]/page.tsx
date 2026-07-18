import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { caseDisplayId, type TestStep } from "@/lib/constants";
import { loadStatusDefs } from "@/lib/result-status-defs";
import { statusMeta } from "@/lib/result-statuses";
import { expandSteps, loadStepGroups } from "@/lib/steps";
import { bucketStatus, isMuted, NON_EXECUTED_BUCKETS } from "@/lib/mute";
import { deltaOf } from "@/lib/run-compare";
import { loadDefectLinks, defectDisplayId } from "@/lib/defects";
import { loadIssueLinks } from "@/lib/issues";
import { formatDuration } from "@/lib/duration";
import { loadSuiteIndex } from "@/lib/case-doc";
import { Markdown } from "@/components/Markdown";
import { PrintToolbar } from "@/components/PrintToolbar";

export const dynamic = "force-dynamic";

// Status glyphs — same map as RunExecutor so the summary reads in grayscale.
const KEY_ICONS: Record<string, string> = {
  PASSED: "✓",
  FAILED: "✕",
  BLOCKED: "⊘",
  SKIPPED: "→",
  RETEST: "↻",
};
const KIND_ICONS: Record<string, string> = {
  PASS: "✓",
  FAIL: "✕",
  BLOCKED: "⊘",
  NEUTRAL: "•",
};

export default async function PrintRunReportPage({
  params,
  searchParams,
}: {
  params: { slug: string; runId: string };
  searchParams: { steps?: string };
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
      plan: { select: { name: true } },
      results: {
        include: { testCase: true, assignee: { select: { name: true } } },
        orderBy: { testCase: { seq: "asc" } },
      },
    },
  });
  if (!run || run.project.slug !== params.slug) notFound();

  const expandStepsMode = searchParams.steps === "1";
  const statusDefs = await loadStatusDefs(run.projectId);
  const { colorOf, labelOf, kindOf } = statusMeta(statusDefs);
  const [stepGroups, idx, defectLinks, issueLinks] = await Promise.all([
    expandStepsMode ? loadStepGroups(run.projectId) : Promise.resolve(new Map()),
    loadSuiteIndex(run.projectId),
    loadDefectLinks("RESULT", run.results.map((r) => r.id)),
    loadIssueLinks("RESULT", run.results.map((r) => r.id)),
  ]);

  // F-21: bucket muted results into MUTED for the summary; exclude them from
  // pass-rate math, exactly like the dashboard.
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
  );
  const passCount = executed.filter((r) => kindOf(r.status) === "PASS").length;
  const passRate = executed.length
    ? Math.round((passCount / executed.length) * 100)
    : 0;

  // Regression annotation: the most recent COMPLETED run of the same source
  // before this one. A FAILED-kind result that was PASS there is a regression.
  const prevRun = await db.testRun.findFirst({
    where: {
      projectId: run.projectId,
      source: run.source,
      status: "COMPLETED",
      id: { not: run.id },
      createdAt: { lt: run.createdAt },
    },
    orderBy: { createdAt: "desc" },
    include: { results: { select: { caseId: true, datasetName: true, status: true } } },
  });
  const prevStatus = new Map<string, string>();
  if (prevRun)
    for (const r of prevRun.results)
      prevStatus.set(`${r.caseId}::${r.datasetName ?? ""}`, r.status);

  const glyphOf = (key: string) =>
    KEY_ICONS[key] ?? KIND_ICONS[kindOf(key)] ?? "•";

  // Group results by suite, in tree order (null-suite trailing).
  type Row = (typeof run.results)[number];
  const bySuite = new Map<string | null, Row[]>();
  for (const r of run.results) {
    const key = r.testCase.suiteId ?? null;
    const list = bySuite.get(key) ?? [];
    list.push(r);
    bySuite.set(key, list);
  }
  const suiteKeys = Array.from(bySuite.keys());
  suiteKeys.sort((a, b) => {
    if (a === null) return 1;
    if (b === null) return -1;
    return idx.rankOf(a) - idx.rankOf(b);
  });

  const now = new Date();
  const generated = `${now.toISOString().slice(0, 10)} ${now
    .toTimeString()
    .slice(0, 5)}`;
  const pdfTitle = `${run.project.slug} — run-report — TestForge`;

  const h = headers();
  const proto = h.get("x-forwarded-proto") ?? "http";
  const host = h.get("host") ?? "";
  const absoluteUrl = `${proto}://${host}/print/projects/${run.project.slug}/runs/${run.id}${
    expandStepsMode ? "?steps=1" : ""
  }`;

  const subtitleParts = [
    labelOf(run.status),
    `started ${run.createdAt.toISOString().slice(0, 10)}`,
  ];
  if (run.environment) subtitleParts.push(run.environment.name);
  if (run.plan) subtitleParts.push(run.plan.name);
  else if (run.milestone) subtitleParts.push(run.milestone.name);

  return (
    <div className="tf-print-page">
      <PrintToolbar title={pdfTitle} />

      {/* Cover */}
      <header className="tf-print-cover" data-testid="print-cover">
        <h1>
          {run.project.name} — Run report: {run.name}
        </h1>
        <hr className="tf-rule" />
        <p className="tf-secondary">{subtitleParts.join(" · ")}</p>
        <p className="tf-secondary tf-mono" style={{ fontSize: "9pt" }}>
          generated {generated} · by {session.name}
        </p>
      </header>

      {/* Summary block (replaces the TOC) */}
      <section data-testid="print-summary" style={{ marginBottom: "6mm" }}>
        <h2>Summary</h2>
        <p style={{ margin: "0 0 2mm" }}>
          Pass rate: <b>{passRate}%</b>{" "}
          <span className="tf-secondary">
            ({passCount}/{executed.length} executed
            {counts.MUTED ? `, ${counts.MUTED} muted excluded` : ""})
          </span>
        </p>

        {/* 100%-stacked bar — outlined so segments survive grayscale. */}
        <div className="tf-stacked" data-testid="print-stacked-bar">
          {legendKeys.map((st) =>
            counts[st] ? (
              <span
                key={st}
                style={{
                  width: `${(counts[st] / total) * 100}%`,
                  backgroundColor: colorOf(st),
                }}
                title={`${labelOf(st)} ${counts[st]}`}
              />
            ) : null
          )}
        </div>

        <table className="tf-steps" style={{ maxWidth: "90mm" }}>
          <thead>
            <tr>
              <th>Status</th>
              <th>Count</th>
              <th>Percent</th>
            </tr>
          </thead>
          <tbody>
            {legendKeys.map((st) =>
              counts[st] ? (
                <tr key={st} data-testid={`print-summary-row-${st}`}>
                  <td>
                    {glyphOf(st)} {labelOf(st)}
                  </td>
                  <td>{counts[st]}</td>
                  <td>{Math.round((counts[st] / total) * 100)}%</td>
                </tr>
              ) : null
            )}
          </tbody>
        </table>
      </section>

      {/* Body — results grouped by suite */}
      {suiteKeys.map((sk) => {
        const rows = bySuite.get(sk)!;
        const path = sk ? idx.pathOf(sk) || "Suite" : "Ungrouped";
        return (
          <div key={sk ?? "none"} className="tf-print-suite">
            <h2 id={`suite-${sk ?? "none"}`}>{path}</h2>
            {rows.map((r) => {
              const displayId = caseDisplayId(run.project.slug, r.testCase.seq);
              const muted = isMuted(r.testCase.mutedAt);
              const key = `${r.caseId}::${r.datasetName ?? ""}`;
              const prev = prevStatus.get(key) ?? null;
              const regressed =
                !muted &&
                ["FAIL", "BLOCKED"].includes(kindOf(r.status)) &&
                deltaOf(prev, r.status, kindOf) === "REGRESSION";
              const defs = defectLinks.get(r.id) ?? [];
              const issues = issueLinks.get(r.id) ?? [];
              const steps = expandStepsMode
                ? expandSteps(
                    JSON.parse(r.testCase.stepsJson || "[]") as TestStep[],
                    stepGroups
                  )
                : [];
              return (
                <section
                  key={r.id}
                  className="tf-print-case"
                  data-testid={`print-result-${displayId}`}
                >
                  <div className="tf-case-head">
                    <div>
                      <span className="tf-mono tf-secondary">{displayId}</span>{" "}
                      <span className="tf-case-title">{r.testCase.title}</span>
                      {r.datasetName && (
                        <span className="tf-chip" style={{ marginLeft: "2mm" }}>
                          {r.datasetName}
                        </span>
                      )}
                      {muted && (
                        <span className="tf-chip" style={{ marginLeft: "2mm" }}>
                          muted
                        </span>
                      )}
                    </div>
                    <span className="tf-chip" style={{ color: colorOf(r.status) }}>
                      {glyphOf(r.status)} {labelOf(r.status)}
                    </span>
                  </div>

                  <div
                    className="tf-secondary"
                    style={{ display: "flex", flexWrap: "wrap", gap: "1mm 3mm", margin: "1mm 0", fontSize: "9pt" }}
                  >
                    {r.elapsedSeconds != null && (
                      <span>Elapsed: {formatDuration(r.elapsedSeconds)}</span>
                    )}
                    {r.assignee?.name && <span>By: {r.assignee.name}</span>}
                    {regressed && (
                      <span data-testid="print-regression" style={{ fontWeight: 600 }}>
                        ↓ regression
                      </span>
                    )}
                    {defs.map((l) => (
                      <span key={l.id}>
                        {defectDisplayId(run.project.slug, l.defect.seq)}
                      </span>
                    ))}
                    {issues.map((l) => (
                      <span key={l.id}>{l.issueKey}</span>
                    ))}
                    {r.defectUrl && <span>{r.defectUrl}</span>}
                  </div>

                  {r.comment && (
                    <div style={{ margin: "1mm 0" }}>
                      <Markdown>{r.comment}</Markdown>
                    </div>
                  )}

                  {/* Steps collapsed by default; ?steps=1 expands them. */}
                  {expandStepsMode ? (
                    steps.length > 0 && (
                      <table className="tf-steps">
                        <thead>
                          <tr>
                            <th className="tf-step-num">#</th>
                            <th>Action</th>
                            <th>Expected</th>
                          </tr>
                        </thead>
                        <tbody>
                          {steps.map((s, i) => (
                            <tr key={i}>
                              <td className="tf-step-num">{i + 1}</td>
                              <td>
                                {s.fromShared && (
                                  <div className="tf-shared-origin">
                                    ⛓ {s.fromShared.title}
                                  </div>
                                )}
                                <Markdown>{s.action}</Markdown>
                              </td>
                              <td>{s.expected ? <Markdown>{s.expected}</Markdown> : null}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )
                  ) : (
                    <p className="tf-secondary" style={{ fontSize: "9pt", margin: "1mm 0" }}>
                      {(() => {
                        // A shared ref counts as one line here — the collapsed
                        // note is a hint, so it doesn't load groups to expand.
                        const n = (JSON.parse(r.testCase.stepsJson || "[]") as TestStep[])
                          .length;
                        return `${n} step${n === 1 ? "" : "s"} — see case catalog`;
                      })()}
                    </p>
                  )}
                </section>
              );
            })}
          </div>
        );
      })}

      <footer className="tf-doc-footer" data-testid="print-footer">
        Generated by TestForge — {absoluteUrl}
      </footer>
    </div>
  );
}
