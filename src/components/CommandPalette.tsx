"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

// F-09: global ⌘K / Ctrl+K search palette. Renders the sidebar trigger button
// plus the modal; queries /api/search (debounced) and navigates on selection.
// Recent selections live in localStorage so an empty query is still useful.

type Item = { key: string; group: string; label: string; sub?: string; href: string };
type Recent = { label: string; href: string };

const RECENT_KEY = "tf_recent_search";

function groupItems(data: {
  cases: { id: string; displayId: string; title: string; projectSlug: string }[];
  runs: { id: string; name: string; status: string; projectSlug: string }[];
  suites: { id: string; name: string; projectSlug: string }[];
  milestones: { id: string; name: string; projectSlug: string }[];
}): Item[] {
  return [
    ...data.cases.map((c) => ({
      key: `c${c.id}`,
      group: "Test Cases",
      label: c.title,
      sub: c.displayId,
      href: `/projects/${c.projectSlug}/cases/${c.id}`,
    })),
    ...data.runs.map((r) => ({
      key: `r${r.id}`,
      group: "Runs",
      label: r.name,
      sub: `${r.projectSlug} · ${r.status}`,
      href: `/projects/${r.projectSlug}/runs/${r.id}`,
    })),
    ...data.suites.map((s) => ({
      key: `s${s.id}`,
      group: "Suites",
      label: s.name,
      sub: s.projectSlug,
      href: `/projects/${s.projectSlug}?suite=${s.id}`,
    })),
    ...data.milestones.map((m) => ({
      key: `m${m.id}`,
      group: "Milestones",
      label: m.name,
      sub: m.projectSlug,
      href: `/projects/${m.projectSlug}/runs`,
    })),
  ];
}

export function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [items, setItems] = useState<Item[]>([]);
  const [idx, setIdx] = useState(0);
  const [recent, setRecent] = useState<Recent[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  // Global shortcut. Works from any app page (mounted once in the layout).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      } else if (e.key === "Escape") {
        setOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (!open) return;
    setQ("");
    setItems([]);
    setIdx(0);
    try {
      setRecent(JSON.parse(localStorage.getItem(RECENT_KEY) ?? "[]"));
    } catch {
      setRecent([]);
    }
    requestAnimationFrame(() => inputRef.current?.focus());
  }, [open]);

  // Debounced fetch; 1-char queries never fire a request.
  useEffect(() => {
    if (!open || q.trim().length < 2) {
      setItems([]);
      setIdx(0);
      return;
    }
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q.trim())}`);
        if (res.ok) {
          setItems(groupItems(await res.json()));
          setIdx(0);
        }
      } catch {
        /* network hiccup — keep previous list */
      }
    }, 200);
    return () => clearTimeout(t);
  }, [q, open]);

  const go = useCallback(
    (item: { label: string; href: string }) => {
      const next = [
        { label: item.label, href: item.href },
        ...recent.filter((r) => r.href !== item.href),
      ].slice(0, 5);
      try {
        localStorage.setItem(RECENT_KEY, JSON.stringify(next));
      } catch {
        /* storage full/blocked — recents are optional */
      }
      setOpen(false);
      router.push(item.href);
    },
    [recent, router]
  );

  const groups = useMemo(() => {
    const map = new Map<string, { item: Item; flat: number }[]>();
    items.forEach((item, flat) => {
      const list = map.get(item.group) ?? [];
      list.push({ item, flat });
      map.set(item.group, list);
    });
    return Array.from(map.entries());
  }, [items]);

  return (
    <>
      <button
        type="button"
        data-testid="global-search-trigger"
        onClick={() => setOpen(true)}
        className="flex w-full items-center gap-2 rounded-lg border border-slate-700 px-3 py-1.5 text-sm text-slate-400 hover:border-slate-500 hover:text-slate-200"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" strokeLinecap="round" />
        </svg>
        Search
        <kbd className="ml-auto rounded border border-slate-700 px-1.5 text-[10px]">⌘K</kbd>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/50 p-4 pt-24"
          onClick={() => setOpen(false)}
        >
          <div
            data-testid="global-search-panel"
            className="mx-auto max-w-xl overflow-hidden rounded-xl bg-white text-slate-800 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <input
              ref={inputRef}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "ArrowDown") {
                  e.preventDefault();
                  setIdx((i) => Math.min(i + 1, items.length - 1));
                } else if (e.key === "ArrowUp") {
                  e.preventDefault();
                  setIdx((i) => Math.max(i - 1, 0));
                } else if (e.key === "Enter" && items[idx]) {
                  go(items[idx]);
                }
              }}
              placeholder="Search cases, runs, suites, milestones…"
              data-testid="global-search-input"
              className="w-full border-b border-slate-200 px-4 py-3 text-sm focus:outline-none"
            />

            <div className="max-h-80 overflow-y-auto p-2">
              {q.trim().length < 2 ? (
                recent.length > 0 ? (
                  <>
                    <p className="px-2 pb-1 pt-2 text-xs font-semibold uppercase text-slate-400">
                      Recent
                    </p>
                    {recent.map((r) => (
                      <button
                        key={r.href}
                        type="button"
                        onClick={() => go(r)}
                        className="flex w-full items-center rounded-lg px-2 py-1.5 text-left text-sm hover:bg-slate-100"
                      >
                        <span className="truncate">{r.label}</span>
                      </button>
                    ))}
                  </>
                ) : (
                  <p className="px-2 py-6 text-center text-sm text-slate-400">
                    Type at least 2 characters to search.
                  </p>
                )
              ) : items.length === 0 ? (
                <p
                  data-testid="global-search-empty"
                  className="px-2 py-6 text-center text-sm text-slate-400"
                >
                  No results for “{q.trim()}”.
                </p>
              ) : (
                groups.map(([group, entries]) => (
                  <div key={group}>
                    <p className="px-2 pb-1 pt-2 text-xs font-semibold uppercase text-slate-400">
                      {group}
                    </p>
                    {entries.map(({ item, flat }) => (
                      <button
                        key={item.key}
                        type="button"
                        data-testid="global-search-result"
                        onClick={() => go(item)}
                        onMouseEnter={() => setIdx(flat)}
                        className={`flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm ${
                          flat === idx ? "bg-indigo-50 text-indigo-800" : "hover:bg-slate-100"
                        }`}
                      >
                        {item.sub && (
                          <span className="shrink-0 font-mono text-xs text-slate-400">
                            {item.sub}
                          </span>
                        )}
                        <span className="truncate">{item.label}</span>
                      </button>
                    ))}
                  </div>
                ))
              )}
            </div>

            <p className="border-t border-slate-200 px-4 py-2 text-[11px] text-slate-400">
              ↑↓ navigate · Enter open · Esc close
            </p>
          </div>
        </div>
      )}
    </>
  );
}
