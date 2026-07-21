"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { TFIcon } from "@/components/icons";
import { settingsHref } from "@/lib/settings-nav";
import { FOCUS_RING } from "@/components/focus";

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
  | "sharing"
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
        className={`inline-flex items-center gap-1.5 whitespace-nowrap border-b-2 px-4 py-2 text-sm font-medium ${FOCUS_RING} ${
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
        <div className="absolute left-0 z-40 mt-1 w-44 origin-top-left rounded-xl border border-slate-200 bg-white p-1 shadow-xl motion-safe:animate-tf-pop-in">
          {items.map((t) => (
            <Link
              key={t.key}
              href={t.href}
              onClick={() => setOpen(false)}
              className={`block rounded-lg px-3 py-1.5 text-sm ${FOCUS_RING} ${
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

  // Which tab keys count as "inside settings", for the trigger's active style.
  // The section list itself lives in lib/settings-sections (shared with the
  // modal route and the standalone permalink pages).
  const settingsActive = (
    [
      "import",
      "fields",
      "api",
      "integrations",
      "notifications",
      "sharing",
      "members",
    ] as TabKey[]
  ).includes(active);

  return (
    <div>
      <div className="mb-1 flex items-center gap-2 text-sm text-slate-400">
        <Link href="/projects" className={`hover:text-slate-600 ${FOCUS_RING}`}>
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
              className={`shrink-0 whitespace-nowrap border-b-2 px-4 py-2 text-sm font-medium ${FOCUS_RING} ${
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
        {/* Boxed pill, not a tab — visually separates "open a settings hub"
            from the tab-underline navigation to its left. Opens the settings
            modal route, which server-renders the section straight into it. */}
        <Link
          href={settingsHref(slug)}
          data-testid="project-settings-trigger"
          className={`my-1 inline-flex shrink-0 items-center gap-1.5 self-center whitespace-nowrap rounded-lg border px-3 py-1.5 text-sm font-medium ${FOCUS_RING} ${
            settingsActive
              ? "border-indigo-300 bg-indigo-50 text-indigo-700"
              : "border-slate-200 bg-slate-50 text-slate-600 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700"
          }`}
        >
          <TFIcon name="gear" className="h-4 w-4" />
          Settings
        </Link>
      </div>
    </div>
  );
}
