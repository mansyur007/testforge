import Link from "next/link";
import type { Metadata } from "next";
import { Logo, TFIcon } from "@/components/icons";
import { BetaChip } from "@/components/BetaChip";
import { AcademyMeSync } from "@/components/AcademyMeSync";
import { requireSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { publishedLessons, publishedTracks } from "@/content/academy";
import { NOINDEX } from "@/lib/seo";
import { getMyExamAttempts } from "@/app/actions/academy";

// A-05: the one Academy page that needs a session — progress belongs to
// somebody, same reasoning as /academy/sandbox. Everything else under
// /academy stays public and prerendered; this route is what that design
// deliberately left dynamic.
export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "My progress — TestForge QA Academy",
  robots: NOINDEX,
};

export default async function AcademyMePage() {
  const session = await requireSession();
  const rows = await db.lessonProgress.findMany({
    where: { userId: session.userId },
    select: { lessonSlug: true },
  });
  const doneSlugs = new Set(rows.map((r) => r.lessonSlug));

  const tracks = publishedTracks().map((track) => {
    const lessons = publishedLessons(track);
    const done = lessons.filter((l) => doneSlugs.has(l.slug)).length;
    const complete = lessons.length > 0 && done === lessons.length;
    // Resume at the first lesson not yet done; once every lesson is done
    // there's nothing to resume, so the link becomes "Review" at lesson one.
    const target = lessons.find((l) => !doneSlugs.has(l.slug)) ?? lessons[0];
    return { track, lessons, done, complete, target };
  });

  const totalDone = tracks.reduce((n, t) => n + t.done, 0);
  const totalLessons = tracks.reduce((n, t) => n + t.lessons.length, 0);
  const attempts = await getMyExamAttempts();

  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <AcademyMeSync />
      <div className="mb-8 flex items-center justify-between">
        <Logo size="sm" />
        <Link href="/dashboard" className="text-sm text-accent-text hover:underline">
          Back to app
        </Link>
      </div>

      <h1 className="flex flex-wrap items-center gap-3 text-3xl font-bold text-content-strong">
        My progress
        <BetaChip className="translate-y-1" />
      </h1>
      <p className="mt-2 text-content-muted" data-testid="me-total-progress">
        {totalDone} of {totalLessons} lessons done across {tracks.length}{" "}
        {tracks.length === 1 ? "track" : "tracks"}.
      </p>

      <div className="mt-8 space-y-4">
        {tracks.map(({ track, lessons, done, complete, target }) => {
          const total = lessons.length;
          const pct = total ? Math.round((done / total) * 100) : 0;
          return (
            <div
              key={track.slug}
              data-testid={`me-track-${track.slug}`}
              className="rounded-xl border border-hairline bg-surface p-5"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent-soft">
                    <TFIcon name={track.icon} className="h-5 w-5" />
                  </span>
                  <div className="min-w-0">
                    <h2 className="truncate font-semibold text-content-strong">
                      {track.title}
                    </h2>
                    <p className="text-xs text-content-muted">
                      {done} of {total} lessons done
                    </p>
                  </div>
                </div>
                {total > 0 && (
                  <Link
                    href={`/academy/${track.slug}/${target.slug}`}
                    data-testid={`me-track-resume-${track.slug}`}
                    className="shrink-0 rounded-lg border border-hairline px-3 py-1.5 text-xs font-medium text-content hover:bg-surface-muted"
                  >
                    {complete ? "Review" : done > 0 ? "Continue" : "Start"}
                  </Link>
                )}
              </div>
              <div
                className="mt-3 h-1.5 overflow-hidden rounded-full bg-surface-muted"
                role="progressbar"
                aria-valuenow={done}
                aria-valuemin={0}
                aria-valuemax={total}
                aria-label={`${track.title} progress`}
              >
                <div
                  className="h-full rounded-full bg-accent motion-safe:transition-[width] motion-safe:duration-panel motion-safe:ease-tf-out"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {totalLessons > 0 && totalDone === 0 && (
        <p className="mt-8 text-sm text-content-muted">
          Nothing marked done yet —{" "}
          <Link href="/academy" className="text-accent-text hover:underline">
            start the first lesson
          </Link>{" "}
          to see it here.
        </p>
      )}

      {/* A-06: exam and chapter-quiz attempt history. Newest first, same
          resume-link shape as the tracks above. */}
      <section className="mt-10" data-testid="me-exam-history">
        <h2 className="text-lg font-semibold text-content-strong">Exam attempts</h2>
        {attempts.length === 0 ? (
          <p className="mt-2 text-sm text-content-muted">
            No attempts yet —{" "}
            <Link href="/academy/istqb/practice-exam" className="text-accent-text hover:underline">
              take the practice exam
            </Link>
            .
          </p>
        ) : (
          <ul className="mt-3 space-y-2">
            {attempts.map((a) => (
              <li
                key={a.id}
                data-testid={`me-exam-attempt-${a.id}`}
                className="flex items-center justify-between rounded-lg border border-hairline bg-surface px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-content-strong">
                    {a.templateSlug === "ctfl-v4-full" ? "Full practice exam" : `Chapter quiz — ${a.templateSlug}`}
                  </p>
                  <p className="text-xs text-content-muted">
                    {a.submittedAt ? new Date(a.submittedAt).toLocaleDateString() : "In progress"} ·{" "}
                    {a.score}/{a.total} · {a.passed ? "Pass" : "Not a pass"}
                  </p>
                </div>
                <Link
                  href={`/academy/istqb/practice-exam/${a.id}`}
                  className="shrink-0 rounded-lg border border-hairline px-3 py-1.5 text-xs font-medium text-content hover:bg-surface-muted"
                >
                  Review
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
