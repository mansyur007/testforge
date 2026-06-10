import Link from "next/link";

export function ProjectTabs({
  slug,
  name,
  active,
}: {
  slug: string;
  name: string;
  active: "cases" | "runs" | "reports" | "import";
}) {
  const tabs = [
    { key: "cases", label: "Test Cases", href: `/projects/${slug}` },
    { key: "runs", label: "Test Runs", href: `/projects/${slug}/runs` },
    { key: "reports", label: "Reports", href: `/projects/${slug}/reports` },
    { key: "import", label: "Import / API", href: `/projects/${slug}/import` },
  ];

  return (
    <div>
      <div className="mb-1 flex items-center gap-2 text-sm text-slate-400">
        <Link href="/projects" className="hover:text-slate-600">
          Proyek
        </Link>
        <span>/</span>
      </div>
      <h1 className="text-2xl font-bold">{name}</h1>
      <div className="mt-4 flex gap-1 border-b border-slate-200">
        {tabs.map((t) => (
          <Link
            key={t.key}
            href={t.href}
            className={`border-b-2 px-4 py-2 text-sm font-medium ${
              active === t.key
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            {t.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
