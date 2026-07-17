"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { submitResult } from "@/app/actions/runs";
import { PRIORITY_BADGES } from "@/lib/constants";
import {
  DEFAULT_STATUS_DEFS,
  assignShortcuts,
  badgeStyle,
  statusMeta,
  submittableDefs,
  type StatusDefLite,
} from "@/lib/result-statuses";

// F-04: steps arrive pre-expanded from the server; fromShared tags the origin.
type ExecutorStep = {
  action: string;
  expected: string;
  fromShared?: { id: string; title: string };
};
import {
  AttachmentUploader,
  type AttachmentItem,
} from "@/components/AttachmentUploader";
import { Markdown } from "@/components/Markdown";
import { MarkdownEditor } from "@/components/MarkdownEditor";
import {
  CustomFieldInputs,
  type CustomDefItem,
  type MemberOption,
} from "@/components/CustomFieldInputs";
import { IssuePanel, type IssueLinkView } from "@/components/IssuePanel";
import {
  DefectPanel,
  type DefectLinkView,
  type ProjectDefectOption,
} from "@/components/DefectPanel";
import { CommentPanel } from "@/components/CommentPanel";
import { Toast } from "@/components/Toast";
import { useRunChannel, type ResultEvent } from "@/components/useRunChannel";

type ResultItem = {
  id: string;
  caseId: string; // L-04: presence + live result events key on the case
  status: string;
  comment: string;
  defectUrl: string;
  elapsedSeconds: number | null;
  assigneeName: string | null;
  displayId: string;
  title: string;
  priority: string;
  caseRev: number | null; // F-05: revision executed (null = pre-F-05 result)
  currentRev: number;
  datasetName: string | null; // F-13: which parameter row this result executes
  muted: boolean; // F-21: case is quarantined — excluded from pass-rate math
  preconditions: string;
  expectedResult: string;
  steps: ExecutorStep[];
  attachments: AttachmentItem[];
  custom: Record<string, unknown>;
  issueLinks: IssueLinkView[]; // F-07
  defectLinks: DefectLinkView[]; // F-26
};

// Icon per system key (the historical glyphs), falling back to the kind.
const KEY_ICONS: Record<string, string> = {
  PASSED: "✓",
  FAILED: "✕",
  BLOCKED: "⊘",
  SKIPPED: "→",
  RETEST: "↻",
};
const KIND_ICONS: Record<string, string> = {
  PASS: "✓",
  FAIL: "✕",
  BLOCKED: "⊘",
  NEUTRAL: "•",
};

// Eksekusi test run (PRD §4.3.3 + US-002):
// inline submission, dynamic keyboard shortcuts (F-14), timer per case, partial run.
export function RunExecutor({
  results,
  runId,
  runStatus,
  projectSlug,
  canWrite,
  maxUploadMb,
  currentUser,
  customDefs = [],
  members = [],
  hasIntegration = false,
  projectDefects = [],
  statusDefs = DEFAULT_STATUS_DEFS,
}: {
  results: ResultItem[];
  runId: string; // L-04
  runStatus: string;
  projectSlug: string;
  canWrite: boolean;
  maxUploadMb: number;
  currentUser: { id: string; name: string }; // L-04: filter own events/presence
  customDefs?: CustomDefItem[];
  members?: MemberOption[];
  hasIntegration?: boolean; // F-07: an active issue tracker on this project
  projectDefects?: ProjectDefectOption[]; // F-26: open defects for the "link existing" picker
  statusDefs?: StatusDefLite[]; // F-14: project's result statuses, ordered
}) {
  const [activeIdx, setActiveIdx] = useState(0);
  const [comment, setComment] = useState("");
  const [defectUrl, setDefectUrl] = useState("");
  const [isPending, startTransition] = useTransition();
  const startedAt = useRef<number>(Date.now());
  const customRef = useRef<HTMLDivElement>(null);
  const active = results[activeIdx];

  // ── L-04 realtime overlay ────────────────────────────────────────────────
  // Server props stay the source of truth; `live` patches rows with other
  // users' results as they stream in. Everything below is an overlay: with
  // the stream absent the executor behaves exactly as before.
  type LivePatch = {
    status: string;
    comment: string;
    elapsedSeconds: number | null;
    assigneeName: string;
  };
  const [live, setLive] = useState<Record<string, LivePatch>>({});
  const [flash, setFlash] = useState<Record<string, boolean>>({});
  const [toast, setToast] = useState<{
    message: string;
    undo?: () => void;
  } | null>(null);
  const lastSubmitted = useRef(new Map<string, number>());
  const view = (r: ResultItem): ResultItem => {
    const patch = live[r.id];
    return patch ? { ...r, ...patch } : r;
  };

  const handleRemote = (evt: ResultEvent) => {
    const row = results.find((r) => r.id === evt.resultId);
    if (!row) return;
    const isActiveRow = row.id === active?.id;
    // Snapshot MY values before applying theirs — that's what Undo restores.
    const before = view(row);
    const mine = {
      status: before.status,
      comment: isActiveRow ? comment : before.comment ?? "",
      defectUrl: isActiveRow ? defectUrl : before.defectUrl ?? "",
      elapsedSeconds: before.elapsedSeconds,
    };
    setLive((prev) => ({
      ...prev,
      [evt.resultId]: {
        status: evt.status,
        comment: evt.comment ?? "",
        elapsedSeconds: evt.elapsedSeconds,
        assigneeName: evt.by.name,
      },
    }));
    setFlash((prev) => ({ ...prev, [evt.resultId]: true }));
    setTimeout(
      () => setFlash((prev) => ({ ...prev, [evt.resultId]: false })),
      1500
    );
    // Conflict = they overwrote a case I'm mid-edit on, or one I submitted
    // in the last 10 s. Last-write-wins; Undo resubmits my values (which
    // publishes — the other side then gets the mirror toast; symmetric,
    // converges because humans stop).
    const dirty =
      isActiveRow &&
      (comment !== (row.comment ?? "") || defectUrl !== (row.defectUrl ?? ""));
    const recent = Date.now() - (lastSubmitted.current.get(row.id) ?? 0) < 10_000;
    if (dirty || recent)
      setToast({
        message: `Overwritten by ${evt.by.name} just now`,
        undo: () => resubmit(row.id, mine),
      });
  };

  const { connected, presence, reportCase } = useRunChannel(runId, {
    selfId: currentUser.id,
    enabled: runStatus === "ACTIVE",
    onResult: handleRemote,
  });
  const others = presence.filter((u) => u.id !== currentUser.id);
  const othersOnCase = (caseId: string) =>
    others.filter((u) => u.caseId === caseId);

  const resubmit = (
    resultId: string,
    vals: {
      status: string;
      comment: string;
      defectUrl: string;
      elapsedSeconds: number | null;
    }
  ) => {
    setToast(null);
    const fd = new FormData();
    fd.set("resultId", resultId);
    fd.set("status", vals.status);
    fd.set("comment", vals.comment);
    fd.set("defectUrl", vals.defectUrl);
    fd.set("elapsedSeconds", vals.elapsedSeconds != null ? String(vals.elapsedSeconds) : "");
    lastSubmitted.current.set(resultId, Date.now());
    setLive((prev) => ({
      ...prev,
      [resultId]: {
        status: vals.status,
        comment: vals.comment,
        elapsedSeconds: vals.elapsedSeconds,
        assigneeName: currentUser.name,
      },
    }));
    startTransition(async () => {
      await submitResult(fd);
    });
  };
  // ────────────────────────────────────────────────────────────────────────

  // F-14: submit buttons + keyboard map derive from the project's status defs.
  const buttons = useMemo(() => submittableDefs(statusDefs), [statusDefs]);
  const shortcuts = useMemo(() => assignShortcuts(buttons), [buttons]);
  const meta = useMemo(() => statusMeta(statusDefs), [statusDefs]);
  const shortcutOf = (key: string) => shortcuts.get(key);
  const byLetter = useMemo(() => {
    const m = new Map<string, string>();
    shortcuts.forEach((letter, key) => m.set(letter, key));
    return m;
  }, [shortcuts]);

  useEffect(() => {
    startedAt.current = Date.now();
    setComment(results[activeIdx]?.comment ?? "");
    setDefectUrl(results[activeIdx]?.defectUrl ?? "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeIdx]);

  // L-04: presence follows the case I'm looking at.
  useEffect(() => {
    reportCase(active?.caseId ?? null);
  }, [active?.caseId, reportCase]);

  const submit = (status: string) => {
    if (!active || runStatus !== "ACTIVE") return;
    const elapsed = Math.round((Date.now() - startedAt.current) / 1000);
    const fd = new FormData();
    fd.set("resultId", active.id);
    fd.set("status", status);
    fd.set("comment", comment);
    fd.set("defectUrl", defectUrl);
    fd.set("elapsedSeconds", String(elapsed));
    // F-03: the custom inputs live outside a <form>, so collect them by name.
    customRef.current
      ?.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>(
        "[name^='custom_']"
      )
      .forEach((el) => {
        if (el instanceof HTMLInputElement && el.type === "checkbox") {
          if (el.checked) fd.append(el.name, el.value || "on");
        } else if (el.value !== "") {
          fd.append(el.name, el.value);
        }
      });
    // L-04: mark the conflict window and overwrite any remote overlay on this
    // row with my values — otherwise a stale live patch would keep shadowing
    // the refreshed server props after my own submit.
    lastSubmitted.current.set(active.id, Date.now());
    setLive((prev) => ({
      ...prev,
      [active.id]: {
        status,
        comment,
        elapsedSeconds: elapsed,
        assigneeName: currentUser.name,
      },
    }));
    startTransition(async () => {
      await submitResult(fd);
      // lanjut ke case berikutnya yang belum dieksekusi
      if (activeIdx < results.length - 1) setActiveIdx(activeIdx + 1);
    });
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)) return;
      const key = e.key.toLowerCase();
      const statusKey = byLetter.get(key); // F-14: dynamic shortcut map
      if (statusKey) submit(statusKey);
      else if (key === "j" || e.key === "ArrowDown")
        setActiveIdx((i) => Math.min(i + 1, results.length - 1));
      else if (key === "k" || e.key === "ArrowUp")
        setActiveIdx((i) => Math.max(i - 1, 0));
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeIdx, comment, defectUrl, results.length, runStatus, byLetter]);

  if (!results.length)
    return (
      <p className="rounded-xl border border-dashed border-slate-300 p-10 text-center text-sm text-slate-400">
        This run has no test cases.
      </p>
    );

  return (
    <div>
      {/* L-04: who else is on this run right now (connected sessions only). */}
      {connected && others.length > 0 && (
        <div
          className="mb-3 flex items-center justify-end gap-1"
          data-testid="presence-bar"
        >
          <span className="mr-1 text-xs text-slate-400">Also here:</span>
          {others.slice(0, 5).map((u) => (
            <span
              key={u.id}
              data-testid="presence-avatar"
              title={`${u.name}${
                u.caseId
                  ? ` — on ${
                      results.find((r) => r.caseId === u.caseId)?.displayId ?? "a case"
                    }`
                  : ""
              }`}
              className="grid h-6 w-6 place-items-center rounded-full bg-indigo-600 text-[10px] font-bold text-white ring-2 ring-white"
            >
              {u.name
                .split(/\s+/)
                .map((w) => w[0])
                .slice(0, 2)
                .join("")
                .toUpperCase()}
            </span>
          ))}
          {others.length > 5 && (
            <span className="grid h-6 w-6 place-items-center rounded-full bg-slate-300 text-[10px] font-bold text-slate-700 ring-2 ring-white">
              +{others.length - 5}
            </span>
          )}
        </div>
      )}

      <div className="flex gap-6">
      {/* Case list */}
      <div className="w-2/5 shrink-0 space-y-1 overflow-y-auto rounded-xl border border-slate-200 bg-white p-3"
        style={{ maxHeight: "calc(100vh - 280px)" }}>
        {results.map((r, i) => (
          <button
            key={r.id}
            onClick={() => setActiveIdx(i)}
            className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm motion-safe:transition-colors motion-safe:duration-1000 ${
              flash[r.id]
                ? "bg-amber-50"
                : i === activeIdx
                  ? "bg-indigo-50 ring-1 ring-indigo-300"
                  : "hover:bg-slate-50"
            }`}
          >
            <span className="font-mono text-xs text-slate-400">{r.displayId}</span>
            <span className="flex-1 truncate">{r.title}</span>
            {othersOnCase(r.caseId).map((u) => (
              <span
                key={u.id}
                data-testid="presence-dot"
                title={`${u.name} is viewing this case`}
                className="grid h-4 w-4 shrink-0 place-items-center rounded-full bg-indigo-600 text-[8px] font-bold text-white"
              >
                {u.name[0]?.toUpperCase()}
              </span>
            ))}
            {r.muted && (
              <span
                className="shrink-0 rounded-full bg-slate-200 px-2 py-0.5 text-xs font-medium text-slate-600"
                data-testid="muted-chip"
                title="Muted — excluded from pass-rate math"
              >
                muted
              </span>
            )}
            {r.datasetName && (
              <span
                className="shrink-0 rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-600"
                data-testid="dataset-chip"
                title="Parameterized run (F-13)"
              >
                {r.datasetName}
              </span>
            )}
            {r.caseRev != null && r.caseRev < r.currentRev && (
              <span
                className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800"
                title="Case has changed since this run"
                data-testid="stale-rev-chip"
              >
                rev {r.caseRev}
              </span>
            )}
            <span
              className="shrink-0 rounded-full px-2 py-0.5 text-xs font-medium"
              style={badgeStyle(meta.colorOf(view(r).status))}
            >
              {view(r).status.replace(/_/g, " ")}
            </span>
          </button>
        ))}
      </div>

      {/* Active case detail + submission */}
      <div className="min-w-0 flex-1 space-y-4">
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <div className="flex items-center justify-between">
            <p className="font-mono text-xs text-slate-400">{active.displayId}</p>
            <span className="flex items-center gap-2">
              {active.datasetName && (
                <span
                  className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-700"
                  data-testid="dataset-chip-detail"
                >
                  Dataset: {active.datasetName}
                </span>
              )}
              {active.caseRev != null && active.caseRev < active.currentRev && (
                <span
                  className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800"
                  title="Case has changed since this run"
                >
                  executed at rev {active.caseRev} (now rev {active.currentRev})
                </span>
              )}
              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${PRIORITY_BADGES[active.priority]}`}>
                {active.priority}
              </span>
            </span>
          </div>
          <h3 className="mt-1 text-lg font-bold">{active.title}</h3>
          {/* L-04: soft claim — informational, never blocking. */}
          {othersOnCase(active.caseId).map((u) => (
            <span
              key={u.id}
              data-testid="soft-claim-chip"
              className="mt-2 inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800"
            >
              {u.name} is on this case
            </span>
          ))}
          {active.preconditions && (
            <div className="mt-3 rounded-lg bg-amber-50 p-3 text-sm">
              <span className="font-medium text-amber-800">Preconditions:</span>
              <Markdown className="text-amber-900">{active.preconditions}</Markdown>
            </div>
          )}
          <ol className="mt-4 space-y-2">
            {active.steps.map((s, i) => (
              <li key={i} className="flex gap-2 text-sm">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-600">
                  {i + 1}
                </span>
                <div className="min-w-0">
                  {s.fromShared && (
                    <span
                      className="mr-1.5 rounded bg-indigo-50 px-1.5 py-0.5 align-middle text-[10px] font-medium text-indigo-600"
                      title={`From shared steps: ${s.fromShared.title}`}
                      data-testid="shared-step-badge"
                    >
                      ⛓ {s.fromShared.title}
                    </span>
                  )}
                  <Markdown>{s.action}</Markdown>
                  {s.expected && (
                    <div className="flex gap-1 text-xs text-slate-500">
                      <span>↳</span>
                      <Markdown className="text-xs text-slate-500">{s.expected}</Markdown>
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ol>
          {active.expectedResult && (
            <div className="mt-4 rounded-lg bg-green-50 p-3 text-sm">
              <span className="font-medium text-green-800">Expected:</span>
              <Markdown className="text-green-900">{active.expectedResult}</Markdown>
            </div>
          )}
          {view(active).assigneeName && (
            <p className="mt-3 text-xs text-slate-400">
              Last executed by {view(active).assigneeName}
              {view(active).elapsedSeconds != null && (
                <> · {view(active).elapsedSeconds}s</>
              )}
            </p>
          )}

          {/* F-01: evidence attachments per result. key remounts on case switch. */}
          <div className="mt-4 border-t border-slate-100 pt-4">
            <p className="mb-2 text-xs font-semibold uppercase text-slate-400">
              Evidence
            </p>
            <AttachmentUploader
              key={active.id}
              projectSlug={projectSlug}
              entityType="RESULT"
              entityId={active.id}
              canWrite={canWrite && runStatus === "ACTIVE"}
              maxMb={maxUploadMb}
              initial={active.attachments}
            />
          </div>

          {/* F-07: issue links. Filing is offered only for a failed result. */}
          {(hasIntegration || active.issueLinks.length > 0) && (
            <div className="mt-4 border-t border-slate-100 pt-4">
              <p className="mb-2 text-xs font-semibold uppercase text-slate-400">
                Issues
              </p>
              <IssuePanel
                key={active.id}
                entityType="RESULT"
                entityId={active.id}
                links={active.issueLinks}
                canWrite={canWrite}
                hasIntegration={hasIntegration}
                canCreate={meta.kindOf(active.status) === "FAIL"} // F-14: kind, not key
              />
            </div>
          )}

          {/* F-26: built-in defects — always available (no external config). */}
          <div className="mt-4 border-t border-slate-100 pt-4">
            <p className="mb-2 text-xs font-semibold uppercase text-slate-400">
              Defects
            </p>
            <DefectPanel
              key={active.id}
              projectSlug={projectSlug}
              entityType="RESULT"
              entityId={active.id}
              links={active.defectLinks}
              canWrite={canWrite}
              projectDefects={projectDefects}
            />
          </div>

          {/* F-16: per-result discussion — remounts per case via key. */}
          <div className="mt-4 border-t border-slate-100 pt-4">
            <CommentPanel
              key={active.id}
              entityType="RESULT"
              entityId={active.id}
              projectSlug={projectSlug}
            />
          </div>
        </div>

        {runStatus === "ACTIVE" ? (
          <div className="rounded-xl border border-slate-200 bg-white p-6">
            {/* F-02: Markdown notes; pasting a screenshot attaches it to this
                result (F-01) and inserts the image reference. */}
            <MarkdownEditor
              key={active.id}
              value={comment}
              onChange={setComment}
              rows={2}
              placeholder="Execution notes (optional, Markdown)..."
              projectSlug={projectSlug}
              entityType="RESULT"
              entityId={active.id}
            />
            <input
              value={defectUrl}
              onChange={(e) => setDefectUrl(e.target.value)}
              placeholder="Bug report URL if failed (Jira/GitHub Issue)..."
              className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
            />
            {customDefs.length > 0 && (
              <div
                ref={customRef}
                key={active.id}
                className="mt-3 grid gap-3 md:grid-cols-2"
              >
                <CustomFieldInputs
                  defs={customDefs}
                  values={active.custom}
                  members={members}
                />
              </div>
            )}
            {/* F-14: one button per active status def; shortcut = first letter
                of the label, earlier order wins conflicts (shown in tooltip). */}
            <div className="mt-3 flex flex-wrap gap-2">
              {buttons.map((d) => {
                const letter = shortcutOf(d.key);
                return (
                  <button
                    key={d.key}
                    onClick={() => submit(d.key)}
                    disabled={isPending}
                    data-testid={`submit-status-${d.key}`}
                    title={letter ? `Shortcut: ${letter.toUpperCase()}` : d.label}
                    className="rounded-lg px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
                    style={{ backgroundColor: d.color }}
                  >
                    {KEY_ICONS[d.key] ?? KIND_ICONS[d.kind] ?? "•"} {d.label}
                    {letter && (
                      <kbd className="ml-1 rounded bg-black/20 px-1 text-xs">
                        {letter.toUpperCase()}
                      </kbd>
                    )}
                  </button>
                );
              })}
            </div>
            <p className="mt-3 text-xs text-slate-400">
              ⌨️ Shortcuts:{" "}
              {buttons
                .filter((d) => shortcutOf(d.key))
                .map((d) => shortcutOf(d.key)!.toUpperCase())
                .join("/")}{" "}
              to submit · J/K or ↑↓ to navigate · Timer runs automatically per case
            </p>
          </div>
        ) : (
          <p className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-center text-sm text-slate-500">
            This run is complete — results are read-only.
          </p>
        )}
      </div>
      </div>

      {/* L-04: last-write-wins conflict toast. Newest wins, no queue. */}
      {toast && (
        <Toast
          message={toast.message}
          actionLabel={toast.undo ? "Undo" : undefined}
          onAction={toast.undo}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
