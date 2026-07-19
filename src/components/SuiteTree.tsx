"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { TFIcon } from "@/components/icons";
import { SuiteDropZone } from "@/components/SuiteDropZone";
import { DeleteSuiteButton } from "@/components/DeleteSuiteButton";

export type SuiteNode = {
  id: string;
  name: string;
  caseCount: number;
  children: SuiteNode[];
};

/** Semua id yang punya anak, di kedalaman berapa pun. */
function idsWithChildren(nodes: SuiteNode[], acc: string[] = []): string[] {
  for (const n of nodes) {
    if (n.children.length) {
      acc.push(n.id);
      idsWithChildren(n.children, acc);
    }
  }
  return acc;
}

/** Rantai id leluhur menuju `target` (tidak termasuk target itu sendiri). */
function ancestorsOf(nodes: SuiteNode[], target: string): string[] | null {
  for (const n of nodes) {
    if (n.id === target) return [];
    const deeper = ancestorsOf(n.children, target);
    if (deeper) return [n.id, ...deeper];
  }
  return null;
}

/** Filter rekursif: node tampil kalau namanya cocok (beserta seluruh anaknya)
 *  atau ada keturunannya yang cocok (hanya cabang yang cocok yang dibawa). */
function filterTree(nodes: SuiteNode[], q: string): SuiteNode[] {
  return nodes.flatMap((n) => {
    if (n.name.toLowerCase().includes(q)) return [n];
    const kids = filterTree(n.children, q);
    return kids.length ? [{ ...n, children: kids }] : [];
  });
}

export function SuiteTree({
  slug,
  roots,
  activeSuite,
  searchParams,
  canWrite,
}: {
  slug: string;
  roots: SuiteNode[];
  activeSuite?: string;
  searchParams: Record<string, string | undefined>;
  canWrite: boolean;
}) {
  const [query, setQuery] = useState("");

  const expandable = useMemo(() => idsWithChildren(roots), [roots]);

  // Id di dalam set ini = ter-collapse. Kunjungan pertama (belum ada state
  // tersimpan) semua node bercabang dalam keadaan tertutup.
  const storageKey = `tf:suites:collapsed:${slug}`;
  const [collapsed, setCollapsed] = useState<Set<string>>(
    () => new Set(idsWithChildren(roots))
  );
  const [hydrated, setHydrated] = useState(false);

  // Baca state tersimpan sekali saat mount (localStorage client-only, jadi
  // render SSR memakai default all-collapsed lalu dikoreksi di sini), lalu
  // buka paksa cabang menuju suite yang sedang aktif.
  useEffect(() => {
    let next: Set<string> | null = null;
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const parsed: unknown = JSON.parse(raw);
        // Format lama & baru sama-sama array id ter-collapse; nilai lain diabaikan.
        if (Array.isArray(parsed))
          next = new Set(parsed.filter((v): v is string => typeof v === "string"));
      }
    } catch {
      // abaikan storage rusak/tidak tersedia
    }
    if (activeSuite) {
      const path = ancestorsOf(roots, activeSuite);
      if (path?.length) {
        next = next ?? new Set(idsWithChildren(roots));
        path.forEach((id) => next!.delete(id));
      }
    }
    if (next) setCollapsed(next);
    setHydrated(true);
    // Sengaja hanya sekali saat mount: ini memulihkan state, bukan mengikutinya.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

  // Persist setelah hydrate supaya default tidak menimpa state tersimpan.
  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(storageKey, JSON.stringify(Array.from(collapsed)));
    } catch {
      // ignore
    }
  }, [collapsed, hydrated, storageKey]);

  const q = query.trim().toLowerCase();
  const filtered = useMemo(() => (q ? filterTree(roots, q) : roots), [roots, q]);

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

  // Saat mencari, hasil selalu terbuka apa pun state collapse-nya.
  const isOpen = (id: string) => (q ? true : !collapsed.has(id));

  const renderNodes = (nodes: SuiteNode[], ancestorLines: boolean[]) =>
    nodes.map((node, i) => {
      const last = i === nodes.length - 1;
      const hasChildren = node.children.length > 0;
      const open = hasChildren && isOpen(node.id);
      const active = activeSuite === node.id;
      const depth = ancestorLines.length;

      return (
        <li
          key={node.id}
          role="treeitem"
          aria-selected={active}
          aria-expanded={hasChildren ? open : undefined}
        >
          <div className="flex items-stretch">
            {/* Rail leluhur: garis diteruskan hanya kalau leluhur itu masih
                punya saudara di bawahnya. Level root tidak pernah bergaris —
                node teratas tidak punya induk untuk digantungi. */}
            {ancestorLines.map((cont, level) => (
              <span
                key={level}
                aria-hidden
                className={`w-3 shrink-0 self-stretch ${
                  cont && level > 0 ? "border-l border-slate-200" : ""
                }`}
              />
            ))}
            {/* Siku: batang berhenti di tengah baris untuk anak terakhir (└),
                menerus penuh ke bawah untuk yang bukan terakhir (├). */}
            {depth > 0 && (
              <span aria-hidden className="relative w-3 shrink-0 self-stretch">
                <span
                  className={`absolute left-0 top-0 w-px bg-slate-200 ${
                    last ? "h-1/2" : "h-full"
                  }`}
                />
                <span className="absolute left-0 top-1/2 h-px w-2 bg-slate-200" />
              </span>
            )}

            {hasChildren ? (
              <button
                type="button"
                onClick={() => toggle(node.id)}
                aria-label={open ? "Collapse" : "Expand"}
                aria-expanded={open}
                data-testid={`suite-toggle-${node.id}`}
                className="grid h-8 w-4 shrink-0 place-items-center text-slate-400 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
              >
                <svg
                  viewBox="0 0 20 20"
                  className={`h-3.5 w-3.5 motion-safe:transition-transform motion-safe:duration-fast motion-safe:ease-tf-out ${open ? "rotate-90" : ""}`}
                  fill="currentColor"
                >
                  <path d="M7 5l6 5-6 5V5z" />
                </svg>
              </button>
            ) : (
              <span className="w-4 shrink-0" />
            )}

            <SuiteDropZone
              projectSlug={slug}
              suiteId={node.id}
              className="flex min-w-0 flex-1 items-center"
            >
              <Link
                href={buildHref(node.id)}
                data-testid={`suite-link-${node.id}`}
                className={`flex min-w-0 flex-1 items-center gap-1.5 rounded px-1.5 py-1.5 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 ${
                  active ? "bg-indigo-50 font-medium text-indigo-700" : "text-slate-700"
                }`}
              >
                <TFIcon
                  name={open || active ? "folder-open" : "folder"}
                  className={`h-4 w-4 shrink-0 ${active ? "text-indigo-600" : "text-slate-400"}`}
                />
                <span className="min-w-0 flex-1 truncate">{node.name}</span>
                {node.caseCount > 0 && (
                  <span
                    data-testid={`suite-count-${node.id}`}
                    className={`shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-medium tabular-nums ${
                      active
                        ? "bg-indigo-100 text-indigo-700"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {node.caseCount}
                  </span>
                )}
              </Link>
              {canWrite && (
                <DeleteSuiteButton
                  suiteId={node.id}
                  suiteName={node.name}
                  caseCount={node.caseCount}
                />
              )}
            </SuiteDropZone>
          </div>

          {hasChildren && open && (
            <ul role="group" className="space-y-0.5">
              {renderNodes(node.children, [...ancestorLines, !last])}
            </ul>
          )}
        </li>
      );
    });

  return (
    <div className="space-y-2">
      {roots.length > 0 && (
        <>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search suites…"
            data-testid="suite-search"
            className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-sm focus:border-indigo-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
          />
          {expandable.length > 0 && (
            <div className="flex items-center gap-2 text-xs">
              <button
                type="button"
                onClick={() => setCollapsed(new Set())}
                className="text-slate-500 hover:text-indigo-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
              >
                Expand all
              </button>
              <span className="text-slate-300">·</span>
              <button
                type="button"
                onClick={() => setCollapsed(new Set(expandable))}
                className="text-slate-500 hover:text-indigo-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
              >
                Collapse all
              </button>
            </div>
          )}
        </>
      )}

      <ul
        role="tree"
        aria-label="Test suites"
        className="max-h-[55vh] space-y-0.5 overflow-y-auto overflow-x-hidden text-sm"
      >
        {/* "All Test Cases" item nav, bukan bagian tree. */}
        <li role="none">
          <SuiteDropZone projectSlug={slug} suiteId={null}>
            <Link
              href={buildHref(undefined)}
              className={`block rounded px-1.5 py-1.5 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 ${
                !activeSuite ? "bg-indigo-50 font-medium text-indigo-700" : ""
              }`}
            >
              All Test Cases
            </Link>
          </SuiteDropZone>
        </li>

        {renderNodes(filtered, [])}

        {q && filtered.length === 0 && (
          <li className="px-2 py-2 text-xs text-slate-400">No suites match.</li>
        )}
      </ul>
    </div>
  );
}
