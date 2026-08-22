"use client";

import Link from "next/link";
import { useProgressTick } from "@/components/AcademyProgress";
import { readProgress } from "@/lib/academy/progress";
import type { Lang } from "@/lib/i18n";
import { academyChrome } from "@/lib/academy/chrome";

/** See `RailLesson` for why this is a local type and not `Lesson`. */
export type IndexLesson = {
  slug: string;
  title: string;
  summary: string;
  minutes: number;
  sandbox?: boolean;
};

/**
 * The track's lesson index — the one list of lessons on the track page, now
 * that the rail no longer duplicates it there.
 *
 * Ruled rows rather than bordered cards: thirteen cards of identical weight
 * read as thirteen equally important things, which is the opposite of a
 * curriculum. A rule between rows says "list", a number in the margin says
 * "in this order", and the right-hand column says where the reader stands.
 */
export function TrackIndex({
  lessons,
  trackPath,
  lang,
}: {
  lessons: IndexLesson[];
  trackPath: string;
  lang: Lang;
}) {
  const t = academyChrome[lang];
  const mounted = useProgressTick();
  const progress = mounted ? readProgress() : {};
  // Where to resume: the first lesson not yet done. Nothing is marked "next"
  // before mount, and nothing is once the track is finished.
  const nextSlug = mounted
    ? lessons.find((l) => !progress[l.slug])?.slug
    : undefined;

  return (
    <ol className="mt-5 border-t border-hairline">
      {lessons.map((l, i) => {
        const isDone = Boolean(progress[l.slug]);
        const isNext = l.slug === nextSlug;
        return (
          <li key={l.slug} className="border-b border-hairline">
            <Link
              href={`${trackPath}/${l.slug}`}
              data-testid={`academy-lesson-${l.slug}`}
              className="group grid grid-cols-[2rem_minmax(0,1fr)] items-baseline gap-x-4 py-4 sm:grid-cols-[2rem_minmax(0,1fr)_7rem]"
            >
              <span className="font-mono text-[11px] tabular-nums text-content-subtle">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="min-w-0">
                <span className="block font-display text-[17px] font-semibold leading-snug text-content-strong group-hover:text-accent-text">
                  {l.title}
                </span>
                <span className="mt-1 block text-sm leading-relaxed text-content-muted">
                  {l.summary}
                </span>
              </span>
              <span className="col-start-2 mt-2 flex items-baseline gap-3 font-mono text-[10px] uppercase tracking-[0.12em] sm:col-start-3 sm:mt-0 sm:flex-col sm:items-end sm:gap-1 sm:text-right">
                <span
                  className={
                    isDone
                      ? "text-success"
                      : isNext
                        ? "text-accent-text"
                        : "text-content-subtle"
                  }
                >
                  {isDone
                    ? t.progress.done
                    : isNext
                      ? t.progress.upNext
                      : l.sandbox
                        ? t.handsOn
                        : ""}
                </span>
                <span className="text-content-subtle">
                  {t.minutesShort(l.minutes)}
                </span>
              </span>
            </Link>
          </li>
        );
      })}
    </ol>
  );
}
