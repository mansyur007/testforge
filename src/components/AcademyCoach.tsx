"use client";

import { Suspense, useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import Link from "next/link";
import { TFIcon } from "@/components/icons";
import { getSandboxTask } from "@/content/academy/sandbox";
import { verifyTask } from "@/app/actions/academy";
import { markDone } from "@/lib/academy/progress";
import type { CheckResult } from "@/lib/academy/types";

// A-04b: the coach overlay. Mounted once in src/app/(app)/layout.tsx, and
// `null` unless there is an active exercise — most pages render nothing here.
//
// The tricky part is not the panel, it's staying docked. A lesson's "Start
// this exercise" button lands on `/projects/<sandbox>/cases/new?academy=<slug>`,
// but `createCase` redirects to the new case's own page on save (src/app/
// actions/cases.ts), which drops the query string. A coach that vanished the
// moment the learner hit Save would be useless for the one action that
// matters. So the active lesson is mirrored into `sessionStorage`
// (`tf_academy_active`) and stays docked for as long as the learner is
// anywhere under their sandbox project — not just on the exact URL the query
// param first arrived on — until they hit "Back to lesson" or leave the
// sandbox entirely.

const STORAGE_KEY = "tf_academy_active";

type ActiveTask = { lessonSlug: string; startedAtIso: string };

function readActive(): ActiveTask | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    if (
      parsed &&
      typeof parsed === "object" &&
      typeof (parsed as ActiveTask).lessonSlug === "string" &&
      typeof (parsed as ActiveTask).startedAtIso === "string"
    ) {
      return parsed as ActiveTask;
    }
  } catch {
    /* corrupt value — treat as no active task */
  }
  return null;
}

function writeActive(task: ActiveTask | null) {
  if (typeof window === "undefined") return;
  try {
    if (task) window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(task));
    else window.sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    /* storage unavailable — the panel just won't survive a redirect */
  }
}

function AcademyCoachInner({ sandboxSlug }: { sandboxSlug: string | null }) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const paramLesson = searchParams.get("academy");

  const [active, setActive] = useState<ActiveTask | null>(null);
  const [collapsed, setCollapsed] = useState(false);
  const [result, setResult] = useState<CheckResult | { error: string } | null>(null);
  const [pending, setPending] = useState(false);
  const [showHint, setShowHint] = useState(false);

  const inSandbox = Boolean(sandboxSlug) && pathname.startsWith(`/projects/${sandboxSlug}`);

  useEffect(() => {
    if (paramLesson) {
      // A new (or re-opened) exercise — start a fresh attempt clock, unless
      // it's the same lesson the panel was already tracking, in which case
      // reopening the same URL (a refresh, or navigating back to the "Start
      // this exercise" link a second time to add another case) must not reset
      // "since" and let a case created a minute ago suddenly fail to count.
      // Checked against sessionStorage, not just component state — a full
      // reload remounts this component and empties the state, but the whole
      // point of sessionStorage here is to survive exactly that.
      setActive((prev) => {
        if (prev?.lessonSlug === paramLesson) return prev;
        const stored = readActive();
        if (stored?.lessonSlug === paramLesson) return stored;
        const next = { lessonSlug: paramLesson, startedAtIso: new Date().toISOString() };
        writeActive(next);
        return next;
      });
      setResult(null);
      return;
    }
    // No param on this page: keep showing the panel while the learner is
    // still somewhere in their sandbox project, otherwise pick up whatever
    // was stored (first mount after a redirect) or hide.
    setActive((prev) => {
      if (prev && inSandbox) return prev;
      const stored = readActive();
      if (stored && inSandbox) return stored;
      if (!inSandbox) return null;
      return prev;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paramLesson, pathname]);

  if (!active) return null;
  const task = getSandboxTask(active.lessonSlug);
  if (!task) return null;

  function dismiss() {
    writeActive(null);
    setActive(null);
    setResult(null);
  }

  async function check() {
    if (!active) return;
    setPending(true);
    setResult(null);
    try {
      const r = await verifyTask(active.lessonSlug, active.startedAtIso);
      setResult(r);
      if ("passed" in r && r.passed) markDone(active.lessonSlug, task!.trackSlug);
    } catch {
      setResult({ error: "Couldn't reach the server. Try again." });
    } finally {
      setPending(false);
    }
  }

  function markDoneAnyway() {
    markDone(active!.lessonSlug, task!.trackSlug);
    setResult({ passed: true, feedback: ["Marked done — the checker was skipped."] });
  }

  if (collapsed) {
    return (
      <button
        type="button"
        data-testid="academy-coach-expand"
        onClick={() => setCollapsed(false)}
        className="fixed bottom-4 right-4 z-[45] flex items-center gap-2 rounded-full bg-accent px-4 py-3 text-sm font-medium text-white shadow-lg hover:bg-accent-hover"
      >
        <TFIcon name="target" className="h-4 w-4" />
        Exercise
      </button>
    );
  }

  return (
    <aside
      data-testid="academy-coach"
      data-lesson={active.lessonSlug}
      className="fixed bottom-4 right-4 z-[45] w-[min(22rem,calc(100vw-2rem))] rounded-2xl border border-hairline bg-surface p-4 shadow-xl"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <TFIcon name="target" className="h-4 w-4 shrink-0 text-accent-text" />
          <p className="text-xs font-semibold uppercase tracking-wide text-content-muted">
            Sandbox exercise
          </p>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            data-testid="academy-coach-collapse"
            onClick={() => setCollapsed(true)}
            aria-label="Minimise"
            className="rounded p-1 text-content-muted hover:bg-surface-muted"
          >
            –
          </button>
        </div>
      </div>

      <h2 className="mt-1.5 text-sm font-semibold text-content-strong">
        {task.lessonTitle}
      </h2>
      <p className="mt-1 text-sm text-content">{task.task}</p>

      <ul className="mt-2.5 space-y-1 text-xs text-content-muted">
        {task.criteria.map((c) => (
          <li key={c} className="flex gap-1.5">
            <span aria-hidden>•</span>
            <span>{c}</span>
          </li>
        ))}
      </ul>

      {!showHint ? (
        <button
          type="button"
          data-testid="academy-coach-hint-toggle"
          onClick={() => setShowHint(true)}
          className="mt-2 text-xs font-medium text-accent-text hover:underline"
        >
          Need a hint?
        </button>
      ) : (
        <p data-testid="academy-coach-hint" className="mt-2 rounded-lg bg-surface-muted p-2 text-xs text-content">
          {task.hint}
        </p>
      )}

      {result && (
        <div
          data-testid="academy-coach-result"
          className={`mt-3 rounded-lg p-2.5 text-xs ${
            "passed" in result && result.passed
              ? "bg-success-soft text-success-soft-fg"
              : "bg-danger-soft text-danger-soft-fg"
          }`}
        >
          {"error" in result ? (
            <p>{result.error}</p>
          ) : (
            <>
              <p className="font-medium">{result.passed ? "Nice — that passes." : "Not yet."}</p>
              <ul className="mt-1 space-y-1">
                {result.feedback.map((f, i) => (
                  <li key={i}>{f}</li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          data-testid="academy-coach-check"
          disabled={pending}
          onClick={check}
          className="min-h-[36px] rounded-lg bg-accent px-3 py-1.5 text-xs font-medium text-white hover:bg-accent-hover disabled:opacity-50"
        >
          {pending ? "Checking…" : "Check my work"}
        </button>
        {!(result && "passed" in result && result.passed) && (
          <button
            type="button"
            data-testid="academy-coach-mark-done"
            onClick={markDoneAnyway}
            className="min-h-[36px] rounded-lg border border-hairline px-3 py-1.5 text-xs font-medium text-content hover:bg-surface-muted"
          >
            Mark done anyway
          </button>
        )}
        <Link
          href={`/academy/${task.trackSlug}/${active.lessonSlug}`}
          data-testid="academy-coach-back"
          onClick={dismiss}
          className="ml-auto text-xs font-medium text-content-muted hover:text-accent-text"
        >
          Back to lesson
        </Link>
      </div>
    </aside>
  );
}

export function AcademyCoach({ sandboxSlug }: { sandboxSlug: string | null }) {
  return (
    <Suspense fallback={null}>
      <AcademyCoachInner sandboxSlug={sandboxSlug} />
    </Suspense>
  );
}
