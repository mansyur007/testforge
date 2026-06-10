import Link from "next/link";
import { requireSession } from "@/lib/auth";
import { logout } from "@/app/actions/auth";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireSession();

  const nav = [
    { href: "/dashboard", label: "Dashboard", icon: "📊" },
    { href: "/projects", label: "Proyek", icon: "📁" },
    { href: "/settings/api-keys", label: "API Keys", icon: "🔑" },
    { href: "/settings/audit-log", label: "Audit Log", icon: "📜" },
  ];

  return (
    <div className="flex min-h-screen">
      <aside className="fixed inset-y-0 flex w-60 flex-col border-r border-slate-800 bg-slate-900 text-slate-300">
        <div className="px-5 py-5">
          <Link href="/dashboard" className="text-xl font-bold text-white">
            ⚒️ Test<span className="text-indigo-400">Forge</span>
          </Link>
        </div>
        <nav className="flex-1 space-y-1 px-3">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm hover:bg-slate-800 hover:text-white"
            >
              <span>{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="border-t border-slate-800 p-4">
          <p className="truncate text-sm font-medium text-white">
            {session.name}
          </p>
          <p className="truncate text-xs text-slate-400">{session.email}</p>
          <form action={logout} className="mt-3">
            <button className="text-xs text-slate-400 hover:text-white">
              Keluar →
            </button>
          </form>
        </div>
      </aside>
      <main className="ml-60 flex-1 p-8">{children}</main>
    </div>
  );
}
