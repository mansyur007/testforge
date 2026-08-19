// A-01: the Academy content registry. Same shape as src/content/help/index.ts —
// plain TS modules imported at build time, not files read at request time.
//
// A-02: this module now carries answer keys (`SelfCheckQuestion.correct` and the
// explanations), so it is server-only. Importing it from a client component is a
// build error, which is a stronger guarantee than the lint rule the work order
// originally proposed — ESLint cannot express "files with 'use client'", since
// Next has no filename convention for them. Client components take the data they
// need as props, sanitized by `src/lib/academy/questions.ts`.
import "server-only";
import { fundamentals } from "./tracks/fundamentals";
import { manualPro } from "./tracks/manual-pro";
import { automation } from "./tracks/automation";
import { beyond } from "./tracks/beyond";
import { istqb } from "./tracks/istqb";
import type {
  ContentStatus,
  Lesson,
  SelfCheckQuestion,
  Track,
} from "./types";

export type { ContentStatus, Lesson, SelfCheckQuestion, Track };

/** Every track, in roadmap order — drafts included, because the roadmap shows
 *  them as "coming soon" cards. Anything that produces a *route* must filter to
 *  published first (see `publishedTracks`). */
export const TRACKS: Track[] = [
  fundamentals,
  manualPro,
  automation,
  beyond,
  istqb,
];

/**
 * Required on every surface that names the certification scheme — see
 * docs/QA-ACADEMY.md §7. One constant so it cannot drift between pages.
 */
export const ISTQB_DISCLAIMER =
  "ISTQB® is a registered trademark of the International Software Testing Qualifications Board. TestForge QA Academy is not affiliated with, endorsed by, or accredited by the ISTQB or any of its member boards. Practice questions are written from the published syllabus learning objectives and are not reproduced from any real examination.";

/**
 * A-08: the same notice in Indonesian, for `/id/academy/**`.
 *
 * §7.1 requires the notice on every page that names the scheme, and a page
 * that names the scheme in Indonesian is such a page — serving the English
 * paragraph under Indonesian prose would satisfy the letter of that rule and
 * not its point, which is that the reader understands they are not looking at
 * an ISTQB product. **The English text above stays authoritative**: this is a
 * translation of it, and the two must be changed together.
 * `scripts/academy-i18n-check.mjs` asserts both exist and that neither is a
 * copy of the other.
 */
export const ISTQB_DISCLAIMER_ID =
  "ISTQB® adalah merek dagang terdaftar milik International Software Testing Qualifications Board. TestForge QA Academy tidak berafiliasi dengan, tidak didukung oleh, dan tidak terakreditasi oleh ISTQB maupun member board mana pun di bawahnya. Soal latihan ditulis berdasarkan learning objective pada silabus yang diterbitkan dan bukan salinan dari ujian sungguhan mana pun.";

export function publishedTracks(): Track[] {
  return TRACKS.filter((t) => t.status === "published");
}

/** Published lessons of a track, in order. Drafts inside a published track are
 *  skipped the same way a draft track is — one status field, one rule. */
export function publishedLessons(track: Track): Lesson[] {
  return track.lessons.filter((l) => l.status === "published");
}

/** Published track by slug. Returns undefined for drafts on purpose: the route
 *  layer turns that into a 404 rather than serving unfinished content. */
export function getTrack(slug: string): Track | undefined {
  return publishedTracks().find((t) => t.slug === slug);
}

export function getLesson(
  trackSlug: string,
  lessonSlug: string,
): { track: Track; lesson: Lesson } | undefined {
  const track = getTrack(trackSlug);
  if (!track) return undefined;
  const lesson = publishedLessons(track).find((l) => l.slug === lessonSlug);
  return lesson ? { track, lesson } : undefined;
}

/** Previous/next within the track's published lessons — the prev/next footer is
 *  the main way people move through a track, so it must never point at a draft. */
export function lessonNeighbours(
  track: Track,
  lessonSlug: string,
): { prev: Lesson | null; next: Lesson | null } {
  const lessons = publishedLessons(track);
  const i = lessons.findIndex((l) => l.slug === lessonSlug);
  if (i === -1) return { prev: null, next: null };
  return {
    prev: i > 0 ? lessons[i - 1] : null,
    next: i < lessons.length - 1 ? lessons[i + 1] : null,
  };
}

export function trackMinutes(track: Track): number {
  return publishedLessons(track).reduce((sum, l) => sum + l.minutes, 0);
}

/**
 * A-05: which published track a lesson slug belongs to. Anonymous progress
 * (A-02) only ever recorded the slug, not the track, so
 * `claimAcademyProgress()` needs this to fill in `LessonProgress.trackSlug`
 * when folding localStorage into the DB. A removed or still-draft lesson
 * resolves to `undefined` — the claim just skips it rather than guessing.
 */
export function findLessonTrack(lessonSlug: string): Track | undefined {
  return publishedTracks().find((t) =>
    publishedLessons(t).some((l) => l.slug === lessonSlug),
  );
}
