import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Logo, TFIcon } from "@/components/icons";
import { JsonLd } from "@/components/JsonLd";
import { AcademyNav, SandboxBadge, formatMinutes } from "@/components/AcademyNav";
import {
  getTrack,
  publishedLessons,
  publishedTracks,
  trackMinutes,
} from "@/content/academy";
import {
  absoluteUrl,
  breadcrumbLd,
  canonical,
  courseLd,
  INDEXABLE,
  ldGraph,
} from "@/lib/seo";

/** Published tracks only, and `dynamicParams = false` so a draft slug 404s
 *  instead of rendering unfinished content. Preview of a draft is a branch
 *  deploy, not a query parameter — a page that reads searchParams cannot be
 *  statically rendered, and static is the point (docs/QA-ACADEMY.md §8, A-01). */
export function generateStaticParams() {
  return publishedTracks().map((t) => ({ track: t.slug }));
}
export const dynamicParams = false;

export function generateMetadata({
  params,
}: {
  params: { track: string };
}): Metadata {
  const track = getTrack(params.track);
  if (!track) return { title: "QA Academy — TestForge" };
  const title = `${track.title} — TestForge QA Academy`;
  const path = `/academy/${track.slug}`;
  return {
    title,
    description: track.tagline,
    alternates: canonical(path),
    robots: INDEXABLE,
    openGraph: {
      type: "website",
      siteName: "TestForge",
      url: path,
      title,
      description: track.tagline,
    },
  };
}

export default function AcademyTrackPage({
  params,
}: {
  params: { track: string };
}) {
  const track = getTrack(params.track);
  if (!track) notFound();

  const lessons = publishedLessons(track);

  return (
    <main className="mx-auto max-w-5xl px-4 py-12">
      <JsonLd
        data={ldGraph(
          courseLd({
            name: track.title,
            description: track.tagline,
            path: `/academy/${track.slug}`,
            workloadMinutes: trackMinutes(track),
          }),
          breadcrumbLd([
            { name: "TestForge", path: "/" },
            { name: "QA Academy", path: "/academy" },
            { name: track.title, path: `/academy/${track.slug}` },
          ]),
          {
            "@type": "ItemList",
            name: track.title,
            itemListElement: lessons.map((l, i) => ({
              "@type": "ListItem",
              position: i + 1,
              name: l.title,
              url: absoluteUrl(`/academy/${track.slug}/${l.slug}`),
            })),
          },
        )}
      />

      <div className="mb-8 flex items-center justify-between">
        <Logo size="sm" />
        <Link href="/dashboard" className="text-sm text-accent-text hover:underline">
          Back to app
        </Link>
      </div>

      <div className="flex gap-10">
        <AcademyNav track={track} />

        <div className="min-w-0 flex-1">
          <Link
            href="/academy"
            className="text-sm text-content-muted hover:text-accent-text md:hidden"
          >
            ← All tracks
          </Link>

          <div className="mt-2 flex items-start gap-4 md:mt-0">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-accent-soft">
              <TFIcon name={track.icon} className="h-7 w-7" />
            </span>
            <div className="min-w-0">
              <h1 className="text-3xl font-bold text-content-strong">
                {track.title}
              </h1>
              <p className="mt-1 text-content">{track.tagline}</p>
              <p className="mt-2 text-sm text-content-muted">
                {track.level} · {lessons.length} lessons ·{" "}
                {formatMinutes(trackMinutes(track))}
              </p>
            </div>
          </div>

          <section className="mt-8 rounded-xl border border-hairline bg-surface p-5">
            <h2 className="font-semibold text-content-strong">
              By the end you&rsquo;ll be able to
            </h2>
            <ul className="mt-2 space-y-1.5">
              {track.outcomes.map((o) => (
                <li key={o} className="flex gap-2 text-sm text-content">
                  <TFIcon name="valid" className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{o}</span>
                </li>
              ))}
            </ul>
          </section>

          <h2 className="mt-10 text-lg font-semibold text-content-strong">
            Lessons
          </h2>
          <ol className="mt-3 space-y-2">
            {lessons.map((l, i) => (
              <li key={l.slug}>
                <Link
                  href={`/academy/${track.slug}/${l.slug}`}
                  data-testid={`academy-lesson-${l.slug}`}
                  className="flex gap-3 rounded-xl border border-hairline bg-surface p-4 hover:border-accent-ring hover:shadow-sm"
                >
                  <span className="mt-0.5 tabular-nums text-sm text-content-muted">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="font-medium text-content-strong">
                        {l.title}
                      </span>
                      {l.sandbox && <SandboxBadge />}
                    </span>
                    <span className="mt-1 block text-sm text-content-muted">
                      {l.summary}
                    </span>
                  </span>
                  <span className="shrink-0 text-xs text-content-muted">
                    {l.minutes} min
                  </span>
                </Link>
              </li>
            ))}
          </ol>

          <div className="mt-8">
            <Link
              href={`/academy/${track.slug}/${lessons[0].slug}`}
              data-testid="academy-track-start"
              className="inline-flex items-center rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover"
            >
              Start the first lesson
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
