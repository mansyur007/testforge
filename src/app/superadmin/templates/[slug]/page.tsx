import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { NOINDEX } from "@/lib/seo";
import { Logo } from "@/components/icons";
import { requireSuperadmin } from "@/lib/superadmin";
import { TemplateJsonEditor } from "@/components/TemplateJsonEditor";
import {
  deleteTemplate,
  setTemplatePublished,
} from "@/app/actions/superadmin-templates";
import { CoverageLegend } from "@/components/TemplateCoverage";
import { coverageBreakdown, readStoredContent } from "@/lib/templates/schema";

export const metadata: Metadata = {
  title: "Edit Case Template — TestForge Instance Console",
  robots: NOINDEX,
};

export const dynamic = "force-dynamic";

export default async function EditTemplatePage({
  params,
}: {
  params: { slug: string };
}) {
  await requireSuperadmin();

  const t = await db.caseTemplate.findUnique({
    where: { slug: params.slug },
    include: { _count: { select: { applications: true } } },
  });
  if (!t) notFound();

  const coverage = coverageBreakdown(readStoredContent(t.contentJson));

  return (
    <main className="min-h-screen bg-canvas px-4 py-8">
      <div className="mx-auto max-w-4xl space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Logo />
            <div>
              <h1 className="text-xl font-bold text-content-strong">{t.name}</h1>
              <p className="text-sm text-content-muted">
                <code>{t.slug}</code> · v{t.version} · {t.suiteCount} suites ·{" "}
                {t.caseCount} cases · applied {t._count.applications}{" "}
                {t._count.applications === 1 ? "time" : "times"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <form action={setTemplatePublished}>
              <input type="hidden" name="slug" value={t.slug} />
              <input type="hidden" name="published" value={String(!t.published)} />
              <button
                type="submit"
                data-testid="tpl-admin-publish"
                className="rounded-lg border border-hairline-strong px-3 py-1.5 text-sm font-medium text-content hover:bg-surface"
              >
                {t.published ? "Unpublish" : "Publish"}
              </button>
            </form>
            {!t.builtIn && (
              <form action={deleteTemplate}>
                <input type="hidden" name="slug" value={t.slug} />
                <button
                  type="submit"
                  data-testid="tpl-admin-delete"
                  className="rounded-lg border border-danger-border px-3 py-1.5 text-sm font-medium text-danger hover:bg-danger-soft"
                >
                  Delete
                </button>
              </form>
            )}
          </div>
        </header>

        <Link
          href="/superadmin/templates"
          className="inline-block text-sm text-content-muted hover:text-content"
        >
          ← All templates
        </Link>

        <div className="space-y-2 rounded-xl border border-hairline bg-surface px-4 py-3">
          <p className="text-xs uppercase tracking-wide text-content-muted">
            Coverage
          </p>
          <CoverageLegend coverage={coverage} />
        </div>

        <TemplateJsonEditor
          mode="edit"
          initial={{
            slug: t.slug,
            name: t.name,
            summary: t.summary ?? "",
            description: t.description ?? "",
            category: t.category,
            contentJson: JSON.stringify(JSON.parse(t.contentJson), null, 2),
            builtIn: t.builtIn,
          }}
        />
      </div>
    </main>
  );
}
