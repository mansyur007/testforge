import Link from "next/link";
import { TFIcon } from "@/components/icons";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import {
  caseDisplayId,
  parseTags,
  PRIORITY_BADGES,
  RESULT_BADGES,
  type TestStep,
} from "@/lib/constants";
import { expandSteps, loadStepGroups } from "@/lib/steps";
import { loadIssueLinks } from "@/lib/issues";
import { serializeRevision } from "@/lib/case-revisions";
import { cloneCase } from "@/app/actions/cases";
import { ProjectTabs } from "@/components/ProjectTabs";
import { DeleteCaseButton } from "@/components/DeleteCaseButton";
import { AttachmentUploader } from "@/components/AttachmentUploader";
import { CaseHistory, type RevisionView } from "@/components/CaseHistory";
import { IssuePanel } from "@/components/IssuePanel";
import { Markdown } from "@/components/Markdown";

export const dynamic = "force-dynamic";

export default async function CaseDetailPage({
  params,
  searchParams,
}: {
  params: { slug: string; caseId: string };
  searchParams: { tab?: string };
}) {
  const session = await requireSession();
  const testCase = await db.testCase.findFirst({
    where: {
      id: params.caseId,
      project: { members: { some: { userId: session.userId } } },
    },
    include: {
      project: true,
      suite: true,
      results: {
        include: { run: true },
        orderBy: { updatedAt: "desc" },
        take: 10,
      },
    },
  });
  if (!testCase || testCase.project.slug !== params.slug) notFound();

  const attachments = await db.attachment.findMany({
    where: { entityType: "CASE", entityId: testCase.id },
    orderBy: { createdAt: "asc" },
  });

  // F-03: custom field values. Shows every def that has a value (including
  // disabled defs — old data keeps rendering) plus active defs without one.
  const fieldDefs = await db.customFieldDef.findMany({
    where: { projectId: testCase.projectId, entity: "CASE" },
    orderBy: { order: "asc" },
  });
  const customValues: Record<string, unknown> = JSON.parse(
    testCase.customJson || "{}"
  );
  const visibleDefs = fieldDefs.filter(
    (d) => d.active || customValues[d.key] !== undefined
  );
  const memberNames = new Map(
    (
      await db.projectMember.findMany({
        where: { projectId: testCase.projectId },
        include: { user: { select: { id: true, name: true } } },
      })
    ).map((m) => [m.user.id, m.user.name])
  );
  const renderCustom = (d: (typeof fieldDefs)[number]) => {
    const v = customValues[d.key];
    if (v === undefined || v === "" || (Array.isArray(v) && v.length === 0))
      return <span className="text-slate-300">—</span>;
    if (d.type === "CHECKBOX") return v ? "✓ yes" : "– no";
    if (d.type === "USER") return memberNames.get(String(v)) ?? String(v);
    if (d.type === "URL")
      return (
        <a href={String(v)} target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline">
          {String(v)}
        </a>
      );
    if (Array.isArray(v))
      return (
        <span className="flex flex-wrap gap-1">
          {v.map((x) => (
            <span key={String(x)} className="rounded bg-slate-100 px-1.5 py-0.5 text-xs">
              {String(x)}
            </span>
          ))}
        </span>
      );
    return String(v);
  };
  const maxUploadMb =
    parseInt(process.env.TF_MAX_UPLOAD_MB ?? "10", 10) || 10;

  // F-05: History tab — revision list rendered client-side with diffs.
  const tab = searchParams.tab === "history" ? "history" : "details";
  let revisions: RevisionView[] = [];
  let suiteNames: Record<string, string> = {};
  if (tab === "history") {
    const rows = await db.testCaseRevision.findMany({
      where: { caseId: testCase.id },
      include: { author: { select: { name: true } } },
      orderBy: { rev: "desc" },
    });
    revisions = rows.map((r) => {
      const { snapshot, ...rest } = serializeRevision(r);
      return { ...rest, authorName: r.author?.name ?? null, snapshot } as RevisionView;
    });
    suiteNames = Object.fromEntries(
      (
        await db.testSuite.findMany({
          where: { projectId: testCase.projectId },
          select: { id: true, name: true },
        })
      ).map((s) => [s.id, s.name])
    );
  }

  // F-07: issue links + whether this project has a tracker connected.
  const caseIssueLinks = (await loadIssueLinks("CASE", [testCase.id])).get(
    testCase.id
  ) ?? [];
  const hasIntegration =
    (await db.integration.count({
      where: { projectId: testCase.projectId, active: true },
    })) > 0;

  // F-04: shared references render expanded, tagged with their group title.
  const rawSteps: TestStep[] = JSON.parse(testCase.stepsJson || "[]");
  const steps = expandSteps(rawSteps, await loadStepGroups(testCase.projectId));
  const displayId = caseDisplayId(testCase.project.slug, testCase.seq);
  // Back link returns to the cases list, scoped to this case's suite if it has one.
  const backHref = `/projects/${testCase.project.slug}${testCase.suiteId ? `?suite=${testCase.suiteId}` : ""}`;

  // Trend pass/fail per case (PRD §4.4.2)
  const executed = testCase.results.filter((r) =>
    ["PASSED", "FAILED"].includes(r.status)
  );
  const passCount = executed.filter((r) => r.status === "PASSED").length;

  return (
    <div className="space-y-6">
      <ProjectTabs
        slug={testCase.project.slug}
        name={testCase.project.name}
        active="cases"
      />

      <Link
        href={backHref}
        data-testid="case-back"
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-indigo-600"
      >
        ← Back to test cases
      </Link>

      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-mono text-sm text-slate-400">{displayId}</p>
          <h2 className="text-xl font-bold">{testCase.title}</h2>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
            <span className={`rounded-full px-2 py-0.5 font-medium ${PRIORITY_BADGES[testCase.priority]}`}>
              {testCase.priority}
            </span>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-slate-600">
              {testCase.type}
            </span>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-slate-600">
              {testCase.status}
            </span>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-slate-600">
              {testCase.automationStatus.replace(/_/g, " ")}
            </span>
            {testCase.suite && (
              <span className="flex items-center gap-1 text-slate-400"><TFIcon name="nav-tree" className="h-4 w-4" /> {testCase.suite.name}</span>
            )}
          </div>
        </div>
        <div className="flex shrink-0 gap-2">
          <Link
            href={`/projects/${testCase.project.slug}/cases/${testCase.id}/edit`}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-100"
          >
            <TFIcon name="edit" className="h-4 w-4" /> Edit
          </Link>
          <form action={cloneCase}>
            <input type="hidden" name="caseId" value={testCase.id} />
            <button className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-100">
              <TFIcon name="clone" className="h-4 w-4" /> Clone
            </button>
          </form>
          <DeleteCaseButton caseId={testCase.id} />
        </div>
      </div>

      {/* F-05: Details | History tabs */}
      <div className="flex gap-1 border-b border-slate-200 text-sm">
        {(
          [
            ["details", "Details", ""],
            ["history", `History (rev ${testCase.rev})`, "?tab=history"],
          ] as const
        ).map(([key, label, qs]) => (
          <Link
            key={key}
            href={`/projects/${testCase.project.slug}/cases/${testCase.id}${qs}`}
            data-testid={`case-tab-${key}`}
            className={`-mb-px border-b-2 px-4 py-2 font-medium ${
              tab === key
                ? "border-indigo-600 text-indigo-700"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            {label}
          </Link>
        ))}
      </div>

      {tab === "history" && (
        <CaseHistory
          revisions={revisions}
          currentRev={testCase.rev}
          canWrite={session.role !== "VIEWER"}
          suiteNames={suiteNames}
          memberNames={Object.fromEntries(memberNames)}
        />
      )}

      {tab === "details" && (
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {testCase.description && (
            <section className="rounded-xl border border-slate-200 bg-white p-6">
              <h3 className="mb-2 text-sm font-semibold uppercase text-slate-400">
                Description
              </h3>
              <Markdown>{testCase.description}</Markdown>
            </section>
          )}
          {testCase.preconditions && (
            <section className="rounded-xl border border-slate-200 bg-white p-6">
              <h3 className="mb-2 text-sm font-semibold uppercase text-slate-400">
                Preconditions
              </h3>
              <Markdown>{testCase.preconditions}</Markdown>
            </section>
          )}
          <section className="rounded-xl border border-slate-200 bg-white p-6">
            <h3 className="mb-3 text-sm font-semibold uppercase text-slate-400">
              Steps to Reproduce
            </h3>
            {steps.length === 0 && (
              <p className="text-sm text-slate-400">No steps yet.</p>
            )}
            <ol className="space-y-3">
              {steps.map((step, i) => (
                <li key={i} className="flex gap-3 text-sm">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700">
                    {i + 1}
                  </span>
                  <div className="grid flex-1 gap-2 md:grid-cols-2">
                    <div className="min-w-0">
                      {step.fromShared && (
                        <span
                          className="mr-1.5 rounded bg-indigo-50 px-1.5 py-0.5 align-middle text-[10px] font-medium text-indigo-600"
                          title={`From shared steps: ${step.fromShared.title}`}
                          data-testid="shared-step-badge"
                        >
                          ⛓ {step.fromShared.title}
                        </span>
                      )}
                      <Markdown>{step.action}</Markdown>
                    </div>
                    <div className="flex gap-1 text-slate-500">
                      {step.expected && (
                        <>
                          <span>↳</span>
                          <Markdown className="text-slate-500">{step.expected}</Markdown>
                        </>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ol>
            {testCase.expectedResult && (
              <div className="mt-4 rounded-lg bg-green-50 p-3 text-sm">
                <span className="font-medium text-green-800">Expected Result:</span>
                <Markdown className="text-green-900">
                  {testCase.expectedResult}
                </Markdown>
              </div>
            )}
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-6">
            <h3 className="mb-3 text-sm font-semibold uppercase text-slate-400">
              Attachments
            </h3>
            <AttachmentUploader
              projectSlug={testCase.project.slug}
              entityType="CASE"
              entityId={testCase.id}
              canWrite={session.role !== "VIEWER"}
              maxMb={maxUploadMb}
              initial={attachments.map((a) => ({
                id: a.id,
                filename: a.filename,
                mimeType: a.mimeType,
                sizeBytes: a.sizeBytes,
                url: `/api/attachments/${a.id}`,
              }))}
            />
          </section>
        </div>

        <div className="space-y-6">
          <section className="rounded-xl border border-slate-200 bg-white p-6">
            <h3 className="mb-3 text-sm font-semibold uppercase text-slate-400">
              Execution History
            </h3>
            {executed.length > 0 && (
              <p className="mb-3 text-sm">
                Pass rate:{" "}
                <span className="font-bold">
                  {Math.round((passCount / executed.length) * 100)}%
                </span>{" "}
                <span className="text-slate-400">
                  ({passCount}/{executed.length} executed)
                </span>
              </p>
            )}
            <ul className="space-y-2">
              {testCase.results.map((r) => (
                <li key={r.id} className="flex items-center justify-between text-sm">
                  <Link
                    href={`/projects/${testCase.project.slug}/runs/${r.runId}`}
                    className="truncate text-slate-600 hover:text-indigo-600"
                  >
                    {r.run.name}
                  </Link>
                  <span className={`ml-2 shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${RESULT_BADGES[r.status]}`}>
                    {r.status}
                  </span>
                </li>
              ))}
              {testCase.results.length === 0 && (
                <p className="text-sm text-slate-400">
                  Never executed in a test run.
                </p>
              )}
            </ul>
          </section>

          {visibleDefs.length > 0 && (
            <section className="rounded-xl border border-slate-200 bg-white p-6" data-testid="custom-fields-panel">
              <h3 className="mb-3 text-sm font-semibold uppercase text-slate-400">
                Custom Fields
              </h3>
              <dl className="space-y-2 text-sm">
                {visibleDefs.map((d) => (
                  <div key={d.id} className="flex items-baseline justify-between gap-3">
                    <dt className="text-slate-500">
                      {d.label}
                      {!d.active && (
                        <span className="ml-1 text-xs text-slate-300">(disabled)</span>
                      )}
                    </dt>
                    <dd className="text-right font-medium">{renderCustom(d)}</dd>
                  </div>
                ))}
              </dl>
            </section>
          )}

          {parseTags(testCase.tags).length > 0 && (
            <section className="rounded-xl border border-slate-200 bg-white p-6">
              <h3 className="mb-3 text-sm font-semibold uppercase text-slate-400">
                Tags
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {parseTags(testCase.tags).map((t) => (
                  <span key={t} className="rounded bg-slate-100 px-2 py-0.5 text-xs">
                    {t}
                  </span>
                ))}
              </div>
            </section>
          )}

          {/* F-07: tracker-backed issue links. Only rendered once a tracker is
              connected (or links already exist) — otherwise the plain-URL
              section below is the whole story, exactly as before. */}
          {(hasIntegration || caseIssueLinks.length > 0) && (
            <section
              className="rounded-xl border border-slate-200 bg-white p-6"
              data-testid="case-issues-panel"
            >
              <h3 className="mb-3 text-sm font-semibold uppercase text-slate-400">
                Issues
              </h3>
              <IssuePanel
                entityType="CASE"
                entityId={testCase.id}
                links={caseIssueLinks.map((l) => ({
                  id: l.id,
                  provider: l.provider,
                  issueKey: l.issueKey,
                  issueUrl: l.issueUrl,
                  title: l.title,
                  status: l.status,
                }))}
                canWrite={session.role !== "VIEWER"}
                hasIntegration={hasIntegration}
              />
            </section>
          )}

          {testCase.linkedIssues && (
            <section className="rounded-xl border border-slate-200 bg-white p-6">
              <h3 className="mb-3 text-sm font-semibold uppercase text-slate-400">
                Linked Issues
              </h3>
              <ul className="space-y-1 text-sm">
                {testCase.linkedIssues.split(",").map((url) => (
                  <li key={url}>
                    <a
                      href={url.trim()}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="break-all text-indigo-600 hover:underline"
                    >
                      {url.trim()}
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </div>
      )}
    </div>
  );
}
