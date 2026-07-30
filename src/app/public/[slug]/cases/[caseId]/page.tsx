import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import {
  caseDisplayId,
  parseTags,
  PRIORITY_BADGES,
  STATUS_BADGES,
  type TestStep,
} from "@/lib/constants";
import { expandSteps, isGherkinCaseSteps, loadStepGroups } from "@/lib/steps";
import { GherkinBlock } from "@/components/GherkinBlock";
import { Markdown } from "@/components/Markdown";
import {
  publicMetadata,
  requirePublicProject,
  requireSection,
  type PublicProject,
} from "@/lib/public-share";

// F-38: public case detail. Read-only fields only — no comments, attachments,
// custom fields, run results, revisions or assignees (see the plan's
// "never exposed" list). The case is always re-scoped to the shared project so
// a case id from another project 404s instead of leaking across the boundary.
export const revalidate = 60;

async function loadCase(project: PublicProject, caseId: string) {
  return db.testCase.findFirst({
    where: { id: caseId, projectId: project.id, deletedAt: null },
    select: {
      id: true,
      seq: true,
      title: true,
      description: true,
      preconditions: true,
      stepsJson: true,
      expectedResult: true,
      priority: true,
      type: true,
      status: true,
      automationStatus: true,
      tags: true,
      suiteId: true,
      suite: { select: { name: true } },
    },
  });
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string; caseId: string };
}): Promise<Metadata> {
  const project = await requirePublicProject(params.slug);
  requireSection(project, "cases");
  const testCase = await loadCase(project, params.caseId);
  if (!testCase) notFound();
  return publicMetadata(project, {
    title: `${caseDisplayId(project.slug, testCase.seq)} ${testCase.title}`,
    description:
      testCase.description ||
      `Test case ${caseDisplayId(project.slug, testCase.seq)} in ${project.name}.`,
    path: `/cases/${params.caseId}`,
  });
}

export default async function PublicCaseDetailPage({
  params,
}: {
  params: { slug: string; caseId: string };
}) {
  const project = await requirePublicProject(params.slug);
  requireSection(project, "cases");
  const testCase = await loadCase(project, params.caseId);
  if (!testCase) notFound();

  const rawSteps: TestStep[] = JSON.parse(testCase.stepsJson || "[]");
  const isGherkin = isGherkinCaseSteps(rawSteps); // F-27
  const steps = expandSteps(rawSteps, await loadStepGroups(project.id));
  const displayId = caseDisplayId(project.slug, testCase.seq);
  const tags = parseTags(testCase.tags);
  const backHref = `/public/${project.slug}/cases${
    testCase.suiteId ? `?suite=${testCase.suiteId}` : ""
  }`;

  return (
    <>
      <Link
        href={backHref}
        data-testid="public-case-back"
        className="inline-flex items-center gap-1.5 text-sm text-content-muted hover:text-content-strong"
      >
        ← Back to test cases
      </Link>

      <header>
        <p className="font-mono text-sm text-content-subtle" data-testid="public-case-id">
          {displayId}
        </p>
        <h1 className="font-display text-xl font-bold" data-testid="public-case-title">
          {testCase.title}
        </h1>
        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
          <span
            className={`rounded-full px-2 py-0.5 font-medium ${PRIORITY_BADGES[testCase.priority] ?? "bg-surface-muted text-content"}`}
          >
            {testCase.priority}
          </span>
          <span className="rounded-full bg-surface-muted px-2 py-0.5 text-content">
            {testCase.type}
          </span>
          <span
            className={`rounded-full px-2 py-0.5 font-medium ${STATUS_BADGES[testCase.status] ?? "bg-surface-muted text-content"}`}
          >
            {testCase.status.replace(/_/g, " ")}
          </span>
          <span className="rounded-full bg-surface-muted px-2 py-0.5 text-content">
            {testCase.automationStatus.replace(/_/g, " ")}
          </span>
          {testCase.suite && (
            <span className="text-content-subtle">{testCase.suite.name}</span>
          )}
        </div>
        {tags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1" data-testid="public-case-tags">
            {tags.map((t) => (
              <span
                key={t}
                className="rounded bg-surface-muted px-1.5 py-0.5 text-xs text-content-muted"
              >
                {t}
              </span>
            ))}
          </div>
        )}
      </header>

      {testCase.description && (
        <section className="rounded-xl border border-hairline bg-surface p-6">
          <h2 className="mb-2 text-sm font-semibold uppercase text-content-subtle">
            Description
          </h2>
          <Markdown>{testCase.description}</Markdown>
        </section>
      )}

      {testCase.preconditions && (
        <section className="rounded-xl border border-hairline bg-surface p-6">
          <h2 className="mb-2 text-sm font-semibold uppercase text-content-subtle">
            Preconditions
          </h2>
          <Markdown>{testCase.preconditions}</Markdown>
        </section>
      )}

      <section
        className="rounded-xl border border-hairline bg-surface p-6"
        data-testid="public-case-steps"
      >
        <h2 className="mb-3 text-sm font-semibold uppercase text-content-subtle">
          {isGherkin ? "Scenario (Gherkin)" : "Steps"}
        </h2>
        {isGherkin ? (
          <GherkinBlock text={rawSteps[0].gherkin} />
        ) : steps.length === 0 ? (
          <p className="text-sm text-content-subtle">No steps yet.</p>
        ) : (
          <ol className="space-y-3">
            {steps.map((step, i) => (
              <li key={i} className="flex gap-3 text-sm">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent-soft text-xs font-bold text-accent-soft-fg">
                  {i + 1}
                </span>
                <div className="grid flex-1 gap-2 md:grid-cols-2">
                  <div className="min-w-0">
                    <Markdown>{step.action}</Markdown>
                  </div>
                  <div className="flex gap-1 text-content-muted">
                    {step.expected && (
                      <>
                        <span>↳</span>
                        <Markdown className="text-content-muted">
                          {step.expected}
                        </Markdown>
                      </>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ol>
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
    </>
  );
}
