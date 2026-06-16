"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { TFIcon } from "@/components/icons";
import {
  caseDisplayId,
  parseTags,
  PRIORITY_BADGES,
  PRIORITIES,
  CASE_TYPES,
  CASE_STATUSES,
} from "@/lib/constants";
import { bulkUpdateCases, bulkDeleteCases } from "@/app/actions/cases";

type CaseRow = {
  id: string;
  seq: number;
  title: string;
  suiteName: string | null;
  priority: string;
  type: string;
  automationStatus: string;
  tags: string;
};

type SearchParams = {
  suite?: string;
  priority?: string;
  type?: string;
  q?: string;
  tag?: string;
};

export function CasesTable({
  cases,
  projectSlug,
  projectName,
  canWrite,
  searchParams,
}: {
  cases: CaseRow[];
  projectSlug: string;
  projectName: string;
  canWrite: boolean;
  searchParams: SearchParams;
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkField, setBulkField] = useState("priority");
  const [bulkValue, setBulkValue] = useState<string>(PRIORITIES[0]);
  const [showDelete, setShowDelete] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const selectAllRef = useRef<HTMLInputElement>(null);

  const allIds = cases.map((c) => c.id);
  const allSelected = cases.length > 0 && selected.size === cases.length;
  const someSelected = selected.size > 0 && !allSelected;

  // Reflect partial selection on the header checkbox.
  useEffect(() => {
    if (selectAllRef.current) selectAllRef.current.indeterminate = someSelected;
  }, [someSelected]);

  // Drop ids that no longer exist after a revalidation (e.g. post-delete).
  useEffect(() => {
    setSelected((prev) => {
      const live = new Set(allIds);
      const next = new Set(Array.from(prev).filter((id) => live.has(id)));
      return next.size === prev.size ? prev : next;
    });
  }, [cases]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const selectAll = () => setSelected(new Set(allIds));
  const clear = () => setSelected(new Set());

  // Ctrl/Cmd+A selects every row in the current (filtered) list; Escape clears.
  useEffect(() => {
    if (!canWrite) return;
    function onKey(e: KeyboardEvent) {
      const el = e.target as HTMLElement | null;
      const typing =
        el &&
        (el.tagName === "INPUT" ||
          el.tagName === "TEXTAREA" ||
          el.tagName === "SELECT" ||
          el.isContentEditable);
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "a" && !typing) {
        if (cases.length === 0) return;
        e.preventDefault();
        selectAll();
      } else if (e.key === "Escape" && !showDelete) {
        clear();
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [canWrite, cases, showDelete]); // eslint-disable-line react-hooks/exhaustive-deps

  const bulkOptions =
    bulkField === "priority"
      ? PRIORITIES
      : bulkField === "type"
        ? CASE_TYPES
        : CASE_STATUSES;

  function applyBulkEdit() {
    const fd = new FormData();
    fd.set("projectSlug", projectSlug);
    fd.set("bulkField", bulkField);
    fd.set("bulkValue", bulkValue);
    selected.forEach((id) => fd.append("caseIds", id));
    startTransition(async () => {
      await bulkUpdateCases(fd);
      clear();
    });
  }

  function confirmDelete() {
    setError(null);
    const fd = new FormData();
    fd.set("projectSlug", projectSlug);
    fd.set("confirmName", confirmText);
    selected.forEach((id) => fd.append("caseIds", id));
    startTransition(async () => {
      const res = await bulkDeleteCases(fd);
      if (res?.error) {
        setError(res.error);
        return;
      }
      setShowDelete(false);
      setConfirmText("");
      clear();
    });
  }

  const buildHref = (overrides: Partial<SearchParams>) => {
    const merged = { ...searchParams, ...overrides };
    const p = new URLSearchParams();
    Object.entries(merged).forEach(([k, v]) => v && p.set(k, v));
    const s = p.toString();
    return `/projects/${projectSlug}${s ? `?${s}` : ""}`;
  };

  return (
    <div className="space-y-4">
      {canWrite && selected.size > 0 && (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-indigo-200 bg-indigo-50 px-4 py-2 text-sm">
          <span className="font-medium text-indigo-700">
            {selected.size} selected
          </span>
          <button
            type="button"
            onClick={clear}
            className="text-xs text-slate-500 hover:text-slate-700"
          >
            Clear
          </button>
          <span className="text-slate-300">|</span>
          <span>Change</span>
          <select
            value={bulkField}
            onChange={(e) => {
              setBulkField(e.target.value);
              const opts =
                e.target.value === "priority"
                  ? PRIORITIES
                  : e.target.value === "type"
                    ? CASE_TYPES
                    : CASE_STATUSES;
              setBulkValue(opts[0]);
            }}
            className="rounded border border-slate-300 px-2 py-1 text-xs"
          >
            <option value="priority">Priority</option>
            <option value="type">Type</option>
            <option value="status">Status</option>
          </select>
          <span>to</span>
          <select
            value={bulkValue}
            onChange={(e) => setBulkValue(e.target.value)}
            className="rounded border border-slate-300 px-2 py-1 text-xs"
          >
            {bulkOptions.map((o) => (
              <option key={o}>{o}</option>
            ))}
          </select>
          <button
            type="button"
            onClick={applyBulkEdit}
            disabled={pending}
            className="rounded bg-indigo-600 px-3 py-1 text-xs font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            Apply
          </button>
          <span className="text-slate-300">|</span>
          <button
            type="button"
            onClick={() => {
              setError(null);
              setConfirmText("");
              setShowDelete(true);
            }}
            disabled={pending}
            className="inline-flex items-center gap-1 rounded bg-red-600 px-3 py-1 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
          >
            <TFIcon name="delete" className="h-3.5 w-3.5" /> Delete ({selected.size})
          </button>
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
            <tr>
              {canWrite && (
                <th className="w-8 px-3 py-3">
                  <input
                    ref={selectAllRef}
                    type="checkbox"
                    aria-label="Select all"
                    checked={allSelected}
                    onChange={(e) => (e.target.checked ? selectAll() : clear())}
                  />
                </th>
              )}
              <th className="px-3 py-3">ID</th>
              <th className="px-3 py-3">Title</th>
              <th className="px-3 py-3">Priority</th>
              <th className="px-3 py-3">Type</th>
              <th className="px-3 py-3">Automation</th>
              <th className="px-3 py-3">Tags</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {cases.map((c) => {
              const isSel = selected.has(c.id);
              return (
                <tr
                  key={c.id}
                  className={isSel ? "bg-indigo-50/60" : "hover:bg-slate-50"}
                >
                  {canWrite && (
                    <td className="px-3 py-2.5">
                      <input
                        type="checkbox"
                        aria-label={`Select ${caseDisplayId(projectSlug, c.seq)}`}
                        checked={isSel}
                        onChange={() => toggle(c.id)}
                      />
                    </td>
                  )}
                  <td className="whitespace-nowrap px-3 py-2.5 font-mono text-xs text-slate-500">
                    {caseDisplayId(projectSlug, c.seq)}
                  </td>
                  <td className="px-3 py-2.5">
                    <Link
                      href={`/projects/${projectSlug}/cases/${c.id}`}
                      className="font-medium text-slate-800 hover:text-indigo-600"
                    >
                      {c.title}
                    </Link>
                    {c.suiteName && (
                      <p className="text-xs text-slate-400">{c.suiteName}</p>
                    )}
                  </td>
                  <td className="px-3 py-2.5">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${PRIORITY_BADGES[c.priority]}`}
                    >
                      {c.priority}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-xs text-slate-600">{c.type}</td>
                  <td className="px-3 py-2.5 text-xs text-slate-600">
                    {c.automationStatus === "AUTOMATED" ? (
                      <span className="inline-flex items-center gap-1">
                        <TFIcon name="automation" className="h-4 w-4" /> Automated
                      </span>
                    ) : (
                      c.automationStatus.replace(/_/g, " ").toLowerCase()
                    )}
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="flex flex-wrap gap-1">
                      {parseTags(c.tags).map((tag) => (
                        <Link
                          key={tag}
                          href={buildHref({ tag })}
                          className="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-600 hover:bg-indigo-100"
                        >
                          {tag}
                        </Link>
                      ))}
                    </div>
                  </td>
                </tr>
              );
            })}
            {cases.length === 0 && (
              <tr>
                <td
                  colSpan={canWrite ? 7 : 6}
                  className="px-3 py-10 text-center text-slate-400"
                >
                  No test cases. Create one or import from CSV.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-slate-400">
        {cases.length} test case{canWrite && " · Ctrl/Cmd+A to select all"}
      </p>

      {showDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="w-full max-w-md space-y-4 rounded-xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-slate-900">
              Delete {selected.size} test case{selected.size === 1 ? "" : "s"}?
            </h3>
            <p className="text-sm text-slate-500">
              They&apos;ll be removed from this project and permanently deleted
              after 15 days. To confirm, type the project name{" "}
              <span className="font-semibold text-slate-700">{projectName}</span>{" "}
              below.
            </p>
            <input
              autoFocus
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder={projectName}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none"
            />
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowDelete(false)}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={pending || confirmText.trim() !== projectName}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                {pending ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
