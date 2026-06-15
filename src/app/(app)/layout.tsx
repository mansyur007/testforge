import Link from "next/link";
import { requireSession } from "@/lib/auth";
import { Logo, TFIcon } from "@/components/icons";
import { LogoutButton } from "@/components/LogoutButton";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireSession();

  const nav = [
    { href: "/dashboard", label: "Dashboard", icon: "dashboard" },
    { href: "/projects", label: "Projects", icon: "nav-projects" },
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
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm hover:bg-slate-800 hover:text-white"
            >
              <TFIcon name={item.icon} current className="h-[19px] w-[19px]" />
              {item.label}
            </Link>
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
