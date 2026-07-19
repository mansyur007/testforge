"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { BackLink } from "@/components/icons";
import { useRouter } from "next/navigation";
import { PRIORITY_BADGES } from "@/lib/constants";
import {
  DEFAULT_STATUS_DEFS,
  assignShortcuts,
  badgeStyle,
  onColorOf,
  statusMeta,
  submittableDefs,
  type StatusDefLite,
} from "@/lib/result-statuses";
import {
  enqueue,
  flush,
  subscribe,
  pendingResultIds,
  type Conflict,
} from "@/lib/offline-queue";

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
  blockedSuggestion: { prereqDisplayId: string; prereqTitle: string } | null; // F-32
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

const glyphFor = (d: { key: string; kind: string }) =>
  KEY_ICONS[d.key] ?? KIND_ICONS[d.kind] ?? "•";

function genClientId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const s = Math.round(diff / 1000);
  if (s < 60) return "just now";
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.round(h / 24)}d ago`;
}

// Eksekusi test run (PRD §4.3.3 + US-002):
// inline submission, dynamic keyboard shortcuts (F-14), timer per case, partial
// run. F-36: submits go through the offline-capable JSON transport; the layout
// collapses to a single-card, thumb-zone flow below md.
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
  const router = useRouter();
  const [activeIdx, setActiveIdx] = useState(0);
  const [comment, setComment] = useState("");
  const [defectUrl, setDefectUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const startedAt = useRef<number>(Date.now());
  const customRef = useRef<HTMLDivElement>(null);
  const active = results[activeIdx];

  // F-36 Part D: mobile-only UI state.
  const [sheetOpen, setSheetOpen] = useState(false); // full case list bottom sheet
  const [showDetails, setShowDetails] = useState(false); // <md aux disclosure
  const [dragX, setDragX] = useState(0);
  const touchRef = useRef<{ x: number; y: number; t: number } | null>(null);
  const [reduceMotion, setReduceMotion] = useState(false);

  // F-36 Part C: offline queue state.
  const [queuedIds, setQueuedIds] = useState<Set<string>>(new Set());
  const [queuedCount, setQueuedCount] = useState(0);
  const [showSynced, setShowSynced] = useState(false);
  const prevQueued = useRef(0);

  // ── L-04 realtime overlay ────────────────────────────────────────────────
  type LivePatch = {
    status: string;
    comment: string;
    elapsedSeconds: number | null;
    assigneeName: string;
  };
  const [live, setLive] = useState<Record<string, LivePatch>>({});
  const [flash, setFlash] = useState<Record<string, boolean>>({});
  const [toast, setToast] = useState<{ message: string; undo?: () => void } | null>(
    null
  );
  const lastSubmitted = useRef(new Map<string, number>());
  const view = (r: ResultItem): ResultItem => {
    const patch = live[r.id];
    return patch ? { ...r, ...patch } : r;
  };

  const showConflictToast = (c: Conflict, resultId: string) => {
    const row = results.find((r) => r.id === resultId);
    const did = row?.displayId ?? "a case";
    setToast({
      message: `Overwrote ${c.theirName}'s "${c.theirStatus}" from ${relativeTime(
        c.theirAt
      )} on ${did}`,
    });
  };

  const handleRemote = (evt: ResultEvent) => {
    const row = results.find((r) => r.id === evt.resultId);
    if (!row) return;
    const isActiveRow = row.id === active?.id;
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

  // F-03: the custom inputs live outside a <form>; collect them by name using
  // the defs so MULTISELECT stays an array (mirrors collectCustomFromForm).
  const collectCustom = (): Record<string, unknown> | undefined => {
    const el = customRef.current;
    if (!el || customDefs.length === 0) return undefined;
    const out: Record<string, unknown> = {};
    for (const def of customDefs) {
      const nodes = el.querySelectorAll<
        HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
      >(`[name="custom_${def.key}"]`);
      if (def.type === "MULTISELECT") {
        const vals: string[] = [];
        nodes.forEach((n) => {
          if (n instanceof HTMLSelectElement && n.multiple)
            Array.from(n.selectedOptions).forEach((o) => {
              if (o.value) vals.push(o.value);
            });
          else if (n instanceof HTMLInputElement) {
            if (n.type === "checkbox" ? n.checked : !!n.value) vals.push(n.value);
          } else if (n.value) vals.push(n.value);
        });
        if (vals.length) out[def.key] = vals;
      } else {
        const n = nodes[0];
        if (!n) continue;
        if (n instanceof HTMLInputElement && n.type === "checkbox") {
          if (n.checked) out[def.key] = n.value || "on";
        } else if (n.value !== "") out[def.key] = n.value;
      }
    }
    return Object.keys(out).length ? out : undefined;
  };

  // F-36 Part C: the single client submit path. Try the JSON route with a 6 s
  // timeout; on success behave exactly as before (optimistic overlay + refresh
  // for the server-rendered summary). On abort/network/5xx, queue and show the
  // ⟳ queued chip — the queue drains automatically on the next trigger.
  async function performSubmit(
    resultId: string,
    status: string,
    vals: { comment: string; defectUrl: string; elapsedSeconds: number | null },
    custom?: Record<string, unknown>
  ) {
    const clientId = genClientId();
    const recordedAt = new Date().toISOString();
    lastSubmitted.current.set(resultId, Date.now());
    setLive((prev) => ({
      ...prev,
      [resultId]: {
        status,
        comment: vals.comment,
        elapsedSeconds: vals.elapsedSeconds,
        assigneeName: currentUser.name,
      },
    }));
    setBusy(true);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 6000);
    const queuedPayload = {
      status,
      comment: vals.comment,
      defectUrl: vals.defectUrl,
      elapsedSeconds: vals.elapsedSeconds,
      clientId,
      recordedAt,
    };
    try {
      const res = await fetch(`/api/runs/results/${resultId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...queuedPayload, custom }),
        signal: controller.signal,
      });
      clearTimeout(timer);
      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        setQueuedIds((prev) => {
          if (!prev.has(resultId)) return prev;
          const n = new Set(prev);
          n.delete(resultId);
          return n;
        });
        if (data?.conflict) showConflictToast(data.conflict, resultId);
        router.refresh(); // matches the old server-action revalidatePath
      } else if (res.status >= 400 && res.status < 500) {
        setToast({
          message: "Couldn't record — you may not have permission on this run.",
        });
        router.refresh();
      } else {
        await enqueue({ clientId, resultId, payload: queuedPayload, recordedAt });
        setQueuedIds((prev) => new Set(prev).add(resultId));
      }
    } catch {
      clearTimeout(timer);
      await enqueue({ clientId, resultId, payload: queuedPayload, recordedAt });
      setQueuedIds((prev) => new Set(prev).add(resultId));
    } finally {
      setBusy(false);
    }
  }

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
    void performSubmit(resultId, vals.status, {
      comment: vals.comment,
      defectUrl: vals.defectUrl,
      elapsedSeconds: vals.elapsedSeconds,
    });
  };

  const submit = (status: string) => {
    if (!active || runStatus !== "ACTIVE") return;
    const elapsed = Math.round((Date.now() - startedAt.current) / 1000);
    void performSubmit(
      active.id,
      status,
      { comment, defectUrl, elapsedSeconds: elapsed },
      collectCustom()
    );
    // Auto-advance to the next case (the keyboard-submit behavior).
    if (activeIdx < results.length - 1) setActiveIdx(activeIdx + 1);
  };
  // ────────────────────────────────────────────────────────────────────────

  useEffect(() => {
    startedAt.current = Date.now();
    setComment(results[activeIdx]?.comment ?? "");
    setDefectUrl(results[activeIdx]?.defectUrl ?? "");
    setShowDetails(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeIdx]);

  // L-04: presence follows the case I'm looking at.
  useEffect(() => {
    reportCase(active?.caseId ?? null);
  }, [active?.caseId, reportCase]);

  // F-36 Part C: drain the queue on the standard triggers + keep the badge in
  // sync. flush() reports conflicts and permanently-dropped items.
  useEffect(() => {
    const run = () =>
      void flush({
        onConflict: (c, item) => showConflictToast(c, item.resultId),
        onDrop: (item) =>
          setToast({
            message: `A queued result was dropped ("${item.payload.status}").`,
          }),
      });
    run(); // executor mount
    const onOnline = () => run();
    const onVis = () => {
      if (document.visibilityState === "visible") run();
    };
    window.addEventListener("online", onOnline);
    document.addEventListener("visibilitychange", onVis);
    const unsub = subscribe((c) => {
      setQueuedCount(c);
      void pendingResultIds().then(setQueuedIds);
    });
    return () => {
      window.removeEventListener("online", onOnline);
      document.removeEventListener("visibilitychange", onVis);
      unsub();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Header pill flips to a brief "All changes synced" when the queue drains.
  useEffect(() => {
    if (prevQueued.current > 0 && queuedCount === 0) {
      setShowSynced(true);
      const t = setTimeout(() => setShowSynced(false), 2500);
      prevQueued.current = queuedCount;
      return () => clearTimeout(t);
    }
    prevQueued.current = queuedCount;
  }, [queuedCount]);

  // prefers-reduced-motion gates the swipe gesture entirely (§7.4.5).
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduceMotion(mq.matches);
    const h = () => setReduceMotion(mq.matches);
    mq.addEventListener?.("change", h);
    return () => mq.removeEventListener?.("change", h);
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // F-14 keyboard shortcuts are a desktop affordance only.
      if (!window.matchMedia("(min-width: 768px)").matches) return;
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

  // Swipe left/right = next/prev. Never submits — movement and mutation stay on
  // separate gestures. Disabled under reduced motion (‹ › buttons are the
  // always-present fallback).
  const onTouchStart = (e: React.TouchEvent) => {
    if (reduceMotion) return;
    const t = e.touches[0];
    touchRef.current = { x: t.clientX, y: t.clientY, t: Date.now() };
  };
  const onTouchMove = (e: React.TouchEvent) => {
    if (reduceMotion || !touchRef.current) return;
    const t = e.touches[0];
    const dx = t.clientX - touchRef.current.x;
    const dy = t.clientY - touchRef.current.y;
    if (Math.abs(dy) > Math.abs(dx)) return; // vertical scroll wins
    setDragX(Math.max(-80, Math.min(80, dx)));
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (reduceMotion || !touchRef.current) {
      setDragX(0);
      return;
    }
    const t = e.changedTouches[0];
    const dx = t.clientX - touchRef.current.x;
    const dy = t.clientY - touchRef.current.y;
    const dur = Date.now() - touchRef.current.t;
    touchRef.current = null;
    setDragX(0);
    if (Math.abs(dx) > 56 && Math.abs(dy) < 32 && dur < 600) {
      if (dx < 0) setActiveIdx((i) => Math.min(i + 1, results.length - 1));
      else setActiveIdx((i) => Math.max(i - 1, 0));
    }
  };

  if (!results.length)
    return (
      <p className="rounded-xl border border-dashed border-slate-300 p-10 text-center text-sm text-slate-400">
        This run has no test cases.
      </p>
    );

  // <md progress strip: one segment per status across all results.
  const progressCounts: Record<string, number> = {};
  results.forEach((r) => {
    const s = view(r).status;
    progressCounts[s] = (progressCounts[s] ?? 0) + 1;
  });

  const caseRow = (r: ResultItem, i: number, onPick?: () => void) => (
    <button
      key={r.id}
      onClick={() => {
        setActiveIdx(i);
        onPick?.();
      }}
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
      {queuedIds.has(r.id) && (
        <span
          data-testid="queued-chip"
          title="Queued — will sync when online"
          className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800"
        >
          ⟳ queued
        </span>
      )}
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
  );

  return (
    <div className="pb-28 md:pb-0">
      {/* F-36: offline queue status pill. */}
      {(queuedCount > 0 || showSynced) && (
        <div
          data-testid="queue-pill"
          className={`mb-3 rounded-lg px-3 py-2 text-sm font-medium ${
            queuedCount > 0
              ? "bg-amber-100 text-amber-800"
              : "bg-green-100 text-green-800"
          }`}
        >
          {queuedCount > 0
            ? `${queuedCount} queued — will sync when online`
            : "All changes synced"}
        </div>
      )}

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

      {/* F-36 Part D: mobile top bar — position, prev/next, progress strip. */}
      <div className="sticky top-12 z-20 -mx-4 mb-3 bg-slate-900 text-white md:hidden">
        <div className="flex items-center justify-between px-3 py-2">
          <BackLink href={`/projects/${projectSlug}/runs`} variant="dark">Runs</BackLink>
          <button
            onClick={() => setSheetOpen(true)}
            data-testid="mobile-position"
            className="font-mono text-sm"
          >
            {activeIdx + 1} / {results.length}
          </button>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setActiveIdx((i) => Math.max(0, i - 1))}
              data-testid="mobile-prev"
              aria-label="Previous case"
              className="grid h-8 w-8 place-items-center rounded text-lg hover:bg-slate-800"
            >
              ‹
            </button>
            <button
              onClick={() =>
                setActiveIdx((i) => Math.min(results.length - 1, i + 1))
              }
              data-testid="mobile-next"
              aria-label="Next case"
              className="grid h-8 w-8 place-items-center rounded text-lg hover:bg-slate-800"
            >
              ›
            </button>
          </div>
        </div>
        <div className="flex h-1.5 overflow-hidden" data-testid="mobile-progress">
          {Object.entries(progressCounts).map(([st, n]) => (
            <span
              key={st}
              style={{
                width: `${(n / results.length) * 100}%`,
                backgroundColor: meta.colorOf(st),
              }}
            />
          ))}
        </div>
      </div>

      <div className="flex gap-6">
        {/* Case list — desktop rail (hidden on mobile; the bottom sheet is the
            mobile escape hatch). */}
        <div
          className="hidden w-2/5 shrink-0 space-y-1 overflow-y-auto rounded-xl border border-slate-200 bg-white p-3 md:block"
          style={{ maxHeight: "calc(100vh - 280px)" }}
        >
          {results.map((r, i) => caseRow(r, i))}
        </div>

        {/* Active case detail + submission */}
        <div className="min-w-0 flex-1 space-y-4">
          <div
            className="rounded-xl border border-slate-200 bg-white p-6 motion-safe:transition-transform"
            style={{ transform: dragX ? `translateX(${dragX}px)` : undefined }}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
          >
            <div className="flex items-center justify-between">
              <p className="font-mono text-xs text-slate-400">{active.displayId}</p>
              <span className="flex items-center gap-2">
                {queuedIds.has(active.id) && (
                  <span
                    data-testid="queued-chip-detail"
                    className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800"
                  >
                    ⟳ queued
                  </span>
                )}
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
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${PRIORITY_BADGES[active.priority]}`}
                >
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
                <li key={i} className="flex gap-2 text-base md:text-sm">
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
                    <Markdown className="text-base md:text-sm">{s.action}</Markdown>
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

            {/* F-36 Part D: <md, the auxiliary panels collapse behind one
                disclosure — the 90% path is read-steps → tap-status. */}
            <button
              type="button"
              onClick={() => setShowDetails((s) => !s)}
              data-testid="mobile-details-toggle"
              className="mt-4 flex w-full items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 md:hidden"
            >
              Details <span>{showDetails ? "▲" : "▼"}</span>
            </button>

            <div className={`${showDetails ? "block" : "hidden"} md:block`}>
              {/* F-01: evidence attachments per result. key remounts on switch. */}
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
          </div>

          {runStatus === "ACTIVE" ? (
            <div className="md:rounded-xl md:border md:border-slate-200 md:bg-white md:p-6">
              {/* F-02 notes + defect URL + F-03 custom fields collapse with the
                  aux disclosure on mobile (desktop shows them inline). */}
              <div className={`${showDetails ? "block" : "hidden"} md:block`}>
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
              </div>
              {/* F-32: a prerequisite failed/blocked in this run — suggest, never
                  apply automatically. Accepting is the normal BLOCKED submit. */}
              {active.blockedSuggestion && (
                <div
                  className="mt-3 flex items-center justify-between gap-3 rounded-lg bg-orange-50 px-3 py-2 text-sm text-orange-800"
                  data-testid="blocked-suggestion"
                >
                  <span>
                    Prerequisite <b>{active.blockedSuggestion.prereqDisplayId}</b>{" "}
                    {active.blockedSuggestion.prereqTitle} is failed/blocked in this run.
                  </span>
                  <button
                    type="button"
                    onClick={() => submit("BLOCKED")}
                    disabled={busy}
                    data-testid="blocked-suggestion-accept"
                    className="shrink-0 rounded-lg border border-orange-300 bg-white px-2.5 py-1 text-xs font-medium text-orange-700 hover:bg-orange-100 disabled:opacity-50"
                  >
                    Accept — mark BLOCKED
                  </button>
                </div>
              )}
              {/* F-14: desktop status buttons; shortcut = first letter of the
                  label, earlier order wins conflicts (shown in tooltip). The
                  thumb-zone bottom bar replaces these on mobile. */}
              <div className="mt-3 hidden flex-wrap gap-2 md:flex">
                {buttons.map((d) => {
                  const letter = shortcutOf(d.key);
                  return (
                    <button
                      key={d.key}
                      onClick={() => submit(d.key)}
                      disabled={busy}
                      data-testid={`submit-status-${d.key}`}
                      title={letter ? `Shortcut: ${letter.toUpperCase()}` : d.label}
                      className="rounded-lg px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
                      style={{ backgroundColor: d.color }}
                    >
                      {glyphFor(d)} {d.label}
                      {letter && (
                        <kbd className="ml-1 rounded bg-black/20 px-1 text-xs">
                          {letter.toUpperCase()}
                        </kbd>
                      )}
                    </button>
                  );
                })}
              </div>
              <p className="mt-3 hidden text-xs text-slate-400 md:block">
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

      {/* F-36 Part D: thumb-zone status bar (mobile only, ACTIVE runs). Filled
          at full opacity — sunlight on a lab floor needs contrast, not pastel. */}
      {runStatus === "ACTIVE" && (
        <div
          data-testid="mobile-status-bar"
          className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white p-2 md:hidden"
          style={{ paddingBottom: "calc(0.5rem + env(safe-area-inset-bottom))" }}
        >
          <div className="grid grid-cols-2 gap-2">
            {buttons.map((d) => (
              <button
                key={d.key}
                onClick={() => submit(d.key)}
                disabled={busy}
                data-testid={`mobile-submit-${d.key}`}
                className="flex items-center justify-center gap-1.5 rounded-xl px-3 text-sm font-semibold disabled:opacity-50"
                style={{
                  minHeight: 52,
                  backgroundColor: d.color,
                  color: onColorOf(d.color),
                }}
              >
                {glyphFor(d)} {d.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* F-36 Part D: full case list as a bottom sheet (random-access escape
          hatch — walking testers mostly go next-next-next). */}
      {sheetOpen && (
        <div className="fixed inset-0 z-40 md:hidden" data-testid="mobile-sheet">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setSheetOpen(false)}
            aria-hidden
          />
          <div className="absolute inset-x-0 bottom-0 max-h-[80vh] overflow-y-auto rounded-t-2xl bg-white p-3">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-sm font-semibold">Cases</h3>
              <button
                onClick={() => setSheetOpen(false)}
                className="text-sm text-slate-400"
              >
                Close
              </button>
            </div>
            <div className="space-y-1">
              {results.map((r, i) => caseRow(r, i, () => setSheetOpen(false)))}
            </div>
          </div>
        </div>
      )}

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
