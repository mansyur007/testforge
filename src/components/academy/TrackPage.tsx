import Link from "next/link";
import { notFound } from "next/navigation";
import { getSession } from "@/lib/auth";
import { AuthedAppShell } from "@/components/AuthedAppShell";
import { TFIcon } from "@/components/icons";
import { JsonLd } from "@/components/JsonLd";
import { AcademyNav, SandboxBadge } from "@/components/AcademyNav";
import { AcademyPublicChrome } from "@/components/academy/PublicChrome";
import { AcademyLanguageLink } from "@/components/academy/LanguageLink";
import { AcademyLangMemory } from "@/components/academy/LangMemory";
import { TrackProgress } from "@/components/AcademyProgress";
import { TrademarkNotice } from "@/components/TrademarkNotice";
import { getTrack, trackMinutes } from "@/content/academy";
import { idLessonSlugs, localiseTrack, visibleLessons } from "@/content/academy/i18n";
import type { Lang } from "@/lib/i18n";
import { academyChrome, academyPath, formatMinutesIn } from "@/lib/academy/chrome";
import { absoluteUrl, breadcrumbLd, courseLd, ldGraph } from "@/lib/seo";

/**
 * A-08: one track page, rendered in either language.
 *
 * The English and Indonesian routes are two files that both call this, rather
 * than two copies of the markup — the previous shape would have doubled every
 * future change to this page and made "the Indonesian one drifted" a normal
 * kind of bug. `lang` decides three things and nothing else: which text the
 * track and its lessons carry (`localiseTrack`), which lessons are listed at
 * all (`visibleLessons` — untranslated ones have no `/id` route), and where the
 * links point (`academyPath`).
 */
export async function AcademyTrackPage({
  trackSlug,
  lang,
}: {
  trackSlug: string;
  lang: Lang;
}) {
  const source = getTrack(trackSlug);
  if (!source) notFound();
  const lessons = visibleLessons(source, lang);
  // An Indonesian track with nothing translated in it is a 404, not an empty
  // listing: there is no page to read, and a crawler that indexed it would have
  // indexed a promise the site cannot keep.
  if (lessons.length === 0) notFound();

  const track = localiseTrack(source, lang);
  const t = academyChrome[lang];
  const session = await getSession();
  const base = academyPath(lang);
  const trackPath = academyPath(lang, `/${track.slug}`);
  const minutes = lessons.reduce((n, l) => n + l.minutes, 0);
  // Localised lessons, in the visible order — `track.lessons` carries the
  // translated titles and summaries, `lessons` carries the visibility rule.
  const shown = lessons.map(
    (l) => track.lessons.find((x) => x.slug === l.slug) ?? l,
  );

  const jsonLd = (
    <JsonLd
      data={ldGraph(
        courseLd({
          name: track.title,
          description: track.tagline,
          path: trackPath,
          workloadMinutes: lang === "en" ? trackMinutes(source) : minutes,
        }),
        breadcrumbLd([
          { name: "TestForge", path: "/" },
          { name: t.brand, path: base },
          { name: track.title, path: trackPath },
        ]),
        {
          "@type": "ItemList",
          name: track.title,
          itemListElement: shown.map((l, i) => ({
            "@type": "ListItem",
            position: i + 1,
            name: l.title,
            url: absoluteUrl(`${trackPath}/${l.slug}`),
          })),
        },
      )}
    />
  );

  // Offer the other language only when the sibling page really exists. English
  // always does; Indonesian only for a track with translated lessons, and A-08
  // lands those one track at a time.
  const hasSibling = lang === "id" || idLessonSlugs(track.slug).size > 0;

  const body = (
    <div className="flex gap-10">
      <AcademyLangMemory lang={lang} />
      <AcademyNav track={track} lessons={shown} lang={lang} />

      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-3">
          <Link
            href={base}
            className="text-sm text-content-muted hover:text-accent-text md:hidden"
          >
            ← {t.allTracks}
          </Link>
          <span className="ml-auto">
            {hasSibling && (
              <AcademyLanguageLink
                lang={lang}
                enPath={`/academy/${track.slug}`}
              />
            )}
          </span>
        </div>

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
              {track.level} · {shown.length} {t.lessons} ·{" "}
              {formatMinutesIn(lang, minutes)}
            </p>
          </div>
        </div>

        {/* Slugs come from the server; the counting happens in the browser,
            because that is where the progress lives (A-02). Progress is keyed
            by slug, and slugs are not translated — so a lesson read in one
            language counts as read in the other, which is the behaviour a
            bilingual reader wants and a side effect worth having on purpose. */}
        <TrackProgress className="mt-6" lessonSlugs={shown.map((l) => l.slug)} />

        <section className="mt-8 rounded-xl border border-hairline bg-surface p-5">
          <h2 className="font-semibold text-content-strong">
            {t.track.outcomesTitle}
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
          {t.lessonsNav}
        </h2>
        <ol className="mt-3 space-y-2">
          {shown.map((l, i) => (
            <li key={l.slug}>
              <Link
                href={`${trackPath}/${l.slug}`}
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
                    {l.sandbox && <SandboxBadge lang={lang} />}
                  </span>
                  <span className="mt-1 block text-sm text-content-muted">
                    {l.summary}
                  </span>
                </span>
                <span className="shrink-0 text-xs text-content-muted">
                  {t.minutesShort(l.minutes)}
                </span>
              </Link>
            </li>
          ))}
        </ol>

        <div className="mt-8">
          <Link
            href={`${trackPath}/${shown[0].slug}`}
            data-testid="academy-track-start"
            className="inline-flex items-center rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover"
          >
            {t.track.startFirst}
          </Link>
        </div>

        {track.trademarkNotice && <TrademarkNotice lang={lang} />}
      </div>
    </div>
  );

  // A-08: the language is marked here rather than on `<html lang>`. The root
  // layout owns that tag and cannot see the pathname without introducing
  // middleware, which this app has none of and which runs on every request in
  // the whole product — too much blast radius for an attribute. `lang` on a
  // subtree is exactly what HTML5 defines for a document whose content is in a
  // different language from its default, and screen readers and Google both
  // honour it. The document default stays `en`; this page says what it is.
  if (session) {
    return (
      <AuthedAppShell session={session}>
        {jsonLd}
        <div lang={lang} className="mx-auto max-w-5xl">
          {body}
        </div>
      </AuthedAppShell>
    );
  }

  return (
    <main lang={lang} className="mx-auto max-w-5xl px-4 py-12">
      {jsonLd}
      <AcademyPublicChrome lang={lang} />
      {body}
    </main>
  );
}
