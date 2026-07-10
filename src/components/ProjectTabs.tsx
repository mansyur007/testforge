import Link from "next/link";

export function ProjectTabs({
  slug,
  name,
  active,
}: {
  slug: string;
  name: string;
  active:
    | "cases"
    | "runs"
    | "plans"
    | "reports"
    | "import"
    | "fields"
    | "api"
    | "integrations"
    | "notifications"
    | "members";
}) {
  const tabs = [
    { key: "cases", label: "Test Cases", href: `/projects/${slug}` },
    { key: "runs", label: "Test Runs", href: `/projects/${slug}/runs` },
    { key: "plans", label: "Plans", href: `/projects/${slug}/plans` },
    { key: "reports", label: "Reports", href: `/projects/${slug}/reports` },
    { key: "import", label: "Import", href: `/projects/${slug}/import` },
    { key: "fields", label: "Fields", href: `/projects/${slug}/fields` },
    { key: "api", label: "API", href: `/projects/${slug}/api` },
    {
      key: "integrations",
      label: "Integrations",
      href: `/projects/${slug}/integrations`,
    },
    {
      key: "notifications",
      label: "Notifications",
      href: `/projects/${slug}/notifications`,
    },
    { key: "members", label: "Members", href: `/projects/${slug}/members` },
  ];

  return (
    <div>
      <div className="mb-1 flex items-center gap-2 text-sm text-slate-400">
        <Link href="/projects" className="hover:text-slate-600">
          Projects
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
