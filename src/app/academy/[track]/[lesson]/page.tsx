import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getSession } from "@/lib/auth";
import { AuthedAppShell } from "@/components/AuthedAppShell";
import { Logo, TFIcon } from "@/components/icons";
import { Markdown } from "@/components/Markdown";
import { JsonLd } from "@/components/JsonLd";
import { AcademyNav, SandboxBadge } from "@/components/AcademyNav";
import { SelfCheck } from "@/components/SelfCheck";
import { LessonDoneToggle } from "@/components/AcademyProgress";
import { getLesson, lessonNeighbours } from "@/content/academy";
import { getSandboxTask } from "@/content/academy/sandbox";
import { openSandboxTask } from "@/app/actions/academy";
import { sanitizeQuestions } from "@/lib/academy/questions";
import { breadcrumbLd, canonical, INDEXABLE, ldGraph, techArticleLd } from "@/lib/seo";

// A-09b: same change as the track page — a signed-in reader keeps the app shell
// on a lesson instead of being dropped into standalone reading chrome. Reading
// the session cookie forces dynamic rendering, so the prerender pair
// (`generateStaticParams` + `dynamicParams = false`) is gone; `getLesson()`
// already returns undefined for a draft or unknown slug and `notFound()` below
// still turns that into a 404. Lessons are the Academy's SEO surface and are
// still fully server-rendered per request — what they lose is the prerender and
// the CDN cache (docs/QA-ACADEMY.md §8, A-01, A-09).
export const dynamic = "force-dynamic";

export function generateMetadata({
  params,
}: {
  params: { track: string; lesson: string };
}): Metadata {
  const found = getLesson(params.track, params.lesson);
  if (!found) return { title: "QA Academy — TestForge" };
  const { track, lesson } = found;
  const title = `${lesson.title} — ${track.title} | TestForge QA Academy`;
  const path = `/academy/${track.slug}/${lesson.slug}`;
  // Each lesson carries its own summary as the description; without it Google
  // writes the snippet from whatever text it finds first, which on these pages
  // is the lesson rail (the same trap F-40 fixed on the help center).
  return {
    title,
    description: lesson.summary,
    alternates: canonical(path),
    robots: INDEXABLE,
    openGraph: {
      type: "article",
      siteName: "TestForge",
      url: path,
      title,
      description: lesson.summary,
    },
  };
}

export default async function AcademyLessonPage({
  params,
}: {
  params: { track: string; lesson: string };
}) {
  const found = getLesson(params.track, params.lesson);
  if (!found) notFound();
  const { track, lesson } = found;
  const session = await getSession();
  const { prev, next } = lessonNeighbours(track, lesson.slug);
  // A-04b: only the five lessons with a real checker get the direct-to-exercise
  // button; other sandbox-marked lessons (T2+) still get the generic callout
  // below until their own work order lands a task and a checker for them.
  const sandboxTask = getSandboxTask(lesson.slug);

  const jsonLd = (
    <>
      <JsonLd
        data={ldGraph(
          techArticleLd({
            headline: lesson.title,
            description: lesson.summary,
            path: `/academy/${track.slug}/${lesson.slug}`,
          }),
          breadcrumbLd([
            { name: "TestForge", path: "/" },
            { name: "QA Academy", path: "/academy" },
            { name: track.title, path: `/academy/${track.slug}` },
            {
              name: lesson.title,
              path: `/academy/${track.slug}/${lesson.slug}`,
            },
          ]),
        )}
      />
    </>
  );

  const body = (
    <>
      <div className="flex gap-10">
        <AcademyNav track={track} currentSlug={lesson.slug} />

        <article className="min-w-0 flex-1">
          <Link
            href={`/academy/${track.slug}`}
            className="text-sm text-content-muted hover:text-accent-text md:hidden"
          >
            ← {track.title}
          </Link>

          <h1 className="mt-2 text-3xl font-bold text-content-strong md:mt-0">
            {lesson.title}
          </h1>
          <p className="mt-2 text-content-muted">{lesson.summary}</p>
          <p className="mt-3 flex flex-wrap items-center gap-2 text-xs text-content-muted">
            <span>{lesson.minutes} min</span>
            <span aria-hidden>·</span>
            <Link
              href={`/academy/${track.slug}`}
              className="hover:text-accent-text"
            >
              {track.title}
            </Link>
            {lesson.sandbox && <SandboxBadge />}
          </p>

          {lesson.sandbox && (
            <div
              data-testid="academy-sandbox-callout"
              className="mt-6 flex gap-3 rounded-xl border border-hairline bg-accent-soft p-4"
            >
              <TFIcon name="edit" className="mt-0.5 h-5 w-5 shrink-0" />
              <div className="text-sm text-accent-soft-fg">
                <p>
                  <strong>This lesson has an exercise.</strong> It runs in your
                  Academy sandbox — a real TestForge project seeded with
                  ShopMini, kept out of your dashboard and projects list.
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  {sandboxTask ? (
                    <form action={openSandboxTask}>
                      <input type="hidden" name="lesson" value={lesson.slug} />
                      <button
                        type="submit"
                        data-testid="lesson-start-exercise"
                        className="min-h-[36px] rounded-lg bg-accent px-4 py-1.5 text-xs font-medium text-white hover:bg-accent-hover"
                      >
                        Start this exercise
                      </button>
                    </form>
                  ) : (
                    <Link
                      href="/academy/sandbox"
                      data-testid="lesson-sandbox-link"
                      className="text-xs font-medium underline"
                    >
                      Open your sandbox
                    </Link>
                  )}
                  <Link href="/signup" className="text-xs underline">
                    or create a free account first
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* Lesson bodies are author-written markdown and some tables are wide
              — the decision-table lesson has nine columns, which pushed the
              document 53px sideways at 375px. Below `md` each table becomes its
              own scroll box; from `md` up nothing changes, so the table keeps
              its native display (and its accessibility semantics) on the widths
              where it fits anyway. Scoped here rather than to `.tf-markdown` in
              globals.css: that class also renders case descriptions and
              comments, and this is not the change that should re-style them. */}
          <Markdown className="mt-8 max-w-none text-base leading-relaxed max-md:[&_table]:block max-md:[&_table]:w-max max-md:[&_table]:max-w-full max-md:[&_table]:overflow-x-auto">
            {lesson.body}
          </Markdown>

          {/* A-02: sanitized here, in a server component — `sanitizeQuestions`
              is the only thing that crosses the answer-key boundary, and it
              runs before any of this reaches the RSC payload. */}
          {lesson.selfCheck?.length ? (
            <SelfCheck
              track={track.slug}
              lesson={lesson.slug}
              questions={sanitizeQuestions(lesson.selfCheck)}
            />
          ) : null}

          <div className="mt-8 flex items-center gap-3">
            <LessonDoneToggle lessonSlug={lesson.slug} trackSlug={track.slug} />
          </div>

          <nav
            className="mt-12 flex flex-col gap-3 border-t border-hairline pt-6 sm:flex-row sm:justify-between"
            aria-label="Lesson navigation"
          >
            {prev ? (
              <Link
                href={`/academy/${track.slug}/${prev.slug}`}
                data-testid="academy-prev"
                className="group min-w-0 rounded-xl border border-hairline bg-surface p-3 hover:border-accent-ring sm:max-w-[48%]"
              >
                <span className="block text-xs text-content-muted">
                  ← Previous
                </span>
                <span className="block text-sm font-medium text-content-strong">
                  {prev.title}
                </span>
              </Link>
            ) : (
              <span />
            )}
            {next ? (
              <Link
                href={`/academy/${track.slug}/${next.slug}`}
                data-testid="academy-next"
                className="group min-w-0 rounded-xl border border-hairline bg-surface p-3 text-right hover:border-accent-ring sm:max-w-[48%]"
              >
                <span className="block text-xs text-content-muted">Next →</span>
                <span className="block text-sm font-medium text-content-strong">
                  {next.title}
                </span>
              </Link>
            ) : (
              <Link
                href={`/academy/${track.slug}`}
                data-testid="academy-next"
                className="min-w-0 rounded-xl border border-hairline bg-surface p-3 text-right hover:border-accent-ring sm:max-w-[48%]"
              >
                <span className="block text-xs text-content-muted">
                  Track complete
                </span>
                <span className="block text-sm font-medium text-content-strong">
                  Back to {track.title}
                </span>
              </Link>
            )}
          </nav>
        </article>
      </div>
    </>
  );

  if (session) {
    return (
      <AuthedAppShell session={session}>
        {jsonLd}
        <div className="mx-auto max-w-5xl">{body}</div>
      </AuthedAppShell>
    );
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-12">
      {jsonLd}

      <div className="mb-8 flex items-center justify-between">
        <Logo size="sm" />
        <div className="flex items-center gap-4 text-sm">
          <Link href="/login" className="text-accent-text hover:underline">
            Log in
          </Link>
          <Link
            href="/signup"
            className="rounded-lg bg-accent px-3 py-1.5 font-medium text-white hover:bg-accent-hover"
          >
            Sign up
          </Link>
        </div>
      </div>

      {body}
    </main>
  );
}
