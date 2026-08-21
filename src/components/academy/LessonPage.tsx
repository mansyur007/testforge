import Link from "next/link";
import { notFound } from "next/navigation";
import { getSession } from "@/lib/auth";
import { AuthedAppShell } from "@/components/AuthedAppShell";
import { TFIcon } from "@/components/icons";
import { Markdown } from "@/components/Markdown";
import { JsonLd } from "@/components/JsonLd";
import { AcademyNav, SandboxBadge } from "@/components/AcademyNav";
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
import { breadcrumbLd, ldGraph, techArticleLd } from "@/lib/seo";

/**
 * A-08: one lesson page, rendered in either language. See `TrackPage.tsx` for
 * why both routes call one component rather than keeping two copies.
 *
 * The exercise callout is deliberately *not* language-gated: `SANDBOX_TASKS` is
 * keyed by slug and slugs are not translated, so an Indonesian reader gets the
 * same "Start this exercise" button, opening the same sandbox, graded by the
 * same checker. Only the wording around it changes.
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
    <div className="flex gap-10">
      <AcademyLangMemory lang={lang} />
      <AcademyNav
        track={track}
        lessons={shown}
        currentSlug={lesson.slug}
        lang={lang}
      />

      <article className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-3">
          <Link
            href={trackPath}
            className="text-sm text-content-muted hover:text-accent-text md:hidden"
          >
            ← {track.title}
          </Link>
          <span className="ml-auto">
            {hasSibling && <AcademyLanguageLink lang={lang} enPath={enPath} />}
          </span>
        </div>

        <h1 className="mt-2 text-3xl font-bold text-content-strong md:mt-0">
          {lesson.title}
        </h1>
        <p className="mt-2 text-content-muted">{lesson.summary}</p>
        <p className="mt-3 flex flex-wrap items-center gap-2 text-xs text-content-muted">
          <span>{t.minutesShort(lesson.minutes)}</span>
          <span aria-hidden>·</span>
          <Link href={trackPath} className="hover:text-accent-text">
            {track.title}
          </Link>
          {lesson.sandbox && <SandboxBadge lang={lang} />}
        </p>

        {lesson.sandbox && (
          <div
            data-testid="academy-sandbox-callout"
            className="mt-6 flex gap-3 rounded-xl border border-hairline bg-accent-soft p-4"
          >
            <TFIcon name="edit" className="mt-0.5 h-5 w-5 shrink-0" />
            <div className="text-sm text-accent-soft-fg">
              <p>
                <strong>{t.lesson.exerciseTitle}</strong> {t.lesson.exerciseBody}
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
                    className="text-xs font-medium underline"
                  >
                    {t.lesson.openSandbox}
                  </Link>
                )}
                <Link href="/signup" className="text-xs underline">
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
            where it fits anyway. */}
        <Markdown className="mt-8 max-w-none text-base leading-relaxed max-md:[&_table]:block max-md:[&_table]:w-max max-md:[&_table]:max-w-full max-md:[&_table]:overflow-x-auto">
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

        <div className="mt-8 flex items-center gap-3">
          <LessonDoneToggle
            lessonSlug={lesson.slug}
            trackSlug={track.slug}
            lang={lang}
          />
        </div>

        <nav
          className="mt-12 flex flex-col gap-3 border-t border-hairline pt-6 sm:flex-row sm:justify-between"
          aria-label={t.lesson.nav}
        >
          {prev ? (
            <Link
              href={`${trackPath}/${prev.slug}`}
              data-testid="academy-prev"
              className="group min-w-0 rounded-xl border border-hairline bg-surface p-3 hover:border-accent-ring sm:max-w-[48%]"
            >
              <span className="block text-xs text-content-muted">
                {t.lesson.prev}
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
              href={`${trackPath}/${next.slug}`}
              data-testid="academy-next"
              className="group min-w-0 rounded-xl border border-hairline bg-surface p-3 text-right hover:border-accent-ring sm:max-w-[48%]"
            >
              <span className="block text-xs text-content-muted">
                {t.lesson.next}
              </span>
              <span className="block text-sm font-medium text-content-strong">
                {next.title}
              </span>
            </Link>
          ) : (
            <span />
          )}
        </nav>

        {track.trademarkNotice && <TrademarkNotice lang={lang} />}
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
