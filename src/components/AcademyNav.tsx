import Link from "next/link";
import { TFIcon } from "@/components/icons";
import type { Lang } from "@/lib/i18n";
import { academyChrome, academyPath, formatMinutesIn } from "@/lib/academy/chrome";
import { LessonRail } from "@/components/academy/LessonRail";
import type { Lesson, Track } from "@/content/academy";

/** "45 min" / "1h 20m" — tracks run to several hours, so bare minutes stop
 *  reading as a commitment somewhere around 90.
 *
 *  A-08 moved the real implementation to `formatMinutesIn(lang, n)`; this is
 *  the English call, kept because several non-Academy callers use it and
 *  threading a language through them is not this work order's change. */
export function formatMinutes(total: number): string {
  return formatMinutesIn("en", total);
}

/** Wrench chip marking a lesson with a sandbox exercise. */
export function SandboxBadge({
  className = "",
  lang = "en",
}: {
  className?: string;
  lang?: Lang;
}) {
  const t = academyChrome[lang];
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md bg-accent-soft px-1.5 py-0.5 text-[11px] font-medium text-accent-soft-fg ${className}`}
      title={t.handsOnTitle}
    >
      <TFIcon name="edit" className="h-3 w-3" />
      {t.handsOn}
    </span>
  );
}

/**
 * Lesson rail for a track — the editorial treatment: a hairline index rather
 * than a stack of filled pills, numbers set in mono, and each lesson's state
 * spelled out underneath its title by `LessonRail`.
 *
 * It renders on the lesson page only. It used to render on the track page too,
 * which listed the same thirteen lessons a second time in the body — one
 * screen, two identical lists. The track page now owns the full index and this
 * owns the compact one.
 *
 * A-08: `lessons` is passed in rather than derived from `track`. On the
 * Indonesian routes the rail must list only the lessons that *have* Indonesian
 * text — an untranslated lesson has no `/id` route (see
 * `src/content/academy/i18n.ts`), and a rail linking to a 404 is worse than a
 * shorter rail.
 */
export function AcademyNav({
  track,
  lessons,
  currentSlug,
  lang = "en",
}: {
  track: Track;
  lessons: Lesson[];
  currentSlug?: string;
  lang?: Lang;
}) {
  const t = academyChrome[lang];
  const trackPath = academyPath(lang, `/${track.slug}`);
  return (
    <nav
      className="hidden w-56 shrink-0 md:block"
      aria-label={`${track.title} ${t.lessons}`}
    >
      <div className="md:sticky md:top-8">
        <Link
          href={academyPath(lang)}
          className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-content-muted hover:text-accent-text"
        >
          <TFIcon name="chevron-left" className="h-3 w-3" />
          {t.allTracks}
        </Link>
        <Link
          href={trackPath}
          className="mt-3 block font-display text-[15px] font-semibold leading-tight text-content-strong hover:text-accent-text"
        >
          {track.title}
        </Link>
        <LessonRail
          lessons={lessons.map((l) => ({
            slug: l.slug,
            title: l.title,
            minutes: l.minutes,
          }))}
          trackPath={trackPath}
          currentSlug={currentSlug}
          lang={lang}
        />
      </div>
    </nav>
  );
}
