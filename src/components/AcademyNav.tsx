import Link from "next/link";
import { TFIcon } from "@/components/icons";
import type { Lang } from "@/lib/i18n";
import { academyChrome, academyPath, formatMinutesIn } from "@/lib/academy/chrome";
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
 * Lesson rail for a track, mirroring the help center's topic sidebar
 * (src/app/docs/help/[topic]/page.tsx). Server component — no state, no
 * progress; both arrive with A-05.
 *
 * A-08: `lessons` is now passed in rather than derived from `track`. On the
 * Indonesian routes the rail must list only the lessons that *have* Indonesian
 * text — an untranslated lesson has no `/id` route (see
 * `src/content/academy/i18n.ts`), and a rail linking to a 404 is worse than a
 * shorter rail. The page already computes that list to render itself, so
 * passing it keeps one definition of "what this track shows in this language".
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
  return (
    <nav
      className="hidden w-60 shrink-0 space-y-1 md:block"
      aria-label={`${track.title} ${t.lessons}`}
    >
      <Link
        href={academyPath(lang)}
        className="mb-2 flex items-center gap-1.5 text-sm text-content-muted hover:text-accent-text"
      >
        <TFIcon name="nav-tree" className="h-4 w-4" /> {t.allTracks}
      </Link>
      <Link
        href={academyPath(lang, `/${track.slug}`)}
        className={`block rounded-lg px-3 py-1.5 text-sm font-semibold ${
          currentSlug
            ? "text-content hover:bg-surface-muted"
            : "bg-accent-soft text-accent-soft-fg"
        }`}
      >
        {track.title}
      </Link>
      <ol className="space-y-1 pt-1">
        {lessons.map((l: Lesson, i: number) => (
          <li key={l.slug}>
            <Link
              href={academyPath(lang, `/${track.slug}/${l.slug}`)}
              aria-current={l.slug === currentSlug ? "page" : undefined}
              className={`flex gap-2 rounded-lg px-3 py-1.5 text-sm ${
                l.slug === currentSlug
                  ? "bg-accent-soft font-medium text-accent-soft-fg"
                  : "text-content hover:bg-surface-muted"
              }`}
            >
              <span className="tabular-nums text-content-muted">{i + 1}.</span>
              <span className="min-w-0">{l.title}</span>
            </Link>
          </li>
        ))}
      </ol>
    </nav>
  );
}
