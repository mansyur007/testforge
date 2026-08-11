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
// **Content status (2026-08-11, A-06).** The plan's bank target is ≥300
// questions, ≥5x the per-chapter draw count. This ships 72 (12/chapter),
// enough to draw the full blueprint (max weight is chapter 4's 11) and every
// chapter quiz (8/chapter) without repeats within one paper, but well short
// of 5x — repeated papers across different seeds will overlap more than the
// target design calls for. Tracked as content debt for a follow-up work
// order per docs/QA-ACADEMY.md §9 ("the cost is content, not code"); every
// question here still carries a real `syllabusRef` for a reviewer to check
// against the objective, per §7.2.
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
