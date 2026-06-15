"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { submitResult } from "@/app/actions/runs";
import { RESULT_BADGES, PRIORITY_BADGES, type TestStep } from "@/lib/constants";

type ResultItem = {
  id: string;
  status: string;
  comment: string;
  defectUrl: string;
  elapsedSeconds: number | null;
  assigneeName: string | null;
  displayId: string;
  title: string;
  priority: string;
  preconditions: string;
  expectedResult: string;
  steps: TestStep[];
};

// Eksekusi test run (PRD §4.3.3 + US-002):
// inline submission, keyboard shortcut P/F/B/S, timer per case, partial run.
export function RunExecutor({
  results,
  runStatus,
}: {
  results: ResultItem[];
  runStatus: string;
}) {
  const [activeIdx, setActiveIdx] = useState(0);
  const [comment, setComment] = useState("");
  const [defectUrl, setDefectUrl] = useState("");
  const [isPending, startTransition] = useTransition();
  const startedAt = useRef<number>(Date.now());
  const active = results[activeIdx];

  useEffect(() => {
    startedAt.current = Date.now();
    setComment(results[activeIdx]?.comment ?? "");
    setDefectUrl(results[activeIdx]?.defectUrl ?? "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeIdx]);

  const submit = (status: string) => {
    if (!active || runStatus !== "ACTIVE") return;
    const elapsed = Math.round((Date.now() - startedAt.current) / 1000);
    const fd = new FormData();
    fd.set("resultId", active.id);
    fd.set("status", status);
    fd.set("comment", comment);
    fd.set("defectUrl", defectUrl);
    fd.set("elapsedSeconds", String(elapsed));
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
      if (key === "p") submit("PASSED");
      else if (key === "f") submit("FAILED");
      else if (key === "b") submit("BLOCKED");
      else if (key === "s") submit("SKIPPED");
      else if (key === "r") submit("RETEST");
      else if (key === "j" || e.key === "ArrowDown")
        setActiveIdx((i) => Math.min(i + 1, results.length - 1));
      else if (key === "k" || e.key === "ArrowUp")
        setActiveIdx((i) => Math.max(i - 1, 0));
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeIdx, comment, defectUrl, results.length, runStatus]);

  if (!results.length)
    return (
      <p className="rounded-xl border border-dashed border-slate-300 p-10 text-center text-sm text-slate-400">
        This run has no test cases.
      </p>
    );

  return (
    <div className="flex gap-6">
      {/* Case list */}
      <div className="w-2/5 shrink-0 space-y-1 overflow-y-auto rounded-xl border border-slate-200 bg-white p-3"
        style={{ maxHeight: "calc(100vh - 280px)" }}>
        {results.map((r, i) => (
          <button
            key={r.id}
            onClick={() => setActiveIdx(i)}
            className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm ${
              i === activeIdx ? "bg-indigo-50 ring-1 ring-indigo-300" : "hover:bg-slate-50"
            }`}
          >
            <span className="font-mono text-xs text-slate-400">{r.displayId}</span>
            <span className="flex-1 truncate">{r.title}</span>
            <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${RESULT_BADGES[r.status]}`}>
              {r.status}
            </span>
          </button>
        ))}
      </div>

      {/* Active case detail + submission */}
      <div className="min-w-0 flex-1 space-y-4">
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <div className="flex items-center justify-between">
            <p className="font-mono text-xs text-slate-400">{active.displayId}</p>
            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${PRIORITY_BADGES[active.priority]}`}>
              {active.priority}
            </span>
          </div>
          <h3 className="mt-1 text-lg font-bold">{active.title}</h3>
          {active.preconditions && (
            <div className="mt-3 rounded-lg bg-amber-50 p-3 text-sm">
              <span className="font-medium text-amber-800">Preconditions: </span>
              <span className="whitespace-pre-wrap text-amber-900">{active.preconditions}</span>
            </div>
          )}
          <ol className="mt-4 space-y-2">
            {active.steps.map((s, i) => (
              <li key={i} className="flex gap-2 text-sm">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-600">
                  {i + 1}
                </span>
                <div>
                  <p className="whitespace-pre-wrap">{s.action}</p>
                  {s.expected && (
                    <p className="whitespace-pre-wrap text-xs text-slate-500">↳ {s.expected}</p>
                  )}
                </div>
              </li>
            ))}
          </ol>
          {active.expectedResult && (
            <div className="mt-4 rounded-lg bg-green-50 p-3 text-sm">
              <span className="font-medium text-green-800">Expected: </span>
              <span className="whitespace-pre-wrap text-green-900">{active.expectedResult}</span>
            </div>
          )}
          {active.assigneeName && (
            <p className="mt-3 text-xs text-slate-400">
              Last executed by {active.assigneeName}
              {active.elapsedSeconds != null && <> · {active.elapsedSeconds}s</>}
            </p>
          )}
        </div>

        {runStatus === "ACTIVE" ? (
          <div className="rounded-xl border border-slate-200 bg-white p-6">
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={2}
              placeholder="Execution notes (optional)..."
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
            />
            <input
              value={defectUrl}
              onChange={(e) => setDefectUrl(e.target.value)}
              placeholder="Bug report URL if failed (Jira/GitHub Issue)..."
              className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
            />
            <div className="mt-3 flex flex-wrap gap-2">
              <button onClick={() => submit("PASSED")} disabled={isPending}
                className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50">
                ✓ Pass <kbd className="ml-1 rounded bg-green-700 px-1 text-xs">P</kbd>
              </button>
              <button onClick={() => submit("FAILED")} disabled={isPending}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50">
                ✕ Fail <kbd className="ml-1 rounded bg-red-700 px-1 text-xs">F</kbd>
              </button>
              <button onClick={() => submit("BLOCKED")} disabled={isPending}
                className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600 disabled:opacity-50">
                ⊘ Blocked <kbd className="ml-1 rounded bg-orange-600 px-1 text-xs">B</kbd>
              </button>
              <button onClick={() => submit("SKIPPED")} disabled={isPending}
                className="rounded-lg bg-gray-400 px-4 py-2 text-sm font-medium text-white hover:bg-gray-500 disabled:opacity-50">
                → Skip <kbd className="ml-1 rounded bg-gray-500 px-1 text-xs">S</kbd>
              </button>
              <button onClick={() => submit("RETEST")} disabled={isPending}
                className="rounded-lg bg-purple-500 px-4 py-2 text-sm font-medium text-white hover:bg-purple-600 disabled:opacity-50">
                ↻ Retest <kbd className="ml-1 rounded bg-purple-600 px-1 text-xs">R</kbd>
              </button>
            </div>
            <p className="mt-3 text-xs text-slate-400">
              ⌨️ Shortcuts: P/F/B/S/R to submit · J/K or ↑↓ to navigate · Timer runs automatically per case
            </p>
          </div>
        ) : (
          <p className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-center text-sm text-slate-500">
            This run is complete — results are read-only.
          </p>
        )}
      </div>
    </div>
  );
}
