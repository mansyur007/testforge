import Link from "next/link";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import type { Session } from "@/lib/auth";
import { memberScope } from "@/lib/projects";
import { Logo, TFIcon } from "@/components/icons";
import { LogoutButton } from "@/components/LogoutButton";
import { SidebarProjects } from "@/components/SidebarProjects";
import { CommandPalette } from "@/components/CommandPalette";
import { AppShell } from "@/components/AppShell";
import { BetaChip } from "@/components/BetaChip";
import { AcademyCoach } from "@/components/AcademyCoach";
import { AcademySync } from "@/components/AcademySync";
import { NOT_SANDBOX, findSandbox } from "@/lib/academy/sandbox";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";
import { loadMyWorkCounts } from "@/lib/my-work";
// The selection, not the dictionary — this shell needs to know which language
// the reader is in, and none of the landing/auth copy. See src/lib/lang.ts.
import { resolveLang, LANG_COOKIE } from "@/lib/lang";
import { academyPath } from "@/lib/academy/chrome";
import { DEFAULT_APP_SETTINGS_HREF } from "@/lib/app-settings-nav";

// A-09: the sidebar+AppShell wiring that used to live only in
// src/app/(app)/layout.tsx, pulled out so any signed-in page can render the
// exact same shell — first reuse is /academy and /docs/help (docs/
// QA-ACADEMY.md A-09), which are public routes and so can't sit inside the
// (app) route group (that group's layout calls requireSession() and blocks
// anonymous visitors before any page in it can render). A caller passes a
// session it already has — this component never redirects on its own.
export async function AuthedAppShell({
  session,
  children,
}: {
  session: Session;
  children: React.ReactNode;
}) {
  // Active projects listed inline under the Projects nav item so any project is
  // one click away from anywhere — no Projects-list detour.
  const projects = await db.project.findMany({
    where: { ...memberScope(session.userId), status: "ACTIVE", ...NOT_SANDBOX },
    select: { id: true, name: true, slug: true },
    orderBy: { createdAt: "desc" },
  });

  // A-04: the sandbox hangs under Academy instead, so the project list stays a
  // list of the user's work. Null until they open their first hands-on lesson.
  const sandbox = await findSandbox(session.userId);

  // F-31: cross-project count for the "My Work" badge.
  const myWorkCounts = await loadMyWorkCounts(session.userId);
  const myWorkTotal = myWorkCounts.results + myWorkCounts.cases + myWorkCounts.reviews;

  const lang = resolveLang(cookies().get(LANG_COOKIE)?.value);
  const academyHref = academyPath(lang);

  const nav = [
    { href: "/dashboard", label: "Dashboard", icon: "dashboard" },
    { href: "/my-work", label: "My Work", icon: "checklist", badge: myWorkTotal },
    { href: "/projects", label: "Projects", icon: "nav-projects" },
    // A-03: Academy sits with Help — both are reference material rather than
    // project work. The *label* stays English per repo conventions §0.5 (app UI
    // is not translated); /academy and /docs/help now render this same shell
    // for a signed-in visitor (A-09), so they carry their own SEO chrome only
    // for guests.
    //
    // The *destination* follows the reader, though, and that is not a breach of
    // §0.5 — it is A-03's own rule that entry points lead somewhere
    // language-appropriate. A signed-in reader working through the Indonesian
    // Academy got this shell wrapped around their lesson, and its one Academy
    // link took them back to the English roadmap with no way back but the URL
    // bar. "My progress" below is a different case: `/id/academy/me` does not
    // exist, so it stays English rather than pointing at a 404.
    { href: academyHref, label: "Academy", icon: "target", beta: true },
    // Team, API Keys, AI assist, Audit Log, Backup and Account were six
    // top-level entries pointing at six `/settings/*` pages — over half the
    // sidebar spent on one category. They now sit behind this single item and
    // reach each other through the tab row in `(app)/settings/layout.tsx`;
    // `lib/app-settings-nav.ts` holds the list both of them read.
    { href: DEFAULT_APP_SETTINGS_HREF, label: "Settings", icon: "gear" },
    { href: "/docs/help", label: "Help", icon: "nav-help" },
  ];

  return (
    <AppShell
      sidebar={
        <>
        <div className="px-5 py-5">
          <Logo href="/dashboard" size="sm" dark />
        </div>
        {/* F-09: global search — trigger in the sidebar, ⌘K works everywhere */}
        <div className="mb-3 px-3">
          <CommandPalette />
        </div>
        <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto px-3">
          {nav.map((item) => (
            <div key={item.href}>
              <Link
                href={item.href}
                data-testid={`nav-${item.label.toLowerCase().replace(/\s+/g, "-")}`}
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm hover:bg-sidebar-hover hover:text-white"
              >
                <TFIcon name={item.icon} current className="h-[19px] w-[19px]" />
                {item.label}
                {"beta" in item && <BetaChip tone="dark" className="ml-auto" />}
                {"badge" in item && item.badge! > 0 && (
                  <span
                    data-testid="my-work-nav-badge"
                    className="ml-auto rounded-full bg-accent px-1.5 py-0.5 text-xs font-medium text-white"
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
              {item.href === "/projects" && (
                <SidebarProjects projects={projects} />
              )}
              {item.href === academyHref && (
                <ul className="mb-1 ml-4 space-y-0.5 border-l border-sidebar-border pl-2">
                  <li>
                    <Link
                      href="/academy/me"
                      data-testid="nav-academy-me"
                      className="block truncate rounded-md px-3 py-1.5 text-sm text-sidebar-fg hover:bg-sidebar-hover hover:text-white"
                    >
                      My progress
                    </Link>
                  </li>
                  {sandbox && (
                    <li>
                      <Link
                        href={`/projects/${sandbox.slug}`}
                        className="block truncate rounded-md px-3 py-1.5 text-sm text-sidebar-fg hover:bg-sidebar-hover hover:text-white"
                      >
                        Sandbox
                      </Link>
                    </li>
                  )}
                </ul>
              )}
            </div>
          ))}
        </nav>
        <div className="border-t border-sidebar-border p-4">
          <p className="truncate text-sm font-medium text-white">
            {session.name}
          </p>
          <p className="truncate text-xs text-sidebar-fg">{session.email}</p>
          <div className="mt-3 flex items-center justify-between gap-2">
            <LogoutButton />
            <ThemeSwitcher tone="dark" />
          </div>
        </div>
        </>
      }
    >
      {children}
      {/* A-04b: reads its own ?academy= param and sandbox-project pathname —
          rendering here rather than per-page is what lets it stay docked
          across the whole sandbox, not just the page it was opened on. */}
      <AcademyCoach sandboxSlug={sandbox?.slug ?? null} />
      {/* A-05: claim-at-signup, fired from every authenticated page rather
          than just Academy's own — see AcademySync.tsx. */}
      <AcademySync />
    </AppShell>
  );
}
