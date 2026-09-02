import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { NOINDEX } from "@/lib/seo";
import { Logo } from "@/components/icons";
import { requireSuperadmin } from "@/lib/superadmin";
import { superadminLogout } from "@/app/actions/superadmin";
import { setTemplatePublished } from "@/app/actions/superadmin-templates";
import { ensureBuiltInTemplates } from "@/lib/templates/sync";

export const metadata: Metadata = {
  title: "Case Templates — TestForge Instance Console",
  robots: NOINDEX,
};

export const dynamic = "force-dynamic";

function fmtDate(d: Date) {
  return d.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// F-47: the template library, as the instance operator sees it — drafts
// included, which is the one thing this view has that the project gallery
// does not.
export default async function SuperadminTemplatesPage() {
  const session = await requireSuperadmin();
  // Same lazy sync the gallery runs, so an operator opening the console on a
  // fresh instance sees the built-in packs rather than an empty table.
  await ensureBuiltInTemplates();

  const templates = await db.caseTemplate.findMany({
    orderBy: [{ order: "asc" }, { name: "asc" }],
    include: { _count: { select: { applications: true } } },
  });

  const published = templates.filter((t) => t.published).length;
  const totalCases = templates.reduce((n, t) => n + t.caseCount, 0);
  const applications = templates.reduce((n, t) => n + t._count.applications, 0);

  return (
    <main className="min-h-screen bg-canvas px-4 py-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Logo />
            <div>
              <h1 className="text-xl font-bold text-content-strong">
                Case templates
              </h1>
              <p className="text-sm text-content-muted">
                The starter packs every project on this instance can apply.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-content-subtle">
              signed in as{" "}
              <code className="rounded bg-surface-muted px-1.5 py-0.5">
                {session.username}
              </code>
            </span>
            <Link
              href="/superadmin"
              className="rounded-lg border border-hairline-strong px-3 py-1.5 text-sm font-medium text-content hover:bg-surface"
            >
              Users
            </Link>
            <Link
              href="/superadmin/templates/new"
              data-testid="tpl-admin-new"
              className="rounded-lg bg-accent px-3 py-1.5 text-sm font-medium text-accent-fg hover:bg-accent-hover"
            >
              New from JSON
            </Link>
            <form action={superadminLogout}>
              <button
                type="submit"
                className="rounded-lg border border-hairline-strong px-3 py-1.5 text-sm font-medium text-content hover:bg-surface"
              >
                Sign out
              </button>
            </form>
          </div>
        </header>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="Templates" value={templates.length} />
          <Stat label="Published" value={published} />
          <Stat label="Cases in library" value={totalCases} />
          <Stat label="Times applied" value={applications} />
        </div>

        <div className="overflow-x-auto rounded-xl border border-hairline bg-surface">
          <table className="w-full min-w-[52rem] text-left text-sm">
            <thead className="border-b border-hairline text-xs uppercase tracking-wide text-content-muted">
              <tr>
                <th className="px-5 py-3">Template</th>
                <th className="px-5 py-3">Category</th>
                <th className="px-5 py-3">Size</th>
                <th className="px-5 py-3">Version</th>
                <th className="px-5 py-3">Applied</th>
                <th className="px-5 py-3">Updated</th>
                <th className="px-5 py-3">Status</th>
              </tr>
            </thead>
            <tbody data-testid="tpl-admin-table">
              {templates.map((t) => (
                <tr key={t.id} className="border-b border-hairline-subtle last:border-0">
                  <td className="px-5 py-3">
                    <Link
                      href={`/superadmin/templates/${t.slug}`}
                      data-testid={`tpl-admin-row-${t.slug}`}
                      className="font-medium text-content-strong hover:text-accent-text"
                    >
                      {t.name}
                    </Link>
                    <div className="text-xs text-content-subtle">
                      <code>{t.slug}</code>
                      {t.builtIn && " · built-in"}
                    </div>
                  </td>
                  <td className="px-5 py-3 text-content-muted">{t.category}</td>
                  <td className="px-5 py-3 text-content-muted">
                    {t.suiteCount} suites · {t.caseCount} cases
                  </td>
                  <td className="px-5 py-3 text-content-muted">v{t.version}</td>
                  <td className="px-5 py-3 text-content-muted">
                    {t._count.applications}
                  </td>
                  <td className="px-5 py-3 text-content-muted">
                    {fmtDate(t.updatedAt)}
                  </td>
                  <td className="px-5 py-3">
                    <form action={setTemplatePublished}>
                      <input type="hidden" name="slug" value={t.slug} />
                      <input
                        type="hidden"
                        name="published"
                        value={String(!t.published)}
                      />
                      <button
                        type="submit"
                        data-testid={`tpl-admin-toggle-${t.slug}`}
                        className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                          t.published
                            ? "bg-success-soft text-success-soft-fg"
                            : "bg-surface-muted text-content-muted"
                        }`}
                      >
                        {t.published ? "Published" : "Draft"}
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
              {templates.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-5 py-10 text-center text-content-muted"
                  >
                    No templates yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <p className="text-xs text-content-subtle">
          Clicking the status cell publishes or unpublishes. Unpublishing a
          built-in survives deploys; deleting one does not, which is why
          built-ins cannot be deleted.
        </p>
      </div>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-hairline bg-surface px-5 py-4">
      <div className="text-2xl font-bold text-content-strong">{value}</div>
      <div className="text-xs uppercase tracking-wide text-content-muted">
        {label}
      </div>
    </div>
  );
}
