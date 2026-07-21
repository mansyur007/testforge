import Link from "next/link";
import { AnvilMark } from "@/components/icons";
import { requirePublicProject } from "@/lib/public-share";

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

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-3 px-4 py-4">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-indigo-600">
            <AnvilMark className="h-5 w-5" />
          </span>
          <Link
            href={`/public/${project.slug}`}
            data-testid="public-project-name"
            className="min-w-0 truncate font-display text-lg font-bold tracking-tight text-slate-900"
          >
            {project.name}
          </Link>
          <span
            className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-500"
            data-testid="public-readonly-chip"
          >
            Public · read-only
          </span>
          {project.share.showCases && (
            <nav className="ml-auto flex items-center gap-1 text-sm">
              <Link
                href={`/public/${project.slug}`}
                className="rounded-lg px-3 py-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
              >
                Overview
              </Link>
              <Link
                href={`/public/${project.slug}/cases`}
                data-testid="public-cases-link"
                className="rounded-lg px-3 py-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
              >
                Test Cases
              </Link>
            </nav>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-6 px-4 py-8">{children}</main>

      <footer className="border-t border-slate-200 py-8 text-center text-xs text-slate-400">
        Built with{" "}
        <Link
          href="/login"
          data-testid="public-cta-link"
          className="font-medium text-indigo-600 hover:underline"
        >
          TestForge
        </Link>
      </footer>
    </div>
  );
}
