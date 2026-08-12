import "server-only";
import type { ExamQuestion } from "../types";
import { CH1_FUNDAMENTALS } from "./ch1-fundamentals";
import { CH2_SDLC } from "./ch2-sdlc";
import { CH3_STATIC_TESTING } from "./ch3-static-testing";
import { CH4_TEST_DESIGN } from "./ch4-test-design";
import { CH5_MANAGING_TESTING } from "./ch5-managing-testing";
import { CH6_TOOLS } from "./ch6-tools";

// A-06: the ISTQB Foundation question bank. `server-only` for the same
// answer-key reason as `src/content/academy/index.ts` (§2.2) — `correct` and
// `explanation` never reach a client bundle except through
// `sanitizeQuestion()`/the grading action. See docs/QA-ACADEMY.md §2.2, §5.1.
//
// **Content status (2026-08-12, A-10d's third slice).** The plan's bank target
// is ≥300 questions, ≥5x the per-chapter draw count. This holds **148**:
// chapters 4 (55), 5 (45) and 6 (12) are at or past their targets, chapters 1,
// 2 and 3 are untouched at 12 each and are the whole of the remaining debt.
// (Before A-10d this comment said 72, then 70; both were wrong, and nothing
// caught it because scripts/academy-exam-selftest.mjs runs against a synthetic
// 12-per-chapter bank rather than this file. scripts/academy-bank-check.mjs
// now reads the real bank and prints the counts on every build, so the number
// above is a convenience rather than the source of truth.)
//
// The shortfall now sits entirely on the three unbuilt chapters, which the
// blueprint draws 18 of a paper's 40 questions from — chapter 1 the sharpest,
// drawing 8 from a pool of 12. Every question here carries a real
// `syllabusRef` for a reviewer to check against the objective, per §7.2.
//
// **On answer positions.** The correct answer is `a` or `b` in 66 of these 70
// questions (`d` is never correct, `c` four times), so as authored, two of the
// four options are dead on almost every question. A-10a fixed the consequence
// rather than the content: `presentPaper` in src/lib/academy/exam-core.mjs
// shuffles each question's choices per attempt, so position now carries no
// information and it does not matter where in the array a new question puts
// its answer. Write them wherever reads most naturally.
//
// What still matters when adding questions is everything shuffling can't fix.
// Chief among them, and the one this comment used to note in passing without
// measuring: **the correct answer being the longest option.** A-10d's third
// slice priced it — always picking the longest choice scored 70.9% against the
// bank as it stood, above the 65% pass line, which made it a strictly better
// exploit than the answer-position bias A-10a was written to kill. It is a
// content property, so there is no `presentPaper` fix; write the distractors
// as carefully as the key. academy-bank-check.mjs now simulates it, reports it
// per chapter, and ratchets: the build fails if a new question makes it worse.
// The same script also reports pool sizes below 5x their blueprint weight and
// the multi-answer count, and asserts that multi questions vary how many
// choices they key.
export const QUESTION_BANK: ExamQuestion[] = [
  ...CH1_FUNDAMENTALS,
  ...CH2_SDLC,
  ...CH3_STATIC_TESTING,
  ...CH4_TEST_DESIGN,
  ...CH5_MANAGING_TESTING,
  ...CH6_TOOLS,
];

const BY_ID = new Map(QUESTION_BANK.map((q) => [q.id, q]));

export function byChapter(chapter: number): ExamQuestion[] {
  return QUESTION_BANK.filter((q) => q.chapter === chapter);
}

export function getQuestion(id: string): ExamQuestion | undefined {
  return BY_ID.get(id);
}

export function getQuestions(ids: string[]): ExamQuestion[] {
  // Preserves `ids`' order (the paper's presentation order) and silently
  // drops anything no longer in the bank — see the "question withdrawn"
  // degrade path in docs/QA-ACADEMY.md §3's ExamAttempt comment.
  return ids.map((id) => BY_ID.get(id)).filter((q): q is ExamQuestion => !!q);
}
