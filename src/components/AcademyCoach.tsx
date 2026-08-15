"use client";

import { Suspense, useEffect, useRef, useState } from "react";
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

// A-11d: `selfChecked` carries the ticked criteria of a self-assessed exercise.
// It lives here rather than in component state because that exercise is the one
// the learner leaves the app to do — Postman, an editor, Settings → API Keys —
// and losing the checklist on the way back would make it useless.
type ActiveTask = {
  lessonSlug: string;
  startedAtIso: string;
  selfChecked?: number[];
};

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
  const panelRef = useRef<HTMLElement | null>(null);
  const [result, setResult] = useState<CheckResult | { error: string } | null>(null);
  const [pending, setPending] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [selfDone, setSelfDone] = useState(false);

  // A-11d: a self-assessed exercise is done off-platform, so scoping its panel
  // to the sandbox project would drop the checklist the moment the learner went
  // to Settings → API Keys — which its own criteria tell them to do. Every
  // other kind keeps the A-04b rule, because their work *is* in the project.
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
      const candidate = prev ?? readActive();
      if (!candidate) return null;
      // Resolved from the candidate rather than from component state, because
      // the case this exists for is a *fresh mount* on a page outside the
      // sandbox — `prev` is null there and only sessionStorage knows which
      // exercise is running.
      const isSelf = getSandboxTask(candidate.lessonSlug)?.target.kind === "self";
      if (!inSandbox && !isSelf) return null;
      return candidate;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paramLesson, pathname]);

  // A-11a: the panel is `position: fixed` in the bottom-right corner, so it sits
  // *on top of* whatever the page put there. That was harmless for the five T1
  // exercises, which all land on a tall form whose controls are nowhere near
  // that corner — and it stopped being harmless with the first exercise that
  // lands on a short settings page: on the sandbox's sharing panel the coach
  // covers "Make this project public", the one button the exercise asks the
  // learner to press. Found by TC-E2E-128, not by looking at it.
  //
  // Reserving the space is the general fix: while the panel is docked, the page
  // gets bottom padding equal to its height, so anything underneath can be
  // scrolled clear of it. Measured rather than hardcoded — the panel grows with
  // the criteria list, the hint and the feedback. Above the early returns
  // below, because a hook may not run conditionally; `panelRef.current` is null
  // whenever the panel is not rendered, which the guard covers.
  useEffect(() => {
    const el = panelRef.current;
    if (collapsed || !el) return;

    const apply = () =>
      document.body.style.setProperty(
        "padding-bottom",
        `${el.getBoundingClientRect().height + 32}px`,
      );
    apply();

    const observer = new ResizeObserver(apply);
    observer.observe(el);
    return () => {
      observer.disconnect();
      document.body.style.removeProperty("padding-bottom");
    };
  }, [collapsed, active, result, showHint]);

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

  // A-11d ------------------------------------------------------------------
  const isSelf = task.target.kind === "self";
  const ticked = active.selfChecked ?? [];
  const allTicked = ticked.length === task.criteria.length;

  function toggleCriterion(index: number) {
    setActive((prev) => {
      if (!prev) return prev;
      const set = new Set(prev.selfChecked ?? []);
      if (set.has(index)) set.delete(index);
      else set.add(index);
      const next = { ...prev, selfChecked: Array.from(set) };
      writeActive(next);
      return next;
    });
  }

  /**
   * The decision this whole target kind turns on: progress is recorded exactly
   * as a checked exercise records it (the owner's call — a self-assessed lesson
   * counts the same, and "Mark done anyway" already meant the product accepted
   * unverified completion), but the panel never says "passed". It says the
   * learner marked it done, because that is the only thing that happened.
   */
  function markSelfDone() {
    markDone(active!.lessonSlug, task!.trackSlug);
    setSelfDone(true);
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
      ref={panelRef}
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

      {isSelf ? (
        <>
          <p className="mt-2.5 text-xs font-medium text-content-muted">
            This one is yours to assess — nothing here is sent to a checker.
          </p>
          <ul
            data-testid="academy-coach-self-list"
            className="mt-1.5 space-y-1.5 text-xs text-content"
          >
            {task.criteria.map((c, i) => (
              <li key={c}>
                <label className="flex cursor-pointer items-start gap-2">
                  <input
                    type="checkbox"
                    data-testid={`academy-coach-self-${i}`}
                    checked={ticked.includes(i)}
                    onChange={() => toggleCriterion(i)}
                    className="mt-0.5 h-3.5 w-3.5 shrink-0 rounded border-hairline accent-accent"
                  />
                  <span>{c}</span>
                </label>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <ul className="mt-2.5 space-y-1 text-xs text-content-muted">
          {task.criteria.map((c) => (
            <li key={c} className="flex gap-1.5">
              <span aria-hidden>•</span>
              <span>{c}</span>
            </li>
          ))}
        </ul>
      )}

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

      {selfDone && (
        <div
          data-testid="academy-coach-self-result"
          className="mt-3 rounded-lg bg-success-soft p-2.5 text-xs text-success-soft-fg"
        >
          <p className="font-medium">You have marked this done.</p>
          <p className="mt-1">
            Nothing was verified — this lesson&apos;s exercise happens outside
            TestForge, and the criteria above are the standard you held yourself
            to. It counts toward the track either way.
          </p>
        </div>
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
        {isSelf ? (
          // No "Check my work": there is nothing to check, and offering the
          // button would imply otherwise. The gate is the learner's own
          // checklist, which is also why this is disabled rather than hidden —
          // it has to be visible for the ticking to have a point.
          !selfDone && (
            <button
              type="button"
              data-testid="academy-coach-self-done"
              disabled={!allTicked}
              onClick={markSelfDone}
              className="min-h-[36px] rounded-lg bg-accent px-3 py-1.5 text-xs font-medium text-white hover:bg-accent-hover disabled:opacity-50"
            >
              {allTicked
                ? "Mark this done"
                : `Tick all ${task.criteria.length} to mark done`}
            </button>
          )
        ) : (
          <>
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
          </>
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
