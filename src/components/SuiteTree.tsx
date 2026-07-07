"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { TFIcon } from "@/components/icons";
import { SuiteDropZone } from "@/components/SuiteDropZone";
import { DeleteSuiteButton } from "@/components/DeleteSuiteButton";

type SuiteNode = { id: string; name: string; caseCount: number };
type RootNode = SuiteNode & { children: SuiteNode[] };

export function SuiteTree({
  slug,
  roots,
  activeSuite,
  searchParams,
  canWrite,
}: {
  slug: string;
  roots: RootNode[];
  activeSuite?: string;
  searchParams: Record<string, string | undefined>;
  canWrite: boolean;
}) {
  const [query, setQuery] = useState("");

  const rootsWithChildren = useMemo(
    () => roots.filter((r) => r.children.length > 0).map((r) => r.id),
    [roots]
  );

  // A root id in this set is collapsed. First visit (no saved state) starts with
  // every root collapsed; after that we remember the last state per project.
  const storageKey = `tf:suites:collapsed:${slug}`;
  const [collapsed, setCollapsed] = useState<Set<string>>(
    () => new Set(roots.filter((r) => r.children.length > 0).map((r) => r.id))
  );
  const [hydrated, setHydrated] = useState(false);

  // Load the saved state once on mount (localStorage is client-only, so the SSR
  // render uses the all-collapsed default and is corrected here).
  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) setCollapsed(new Set(JSON.parse(raw) as string[]));
    } catch {
      // ignore malformed/unavailable storage
    }
    setHydrated(true);
  }, [storageKey]);

  // Persist after hydration so we never overwrite saved state with the default.
  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(storageKey, JSON.stringify(Array.from(collapsed)));
    } catch {
      // ignore
    }
  }, [collapsed, hydrated, storageKey]);

  // One search box, matching both suites and sub-suites. A root shows if it or
  // any child matches; a matching root reveals all its children, otherwise only
  // the matching ones.
  const q = query.trim().toLowerCase();
  const filtered = useMemo(() => {
    if (!q) return roots;
    return roots.flatMap((r) => {
      const rootMatch = r.name.toLowerCase().includes(q);
      const kids = rootMatch
        ? r.children
        : r.children.filter((c) => c.name.toLowerCase().includes(q));
      if (rootMatch || kids.length) return [{ ...r, children: kids }];
      return [];
    });
  }, [roots, q]);

  const buildHref = (suiteId?: string) => {
    const merged = { ...searchParams, suite: suiteId };
    const p = new URLSearchParams();
    Object.entries(merged).forEach(([k, v]) => v && p.set(k, String(v)));
    const s = p.toString();
    return `/projects/${slug}${s ? `?${s}` : ""}`;
  };

  const toggle = (id: string) =>
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const linkClass = (active: boolean, muted = false) =>
    `min-w-0 flex-1 truncate rounded px-2 py-1 hover:bg-slate-100 ${
      muted ? "text-slate-600" : ""
    } ${active ? "bg-indigo-50 font-medium text-indigo-700" : ""}`;

  // While searching, matches are always revealed regardless of collapsed state.
  const isOpen = (id: string) => (q ? true : !collapsed.has(id));

  return (
    <div className="space-y-2">
      {roots.length > 0 && (
        <>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search suites…"
            data-testid="suite-search"
            className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-sm focus:border-indigo-500 focus:outline-none"
          />
          {rootsWithChildren.length > 0 && (
            <div className="flex items-center gap-2 text-xs">
              <button
                type="button"
                onClick={() => setCollapsed(new Set())}
                className="text-slate-500 hover:text-indigo-600"
              >
                Expand all
              </button>
              <span className="text-slate-300">·</span>
              <button
                type="button"
                onClick={() => setCollapsed(new Set(rootsWithChildren))}
                className="text-slate-500 hover:text-indigo-600"
              >
                Collapse all
              </button>
            </div>
          )}
        </>
      )}

      <ul className="max-h-[55vh] space-y-1 overflow-y-auto text-sm">
        {/* "All Test Cases" is a nav item, not a suite — always shown. */}
        <li>
          <SuiteDropZone projectSlug={slug} suiteId={null}>
            <Link
              href={buildHref(undefined)}
              className={`block rounded px-2 py-1 hover:bg-slate-100 ${
                !activeSuite ? "bg-indigo-50 font-medium text-indigo-700" : ""
              }`}
            >
              All Test Cases
            </Link>
          </SuiteDropZone>
        </li>

        {filtered.map((suite) => {
          const hasChildren = suite.children.length > 0;
          const open = isOpen(suite.id);
          return (
            <li key={suite.id}>
              <div className="flex items-center">
                {hasChildren ? (
                  <button
                    type="button"
                    onClick={() => toggle(suite.id)}
                    aria-label={open ? "Collapse" : "Expand"}
                    aria-expanded={open}
                    data-testid={`suite-toggle-${suite.id}`}
                    className="grid h-6 w-5 shrink-0 place-items-center text-slate-400 hover:text-slate-700"
                  >
                    <svg
                      viewBox="0 0 20 20"
                      className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-90" : ""}`}
                      fill="currentColor"
                    >
                      <path d="M7 5l6 5-6 5V5z" />
                    </svg>
                  </button>
                ) : (
                  <span className="w-5 shrink-0" />
                )}
                <SuiteDropZone
                  projectSlug={slug}
                  suiteId={suite.id}
                  className="flex min-w-0 flex-1 items-center"
                >
                  <Link
                    href={buildHref(suite.id)}
                    className={linkClass(activeSuite === suite.id)}
                  >
                    <span className="inline-flex items-center gap-1.5">
                      <TFIcon name="nav-tree" className="h-4 w-4" /> {suite.name}
                    </span>
                  </Link>
                  {canWrite && (
                    <DeleteSuiteButton
                      suiteId={suite.id}
                      suiteName={suite.name}
                      caseCount={suite.caseCount}
                    />
                  )}
                </SuiteDropZone>
              </div>

              {hasChildren && open && (
                <ul className="space-y-1">
                  {suite.children.map((section) => (
                    <li key={section.id} className="flex items-center pl-5">
                      <SuiteDropZone
                        projectSlug={slug}
                        suiteId={section.id}
                        className="flex min-w-0 flex-1 items-center"
                      >
                        <Link
                          href={buildHref(section.id)}
                          className={linkClass(activeSuite === section.id, true)}
                        >
                          └ {section.name}
                        </Link>
                        {canWrite && (
                          <DeleteSuiteButton
                            suiteId={section.id}
                            suiteName={section.name}
                            caseCount={section.caseCount}
                          />
                        )}
                      </SuiteDropZone>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          );
        })}

        {q && filtered.length === 0 && (
          <li className="px-2 py-2 text-xs text-slate-400">No suites match.</li>
        )}
      </ul>
    </div>
  );
}
