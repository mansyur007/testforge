import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Logo, TFIcon } from "@/components/icons";
import { Markdown } from "@/components/Markdown";
import { JsonLd } from "@/components/JsonLd";
import { AcademyNav, SandboxBadge } from "@/components/AcademyNav";
import { allLessonParams, getLesson, lessonNeighbours } from "@/content/academy";
import { breadcrumbLd, canonical, INDEXABLE, ldGraph, techArticleLd } from "@/lib/seo";

export function generateStaticParams() {
  return allLessonParams();
}
export const dynamicParams = false;

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

export default function AcademyLessonPage({
  params,
}: {
  params: { track: string; lesson: string };
}) {
  const found = getLesson(params.track, params.lesson);
  if (!found) notFound();
  const { track, lesson } = found;
  const { prev, next } = lessonNeighbours(track, lesson.slug);

  return (
    <main className="mx-auto max-w-5xl px-4 py-12">
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

      <div className="mb-8 flex items-center justify-between">
        <Logo size="sm" />
        <Link href="/dashboard" className="text-sm text-accent-text hover:underline">
          Back to app
        </Link>
      </div>

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
              <p className="text-sm text-accent-soft-fg">
                <strong>This lesson has an exercise.</strong> The hands-on part
                runs in a real TestForge project — the sandbox is being built,
                so for now do the exercise in a project of your own.{" "}
                <Link href="/signup" className="underline">
                  Create a free account
                </Link>{" "}
                if you don&rsquo;t have one.
              </p>
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
    </main>
  );
}
