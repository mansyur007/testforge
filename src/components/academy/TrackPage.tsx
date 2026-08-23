import Link from "next/link";
import { notFound } from "next/navigation";
import { getSession } from "@/lib/auth";
import { TFIcon } from "@/components/icons";
import { JsonLd } from "@/components/JsonLd";
import { AcademyFrame } from "@/components/academy/Frame";
import { AcademyLanguageLink } from "@/components/academy/LanguageLink";
import { AcademyLangMemory } from "@/components/academy/LangMemory";
import { TrackIndex } from "@/components/academy/TrackIndex";
import { TrackProgress } from "@/components/AcademyProgress";
import { TrademarkNotice } from "@/components/TrademarkNotice";
import { TRACKS, getTrack, trackMinutes } from "@/content/academy";
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
 *
 * The layout is the editorial direction picked on 2026-08-22 (the four options
 * are in `docs/design/academy-redesign-directions.html`): the page opens like
 * the first page of a chapter — oversized display title, a set numeral behind
 * it, four facts set in mono — and the lessons are a ruled index rather than a
 * stack of cards. Two structural things changed with it:
 *
 * 1. **The rail is gone from this page.** It listed every lesson down the left
 *    while the body listed the same lessons again as cards. `TrackIndex` is now
 *    the only list, and it is the one that carries progress state.
 * 2. **No `max-w-5xl` wrapper.** The measure belongs to the text, not to the
 *    page — see `LessonPage.tsx`, where dropping it mattered more.
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
  const handsOn = shown.filter((l) => l.sandbox).length;
  // Position in the roadmap, for the kicker and the set numeral. Read from
  // TRACKS so it cannot drift from the order the roadmap lists.
  const position = TRACKS.findIndex((x) => x.slug === source.slug) + 1;

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

  const facts: { k: string; v: string }[] = [
    { k: t.track.factLessons, v: String(shown.length) },
    { k: t.track.factTime, v: formatMinutesIn(lang, minutes) },
    ...(handsOn > 0 ? [{ k: t.track.factHandsOn, v: String(handsOn) }] : []),
  ];

  const body = (
    <>
      <AcademyLangMemory lang={lang} />

      <div className="flex items-center justify-between gap-3 border-b border-hairline pb-3">
        <p className="flex min-w-0 items-center gap-2 font-mono text-[10px] uppercase tracking-[0.14em] text-content-muted">
          <Link href={base} className="hover:text-accent-text">
            {t.brand}
          </Link>
          <span aria-hidden>/</span>
          <span className="truncate text-content-strong">{track.title}</span>
        </p>
        {hasSibling && (
          <AcademyLanguageLink lang={lang} enPath={`/academy/${track.slug}`} />
        )}
      </div>

      <header className="relative border-b border-hairline-strong pb-9 pt-9">
        {/* The set numeral: the track's place in the roadmap, at the size a
            chapter opener would print it. Decorative — the same number is in
            the kicker as text, which is what a screen reader reads. */}
        <span
          aria-hidden
          className="pointer-events-none absolute -top-3 right-0 select-none font-display text-[110px] font-bold leading-none tracking-tighter text-accent-soft sm:text-[150px]"
        >
          {String(position).padStart(2, "0")}
        </span>
        <p className="relative font-mono text-[10px] uppercase tracking-[0.18em] text-accent-text">
          {t.track.position(position, TRACKS.length)} · {track.level}
        </p>
        <h1 className="relative mt-4 max-w-[16ch] font-display text-[34px] font-bold leading-[1.03] tracking-tight text-content-strong sm:text-5xl">
          {track.title}
        </h1>
        <p className="relative mt-4 max-w-[46ch] text-[21px] leading-snug text-content">
          {track.tagline}
        </p>
        <dl className="relative mt-8 flex flex-wrap gap-x-12 gap-y-4">
          {facts.map((f) => (
            <div key={f.k}>
              <dt className="font-mono text-[9.5px] uppercase tracking-[0.16em] text-content-subtle">
                {f.k}
              </dt>
              <dd className="mt-1 text-[17px] font-medium tabular-nums text-content-strong">
                {f.v}
              </dd>
            </div>
          ))}
        </dl>
      </header>

      {/* Slugs come from the server; the counting happens in the browser,
          because that is where the progress lives (A-02). Progress is keyed
          by slug, and slugs are not translated — so a lesson read in one
          language counts as read in the other, which is the behaviour a
          bilingual reader wants and a side effect worth having on purpose. */}
      <TrackProgress
        className="mt-6"
        lessonSlugs={shown.map((l) => l.slug)}
        lang={lang}
      />

      <section className="mt-10">
        <h2 className="font-mono text-[10px] uppercase tracking-[0.14em] text-content-muted">
          {t.track.outcomesTitle}
        </h2>
        <ul className="mt-4 grid gap-x-12 gap-y-3 sm:grid-cols-2">
          {track.outcomes.map((o) => (
            <li key={o} className="flex gap-2.5 text-[15px] leading-relaxed text-content">
              <TFIcon name="valid" className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{o}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-12">
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="font-display text-2xl font-bold tracking-tight text-content-strong">
            {t.track.contents}
          </h2>
          <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-content-subtle">
            {shown.length} {t.lessons}
          </span>
        </div>
        <TrackIndex
          lessons={shown.map((l) => ({
            slug: l.slug,
            title: l.title,
            summary: l.summary,
            minutes: l.minutes,
            sandbox: l.sandbox,
          }))}
          trackPath={trackPath}
          lang={lang}
        />
      </section>

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
    </>
  );

  // A-09d: the frame — app shell or public chrome, the 65rem column either way,
  // and the `lang` attribute A-08 puts on the wrapper rather than on `<html>` —
  // is `AcademyFrame`'s, which is where all three are explained.
  return (
    <AcademyFrame session={session} lang={lang}>
      {jsonLd}
      {body}
    </AcademyFrame>
  );
}
