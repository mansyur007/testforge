"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { TFIcon } from "@/components/icons";
import {
  caseDisplayId,
  parseTags,
  PRIORITY_BADGES,
  STATUS_BADGES,
  PRIORITIES,
  CASE_TYPES,
  CASE_FORM_STATUSES,
  AUTOMATION_STATUSES,
} from "@/lib/constants";
import {
  bulkUpdateCases,
  bulkDeleteCases,
  reorderCases,
  copyCasesToProject,
} from "@/app/actions/cases";
import { CASE_DND_MIME, CASES_MOVED_EVENT } from "@/lib/dnd";

const AUTOMATION_LABELS: Record<string, string> = {
  NOT_AUTOMATED: "Not automated",
  IN_PROGRESS: "In progress",
  AUTOMATED: "Automated",
  TO_BE_UPDATED: "To be updated",
};

type CaseRow = {
  id: string;
  seq: number;
  title: string;
  suiteName: string | null;
  priority: string;
  type: string;
  status: string;
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

type OtherProject = { id: string; slug: string; name: string };

export function CasesTable({
  cases,
  projectSlug,
  projectName,
  canWrite,
  searchParams,
  otherProjects = [],
}: {
  cases: CaseRow[];
  projectSlug: string;
  projectName: string;
  canWrite: boolean;
  searchParams: SearchParams;
  otherProjects?: OtherProject[];
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkField, setBulkField] = useState("priority");
  const [bulkValue, setBulkValue] = useState<string>(PRIORITIES[0]);
  const [showDelete, setShowDelete] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [showCopy, setShowCopy] = useState(false);
  const [copyTarget, setCopyTarget] = useState<string>(otherProjects[0]?.id ?? "");
  const [copyError, setCopyError] = useState<string | null>(null);
  const [copyDone, setCopyDone] = useState<{ copied: number; targetSlug: string } | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const selectAllRef = useRef<HTMLInputElement>(null);

  const allIds = cases.map((c) => c.id);

  // Client-side pagination. Selection lives by id, so it survives page changes
  // and Ctrl/Cmd+A still spans the whole filtered set, not just this page.
  const totalPages = Math.max(1, Math.ceil(cases.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pageStart = (currentPage - 1) * pageSize;
  const pageRows = cases.slice(pageStart, pageStart + pageSize);

  // Jump back to page 1 whenever the filter changes (new result set).
  useEffect(() => {
    setPage(1);
  }, [
    searchParams.suite,
    searchParams.q,
    searchParams.priority,
    searchParams.type,
    searchParams.tag,
  ]);
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
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const selectAll = () => setSelected(new Set(allIds));
  const clear = () => setSelected(new Set());

  // A drop onto a suite happens in a different component subtree, so it tells us
  // to clear the selection via a window event once the move has landed.
  useEffect(() => {
    const onMoved = () => clear();
    window.addEventListener(CASES_MOVED_EVENT, onMoved);
    return () => window.removeEventListener(CASES_MOVED_EVENT, onMoved);
  }, []);

  // Drag a case onto a suite in the sidebar to move it. If the dragged row is
  // part of the current selection, the whole selection travels; otherwise just
  // that one row.
  function onDragStart(e: React.DragEvent, id: string) {
    // Don't hijack interactions with the inline priority/automation selects.
    const target = e.target as HTMLElement | null;
    if (target?.closest("select")) {
      e.preventDefault();
      return;
    }
    const ids = selected.has(id) ? Array.from(selected) : [id];
    e.dataTransfer.setData(CASE_DND_MIME, JSON.stringify(ids));
    e.dataTransfer.effectAllowed = "move";
    if (ids.length > 1) {
      const badge = document.createElement("div");
      badge.textContent = `${ids.length} test cases`;
      badge.style.cssText =
        "position:absolute;top:-1000px;left:-1000px;padding:4px 10px;border-radius:9999px;background:#4f46e5;color:#fff;font:500 12px sans-serif";
      document.body.appendChild(badge);
      e.dataTransfer.setDragImage(badge, 0, 0);
      setTimeout(() => badge.remove(), 0);
    }
  }

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

  const optionsFor = (field: string) =>
    field === "priority"
      ? PRIORITIES
      : field === "type"
        ? CASE_TYPES
        : field === "automationStatus"
          ? AUTOMATION_STATUSES
          : CASE_FORM_STATUSES; // F-15: bulk edit can't set review states

  const bulkOptions = optionsFor(bulkField);

  // Inline single-row edit (priority / automation) straight from the table.
  function inlineUpdate(id: string, field: string, value: string) {
    const fd = new FormData();
    fd.set("projectSlug", projectSlug);
    fd.set("bulkField", field);
    fd.set("bulkValue", value);
    fd.append("caseIds", id);
    startTransition(async () => {
      await bulkUpdateCases(fd);
    });
  }

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

  // F-24: drop onto another row in the table reorders within the current
  // (filtered) list, as opposed to dropping onto the sidebar (SuiteDropZone),
  // which moves cases between suites. Both read the same drag payload.
  function onRowDragOver(e: React.DragEvent, targetId: string) {
    if (!e.dataTransfer.types.includes(CASE_DND_MIME)) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (dragOverId !== targetId) setDragOverId(targetId);
  }

  function onRowDrop(e: React.DragEvent, targetId: string) {
    e.preventDefault();
    setDragOverId(null);
    const raw = e.dataTransfer.getData(CASE_DND_MIME);
    if (!raw) return;
    let ids: string[];
    try {
      ids = JSON.parse(raw);
    } catch {
      return;
    }
    if (!Array.isArray(ids) || ids.length === 0) return;
    const draggedSet = new Set(ids);
    if (draggedSet.has(targetId)) return; // dropped onto itself/its own selection

    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const before = e.clientY < rect.top + rect.height / 2;

    const remaining = cases.filter((c) => !draggedSet.has(c.id));
    const targetIdx = remaining.findIndex((c) => c.id === targetId);
    if (targetIdx === -1) return;
    const insertAt = before ? targetIdx : targetIdx + 1;
    const reordered = [
      ...remaining.slice(0, insertAt).map((c) => c.id),
      ...ids,
      ...remaining.slice(insertAt).map((c) => c.id),
    ];

    const fd = new FormData();
    fd.set("projectSlug", projectSlug);
    reordered.forEach((id) => fd.append("caseIds", id));
    startTransition(async () => {
      await reorderCases(fd);
    });
  }

  function submitCopy() {
    setCopyError(null);
    if (!copyTarget) {
      setCopyError("Choose a target project.");
      return;
    }
    const fd = new FormData();
    fd.set("projectSlug", projectSlug);
    fd.set("targetProjectId", copyTarget);
    selected.forEach((id) => fd.append("caseIds", id));
    startTransition(async () => {
      const res = await copyCasesToProject(fd);
      if (res?.error) {
        setCopyError(res.error);
        return;
      }
      setShowCopy(false);
      setCopyDone({ copied: res?.copied ?? 0, targetSlug: res?.targetSlug ?? "" });
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
              setBulkValue(optionsFor(e.target.value)[0]);
            }}
            className="rounded border border-slate-300 px-2 py-1 text-xs"
          >
            <option value="priority">Priority</option>
            <option value="type">Type</option>
            <option value="status">Status</option>
            <option value="automationStatus">Automation</option>
          </select>
          <span>to</span>
          <select
            value={bulkValue}
            onChange={(e) => setBulkValue(e.target.value)}
            className="rounded border border-slate-300 px-2 py-1 text-xs"
          >
            {bulkOptions.map((o) => (
              <option key={o} value={o}>
                {bulkField === "automationStatus" ? AUTOMATION_LABELS[o] : o}
              </option>
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
          {otherProjects.length > 0 && (
            <>
              <span className="text-slate-300">|</span>
              <button
                type="button"
                onClick={() => {
                  setCopyError(null);
                  setCopyTarget(otherProjects[0].id);
                  setShowCopy(true);
                }}
                disabled={pending}
                data-testid="cases-bulk-copy"
                className="inline-flex items-center gap-1 rounded border border-slate-300 bg-white px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                Copy to project…
              </button>
            </>
          )}
          <span className="text-slate-300">|</span>
          <button
            type="button"
            onClick={() => {
              setError(null);
              setConfirmText("");
              setShowDelete(true);
            }}
            disabled={pending}
            data-testid="cases-bulk-delete"
            className="inline-flex items-center gap-1 rounded bg-red-600 px-3 py-1 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
          >
            <TFIcon name="delete" className="h-3.5 w-3.5" /> Delete ({selected.size})
          </button>
        </div>
      )}

      {copyDone && (
        <div className="flex items-center justify-between gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-800">
          <span>
            Copied {copyDone.copied} test case{copyDone.copied === 1 ? "" : "s"} to{" "}
            <Link href={`/projects/${copyDone.targetSlug}`} className="underline">
              {copyDone.targetSlug}
            </Link>{" "}
            as drafts.
          </span>
          <button
            type="button"
            onClick={() => setCopyDone(null)}
            className="text-emerald-700 hover:text-emerald-900"
          >
            Dismiss
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
                    data-testid="cases-select-all"
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
            {pageRows.map((c) => {
              const isSel = selected.has(c.id);
              return (
                <tr
                  key={c.id}
                  draggable={canWrite}
                  onDragStart={
                    canWrite ? (e) => onDragStart(e, c.id) : undefined
                  }
                  onDragOver={canWrite ? (e) => onRowDragOver(e, c.id) : undefined}
                  onDragLeave={
                    canWrite ? () => setDragOverId((id) => (id === c.id ? null : id)) : undefined
                  }
                  onDrop={canWrite ? (e) => onRowDrop(e, c.id) : undefined}
                  data-testid={`case-row-${c.id}`}
                  className={`${isSel ? "bg-indigo-50/60" : "hover:bg-slate-50"} ${canWrite ? "cursor-grab active:cursor-grabbing" : ""} ${dragOverId === c.id ? "ring-2 ring-inset ring-indigo-400" : ""}`}
                >
                  {canWrite && (
                    <td className="px-3 py-2.5">
                      <input
                        type="checkbox"
                        aria-label={`Select ${caseDisplayId(projectSlug, c.seq)}`}
                        data-testid={`case-checkbox-${c.id}`}
                        checked={isSel}
                        onChange={() => toggle(c.id)}
                      />
                    </td>
                  )}
                  <td className="whitespace-nowrap px-3 py-2.5 font-mono text-xs text-slate-500">
                    {caseDisplayId(projectSlug, c.seq)}
                  </td>
                  <td className="px-3 py-2.5">
                    <span className="inline-flex items-center gap-1.5">
                      <Link
                        href={`/projects/${projectSlug}/cases/${c.id}`}
                        className="font-medium text-slate-800 hover:text-indigo-600"
                      >
                        {c.title}
                      </Link>
                      {/* F-15: surface non-runnable/review states inline; ACTIVE
                          (the common runnable state) stays unlabeled. */}
                      {c.status && c.status !== "ACTIVE" && (
                        <span
                          className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium ${STATUS_BADGES[c.status] ?? "bg-slate-100 text-slate-600"}`}
                          data-testid={`case-row-status-${c.id}`}
                        >
                          {c.status.replace(/_/g, " ")}
                        </span>
                      )}
                    </span>
                    {c.suiteName && (
                      <p className="text-xs text-slate-400">{c.suiteName}</p>
                    )}
                  </td>
                  <td className="px-3 py-2.5">
                    {canWrite ? (
                      <select
                        value={c.priority}
                        disabled={pending}
                        aria-label={`Priority for ${caseDisplayId(projectSlug, c.seq)}`}
                        data-testid={`case-priority-${c.id}`}
                        onChange={(e) =>
                          inlineUpdate(c.id, "priority", e.target.value)
                        }
                        className={`cursor-pointer rounded-full border-0 px-2 py-0.5 text-xs font-medium focus:ring-2 focus:ring-indigo-400 disabled:opacity-50 ${PRIORITY_BADGES[c.priority]}`}
                      >
                        {PRIORITIES.map((p) => (
                          <option key={p} value={p}>
                            {p}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${PRIORITY_BADGES[c.priority]}`}
                      >
                        {c.priority}
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-xs text-slate-600">{c.type}</td>
                  <td className="px-3 py-2.5 text-xs text-slate-600">
                    {canWrite ? (
                      <select
                        value={c.automationStatus}
                        disabled={pending}
                        aria-label={`Automation for ${caseDisplayId(projectSlug, c.seq)}`}
                        data-testid={`case-automation-${c.id}`}
                        onChange={(e) =>
                          inlineUpdate(c.id, "automationStatus", e.target.value)
                        }
                        className="cursor-pointer rounded border border-slate-300 bg-white px-1.5 py-0.5 text-xs text-slate-600 focus:border-indigo-500 focus:outline-none disabled:opacity-50"
                      >
                        {AUTOMATION_STATUSES.map((a) => (
                          <option key={a} value={a}>
                            {AUTOMATION_LABELS[a]}
                          </option>
                        ))}
                      </select>
                    ) : c.automationStatus === "AUTOMATED" ? (
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
                  No test cases. Create one, import from CSV, or{" "}
                  <Link href="/docs/help/test-cases" className="text-indigo-600 hover:underline">
                    learn how test cases work
                  </Link>
                  .
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
        <span>
          {cases.length === 0
            ? "0 test cases"
            : `Showing ${pageStart + 1}–${pageStart + pageRows.length} of ${cases.length}`}
          {canWrite &&
            " · Ctrl/Cmd+A to select all · drag onto a suite to move · drag onto a row to reorder"}
        </span>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-1.5">
            <span>Rows</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(1);
              }}
              data-testid="cases-page-size"
              className="rounded border border-slate-300 px-1.5 py-1 text-xs text-slate-600"
            >
              {[10, 25, 50, 100].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
              data-testid="cases-prev-page"
              className="rounded border border-slate-300 px-2 py-1 text-slate-600 hover:bg-slate-100 disabled:opacity-40"
            >
              Prev
            </button>
            <span data-testid="cases-page-indicator" className="px-1">
              Page {currentPage} of {totalPages}
            </span>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
              data-testid="cases-next-page"
              className="rounded border border-slate-300 px-2 py-1 text-slate-600 hover:bg-slate-100 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      </div>

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
              data-testid="cases-bulk-delete-confirm-input"
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
                data-testid="cases-bulk-delete-confirm"
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                {pending ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showCopy && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="w-full max-w-md space-y-4 rounded-xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-slate-900">
              Copy {selected.size} test case{selected.size === 1 ? "" : "s"} to another project
            </h3>
            <p className="text-sm text-slate-500">
              Copies get a fresh ID in the target project, start as{" "}
              <span className="font-medium text-slate-700">Draft</span>, and any
              shared steps are flattened into plain steps (shared-step groups
              don&apos;t cross projects). Attachments are duplicated as new files.
            </p>
            <select
              autoFocus
              value={copyTarget}
              onChange={(e) => setCopyTarget(e.target.value)}
              data-testid="cases-copy-target"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
            >
              {otherProjects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            {copyError && <p className="text-sm text-red-600">{copyError}</p>}
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowCopy(false)}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={submitCopy}
                disabled={pending}
                data-testid="cases-copy-confirm"
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                {pending ? "Copying…" : "Copy"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
