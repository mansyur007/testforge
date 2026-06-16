import Link from "next/link";
import { requireSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { memberScope } from "@/lib/projects";
import { Logo, TFIcon } from "@/components/icons";
import { LogoutButton } from "@/components/LogoutButton";
import { SidebarProjects } from "@/components/SidebarProjects";

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

  const nav = [
    { href: "/dashboard", label: "Dashboard", icon: "dashboard" },
    { href: "/projects", label: "Projects", icon: "nav-projects" },
    { href: "/settings/team", label: "Team", icon: "nav-team" },
    { href: "/settings/api-keys", label: "API Keys", icon: "nav-keys" },
    { href: "/settings/audit-log", label: "Audit Log", icon: "nav-audit" },
    { href: "/settings/account", label: "Account", icon: "nav-account" },
  ];

  return (
    <div className="flex min-h-screen">
      <aside className="fixed inset-y-0 flex w-60 flex-col border-r border-slate-800 bg-slate-900 text-slate-300">
        <div className="px-5 py-5">
          <Logo href="/dashboard" size="sm" dark />
        </div>
        <nav className="flex-1 space-y-1 px-3">
          {nav.map((item) => (
            <div key={item.href}>
              <Link
                href={item.href}
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm hover:bg-slate-800 hover:text-white"
              >
                <TFIcon name={item.icon} current className="h-[19px] w-[19px]" />
                {item.label}
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
      </aside>
      <main className="ml-60 flex-1 p-8">{children}</main>
    </div>
  );
}
