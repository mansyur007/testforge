"use client";

import Link from "next/link";
import { useProgressTick } from "@/components/AcademyProgress";
import { readProgress } from "@/lib/academy/progress";
import type { Lang } from "@/lib/i18n";
import { academyChrome } from "@/lib/academy/chrome";

/** What the rail needs to know about a lesson. Deliberately not `Lesson` from
 *  `@/content/academy` — that module is `server-only` (it carries the answer
 *  key), and a client component must never be the thing that pulls it in. */
export type RailLesson = {
  slug: string;
  title: string;
  minutes: number;
};

/**
 * The lesson rail, with each lesson's state on it.
 *
 * Progress has been stored per lesson since A-05, but the rail never read it —
 * it marked the page you were on and nothing else, so the one place that could
 * answer "how far in am I" showed thirteen identical rows. It reads it now.
 *
 * State is written rather than drawn: "Done" / "Reading now" / a duration.
 * That is the editorial treatment's rule, and it happens to be the accessible
 * one too — a tick that only exists as a colour is invisible to a screen
 * reader, and `aria-current` alone does not say "you finished this one".
 *
 * Client component because `readProgress()` is `localStorage`, which the
 * server cannot see; the first paint is the server-safe shape (no state at
 * all) and the states appear on mount. See `AcademyProgress.tsx`.
 */
export function LessonRail({
  lessons,
  trackPath,
  currentSlug,
  lang,
}: {
  lessons: RailLesson[];
  trackPath: string;
  currentSlug?: string;
  lang: Lang;
}) {
  const t = academyChrome[lang];
  const mounted = useProgressTick();
  const progress = mounted ? readProgress() : {};
  const done = lessons.filter((l) => progress[l.slug]).length;

  return (
    <ol className="mt-4 border-t border-hairline">
      {lessons.map((l, i) => {
        const isCurrent = l.slug === currentSlug;
        const isDone = Boolean(progress[l.slug]);
        return (
          <li key={l.slug} className="border-b border-hairline-subtle">
            <Link
              href={`${trackPath}/${l.slug}`}
              aria-current={isCurrent ? "page" : undefined}
              className={`-ml-3 flex gap-3 border-l-2 py-2 pl-3 pr-1 ${
                isCurrent
                  ? "border-accent"
                  : "border-transparent hover:border-hairline-strong"
              }`}
            >
              <span
                className={`mt-px font-mono text-[11px] tabular-nums ${
                  isCurrent ? "text-accent-text" : "text-content-subtle"
                }`}
              >
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="min-w-0 flex-1">
                <span
                  className={`block text-[15px] leading-snug ${
                    isCurrent
                      ? "font-medium text-content-strong"
                      : isDone
                        ? "text-content-muted"
                        : "text-content"
                  }`}
                >
                  {l.title}
                </span>
                <span
                  className={`mt-0.5 block font-mono text-[10px] uppercase tracking-[0.12em] ${
                    isCurrent
                      ? "text-accent-text"
                      : isDone
                        ? "text-success"
                        : "text-content-subtle"
                  }`}
                >
                  {isCurrent
                    ? t.progress.reading
                    : isDone
                      ? t.progress.done
                      : t.minutesShort(l.minutes)}
                </span>
              </span>
            </Link>
          </li>
        );
      })}
      {mounted && done > 0 && (
        <li className="pt-3 font-mono text-[10px] uppercase tracking-[0.12em] text-content-subtle">
          {t.progress.doneOf(done, lessons.length)}
        </li>
      )}
    </ol>
  );
}
