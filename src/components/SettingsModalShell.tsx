"use client";

import Link from "next/link";
import { useRouter, useSelectedLayoutSegment } from "next/navigation";
import { useEffect } from "react";
import { TFIcon, type IconName } from "@/components/icons";
import { FOCUS_RING } from "@/components/focus";

export type ShellSection = {
  key: string;
  label: string;
  icon: IconName;
  href: string;
};

/**
 * Chrome for the project-settings modal. The section list navigates between
 * real routes (each section is server-rendered into `children`), so the modal
 * is deep-linkable and reloadable rather than client-only state — but it still
 * closes like a dialog: Escape, backdrop click, or the ✕.
 */
export function SettingsModalShell({
  title,
  closeHref,
  sections,
  children,
}: {
  title: string;
  closeHref: string;
  sections: ShellSection[];
  children: React.ReactNode;
}) {
  const router = useRouter();
  // The child route segment is the active section key — no prop drilling from
  // the page, and it stays correct across client-side section switches.
  const active = useSelectedLayoutSegment();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") router.push(closeHref);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [router, closeHref]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 motion-safe:animate-tf-fade-in"
      onClick={() => router.push(closeHref)}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Project settings"
        data-testid="project-settings-modal"
        className="flex h-[min(46rem,calc(100vh-2rem))] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl motion-safe:animate-tf-pop-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-slate-200 px-5 py-3.5">
          <h2 className="flex min-w-0 items-center gap-2 font-semibold text-slate-800">
            <TFIcon name="gear" className="h-5 w-5 shrink-0 text-slate-500" />
            <span className="truncate">{title}</span>
          </h2>
          <Link
            href={closeHref}
            aria-label="Close settings"
            data-testid="project-settings-modal-close"
            className={`rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 ${FOCUS_RING}`}
          >
            ✕
          </Link>
        </div>

        <div className="flex min-h-0 flex-1">
          <nav className="w-52 shrink-0 overflow-y-auto border-r border-slate-100 bg-slate-50/60 p-2">
            {sections.map((s) => (
              <Link
                key={s.key}
                href={s.href}
                data-testid={`project-settings-item-${s.key}`}
                aria-current={s.key === active ? "page" : undefined}
                className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${FOCUS_RING} ${
                  s.key === active
                    ? "bg-indigo-50 font-medium text-indigo-700"
                    : "text-slate-600 hover:bg-white"
                }`}
              >
                <TFIcon name={s.icon} className="h-4 w-4 shrink-0" />
                <span className="truncate">{s.label}</span>
              </Link>
            ))}
          </nav>

          <div
            className="min-w-0 flex-1 overflow-y-auto p-6"
            data-testid="project-settings-content"
          >
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
