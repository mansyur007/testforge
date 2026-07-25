"use client";

import Link from "next/link";
import { TFIcon } from "@/components/icons";
import { settingsHref } from "@/lib/settings-nav";
import { trackingHref } from "@/lib/tracking-nav";
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
// tabs stay inline, the rest live behind two hub controls (tracking, project
// settings). Each opens a modal route that server-renders its sections, and
// picks up the active style when one of its own sections is the current page.
const TRACKING_KEYS: TabKey[] = [
  "requirements",
  "sessions",
  "defects",
  "baselines",
];

const SETTINGS_KEYS: TabKey[] = [
  "import",
  "fields",
  "api",
  "integrations",
  "notifications",
  "sharing",
  "members",
];

// Both hubs and every inline tab share one underline treatment, so the row
// reads as a single navigation control.
function tabClass(isActive: boolean) {
  return `inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap border-b-2 px-4 py-2 text-sm font-medium ${FOCUS_RING} ${
    isActive
      ? "border-indigo-600 text-indigo-600"
      : "border-transparent text-slate-500 hover:text-slate-800"
  }`;
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

  // Which tab keys count as "inside" each hub, for its trigger's active style.
  // The section lists themselves live in lib/tracking-nav and lib/settings-nav
  // (shared with the modal routes and the standalone permalink pages).
  const trackingActive = TRACKING_KEYS.includes(active);
  const settingsActive = SETTINGS_KEYS.includes(active);

  return (
    <div>
      <div className="flex items-baseline gap-2">
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <Link href="/projects" className={`hover:text-slate-600 ${FOCUS_RING}`}>
            Projects
          </Link>
          <span>/</span>
        </div>
        <h1 className="text-2xl font-bold">{name}</h1>
      </div>
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
        <Link
          href={trackingHref(slug)}
          data-testid="project-tracking-trigger"
          className={tabClass(trackingActive)}
        >
          <TFIcon name="checklist" className="h-4 w-4" />
          Tracking
        </Link>
        <Link
          href={settingsHref(slug)}
          data-testid="project-settings-trigger"
          className={tabClass(settingsActive)}
        >
          <TFIcon name="gear" className="h-4 w-4" />
          Settings
        </Link>
      </div>
    </div>
  );
}
