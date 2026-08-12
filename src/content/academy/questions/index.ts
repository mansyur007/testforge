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
// **Content status (2026-08-12, corrected by the A-10 audit).** The plan's bank
// target is ≥300 questions, ≥5x the per-chapter draw count. This holds **70** —
// 12 per chapter except chapter 5, which has 10. (This comment previously said
// 72 (12/chapter); it was wrong, and nothing caught it because
// scripts/academy-exam-selftest.mjs runs against a synthetic 12-per-chapter
// bank rather than this file.)
//
// That is enough to draw the full blueprint (max weight is chapter 4's 11) and
// every chapter quiz (8/chapter) without repeats within one paper, but well
// short of 5x, and the shortfall sits on the chapter the blueprint draws 9
// from: measured over 200 seeds, two papers share 28.2 of 40 questions on
// average and never fewer than 23. Every question here still carries a real
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
// What still matters when adding questions is everything shuffling can't fix:
// the correct answer being the longest option (true of 76% here), pool sizes
// below 5x their blueprint weight, and the total absence of multi-answer
// questions. scripts/academy-bank-check.mjs reports all three on every build.
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
