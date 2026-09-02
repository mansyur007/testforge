import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { memberScope } from "@/lib/projects";
import { loadPerms } from "@/lib/permissions";
import { ProjectTabs } from "@/components/ProjectTabs";
import { TFIcon } from "@/components/icons";
import { CoverageBar } from "@/components/TemplateCoverage";
import { listTemplates, lastAppliedByTemplate } from "@/lib/templates/library";

export const dynamic = "force-dynamic";

const CATEGORY_LABELS: Record<string, string> = {
  AUTH: "Authentication",
  ONBOARDING: "Onboarding",
  CRUD: "CRUD",
  COMMERCE: "Commerce",
  GENERAL: "General",
};

// F-47: the template gallery. `active="cases"` on the tab bar on purpose —
// applying a template is a way of creating cases, so the row should not shift
// out from under someone who arrived here from the cases toolbar.
export default async function TemplatesPage({
  params,
}: {
  params: { slug: string };
}) {
  const session = await requireSession();
  const project = await db.project.findFirst({
    where: { slug: params.slug, ...memberScope(session.userId) },
    select: { id: true, slug: true, name: true },
  });
  if (!project) notFound();

  const perms = await loadPerms(session.userId, project.id);
  const canWrite = perms.has("case.write");

  const [templates, applied] = await Promise.all([
    listTemplates(),
    lastAppliedByTemplate(project.id),
  ]);

  return (
    <div className="space-y-6">
      <ProjectTabs slug={project.slug} name={project.name} active="cases" />

      <div className="space-y-1">
        <h2 className="text-lg font-semibold">Start from a template</h2>
        <p className="max-w-2xl text-sm text-content-muted">
          Curated suites of test cases you can drop into this project — negative,
          boundary and security cases included, not just the happy path. You pick
          where they land and what to leave out.
        </p>
      </div>

      {!canWrite && (
        <p
          data-testid="templates-readonly"
          className="rounded-lg border border-hairline bg-surface-muted px-4 py-3 text-sm text-content-muted"
        >
          You have read-only access to this project, so you can browse templates
          but not apply them.
        </p>
      )}

      {templates.length === 0 ? (
        <p
          data-testid="templates-empty"
          className="rounded-lg border border-hairline px-4 py-8 text-center text-sm text-content-muted"
        >
          No templates are published yet.
        </p>
      ) : (
        <ul
          data-testid="template-gallery"
          className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
        >
          {templates.map((t) => {
            const when = applied.get(t.id);
            return (
              <li key={t.slug}>
                <Link
                  href={`/projects/${project.slug}/templates/${t.slug}`}
                  data-testid={`template-card-${t.slug}`}
                  className="flex h-full flex-col gap-3 rounded-xl border border-hairline bg-surface p-4 transition-colors duration-fast ease-tf-out hover:border-hairline-strong hover:bg-surface-raised"
                >
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="font-medium text-content-strong">{t.name}</h3>
                    <span className="shrink-0 rounded-full bg-surface-muted px-2 py-0.5 text-xs text-content-muted">
                      {CATEGORY_LABELS[t.category] ?? t.category}
                    </span>
                  </div>

                  {t.summary && (
                    <p className="flex-1 text-sm text-content-muted">{t.summary}</p>
                  )}

                  <div className="space-y-2">
                    <CoverageBar coverage={t.coverage} />
                    <p className="text-xs text-content-subtle">
                      {t.suiteCount} suites · {t.caseCount} test cases
                    </p>
                  </div>

                  {when && (
                    <p
                      data-testid={`template-applied-${t.slug}`}
                      className="inline-flex items-center gap-1.5 text-xs text-content-subtle"
                    >
                      <TFIcon name="valid" className="h-3.5 w-3.5" />
                      Applied {when.toLocaleDateString()}
                    </p>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
