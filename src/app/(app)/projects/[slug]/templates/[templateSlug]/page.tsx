import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { memberScope } from "@/lib/projects";
import { loadPerms } from "@/lib/permissions";
import { ProjectTabs } from "@/components/ProjectTabs";
import { Markdown } from "@/components/Markdown";
import { TFIcon } from "@/components/icons";
import { CoverageLegend } from "@/components/TemplateCoverage";
import { TemplateApplyForm } from "@/components/TemplateApplyForm";
import { getTemplate } from "@/lib/templates/library";

export const dynamic = "force-dynamic";

// F-47: preview one template and apply it. The selection tree and the apply
// panel live in the client component; everything read-only is rendered here.
export default async function TemplateDetailPage({
  params,
}: {
  params: { slug: string; templateSlug: string };
}) {
  const session = await requireSession();
  const project = await db.project.findFirst({
    where: { slug: params.slug, ...memberScope(session.userId) },
    select: { id: true, slug: true, name: true },
  });
  if (!project) notFound();

  const template = await getTemplate(params.templateSlug);
  if (!template) notFound();

  const perms = await loadPerms(session.userId, project.id);
  const canWrite = perms.has("case.write");

  const [suites, lastApplied] = await Promise.all([
    db.testSuite.findMany({
      where: { projectId: project.id },
      select: { id: true, name: true, parentId: true },
      orderBy: { order: "asc" },
    }),
    db.templateApplication.findFirst({
      where: { projectId: project.id, templateId: template.id },
      orderBy: { appliedAt: "desc" },
      select: { appliedAt: true, caseCount: true },
    }),
  ]);

  return (
    <div className="space-y-6">
      <ProjectTabs slug={project.slug} name={project.name} active="cases" />

      <Link
        href={`/projects/${project.slug}/templates`}
        data-testid="tpl-back"
        className="inline-flex items-center gap-1.5 text-sm text-content-muted hover:text-content"
      >
        <TFIcon name="chevron-left" className="h-4 w-4" />
        All templates
      </Link>

      <div className="space-y-3">
        <div className="flex flex-wrap items-baseline gap-3">
          <h2 className="text-lg font-semibold">{template.name}</h2>
          <span className="text-sm text-content-subtle">
            {template.suiteCount} suites · {template.caseCount} test cases
          </span>
        </div>
        <CoverageLegend coverage={template.coverage} />
      </div>

      {lastApplied && (
        <p
          data-testid="tpl-already-applied"
          className="rounded-lg border border-info-border bg-info-soft px-4 py-3 text-sm text-info-soft-fg"
        >
          You applied this template to {project.name} on{" "}
          {lastApplied.appliedAt.toLocaleDateString()} ({lastApplied.caseCount}{" "}
          test cases). Applying it again adds another copy.
        </p>
      )}

      {template.description && (
        <div className="max-w-3xl rounded-xl border border-hairline bg-surface p-4">
          <Markdown>{template.description}</Markdown>
        </div>
      )}

      <TemplateApplyForm
        projectSlug={project.slug}
        templateSlug={template.slug}
        content={template.content}
        suites={suites}
        existingSuiteNames={suites.map((s) => s.name)}
        canWrite={canWrite}
      />
    </div>
  );
}
