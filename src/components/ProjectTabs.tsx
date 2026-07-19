"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { TFIcon } from "@/components/icons";

type TabKey =
  | "cases"
  | "runs"
  | "plans"
  | "reports"
  | "dashboards"
  | "requirements"
  | "sessions"
  | "defects"
  | "baselines"
  | "import"
  | "fields"
  | "api"
  | "integrations"
  | "notifications"
  | "members";

type Tab = { key: TabKey; label: string; href: string };

// Grouped so the tab row doesn't grow one entry per feature: core workflow
// tabs stay inline, the rest live behind two dropdowns (tracking tools,
// project settings) that pick up the active style when one of their own
// items is the current page.
function GroupMenu({
  label,
  icon,
  items,
  activeKey,
}: {
  label: string;
  icon: Parameters<typeof TFIcon>[0]["name"];
  items: Tab[];
  activeKey: TabKey;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const isActive = items.some((t) => t.key === activeKey);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("mousedown", onDown);
    return () => window.removeEventListener("mousedown", onDown);
  }, [open]);

  return (
    <div ref={rootRef} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`inline-flex items-center gap-1.5 whitespace-nowrap border-b-2 px-4 py-2 text-sm font-medium ${
          isActive
            ? "border-indigo-600 text-indigo-600"
            : "border-transparent text-slate-500 hover:text-slate-800"
        }`}
      >
        <TFIcon name={icon} className="h-4 w-4" />
        {label}
        <span className="text-[10px]">▾</span>
      </button>
      {open && (
        <div className="absolute left-0 z-40 mt-1 w-44 rounded-xl border border-slate-200 bg-white p-1 shadow-xl">
          {items.map((t) => (
            <Link
              key={t.key}
              href={t.href}
              onClick={() => setOpen(false)}
              className={`block rounded-lg px-3 py-1.5 text-sm ${
                t.key === activeKey
                  ? "text-indigo-600"
                  : "text-slate-700 hover:bg-slate-100"
              }`}
            >
              {t.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export function ProjectTabs({
  slug,
  name,
  active,
}: {
  slug: string;
  name: string;
  active: TabKey;
}) {
  const primary: Tab[] = [
    { key: "cases", label: "Test Cases", href: `/projects/${slug}` },
    { key: "runs", label: "Test Runs", href: `/projects/${slug}/runs` },
    { key: "plans", label: "Plans", href: `/projects/${slug}/plans` },
    { key: "reports", label: "Reports", href: `/projects/${slug}/reports` },
    {
      key: "dashboards",
      label: "Dashboards",
      href: `/projects/${slug}/dashboards`,
    },
  ];

  const tracking: Tab[] = [
    {
      key: "requirements",
      label: "Requirements",
      href: `/projects/${slug}/requirements`,
    },
    {
      key: "sessions",
      label: "Sessions",
      href: `/projects/${slug}/sessions`,
    },
    {
      key: "defects",
      label: "Defects",
      href: `/projects/${slug}/defects`,
    },
    {
      key: "baselines",
      label: "Baselines",
      href: `/projects/${slug}/baselines`,
    },
  ];

  const settings: Tab[] = [
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
      <div className="mt-4 flex items-stretch gap-1 border-b border-slate-200">
        <div className="flex gap-1 overflow-x-auto">
          {primary.map((t) => (
            <Link
              key={t.key}
              href={t.href}
              className={`shrink-0 whitespace-nowrap border-b-2 px-4 py-2 text-sm font-medium ${
                active === t.key
                  ? "border-indigo-600 text-indigo-600"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              {t.label}
            </Link>
          ))}
        </div>
        <GroupMenu
          label="Tracking"
          icon="checklist"
          items={tracking}
          activeKey={active}
        />
        <GroupMenu
          label="Settings"
          icon="nav-keys"
          items={settings}
          activeKey={active}
        />
      </div>
    </div>
  );
}
