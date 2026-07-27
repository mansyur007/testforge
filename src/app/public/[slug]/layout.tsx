import Link from "next/link";
import { AnvilMark } from "@/components/icons";
import { requirePublicProject } from "@/lib/public-share";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";

// F-38: public "portfolio mode" chrome. Deliberately NOT the (app) layout —
// that one calls requireSession() and renders permission-aware navigation.
// The only link into the app anywhere under /public is the footer CTA.
export default async function PublicLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { slug: string };
}) {
  const project = await requirePublicProject(params.slug);

  // One entry per section the owner enabled. Overview is implicit, so with
  // every section off the nav disappears entirely rather than rendering a lone
  // link back to the page you are already on.
  const tabs = [
    {
      on: project.share.showCases,
      href: `/public/${project.slug}/cases`,
      label: "Test Cases",
      testid: "public-cases-link",
    },
    {
      on: project.share.showRuns,
      href: `/public/${project.slug}/runs`,
      label: "Test Runs",
      testid: "public-runs-link",
    },
    {
      on: project.share.showReports,
      href: `/public/${project.slug}/reports`,
      label: "Reports",
      testid: "public-reports-link",
    },
  ].filter((t) => t.on);

  return (
    <div className="min-h-screen bg-canvas">
      <header className="border-b border-hairline bg-surface">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-3 px-4 py-4">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-accent">
            <AnvilMark className="h-5 w-5" />
          </span>
          <Link
            href={`/public/${project.slug}`}
            data-testid="public-project-name"
            className="min-w-0 truncate font-display text-lg font-bold tracking-tight text-content-strong"
          >
            {project.name}
          </Link>
          <span
            className="rounded-full bg-surface-muted px-2.5 py-1 text-xs font-medium text-content-muted"
            data-testid="public-readonly-chip"
          >
            Public · read-only
          </span>
          {tabs.length > 0 && (
            <nav className="ml-auto flex items-center gap-1 text-sm">
              <Link
                href={`/public/${project.slug}`}
                className="rounded-lg px-3 py-1.5 text-content-muted hover:bg-surface-muted hover:text-content-strong"
              >
                Overview
              </Link>
              {tabs.map((t) => (
                <Link
                  key={t.href}
                  href={t.href}
                  data-testid={t.testid}
                  className="rounded-lg px-3 py-1.5 text-content-muted hover:bg-surface-muted hover:text-content-strong"
                >
                  {t.label}
                </Link>
              ))}
            </nav>
          )}
          <div className={tabs.length === 0 ? "ml-auto" : ""}>
            <ThemeSwitcher size="sm" tone="light" />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-6 px-4 py-8">{children}</main>

      <footer className="border-t border-hairline py-8 text-center text-xs text-content-subtle">
        Built with{" "}
        <Link
          href="/login"
          data-testid="public-cta-link"
          className="font-medium text-accent-text hover:underline"
        >
          TestForge
        </Link>
      </footer>
    </div>
  );
}
