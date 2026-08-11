"use client";

import { useEffect, useState } from "react";
import {
  PROGRESS_EVENT,
  countDone,
  markDone,
  markNotDone,
  readProgress,
} from "@/lib/academy/progress";

/**
 * Progress lives in `localStorage`, which the server cannot see. Rendering it
 * during SSR would guarantee a hydration mismatch, so both components below
 * render their server-safe shape first and fill in after mount. `mounted` is
 * the flag; there is no way around it short of moving progress to a cookie,
 * which would send it on every request for no benefit.
 */
function useProgressTick(): boolean {
  const [mounted, setMounted] = useState(false);
  const [, force] = useState(0);
  useEffect(() => {
    setMounted(true);
    const onChange = () => force((n) => n + 1);
    window.addEventListener(PROGRESS_EVENT, onChange);
    window.addEventListener("storage", onChange); // other tabs
    return () => {
      window.removeEventListener(PROGRESS_EVENT, onChange);
      window.removeEventListener("storage", onChange);
    };
  }, []);
  return mounted;
}

/** Bar + "n of m done" for a track. `lessonSlugs` comes from the server. */
export function TrackProgress({
  lessonSlugs,
  className = "",
}: {
  lessonSlugs: string[];
  className?: string;
}) {
  const mounted = useProgressTick();
  const total = lessonSlugs.length;
  const done = mounted ? countDone(lessonSlugs) : 0;
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);

  return (
    <div className={className} data-testid="track-progress">
      <div className="flex items-center justify-between text-xs text-content-muted">
        <span>
          {mounted ? `${done} of ${total} lessons done` : `${total} lessons`}
        </span>
        {mounted && done > 0 && <span className="tabular-nums">{pct}%</span>}
      </div>
      <div
        className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-surface-muted"
        role="progressbar"
        aria-valuenow={done}
        aria-valuemin={0}
        aria-valuemax={total}
        aria-label="Track progress"
      >
        <div
          className="h-full rounded-full bg-accent motion-safe:transition-[width] motion-safe:duration-panel motion-safe:ease-tf-out"
          style={{ width: `${pct}%` }}
        />
      </div>
      {mounted && (
        <p className="mt-1.5 text-[11px] text-content-subtle">
          Saved in this browser only. Sign-in sync is coming.
        </p>
      )}
    </div>
  );
}

/** "Mark as done" for one lesson. */
export function LessonDoneToggle({ lessonSlug }: { lessonSlug: string }) {
  const mounted = useProgressTick();
  const done = mounted ? Boolean(readProgress()[lessonSlug]) : false;

  return (
    <button
      type="button"
      data-testid="lesson-done-toggle"
      aria-pressed={done}
      onClick={() => (done ? markNotDone(lessonSlug) : markDone(lessonSlug))}
      className={`inline-flex min-h-[44px] items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium ${
        done
          ? "border-accent-ring bg-accent-soft text-accent-soft-fg"
          : "border-hairline bg-surface text-content hover:bg-surface-muted"
      }`}
    >
      <span
        aria-hidden
        className={`grid h-4 w-4 place-items-center rounded border text-[10px] ${
          done ? "border-current" : "border-hairline-strong"
        }`}
      >
        {done ? "✓" : ""}
      </span>
      {done ? "Done" : "Mark as done"}
    </button>
  );
}
