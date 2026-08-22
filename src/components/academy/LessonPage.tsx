import Link from "next/link";
import { notFound } from "next/navigation";
import { getSession } from "@/lib/auth";
import { AuthedAppShell } from "@/components/AuthedAppShell";
import { TFIcon } from "@/components/icons";
import { Markdown } from "@/components/Markdown";
import { JsonLd } from "@/components/JsonLd";
import { AcademyNav } from "@/components/AcademyNav";
import { AcademyPublicChrome } from "@/components/academy/PublicChrome";
import { AcademyLanguageLink } from "@/components/academy/LanguageLink";
import { AcademyLangMemory } from "@/components/academy/LangMemory";
import { SelfCheck } from "@/components/SelfCheck";
import { LessonDoneToggle } from "@/components/AcademyProgress";
import { TrademarkNotice } from "@/components/TrademarkNotice";
import { getTrack } from "@/content/academy";
import {
  hasIdLesson,
  localiseTrack,
  neighboursIn,
  visibleLessons,
} from "@/content/academy/i18n";
import { getSandboxTask } from "@/content/academy/sandbox";
import { openSandboxTask } from "@/app/actions/academy";
import { sanitizeQuestions } from "@/lib/academy/questions";
import type { Lang } from "@/lib/i18n";
import { academyChrome, academyPath } from "@/lib/academy/chrome";
import { ACADEMY_SHELL } from "@/components/academy/shell";
import { breadcrumbLd, ldGraph, techArticleLd } from "@/lib/seo";

/**
 * A-08: one lesson page, rendered in either language. See `TrackPage.tsx` for
 * why both routes call one component rather than keeping two copies.
 *
 * The exercise callout is deliberately *not* language-gated: `SANDBOX_TASKS` is
 * keyed by slug and slugs are not translated, so an Indonesian reader gets the
 * same "Start this exercise" button, opening the same sandbox, graded by the
 * same checker. Only the wording around it changes.
 *
 * A-12 gave this page the editorial layout (options in
 * `docs/design/academy-redesign-directions.html`). Three things about it are
 * structural rather than cosmetic:
 *
 * 1. **No `max-w-5xl` wrapper.** It sat *inside* the app shell, so on a wide
 *    screen the rail started ~390px right of the sidebar with nothing in
 *    between, and the body it left over was ~740px. The rail now sits at the
 *    left edge of the content area and the measure lives on the prose itself.
 * 2. **The rail carries state** — see `LessonRail`. Progress has been stored
 *    per lesson since A-05 and the rail never read it.
 * 3. **"Done" and "next" are pinned to the bottom of the viewport** while the
 *    lesson is on screen, instead of waiting at the end of eight minutes of
 *    reading and a quiz.
 */
export async function AcademyLessonPage({
  trackSlug,
  lessonSlug,
  lang,
}: {
  trackSlug: string;
  lessonSlug: string;
  lang: Lang;
}) {
  const source = getTrack(trackSlug);
  if (!source) notFound();
  // The visibility rule, not the published rule: on `/id` a lesson without
  // Indonesian text has no page, rather than one showing the English body at an
  // Indonesian URL. `src/content/academy/i18n.ts` has the reasoning.
  const visible = visibleLessons(source, lang);
  if (!visible.some((l) => l.slug === lessonSlug)) notFound();

  const track = localiseTrack(source, lang);
  const lesson = track.lessons.find((l) => l.slug === lessonSlug);
  if (!lesson) notFound();

  const t = academyChrome[lang];
  const session = await getSession();
  const { prev, next } = neighboursIn(track, lesson.slug, lang);
  const base = academyPath(lang);
  const trackPath = academyPath(lang, `/${track.slug}`);
  const lessonPath = `${trackPath}/${lesson.slug}`;
  const enPath = `/academy/${track.slug}/${lesson.slug}`;
  const shown = visible.map(
    (l) => track.lessons.find((x) => x.slug === l.slug) ?? l,
  );
  const position = shown.findIndex((l) => l.slug === lesson.slug) + 1;
  const sandboxTask = getSandboxTask(lesson.slug);
  const hasSibling = lang === "id" || hasIdLesson(track.slug, lesson.slug);

  const jsonLd = (
    <JsonLd
      data={ldGraph(
        techArticleLd({
          headline: lesson.title,
          description: lesson.summary,
          path: lessonPath,
        }),
        breadcrumbLd([
          { name: "TestForge", path: "/" },
          { name: t.brand, path: base },
          { name: track.title, path: trackPath },
          { name: lesson.title, path: lessonPath },
        ]),
      )}
    />
  );

  const body = (
    <div className="flex gap-10 lg:gap-12">
      <AcademyLangMemory lang={lang} />
      <AcademyNav
        track={track}
        lessons={shown}
        currentSlug={lesson.slug}
        lang={lang}
      />

      <article className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-3 border-b border-hairline pb-3">
          <p className="flex min-w-0 items-center gap-2 font-mono text-[10px] uppercase tracking-[0.14em] text-content-muted">
            <Link href={trackPath} className="truncate hover:text-accent-text">
              {track.title}
            </Link>
            <span aria-hidden>/</span>
            <span className="whitespace-nowrap tabular-nums text-content-strong">
              {t.lesson.position(position, shown.length)}
            </span>
          </p>
          {hasSibling && <AcademyLanguageLink lang={lang} enPath={enPath} />}
        </div>

        <div className="max-w-[47rem]">
          <h1 className="mt-9 font-display text-[34px] font-bold leading-[1.06] tracking-tight text-content-strong sm:text-[44px]">
            {lesson.title}
          </h1>
          <p className="mt-4 text-[21px] leading-snug text-content-muted">
            {lesson.summary}
          </p>
          <p className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-1 border-t border-hairline pt-3 font-mono text-[10px] uppercase tracking-[0.14em] text-content-subtle">
            <span>{t.minutesShort(lesson.minutes)}</span>
            <Link href={trackPath} className="hover:text-accent-text">
              {track.title}
            </Link>
            {lesson.sandbox && (
              <span className="text-accent-text" title={t.handsOnTitle}>
                {t.handsOn}
              </span>
            )}
          </p>

          {lesson.sandbox && (
            <div
              data-testid="academy-sandbox-callout"
              className="mt-8 flex gap-3 border-l-2 border-accent py-1 pl-4"
            >
              <TFIcon name="edit" className="mt-0.5 h-4 w-4 shrink-0" />
              <div className="text-[15px] leading-relaxed text-content">
                <p>
                  <strong className="text-content-strong">
                    {t.lesson.exerciseTitle}
                  </strong>{" "}
                  {t.lesson.exerciseBody}
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
                        {t.lesson.startExercise}
                      </button>
                    </form>
                  ) : (
                    <Link
                      href={`${base}/sandbox`}
                      data-testid="lesson-sandbox-link"
                      className="text-xs font-medium text-accent-text underline"
                    >
                      {t.lesson.openSandbox}
                    </Link>
                  )}
                  <Link
                    href="/signup"
                    className="text-xs text-content-muted underline"
                  >
                    {t.lesson.orSignUp}
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
              where it fits anyway. `tf-lesson` is the reading scale — see the
              block of the same name in globals.css. */}
          <Markdown className="tf-lesson mt-9 max-w-none max-md:[&_table]:block max-md:[&_table]:w-max max-md:[&_table]:max-w-full max-md:[&_table]:overflow-x-auto">
            {lesson.body}
          </Markdown>

          {/* A-02: sanitized here, in a server component — `sanitizeQuestions`
              is the only thing that crosses the answer-key boundary, and it
              runs before any of this reaches the RSC payload. A-08: the
              questions are the localised ones, but `correct` came from the
              English bank either way — a translation carries no answer key. */}
          {lesson.selfCheck?.length ? (
            <SelfCheck
              track={track.slug}
              lesson={lesson.slug}
              questions={sanitizeQuestions(lesson.selfCheck)}
              lang={lang}
            />
          ) : null}

          {track.trademarkNotice && <TrademarkNotice lang={lang} />}
        </div>

        {/* Pinned to the bottom of the viewport while the lesson is on screen.
            Marking a lesson done and starting the next one are the two things
            a reader does most, and both used to sit past the quiz. */}
        <nav
          className="sticky bottom-0 z-10 mt-14 flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-hairline bg-canvas/95 py-3 backdrop-blur"
          aria-label={t.lesson.nav}
        >
          <LessonDoneToggle
            lessonSlug={lesson.slug}
            trackSlug={track.slug}
            lang={lang}
          />

          {/* `min-w-0`: without it this flex item cannot shrink below the
              intrinsic width of two lesson titles, and the bar pushed the whole
              document 16px sideways at 375px — the truncation inside it never
              got a chance to apply. */}
          <div className="ml-auto flex min-w-0 items-center gap-6">
            {prev && (
              <Link
                href={`${trackPath}/${prev.slug}`}
                data-testid="academy-prev"
                className="min-w-0 max-w-[10rem] text-right sm:max-w-[16rem]"
              >
                <span className="block font-mono text-[9.5px] uppercase tracking-[0.16em] text-content-subtle">
                  {t.lesson.prevUp}
                </span>
                <span className="block truncate text-sm text-content-muted hover:text-accent-text">
                  {prev.title}
                </span>
              </Link>
            )}
            {next && (
              <Link
                href={`${trackPath}/${next.slug}`}
                data-testid="academy-next"
                className="group flex min-w-0 items-center gap-3"
              >
                <span className="min-w-0 text-right">
                  <span className="block font-mono text-[9.5px] uppercase tracking-[0.16em] text-content-subtle">
                    {t.lesson.nextUp}
                  </span>
                  <span className="block max-w-[16rem] truncate font-display text-[15px] font-semibold text-content-strong group-hover:text-accent-text">
                    {next.title}
                  </span>
                </span>
                <TFIcon
                  name="chevron-left"
                  className="h-4 w-4 shrink-0 rotate-180 text-content-muted"
                />
              </Link>
            )}
          </div>
        </nav>
      </article>
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
        <div lang={lang} className={ACADEMY_SHELL}>
          {body}
        </div>
      </AuthedAppShell>
    );
  }

  return (
    <main lang={lang} className={`${ACADEMY_SHELL} px-4 py-12`}>
      {jsonLd}
      <AcademyPublicChrome lang={lang} />
      {body}
    </main>
  );
}
