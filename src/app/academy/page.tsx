import Link from "next/link";
import type { Metadata } from "next";
import { Logo, TFIcon } from "@/components/icons";
import { BetaChip } from "@/components/BetaChip";
import { JsonLd } from "@/components/JsonLd";
import { formatMinutes } from "@/components/AcademyNav";
import {
  ISTQB_DISCLAIMER,
  TRACKS,
  publishedLessons,
  trackMinutes,
} from "@/content/academy";
import { absoluteUrl, breadcrumbLd, canonical, INDEXABLE, ldGraph } from "@/lib/seo";

// Declared locally, the same way src/app/docs/self-hosting/page.tsx and
// src/app/page.tsx already do it. Hoisting it into a shared constant would be
// the better design and is a change to three unrelated files, not this one.
const GITHUB_REPO = process.env.NEXT_PUBLIC_GITHUB_REPO ?? "mansyur007/testforge";

const DESCRIPTION =
  "A free roadmap from zero to professional QA: testing fundamentals, manual QA at work, automation, and Foundation Level exam prep — practised in a real test management tool.";

export const metadata: Metadata = {
  title: "QA Academy — learn software testing from scratch | TestForge",
  description: DESCRIPTION,
  alternates: canonical("/academy"),
  robots: INDEXABLE,
  openGraph: {
    type: "website",
    siteName: "TestForge",
    url: "/academy",
    title: "TestForge QA Academy",
    description: DESCRIPTION,
  },
};

export default function AcademyIndexPage() {
  const published = TRACKS.filter((t) => t.status === "published");
  const totalLessons = published.reduce(
    (n, t) => n + publishedLessons(t).length,
    0,
  );

  return (
    <main className="mx-auto max-w-5xl px-4 py-12">
      <JsonLd
        data={ldGraph(
          breadcrumbLd([
            { name: "TestForge", path: "/" },
            { name: "QA Academy", path: "/academy" },
          ]),
          {
            "@type": "ItemList",
            name: "TestForge QA Academy tracks",
            itemListElement: TRACKS.map((t, i) => ({
              "@type": "ListItem",
              position: i + 1,
              name: t.title,
              ...(t.status === "published"
                ? { url: absoluteUrl(`/academy/${t.slug}`) }
                : {}),
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

      <h1 className="flex flex-wrap items-center gap-3 text-3xl font-bold text-content-strong sm:text-4xl">
        QA Academy
        <BetaChip className="translate-y-1" />
      </h1>
      <p className="mt-3 max-w-2xl text-lg text-content">
        A roadmap from zero to professional QA — and then to automation. Free,
        open source, and practised where the work actually happens: in a real
        test management tool, on a real project.
      </p>
      <p className="mt-2 text-sm text-content-muted">
        {totalLessons} lessons available now · more tracks in progress
      </p>

      {/* A-03b: said once, plainly, at the top. A reader who invests two hours
          in a track deserves to know up front that the rest is still being
          written and that lessons may change under them. */}
      <div
        data-testid="academy-beta-banner"
        className="mt-6 flex items-start gap-3 rounded-xl border border-hairline bg-surface-muted p-4"
      >
        <BetaChip className="mt-0.5" />
        <p className="text-sm text-content">
          <strong className="text-content-strong">
            QA Academy is in beta.
          </strong>{" "}
          One track is finished; the rest are still being written, and published
          lessons may still change. Nothing here needs an account — if something
          is wrong or missing,{" "}
          <a
            href={`https://github.com/${GITHUB_REPO}/issues`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent-text hover:underline"
          >
            tell us on GitHub
          </a>
          .
        </p>
      </div>

      <ol className="mt-10 space-y-4">
        {TRACKS.map((track, i) => {
          const live = track.status === "published";
          const lessonCount = live
            ? publishedLessons(track).length
            : track.lessons.length;
          const inner = (
            <>
              <div className="flex items-start gap-4">
                <span
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                    live ? "bg-accent-soft" : "bg-surface-muted"
                  }`}
                >
                  <TFIcon name={track.icon} className="h-6 w-6" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-lg font-semibold text-content-strong">
                      <span className="tabular-nums text-content-muted">
                        {i + 1}.
                      </span>{" "}
                      {track.title}
                    </h2>
                    <span className="rounded-md bg-surface-muted px-1.5 py-0.5 text-[11px] font-medium text-content-muted">
                      {track.level}
                    </span>
                    {!live && (
                      <span className="rounded-md border border-hairline px-1.5 py-0.5 text-[11px] font-medium text-content-muted">
                        In progress
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-content">{track.tagline}</p>
                  <p className="mt-2 text-xs text-content-muted">
                    {lessonCount} lessons
                    {live ? ` · ${formatMinutes(trackMinutes(track))}` : ""}
                    {live ? "" : " planned"}
                  </p>
                </div>
              </div>
            </>
          );

          return (
            <li key={track.slug}>
              {live ? (
                <Link
                  href={`/academy/${track.slug}`}
                  data-testid={`academy-track-${track.slug}`}
                  className="block rounded-xl border border-hairline bg-surface p-5 hover:border-accent-ring hover:shadow-sm"
                >
                  {inner}
                </Link>
              ) : (
                <div
                  data-testid={`academy-track-${track.slug}`}
                  className="rounded-xl border border-dashed border-hairline bg-surface/60 p-5"
                >
                  {inner}
                  <details className="mt-3">
                    <summary className="cursor-pointer text-xs text-accent-text">
                      What&rsquo;s coming
                    </summary>
                    <ul className="mt-2 space-y-1 text-xs text-content-muted">
                      {track.lessons.map((l) => (
                        <li key={l.slug}>• {l.title}</li>
                      ))}
                    </ul>
                  </details>
                </div>
              )}
            </li>
          );
        })}
      </ol>

      <section className="mt-12 rounded-xl border border-hairline bg-surface-muted p-5">
        <h2 className="font-semibold text-content-strong">How to use this</h2>
        <ul className="mt-2 space-y-1.5 text-sm text-content">
          <li>
            Work through a track in order — each lesson assumes the one before it.
          </li>
          <li>
            Lessons marked <strong>Hands-on</strong> come with an exercise you do
            in a real TestForge project, not a quiz.
          </li>
          <li>
            You don&rsquo;t need an account to read anything. Create one when you
            want your work and your progress saved —{" "}
            <Link href="/signup" className="text-accent-text hover:underline">
              it&rsquo;s free
            </Link>
            .
          </li>
        </ul>
      </section>

      <p className="mt-8 text-xs leading-relaxed text-content-muted">
        {ISTQB_DISCLAIMER}
      </p>
    </main>
  );
}
