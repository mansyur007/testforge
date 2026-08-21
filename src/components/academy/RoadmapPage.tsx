import Link from "next/link";
import { getSession } from "@/lib/auth";
import { AuthedAppShell } from "@/components/AuthedAppShell";
import { TFIcon } from "@/components/icons";
import { BetaChip } from "@/components/BetaChip";
import { JsonLd } from "@/components/JsonLd";
import { SandboxBadge } from "@/components/AcademyNav";
import { AcademyPublicChrome } from "@/components/academy/PublicChrome";
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
 * gets a card saying so, with a link straight to the English version. That is a
 * better answer than either a silent omission or an untranslated page pretending
 * otherwise, and it is honest about a roll-out that lands one track at a time.
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
        <h1 className="flex flex-wrap items-center gap-3 text-3xl font-bold text-content-strong sm:text-4xl">
          {t.brand}
          <BetaChip className="translate-y-1" />
        </h1>
        {(lang === "id" || anyTranslated) && (
          <AcademyLanguageLink lang={lang} enPath="/academy" />
        )}
      </div>
      <p className="mt-3 max-w-2xl text-lg text-content">{t.roadmap.intro}</p>
      <p className="mt-2 text-sm text-content-muted">
        {t.roadmap.availableNow(totalLessons)}
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

      <ol className="mt-10 space-y-4">
        {TRACKS.map((source, i) => {
          const shown = visibleLessons(source, lang);
          const live = source.status === "published" && shown.length > 0;
          const track = localiseTrack(source, lang);
          // Published in English but not translated: a real page exists, just
          // not in this language. Say so and link to the one that does.
          const englishOnly = lang === "id" && source.status === "published" && !live;
          const lessonCount = live ? shown.length : source.lessons.length;
          const minutes = shown.reduce((n, l) => n + l.minutes, 0);

          const inner = (
            <div className="flex items-start gap-4">
              <span
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                  live ? "bg-accent-soft" : "bg-surface-muted"
                }`}
              >
                <TFIcon name={source.icon} className="h-6 w-6" />
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
                      {englishOnly ? t.roadmap.notTranslated : t.roadmap.inProgress}
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm text-content">{track.tagline}</p>
                <p className="mt-2 text-xs text-content-muted">
                  {lessonCount} {t.lessons}
                  {live ? ` · ${formatMinutesIn(lang, minutes)}` : ""}
                  {live || englishOnly ? "" : t.roadmap.planned}
                </p>
              </div>
            </div>
          );

          return (
            <li key={source.slug}>
              {live ? (
                <Link
                  href={`${base}/${source.slug}`}
                  data-testid={`academy-track-${source.slug}`}
                  className="block rounded-xl border border-hairline bg-surface p-5 hover:border-accent-ring hover:shadow-sm"
                >
                  {inner}
                </Link>
              ) : (
                <div
                  data-testid={`academy-track-${source.slug}`}
                  className="rounded-xl border border-dashed border-hairline bg-surface/60 p-5"
                >
                  {inner}
                  {englishOnly ? (
                    <Link
                      href={`/academy/${source.slug}`}
                      hrefLang="en"
                      data-testid={`academy-track-en-${source.slug}`}
                      className="mt-3 inline-block text-xs text-accent-text hover:underline"
                    >
                      {t.roadmap.readInEnglish} →
                    </Link>
                  ) : (
                    <details className="mt-3">
                      <summary className="cursor-pointer text-xs text-accent-text">
                        {t.roadmap.whatsComing}
                      </summary>
                      <ul className="mt-2 space-y-1 text-xs text-content-muted">
                        {track.lessons.map((l) => (
                          <li key={l.slug}>• {l.title}</li>
                        ))}
                      </ul>
                    </details>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ol>

      <section className="mt-12 rounded-xl border border-hairline bg-surface-muted p-5">
        <h2 className="font-semibold text-content-strong">
          {t.roadmap.howToTitle}
        </h2>
        <ul className="mt-2 space-y-1.5 text-sm text-content">
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
        className="mt-8 text-xs leading-relaxed text-content-muted"
      >
        {lang === "id" ? ISTQB_DISCLAIMER_ID : ISTQB_DISCLAIMER}
      </p>
    </>
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
