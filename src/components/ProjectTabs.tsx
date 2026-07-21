"use client";

import Link from "next/link";
import { createPortal } from "react-dom";
import { useEffect, useRef, useState } from "react";
import { TFIcon, type IconName } from "@/components/icons";
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
type SettingsTab = Tab & { icon: IconName; description: string };

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

// Settings lives behind a modal instead of a dropdown: it's a longer, more
// deliberate list (7 project-admin surfaces) than Tracking's 4 workflow
// shortcuts, so it gets the "browse, then commit" two-pane pattern instead
// of a flat menu — pick a section on the left, read what it does, then open
// it. Each entry is still a real page (not an inline settings toggle), so
// the right pane is a preview + explicit "Open" action, not live content.
function SettingsModal({
  items,
  activeKey,
  onClose,
}: {
  items: SettingsTab[];
  activeKey: TabKey;
  onClose: () => void;
}) {
  const [selected, setSelected] = useState(
    items.find((t) => t.key === activeKey) ?? items[0]
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 motion-safe:animate-tf-fade-in"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Project settings"
        data-testid="project-settings-modal"
        className="flex max-h-[32rem] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl motion-safe:animate-tf-pop-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3.5">
          <h2 className="flex items-center gap-2 font-semibold text-slate-800">
            <TFIcon name="gear" className="h-5 w-5 text-slate-500" />
            Project settings
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            data-testid="project-settings-modal-close"
            className={`rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 ${FOCUS_RING}`}
          >
            ✕
          </button>
        </div>

        <div className="flex min-h-0 flex-1">
          <nav className="w-48 shrink-0 overflow-y-auto border-r border-slate-100 bg-slate-50/60 p-2">
            {items.map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => setSelected(t)}
                data-testid={`project-settings-item-${t.key}`}
                className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm ${FOCUS_RING} ${
                  t.key === selected.key
                    ? "bg-indigo-50 font-medium text-indigo-700"
                    : "text-slate-600 hover:bg-white"
                } ${t.key === activeKey ? "ring-1 ring-inset ring-indigo-200" : ""}`}
              >
                <TFIcon name={t.icon} className="h-4 w-4 shrink-0" />
                <span className="truncate">{t.label}</span>
              </button>
            ))}
          </nav>

          <div className="flex-1 overflow-y-auto p-6">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-indigo-50">
              <TFIcon name={selected.icon} className="h-5 w-5 text-indigo-600" />
            </div>
            <h3 className="mt-3 text-base font-semibold text-slate-800">
              {selected.label}
            </h3>
            <p className="mt-1.5 text-sm leading-relaxed text-slate-500">
              {selected.description}
            </p>
            <Link
              href={selected.href}
              onClick={onClose}
              data-testid="project-settings-open"
              className={`mt-5 inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 ${FOCUS_RING}`}
            >
              Open {selected.label} →
            </Link>
          </div>
        </div>
      </div>
    </div>,
    document.body
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

  const settings: SettingsTab[] = [
    {
      key: "import",
      label: "Import",
      href: `/projects/${slug}/import`,
      icon: "import",
      description:
        "Bulk-import cases from TestRail, Qase, or TestLink exports, with column mapping remembered per project.",
    },
    {
      key: "fields",
      label: "Fields",
      href: `/projects/${slug}/fields`,
      icon: "breakdown",
      description:
        "Custom fields, result statuses, configurations, environments, and the CI quality gate policy.",
    },
    {
      key: "api",
      label: "API",
      href: `/projects/${slug}/api`,
      icon: "cicd",
      description:
        "REST API endpoints, API keys, webhooks, and the public quality badge for this project.",
    },
    {
      key: "integrations",
      label: "Integrations",
      href: `/projects/${slug}/integrations`,
      icon: "frameworks",
      description:
        "Connect Jira, GitHub, or GitLab so failed results can open tracked issues automatically.",
    },
    {
      key: "notifications",
      label: "Notifications",
      href: `/projects/${slug}/notifications`,
      icon: "mailbox",
      description:
        "Slack, Discord, Teams, and email channels for run and result activity, plus scheduled report emails.",
    },
    {
      key: "sharing",
      label: "Public sharing",
      href: `/projects/${slug}/sharing`,
      icon: "tpl-web",
      description:
        "Publish a read-only portfolio view of this project at a public URL — no sign-in required.",
    },
    {
      key: "members",
      label: "Members",
      href: `/projects/${slug}/members`,
      icon: "nav-team",
      description:
        "Invite teammates and manage who can view, edit, or administer this project.",
    },
  ];

  const [settingsOpen, setSettingsOpen] = useState(false);
  const settingsActive = settings.some((t) => t.key === active);

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
            from the tab-underline navigation to its left. */}
        <button
          type="button"
          onClick={() => setSettingsOpen(true)}
          data-testid="project-settings-trigger"
          className={`my-1 inline-flex shrink-0 items-center gap-1.5 self-center whitespace-nowrap rounded-lg border px-3 py-1.5 text-sm font-medium ${FOCUS_RING} ${
            settingsActive
              ? "border-indigo-300 bg-indigo-50 text-indigo-700"
              : "border-slate-200 bg-slate-50 text-slate-600 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700"
          }`}
        >
          <TFIcon name="gear" className="h-4 w-4" />
          Settings
        </button>
      </div>

      {settingsOpen && (
        <SettingsModal
          items={settings}
          activeKey={active}
          onClose={() => setSettingsOpen(false)}
        />
      )}
    </div>
  );
}
