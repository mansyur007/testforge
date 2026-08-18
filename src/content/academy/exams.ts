import "server-only";
import type { ExamBlueprint } from "./types";

// A-06: the ISTQB Foundation exam blueprints. `server-only` for the same
// reason as `src/content/academy/index.ts` — nothing that shapes a paper
// belongs anywhere a client bundle could see it, even though a blueprint
// alone contains no answer key. See docs/QA-ACADEMY.md §5.1.
//
// **Verified 2026-08-18, and no longer a warning.** Every number below now
// matches ISTQB's *Exam Structure Tables* v1.18 (2026-05-27), page "CTFL v4.0":
// 40 questions as 8 / 6 / 4 / 11 / 9 / 2, pass at 65% (26 of 40), 60 minutes,
// and 75 minutes total under the non-native-language allowance. The
// per-chapter split was the last number in this file with no document behind
// it — it had been authored from memory of the syllabus and was correct, which
// is a good outcome and was not a safe assumption.
//
// Do not edit the weights here alone: `scripts/academy-bank-check.mjs` holds
// the published table and fails `npm run build` if this object drifts from it.
// A real change to the exam structure means editing both, with the document
// version in hand. See docs/QA-ACADEMY.md §5.1 — and §7.1 for why this is still
// never called "the ISTQB exam".

const FULL_PASS_PCT = 65; // 26/40

export const CTFL_V4_FULL: ExamBlueprint = {
  slug: "ctfl-v4-full",
  title: "Foundation Level Practice Exam (aligned to the CTFL v4.0 syllabus)",
  timed: true,
  durationSec: 60 * 60,
  extraTimeSec: 75 * 60, // non-native English speakers, offered as a checkbox at start
  passPct: FULL_PASS_PCT,
  chapters: [
    { chapter: 1, topic: "Fundamentals of Testing", count: 8 },
    { chapter: 2, topic: "Testing Throughout the SDLC", count: 6 },
    { chapter: 3, topic: "Static Testing", count: 4 },
    { chapter: 4, topic: "Test Analysis and Design", count: 11 },
    { chapter: 5, topic: "Managing the Test Activities", count: 9 },
    { chapter: 6, topic: "Test Tools", count: 2 },
  ],
};

const CHAPTER_TOPICS: Record<1 | 2 | 3 | 4 | 5 | 6, string> = {
  1: "Fundamentals of Testing",
  2: "Testing Throughout the SDLC",
  3: "Static Testing",
  4: "Test Analysis and Design",
  5: "Managing the Test Activities",
  6: "Test Tools",
};

/**
 * Untimed, 8 questions, single chapter — drilling before the full paper.
 * §5.2 of the plan says 10; this ships 8, sized to the initial bank (12
 * questions/chapter, §9 "the cost is content, not code" — the bank grows to
 * the ≥300/5x target in a later work order without this file changing shape).
 */
const CHAPTER_QUIZ_COUNT = 8;

export const CHAPTER_QUIZZES: ExamBlueprint[] = ([1, 2, 3, 4, 5, 6] as const).map(
  (chapter) => ({
    slug: `ctfl-v4-ch${chapter}`,
    title: `Chapter ${chapter} quiz — ${CHAPTER_TOPICS[chapter]}`,
    timed: false,
    // No timer in the UI, but the ticket still needs a bound — generous
    // enough that no honest attempt ever hits it.
    durationSec: 24 * 60 * 60,
    passPct: FULL_PASS_PCT,
    chapters: [{ chapter, topic: CHAPTER_TOPICS[chapter], count: CHAPTER_QUIZ_COUNT }],
  }),
);

export const EXAM_BLUEPRINTS: ExamBlueprint[] = [CTFL_V4_FULL, ...CHAPTER_QUIZZES];

export function getBlueprint(slug: string): ExamBlueprint | undefined {
  return EXAM_BLUEPRINTS.find((b) => b.slug === slug);
}
