import "server-only";
import type {
  Lang,
} from "@/lib/i18n";
import type {
  Lesson,
  LessonTranslation,
  SelfCheckQuestion,
  Track,
  TrackTranslation,
} from "./types";
import { ID_TRACK_TRANSLATIONS } from "./translations/id";

// A-08: the Indonesian half of the Academy. `server-only` for the same reason
// as `index.ts` — this module resolves `selfCheck`, which carries answer keys.
//
// The English tree in `./tracks` is the source text and this module never
// mutates it: `localiseTrack` returns a *new* Track whose translated fields are
// swapped in and whose structure (slugs, order, status, minutes, `sandbox`,
// `trademarkNotice`) comes from the English original. An untranslated lesson
// falls back to English at the object level, but the *route* layer does not
// serve it — see `idLessonSlugs` and the note on it.

const BY_TRACK = new Map<string, TrackTranslation>(
  ID_TRACK_TRANSLATIONS.map((t) => [t.slug, t]),
);

/** Merge translated wording onto one question, keeping the English answer key.
 *  A choice with no translation keeps its English text rather than vanishing —
 *  the build check makes that unreachable, and losing an option silently would
 *  be far worse than showing one untranslated. */
function localiseQuestion(
  q: SelfCheckQuestion,
  tr: { stem: string; choices: { id: string; text: string }[]; explanation: string } | undefined,
): SelfCheckQuestion {
  if (!tr) return q;
  const text = new Map(tr.choices.map((c) => [c.id, c.text]));
  return {
    ...q,
    stem: tr.stem,
    explanation: tr.explanation,
    // `correct` is carried over from the English question, never read from the
    // translation — see the note on `QuestionTranslation` in types.ts.
    choices: q.choices.map((c) => ({ ...c, text: text.get(c.id) ?? c.text })),
  };
}

function localiseLesson(lesson: Lesson, tr: LessonTranslation | undefined): Lesson {
  if (!tr) return lesson;
  const byId = new Map(tr.selfCheck?.map((q) => [q.id, q]) ?? []);
  return {
    ...lesson,
    title: tr.title,
    summary: tr.summary,
    body: tr.body,
    selfCheck: lesson.selfCheck?.map((q) => localiseQuestion(q, byId.get(q.id))),
  };
}

/**
 * A track as it should read in `lang`. `en` returns the original object
 * unchanged — identity, not a copy — so nothing on the English path pays for
 * this existing.
 */
export function localiseTrack(track: Track, lang: Lang): Track {
  if (lang === "en") return track;
  const tr = BY_TRACK.get(track.slug);
  if (!tr) return track;
  const bySlug = new Map(tr.lessons.map((l) => [l.slug, l]));
  return {
    ...track,
    title: tr.title,
    tagline: tr.tagline,
    level: tr.level,
    outcomes: tr.outcomes,
    lessons: track.lessons.map((l) => localiseLesson(l, bySlug.get(l.slug))),
  };
}

/**
 * One lesson's `selfCheck` as a reader of `lang` sees it.
 *
 * `LessonPage` already sanitizes the *localised* questions into the page, so
 * the stems and choices a reader answers are in their language. The grader is
 * a separate lookup, and it was the one that stayed English — which showed up
 * only after answering, as an English explanation under an Indonesian
 * question. `correct` is unaffected in either direction: `localiseQuestion`
 * takes the answer key from the English bank whatever language it is asked for.
 */
export function localiseSelfCheck(
  track: Track,
  lessonSlug: string,
  lang: Lang,
): SelfCheckQuestion[] | undefined {
  return localiseTrack(track, lang).lessons.find((l) => l.slug === lessonSlug)
    ?.selfCheck;
}

/**
 * The lesson slugs of `trackSlug` that have Indonesian text, as a Set.
 *
 * **This is what the `/id` routes gate on, and it is the whole fallback
 * policy.** A lesson with no translation 404s under `/id/academy/**` rather
 * than serving the English body at an Indonesian URL: duplicate content under a
 * second path is the specific thing `hreflang` exists to prevent, and shipping
 * it would make the Indonesian routes worth less than not having them. The same
 * set drives the sitemap and the `hreflang` alternates, so a lesson is
 * advertised in Indonesian in exactly one place and only when it really is.
 */
export function idLessonSlugs(trackSlug: string): Set<string> {
  return new Set(BY_TRACK.get(trackSlug)?.lessons.map((l) => l.slug) ?? []);
}

/** Track slugs with any Indonesian content at all. A track page is served in
 *  Indonesian as soon as its own copy is translated, listing whichever of its
 *  lessons are — a partly translated track is a normal state during A-08's
 *  roll-out, not an error. */
export function idTrackSlugs(): Set<string> {
  return new Set(BY_TRACK.keys());
}

export function hasIdLesson(trackSlug: string, lessonSlug: string): boolean {
  return idLessonSlugs(trackSlug).has(lessonSlug);
}

/**
 * The lessons of `track` that should be listed and linked in `lang`.
 *
 * English: every published lesson. Indonesian: the published lessons that have
 * Indonesian text, in the English track's order. One definition, used by the
 * track page, the lesson rail, the prev/next footer and the sitemap, so a
 * partly translated track cannot advertise a lesson in one place and 404 in
 * another.
 */
export function visibleLessons(track: Track, lang: Lang): Lesson[] {
  const published = track.lessons.filter((l) => l.status === "published");
  if (lang === "en") return published;
  const ids = idLessonSlugs(track.slug);
  return published.filter((l) => ids.has(l.slug));
}

/** Previous/next within what `lang` actually shows. The English helper walks
 *  every published lesson; on `/id` that would point at a 404 the moment a
 *  track is half translated. */
export function neighboursIn(
  track: Track,
  lessonSlug: string,
  lang: Lang,
): { prev: Lesson | null; next: Lesson | null } {
  const lessons = visibleLessons(track, lang);
  const i = lessons.findIndex((l) => l.slug === lessonSlug);
  if (i === -1) return { prev: null, next: null };
  return {
    prev: i > 0 ? lessons[i - 1] : null,
    next: i < lessons.length - 1 ? lessons[i + 1] : null,
  };
}

/** Tracks to show on the roadmap in `lang`: published tracks, and in
 *  Indonesian only those with at least one translated lesson. A track whose
 *  own copy is translated but whose lessons are not would render a listing
 *  with nothing to click. */
export function visibleTracks(tracks: Track[], lang: Lang): Track[] {
  const published = tracks.filter((t) => t.status === "published");
  if (lang === "en") return published;
  return published.filter((t) => idLessonSlugs(t.slug).size > 0);
}
