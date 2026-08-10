import Link from "next/link";
import { TFIcon } from "@/components/icons";
import { publishedLessons, type Lesson, type Track } from "@/content/academy";

/** "45 min" / "1h 20m" — tracks run to several hours, so bare minutes stop
 *  reading as a commitment somewhere around 90. */
export function formatMinutes(total: number): string {
  if (total < 60) return `${total} min`;
  const h = Math.floor(total / 60);
  const m = total % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

/** Wrench chip marking a lesson with a sandbox exercise. The exercise itself
 *  lands in A-04; A-01 only advertises it. */
export function SandboxBadge({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md bg-accent-soft px-1.5 py-0.5 text-[11px] font-medium text-accent-soft-fg ${className}`}
      title="Includes a hands-on exercise in a real TestForge project"
    >
      <TFIcon name="edit" className="h-3 w-3" />
      Hands-on
    </span>
  );
}

/**
 * Lesson rail for a track, mirroring the help center's topic sidebar
 * (src/app/docs/help/[topic]/page.tsx). Server component — no state, no
 * progress; both arrive with A-05.
 */
export function AcademyNav({
  track,
  currentSlug,
}: {
  track: Track;
  currentSlug?: string;
}) {
  const lessons = publishedLessons(track);
  return (
    <nav className="hidden w-60 shrink-0 space-y-1 md:block" aria-label={`${track.title} lessons`}>
      <Link
        href="/academy"
        className="mb-2 flex items-center gap-1.5 text-sm text-content-muted hover:text-accent-text"
      >
        <TFIcon name="nav-tree" className="h-4 w-4" /> All tracks
      </Link>
      <Link
        href={`/academy/${track.slug}`}
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
              href={`/academy/${track.slug}/${l.slug}`}
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
