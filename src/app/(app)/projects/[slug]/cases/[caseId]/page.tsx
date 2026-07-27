import Link from "next/link";
import { TFIcon, BackLink } from "@/components/icons";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import {
  caseDisplayId,
  parseTags,
  PRIORITY_BADGES,
  STATUS_BADGES,
  type TestStep,
} from "@/lib/constants";
import { loadStatusDefs } from "@/lib/result-status-defs";
import { badgeStyle, statusMeta } from "@/lib/result-statuses";
import { expandSteps, isGherkinCaseSteps, loadStepGroups } from "@/lib/steps";
import { GherkinBlock } from "@/components/GherkinBlock";
import { loadIssueLinks } from "@/lib/issues";
import { loadPrerequisites, loadDependents } from "@/lib/case-dependencies";
import { CaseDependencies } from "@/components/CaseDependencies";
import { serializeRevision } from "@/lib/case-revisions";
import { cloneCase } from "@/app/actions/cases";
import { ProjectTabs } from "@/components/ProjectTabs";
import { DeleteCaseButton } from "@/components/DeleteCaseButton";
import { AttachmentUploader } from "@/components/AttachmentUploader";
import { CaseHistory, type RevisionView } from "@/components/CaseHistory";
import { IssuePanel } from "@/components/IssuePanel";
import { Markdown } from "@/components/Markdown";
import { UnmuteButton } from "@/components/MuteControls";
import { CommentPanel } from "@/components/CommentPanel";
import { ReviewPanel } from "@/components/ReviewPanel";
import { formatDuration } from "@/lib/duration";
import { loadPerms } from "@/lib/permissions";
import { aiConfigured, orgIdForUser } from "@/lib/ai";
import { findNearDuplicates } from "@/lib/case-dedupe";
import { AiSuggestSteps } from "@/components/AiSuggestSteps";

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
  // F-14: permission-derived write access (covers custom roles).
  const perms = await loadPerms(session.userId, testCase.projectId);
  const canWrite = perms.has("case.write");

  // F-14: status colors for the recent-results badges.
  const { colorOf: statusColorOf } = statusMeta(
    await loadStatusDefs(testCase.projectId)
  );

  const projectMembers = await db.projectMember.findMany({
    where: { projectId: testCase.projectId },
    include: { user: { select: { id: true, name: true } } },
  });
  const memberNames = new Map(projectMembers.map((m) => [m.user.id, m.user.name]));
  // F-15: only members with write access can be assigned as reviewers.
  const reviewerCandidates = projectMembers
    .filter((m) => m.role !== "VIEWER")
    .map((m) => ({ id: m.user.id, name: m.user.name }));
  const renderCustom = (d: (typeof fieldDefs)[number]) => {
    const v = customValues[d.key];
    if (v === undefined || v === "" || (Array.isArray(v) && v.length === 0))
      return <span className="text-content-subtle">—</span>;
    if (d.type === "CHECKBOX") return v ? "✓ yes" : "– no";
    if (d.type === "USER") return memberNames.get(String(v)) ?? String(v);
    if (d.type === "URL")
      return (
        <a href={String(v)} target="_blank" rel="noreferrer" className="text-accent-text hover:underline">
          {String(v)}
        </a>
      );
    if (Array.isArray(v))
      return (
        <span className="flex flex-wrap gap-1">
          {v.map((x) => (
            <span key={String(x)} className="rounded bg-surface-muted px-1.5 py-0.5 text-xs">
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

  // F-32: prerequisites/dependents + candidates for the "add prerequisite"
  // picker (live cases in the project, minus self and existing prerequisites).
  const [prerequisites, dependents] = await Promise.all([
    loadPrerequisites(testCase.id),
    loadDependents(testCase.id),
  ]);
  const excludeIds = new Set([testCase.id, ...prerequisites.map((p) => p.case.id)]);
  const dependencyCandidates = (
    await db.testCase.findMany({
      where: { projectId: testCase.projectId, deletedAt: null, id: { notIn: Array.from(excludeIds) } },
      select: { id: true, seq: true, title: true },
      orderBy: { seq: "asc" },
    })
  ).map((c) => ({ id: c.id, displayId: caseDisplayId(testCase.project.slug, c.seq), title: c.title }));

  // F-04: shared references render expanded, tagged with their group title.
  const rawSteps: TestStep[] = JSON.parse(testCase.stepsJson || "[]");
  const isGherkin = isGherkinCaseSteps(rawSteps); // F-27
  const steps = expandSteps(rawSteps, await loadStepGroups(testCase.projectId));
  const displayId = caseDisplayId(testCase.project.slug, testCase.seq);

  // F-29: near-duplicate detection (local trigram similarity — no AI key
  // needed) and AI edge-case suggestions (only when a key is configured).
  const siblingCases = await db.testCase.findMany({
    where: { projectId: testCase.projectId, deletedAt: null, id: { not: testCase.id } },
    select: { id: true, seq: true, title: true },
  });
  const nearDuplicates = findNearDuplicates(
    testCase.title,
    siblingCases.map((c) => ({
      id: c.id,
      displayId: caseDisplayId(testCase.project.slug, c.seq),
      title: c.title,
    }))
  );
  const aiOrgId = await orgIdForUser(session.userId);
  const aiOn = canWrite && !!aiOrgId && (await aiConfigured(aiOrgId));
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

      <BackLink href={backHref} testId="case-back">Back to test cases</BackLink>

      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-mono text-sm text-content-subtle">{displayId}</p>
          <h2 className="text-xl font-bold">{testCase.title}</h2>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
            <span className={`rounded-full px-2 py-0.5 font-medium ${PRIORITY_BADGES[testCase.priority]}`}>
              {testCase.priority}
            </span>
            <span className="rounded-full bg-surface-muted px-2 py-0.5 text-content">
              {testCase.type}
            </span>
            <span
              className={`rounded-full px-2 py-0.5 font-medium ${STATUS_BADGES[testCase.status] ?? "bg-surface-muted text-content"}`}
              data-testid="case-status-badge"
            >
              {testCase.status.replace(/_/g, " ")}
            </span>
            <span className="rounded-full bg-surface-muted px-2 py-0.5 text-content">
              {testCase.automationStatus.replace(/_/g, " ")}
            </span>
            {testCase.estimateSeconds != null && (
              <span
                className="rounded-full bg-surface-muted px-2 py-0.5 text-content"
                data-testid="case-estimate-badge"
              >
                ⏱ {formatDuration(testCase.estimateSeconds)}
              </span>
            )}
            {testCase.suite && (
              <span className="flex items-center gap-1 text-content-subtle"><TFIcon name="nav-tree" className="h-4 w-4" /> {testCase.suite.name}</span>
            )}
            {testCase.mutedAt && (
              <span
                className="flex items-center gap-1 rounded-full bg-surface-muted px-2 py-0.5 font-medium text-content"
                data-testid="case-muted-banner"
                title={testCase.mutedReason ?? undefined}
              >
                🔇 Muted{testCase.mutedReason ? `: ${testCase.mutedReason}` : ""}
                <UnmuteButton caseId={testCase.id} />
              </span>
            )}
          </div>
        </div>
        <div className="flex shrink-0 gap-2">
          {/* F-35: one-case printable document. */}
          <Link
            href={`/print/projects/${testCase.project.slug}/cases?case=${testCase.id}`}
            target="_blank"
            rel="noopener"
            data-testid="print-case-link"
            className="inline-flex items-center gap-1.5 rounded-lg border border-hairline-strong px-3 py-1.5 text-sm hover:bg-surface-muted"
          >
            <TFIcon name="print" className="h-4 w-4" /> Print view
          </Link>
          <Link
            href={`/projects/${testCase.project.slug}/cases/${testCase.id}/edit`}
            className="inline-flex items-center gap-1.5 rounded-lg border border-hairline-strong px-3 py-1.5 text-sm hover:bg-surface-muted"
          >
            <TFIcon name="edit" className="h-4 w-4" /> Edit
          </Link>
          <form action={cloneCase}>
            <input type="hidden" name="caseId" value={testCase.id} />
            <button className="inline-flex items-center gap-1.5 rounded-lg border border-hairline-strong px-3 py-1.5 text-sm hover:bg-surface-muted">
              <TFIcon name="clone" className="h-4 w-4" /> Clone
            </button>
          </form>
          <DeleteCaseButton caseId={testCase.id} />
        </div>
      </div>

      {/* F-05: Details | History tabs */}
      <div className="flex gap-1 border-b border-hairline text-sm">
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
                ? "border-accent text-accent-soft-fg"
                : "border-transparent text-content-muted hover:text-content"
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
          canWrite={canWrite}
          suiteNames={suiteNames}
          memberNames={Object.fromEntries(memberNames)}
        />
      )}

      {tab === "details" && (
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {testCase.description && (
            <section className="rounded-xl border border-hairline bg-surface p-6">
              <h3 className="mb-2 text-sm font-semibold uppercase text-content-subtle">
                Description
              </h3>
              <Markdown>{testCase.description}</Markdown>
            </section>
          )}
          {testCase.preconditions && (
            <section className="rounded-xl border border-hairline bg-surface p-6">
              <h3 className="mb-2 text-sm font-semibold uppercase text-content-subtle">
                Preconditions
              </h3>
              <Markdown>{testCase.preconditions}</Markdown>
            </section>
          )}
          <section className="rounded-xl border border-hairline bg-surface p-6">
            <h3 className="mb-3 text-sm font-semibold uppercase text-content-subtle">
              {isGherkin ? "Scenario (Gherkin)" : "Steps to Reproduce"}
            </h3>
            {isGherkin ? (
              <GherkinBlock text={rawSteps[0].gherkin} />
            ) : (
              <>
                {steps.length === 0 && (
                  <p className="text-sm text-content-subtle">No steps yet.</p>
                )}
                <ol className="space-y-3">
                  {steps.map((step, i) => (
                    <li key={i} className="flex gap-3 text-sm">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent-soft text-xs font-bold text-accent-soft-fg">
                        {i + 1}
                      </span>
                      <div className="grid flex-1 gap-2 md:grid-cols-2">
                        <div className="min-w-0">
                          {step.fromShared && (
                            <span
                              className="mr-1.5 rounded bg-accent-soft px-1.5 py-0.5 align-middle text-[10px] font-medium text-accent-text"
                              title={`From shared steps: ${step.fromShared.title}`}
                              data-testid="shared-step-badge"
                            >
                              ⛓ {step.fromShared.title}
                            </span>
                          )}
                          <Markdown>{step.action}</Markdown>
                        </div>
                        <div className="flex gap-1 text-content-muted">
                          {step.expected && (
                            <>
                              <span>↳</span>
                              <Markdown className="text-content-muted">{step.expected}</Markdown>
                            </>
                          )}
                        </div>
                      </div>
                    </li>
                  ))}
                </ol>
              </>
            )}
            {testCase.expectedResult && (
              <div className="mt-4 rounded-lg bg-success-soft p-3 text-sm">
                <span className="font-medium text-success-soft-fg">Expected Result:</span>
                <Markdown className="text-success-soft-fg">
                  {testCase.expectedResult}
                </Markdown>
              </div>
            )}
          </section>

          <section className="rounded-xl border border-hairline bg-surface p-6">
            <h3 className="mb-3 text-sm font-semibold uppercase text-content-subtle">
              Attachments
            </h3>
            <AttachmentUploader
              projectSlug={testCase.project.slug}
              entityType="CASE"
              entityId={testCase.id}
              canWrite={canWrite}
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
          <section className="rounded-xl border border-hairline bg-surface p-6">
            <h3 className="mb-3 text-sm font-semibold uppercase text-content-subtle">
              Execution History
            </h3>
            {executed.length > 0 && (
              <p className="mb-3 text-sm">
                Pass rate:{" "}
                <span className="font-bold">
                  {Math.round((passCount / executed.length) * 100)}%
                </span>{" "}
                <span className="text-content-subtle">
                  ({passCount}/{executed.length} executed)
                </span>
              </p>
            )}
            <ul className="space-y-2">
              {testCase.results.map((r) => (
                <li key={r.id} className="flex items-center justify-between text-sm">
                  <Link
                    href={`/projects/${testCase.project.slug}/runs/${r.runId}`}
                    className="truncate text-content hover:text-accent-text"
                  >
                    {r.run.name}
                  </Link>
                  <span
                    className="ml-2 shrink-0 rounded-full px-2 py-0.5 text-xs font-medium"
                    style={badgeStyle(statusColorOf(r.status))}
                  >
                    {r.status.replace(/_/g, " ")}
                  </span>
                </li>
              ))}
              {testCase.results.length === 0 && (
                <p className="text-sm text-content-subtle">
                  Never executed in a test run.
                </p>
              )}
            </ul>
          </section>

          {visibleDefs.length > 0 && (
            <section className="rounded-xl border border-hairline bg-surface p-6" data-testid="custom-fields-panel">
              <h3 className="mb-3 text-sm font-semibold uppercase text-content-subtle">
                Custom Fields
              </h3>
              <dl className="space-y-2 text-sm">
                {visibleDefs.map((d) => (
                  <div key={d.id} className="flex items-baseline justify-between gap-3">
                    <dt className="text-content-muted">
                      {d.label}
                      {!d.active && (
                        <span className="ml-1 text-xs text-content-subtle">(disabled)</span>
                      )}
                    </dt>
                    <dd className="text-right font-medium">{renderCustom(d)}</dd>
                  </div>
                ))}
              </dl>
            </section>
          )}

          {parseTags(testCase.tags).length > 0 && (
            <section className="rounded-xl border border-hairline bg-surface p-6">
              <h3 className="mb-3 text-sm font-semibold uppercase text-content-subtle">
                Tags
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {parseTags(testCase.tags).map((t) => (
                  <span key={t} className="rounded bg-surface-muted px-2 py-0.5 text-xs">
                    {t}
                  </span>
                ))}
              </div>
            </section>
          )}

          {/* F-29: possible duplicates (local trigram match — no AI key). */}
          {nearDuplicates.length > 0 && (
            <section
              className="rounded-xl border border-warning-border bg-warning-soft p-6"
              data-testid="near-duplicates-panel"
            >
              <h3 className="mb-3 text-sm font-semibold uppercase text-warning-soft-fg">
                Possible duplicates
              </h3>
              <ul className="space-y-2 text-sm">
                {nearDuplicates.map((d) => (
                  <li key={d.id} className="flex items-center justify-between gap-2">
                    <Link
                      href={`/projects/${testCase.project.slug}/cases/${d.id}`}
                      className="min-w-0 truncate text-warning-soft-fg hover:underline"
                    >
                      <span className="font-mono text-xs text-warning-soft-fg">{d.displayId}</span>{" "}
                      {d.title}
                    </Link>
                    <span className="shrink-0 text-xs text-warning-soft-fg">
                      {Math.round(d.score * 100)}% similar
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* F-29: AI edge-case suggestions (only when a key is configured). */}
          {aiOn && <AiSuggestSteps caseId={testCase.id} />}

          <section className="rounded-xl border border-hairline bg-surface p-6" data-testid="case-dependencies-panel">
            <h3 className="mb-3 text-sm font-semibold uppercase text-content-subtle">
              Dependencies
            </h3>
            <CaseDependencies
              projectSlug={testCase.project.slug}
              caseId={testCase.id}
              prerequisites={prerequisites.map((p) => ({
                linkId: p.linkId,
                case: {
                  id: p.case.id,
                  displayId: caseDisplayId(testCase.project.slug, p.case.seq),
                  title: p.case.title,
                },
              }))}
              dependents={dependents.map((d) => ({
                linkId: d.linkId,
                case: {
                  id: d.case.id,
                  displayId: caseDisplayId(testCase.project.slug, d.case.seq),
                  title: d.case.title,
                },
              }))}
              candidates={dependencyCandidates}
              canWrite={canWrite}
            />
          </section>

          {/* F-07: tracker-backed issue links. Only rendered once a tracker is
              connected (or links already exist) — otherwise the plain-URL
              section below is the whole story, exactly as before. */}
          {(hasIntegration || caseIssueLinks.length > 0) && (
            <section
              className="rounded-xl border border-hairline bg-surface p-6"
              data-testid="case-issues-panel"
            >
              <h3 className="mb-3 text-sm font-semibold uppercase text-content-subtle">
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
                canWrite={canWrite}
                hasIntegration={hasIntegration}
              />
            </section>
          )}

          {testCase.linkedIssues && (
            <section className="rounded-xl border border-hairline bg-surface p-6">
              <h3 className="mb-3 text-sm font-semibold uppercase text-content-subtle">
                Linked Issues
              </h3>
              <ul className="space-y-1 text-sm">
                {testCase.linkedIssues.split(",").map((url) => (
                  <li key={url}>
                    <a
                      href={url.trim()}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="break-all text-accent-text hover:underline"
                    >
                      {url.trim()}
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* F-15: review workflow — request review, approve, request changes. */}
          <section className="rounded-xl border border-hairline bg-surface p-6">
            <h3 className="mb-3 text-sm font-semibold uppercase text-content-subtle">
              Review
            </h3>
            <ReviewPanel
              caseId={testCase.id}
              status={testCase.status}
              canWrite={canWrite}
              currentUserId={session.userId}
              reviewerId={testCase.reviewerId}
              reviewerName={
                testCase.reviewerId ? memberNames.get(testCase.reviewerId) ?? null : null
              }
              reviewedAt={testCase.reviewedAt ? testCase.reviewedAt.toISOString() : null}
              reviewNote={testCase.reviewNote}
              members={reviewerCandidates}
            />
          </section>

          {/* F-16: discussion thread on this case. */}
          <section className="rounded-xl border border-hairline bg-surface p-6">
            <CommentPanel
              entityType="CASE"
              entityId={testCase.id}
              projectSlug={testCase.project.slug}
            />
          </section>
        </div>
      </div>
      )}
    </div>
  );
}
