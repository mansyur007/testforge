import Link from "next/link";
import { getSession } from "@/lib/auth";
import { BetaChip } from "@/components/BetaChip";
import { JsonLd } from "@/components/JsonLd";
import { SandboxBadge } from "@/components/AcademyNav";
import { AcademyFrame } from "@/components/academy/Frame";
import { AcademyLanguageLink } from "@/components/academy/LanguageLink";
import { AcademyLangMemory } from "@/components/academy/LangMemory";
import { TRACKS, ISTQB_DISCLAIMER, ISTQB_DISCLAIMER_ID } from "@/content/academy";
import { idLessonSlugs, localiseTrack, visibleLessons } from "@/content/academy/i18n";
import type { Lang } from "@/lib/i18n";
import { academyChrome, academyPath, formatMinutesIn } from "@/lib/academy/chrome";
import { absoluteUrl, breadcrumbLd, ldGraph } from "@/lib/seo";

const GITHUB_REPO = process.env.NEXT_PUBLIC_GITHUB_REPO ?? "mansyur007/testforge";

/**
 * A-08: the Academy roadmap, in either language.
 *
 * The Indonesian roadmap lists **every** track, not only the translated ones.
 * Hiding the rest would tell an Indonesian reader the Academy is one track big,
 * which is false and is the opposite of useful: a track that exists in English
 * gets a row saying so, with a link straight to the English version. That is a
 * better answer than either a silent omission or an untranslated page pretending
 * otherwise, and it is honest about a roll-out that lands one track at a time.
 *
 * A-12: the roadmap is an index, so it is set as one — five ruled rows with the
 * track's place in the margin, not five bordered cards of equal weight. Nothing
 * about which tracks appear, or what each row says, changed with it.
 */
export async function AcademyRoadmapPage({ lang }: { lang: Lang }) {
  const session = await getSession();
  const t = academyChrome[lang];
  const base = academyPath(lang);
  const published = TRACKS.filter((tr) => tr.status === "published");
  const totalLessons = published.reduce(
    (n, tr) => n + visibleLessons(tr, lang).length,
    0,
  );
  const anyTranslated = published.some((tr) => idLessonSlugs(tr.slug).size > 0);

  const jsonLd = (
    <JsonLd
      data={ldGraph(
        breadcrumbLd([
          { name: "TestForge", path: "/" },
          { name: t.brand, path: base },
        ]),
        {
          "@type": "ItemList",
          name: "TestForge QA Academy tracks",
          itemListElement: TRACKS.map((tr, i) => {
            const live =
              tr.status === "published" && visibleLessons(tr, lang).length > 0;
            return {
              "@type": "ListItem",
              position: i + 1,
              name: localiseTrack(tr, lang).title,
              ...(live ? { url: absoluteUrl(`${base}/${tr.slug}`) } : {}),
            };
          }),
        },
      )}
    />
  );

  const body = (
    <>
      <AcademyLangMemory lang={lang} />
      <div className="flex items-start justify-between gap-3">
        <h1 className="flex flex-wrap items-center gap-3 font-display text-[38px] font-bold leading-none tracking-tight text-content-strong sm:text-5xl">
          {t.brand}
          <BetaChip className="translate-y-0.5" />
        </h1>
        {(lang === "id" || anyTranslated) && (
          <AcademyLanguageLink lang={lang} enPath="/academy" />
        )}
      </div>
      <p className="mt-5 max-w-[54ch] text-[21px] leading-snug text-content">
        {t.roadmap.intro}
      </p>
      <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.16em] text-content-subtle">
        {t.roadmap.availableNow(totalLessons)}
      </p>

      {/* A-03b: said once, plainly, at the top. A reader who invests two hours
          in a track deserves to know up front that the rest is still being
          written and that lessons may change under them. */}
      <div
        data-testid="academy-beta-banner"
        className="mt-8 flex items-start gap-3 border-y border-hairline py-4"
      >
        <BetaChip className="mt-0.5" />
        <p className="text-[15px] leading-relaxed text-content">
          <strong className="text-content-strong">{t.roadmap.betaTitle}</strong>{" "}
          {t.roadmap.betaBody}{" "}
          <a
            href={`https://github.com/${GITHUB_REPO}/issues`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent-text hover:underline"
          >
            {t.roadmap.betaLink}
          </a>
          .
        </p>
      </div>

      <ol className="mt-10 border-t border-hairline-strong">
        {TRACKS.map((source, i) => {
          const shown = visibleLessons(source, lang);
          const live = source.status === "published" && shown.length > 0;
          const track = localiseTrack(source, lang);
          // Published in English but not translated: a real page exists, just
          // not in this language. Say so and link to the one that does.
          const englishOnly = lang === "id" && source.status === "published" && !live;
          const lessonCount = live ? shown.length : source.lessons.length;
          const minutes = shown.reduce((n, l) => n + l.minutes, 0);
          const handsOn = shown.filter((l) => l.sandbox).length;

          const inner = (
            <>
              <span className="font-mono text-[12px] tabular-nums text-content-subtle">
                {String(i + 1).padStart(2, "0")}
              </span>
              <div className="min-w-0">
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <h2
                    className={`font-display text-[22px] font-bold tracking-tight ${
                      live
                        ? "text-content-strong group-hover:text-accent-text"
                        : "text-content-muted"
                    }`}
                  >
                    {track.title}
                  </h2>
                  <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-content-subtle">
                    {track.level}
                  </span>
                </div>
                <p className="mt-1.5 max-w-[62ch] text-[15px] leading-relaxed text-content-muted">
                  {track.tagline}
                </p>
              </div>
              <div className="col-start-2 mt-2 flex items-baseline gap-x-3 font-mono text-[10px] uppercase tracking-[0.14em] text-content-subtle sm:col-start-3 sm:mt-0 sm:flex-col sm:items-end sm:gap-y-1 sm:text-right">
                {!live && (
                  <span>
                    {englishOnly ? t.roadmap.notTranslated : t.roadmap.inProgress}
                  </span>
                )}
                <span>
                  {lessonCount} {t.lessons}
                </span>
                <span>
                  {live ? formatMinutesIn(lang, minutes) : t.roadmap.planned}
                </span>
                {live && handsOn > 0 && (
                  <span className="text-accent-text">
                    {handsOn} {t.handsOn}
                  </span>
                )}
              </div>
            </>
          );

          const rowClass =
            "group grid grid-cols-[2rem_minmax(0,1fr)] items-baseline gap-x-4 py-5 sm:grid-cols-[2rem_minmax(0,1fr)_8rem]";

          return (
            <li key={source.slug} className="border-b border-hairline">
              {live ? (
                <Link
                  href={`${base}/${source.slug}`}
                  data-testid={`academy-track-${source.slug}`}
                  className={rowClass}
                >
                  {inner}
                </Link>
              ) : (
                <div
                  data-testid={`academy-track-${source.slug}`}
                  className={rowClass}
                >
                  {inner}
                  <div className="col-start-2 mt-3">
                    {englishOnly ? (
                      <Link
                        href={`/academy/${source.slug}`}
                        hrefLang="en"
                        data-testid={`academy-track-en-${source.slug}`}
                        className="font-mono text-[10px] uppercase tracking-[0.14em] text-accent-text hover:underline"
                      >
                        {t.roadmap.readInEnglish} →
                      </Link>
                    ) : (
                      <details>
                        <summary className="cursor-pointer font-mono text-[10px] uppercase tracking-[0.14em] text-accent-text">
                          {t.roadmap.whatsComing}
                        </summary>
                        <ul className="mt-2 space-y-1 text-xs text-content-muted">
                          {track.lessons.map((l) => (
                            <li key={l.slug}>· {l.title}</li>
                          ))}
                        </ul>
                      </details>
                    )}
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ol>

      <section className="mt-14 border-t border-hairline pt-6">
        <h2 className="font-mono text-[10px] uppercase tracking-[0.14em] text-content-muted">
          {t.roadmap.howToTitle}
        </h2>
        <ul className="mt-4 max-w-[64ch] space-y-2.5 text-[15px] leading-relaxed text-content">
          <li>{t.roadmap.howTo1}</li>
          <li>
            {t.roadmap.howTo2Pre} <SandboxBadge lang={lang} />{" "}
            {t.roadmap.howTo2Post}
          </li>
          {!session && (
            <li>
              {t.roadmap.howTo3Pre}{" "}
              <Link href="/signup" className="text-accent-text hover:underline">
                {t.roadmap.howTo3Link}
              </Link>
              .
            </li>
          )}
        </ul>
      </section>

      <p
        data-testid="istqb-disclaimer"
        lang={lang}
        className="mt-10 text-xs leading-relaxed text-content-subtle"
      >
        {lang === "id" ? ISTQB_DISCLAIMER_ID : ISTQB_DISCLAIMER}
      </p>
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
