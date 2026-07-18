import Link from "next/link";
import { requireSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { memberScope } from "@/lib/projects";
import { Logo, TFIcon } from "@/components/icons";
import { LogoutButton } from "@/components/LogoutButton";
import { SidebarProjects } from "@/components/SidebarProjects";
import { CommandPalette } from "@/components/CommandPalette";
import { AppShell } from "@/components/AppShell";
import { loadMyWorkCounts } from "@/lib/my-work";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireSession();

  // Active projects listed inline under the Projects nav item so any project is
  // one click away from anywhere — no Projects-list detour.
  const projects = await db.project.findMany({
    where: { ...memberScope(session.userId), status: "ACTIVE" },
    select: { id: true, name: true, slug: true },
    orderBy: { createdAt: "desc" },
  });

  // F-31: cross-project count for the "My Work" badge.
  const myWorkCounts = await loadMyWorkCounts(session.userId);
  const myWorkTotal = myWorkCounts.results + myWorkCounts.cases + myWorkCounts.reviews;

  const nav = [
    { href: "/dashboard", label: "Dashboard", icon: "dashboard" },
    { href: "/my-work", label: "My Work", icon: "checklist", badge: myWorkTotal },
    { href: "/projects", label: "Projects", icon: "nav-projects" },
    { href: "/settings/team", label: "Team", icon: "nav-team" },
    { href: "/settings/api-keys", label: "API Keys", icon: "nav-keys" },
    { href: "/settings/ai", label: "AI Assist", icon: "ai" },
    { href: "/settings/audit-log", label: "Audit Log", icon: "nav-audit" },
    { href: "/settings/backup", label: "Backup", icon: "nav-backup" },
    { href: "/settings/account", label: "Account", icon: "nav-account" },
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
        <nav className="flex-1 space-y-1 px-3">
          {nav.map((item) => (
            <div key={item.href}>
              <Link
                href={item.href}
                data-testid={`nav-${item.label.toLowerCase().replace(/\s+/g, "-")}`}
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm hover:bg-slate-800 hover:text-white"
              >
                <TFIcon name={item.icon} current className="h-[19px] w-[19px]" />
                {item.label}
                {"badge" in item && item.badge! > 0 && (
                  <span
                    data-testid="my-work-nav-badge"
                    className="ml-auto rounded-full bg-indigo-600 px-1.5 py-0.5 text-xs font-medium text-white"
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
              {item.href === "/projects" && (
                <SidebarProjects projects={projects} />
              )}
            </div>
          ))}
        </nav>
        <div className="border-t border-slate-800 p-4">
          <p className="truncate text-sm font-medium text-white">
            {session.name}
          </p>
          <p className="truncate text-xs text-slate-400">{session.email}</p>
          <div className="mt-3">
            <LogoutButton />
          </div>
        </div>
        </>
      }
    >
      {children}
    </AppShell>
  );
}
