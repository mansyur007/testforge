"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type Project = { id: string; name: string; slug: string };

// Daftar project langsung di sidebar agar bisa lompat ke satu project dalam satu
// klik dari halaman mana pun. Highlight project yang sedang dibuka.
export function SidebarProjects({ projects }: { projects: Project[] }) {
  const pathname = usePathname();
  if (projects.length === 0) return null;

  return (
    <ul className="mb-1 ml-4 space-y-0.5 border-l border-sidebar-border pl-2">
      {projects.map((p) => {
        const href = `/projects/${p.slug}`;
        const active = pathname === href || pathname.startsWith(`${href}/`);
        return (
          <li key={p.id}>
            <Link
              href={href}
              className={`block truncate rounded-md px-3 py-1.5 text-sm ${
                active
                  ? "bg-sidebar-hover font-medium text-white"
                  : "text-sidebar-fg hover:bg-sidebar-hover hover:text-white"
              }`}
            >
              {p.name}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
