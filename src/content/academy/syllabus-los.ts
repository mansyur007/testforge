import {
  CHAPTER_TITLES as CHAPTER_TITLES_CORE,
  SYLLABUS_OBJECTIVES as SYLLABUS_OBJECTIVES_CORE,
  OBJECTIVES_BY_ID as OBJECTIVES_BY_ID_CORE,
} from "@/lib/academy/syllabus-los.mjs";

// A-10e: the typed face of `src/lib/academy/syllabus-los.mjs`, which is where
// the 64 CTFL v4.0 learning objectives, their K-levels and their provenance
// live. Same split as `exam-core.mjs`/`exam.ts`: the data is plain ESM so
// `scripts/academy-bank-check.mjs` can import it under bare `node` at build
// time, and this file pins the shape so the app doesn't see `any`.

/** K1 recall, K2 understand, K3 apply — the syllabus's own cognitive levels. */
export type KLevel = "K1" | "K2" | "K3";

export type ChapterNumber = 1 | 2 | 3 | 4 | 5 | 6;

export type SyllabusObjective = {
  /** e.g. "FL-4.2.1". What `ExamQuestion.syllabusRef` must match. */
  id: string;
  chapter: ChapterNumber;
  /** e.g. "4.2" — the syllabus section the objective belongs to. */
  section: string;
  /** The section's title, as printed in the syllabus contents. */
  sectionTitle: string;
  /** The objective's level in the syllabus. A question's `kLevel` must equal
   *  this — asserted by `scripts/academy-bank-check.mjs`. */
  kLevel: KLevel;
  /** Our own short label for what the objective is about, not the syllabus's
   *  wording. See the note at the top of `syllabus-los.mjs`. */
  topic: string;
};

export const CHAPTER_TITLES = CHAPTER_TITLES_CORE as Record<ChapterNumber, string>;
export const SYLLABUS_OBJECTIVES = SYLLABUS_OBJECTIVES_CORE as SyllabusObjective[];
export const OBJECTIVES_BY_ID = OBJECTIVES_BY_ID_CORE as ReadonlyMap<string, SyllabusObjective>;

/** The objective a `syllabusRef` names, or `undefined` if it names nothing —
 *  which the build rejects, so a caller here can treat it as a real lookup. */
export function findObjective(ref: string): SyllabusObjective | undefined {
  return OBJECTIVES_BY_ID.get(ref);
}
