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
// **Content status (2026-08-13, A-10d's fifth slice).** The plan's bank target
// is ≥300 questions, ≥5x the per-chapter draw count. This holds **176**:
// chapters 1 (40), 4 (55), 5 (45) and 6 (12) are at or past their targets, and
// chapters 2 (12/30) and 3 (12/20) are the whole of the remaining debt.
// (Before A-10d this comment said 72, then 70; both were wrong, and nothing
// caught it because scripts/academy-exam-selftest.mjs runs against a synthetic
// 12-per-chapter bank rather than this file. scripts/academy-bank-check.mjs
// now reads the real bank and prints the counts on every build, so the number
// above is a convenience rather than the source of truth.)
//
// The shortfall now sits on chapters 2 and 3, which the blueprint draws 10 of
// a paper's 40 questions from — chapter 2 the sharper, drawing 6 from a pool of
// 12. The writing order for both is the untested-objective list the bank-check
// prints, not the pool count: chapter 2 is missing five of the six FL-2.1.x
// objectives, which is most of what makes it a chapter about modern lifecycles
// rather than about test levels.
//
// **On `syllabusRef` and `kLevel` — read before adding a question (A-10e).**
// This comment used to end "every question here carries a real `syllabusRef`
// for a reviewer to check against the objective, per §7.2". That was not true,
// and could not have been checked until 2026-08-12, when the real CTFL v4.0.1
// syllabus arrived and the whole bank was audited against it. What it found:
//   - 26 of 148 questions cited an objective code that **did not exist** — 14
//     invented codes. Chapter 5's numbering was wrong wholesale (its metrics
//     and defect-report codes were swapped with each other).
//   - 6 questions tested material ISTQB **removed** from Foundation Level in
//     v4.0 — use case testing (ch4-q10/q22/q48) and tool selection, pilots and
//     rollout (ch6-q5/q6/q10). Correct questions, wrong syllabus. Rewritten
//     rather than deleted, so the pools did not shrink.
//   - 58 of the 122 questions on valid refs carried a `kLevel` the syllabus
//     contradicts. The systematic one: all four `FL-4.2.x` techniques
//     (equivalence partitioning, BVA, decision tables, state transition) are
//     **K3**, and 10 questions here tagged them K2 — so the bank had been
//     modelling its heaviest chapter as easier than the real paper.
// Every tag in this bank was authored from memory of the syllabus rather than
// from the syllabus, which is the single root cause of all three.
//
// **Fixed 2026-08-13 (A-10e).** The 64 objectives are now data, in
// `src/lib/academy/syllabus-los.mjs`, and academy-bank-check.mjs asserts that a
// `syllabusRef` exists, belongs to the question's own chapter, and carries the
// `kLevel` the syllabus assigns it. So: **do not hand-check those two fields —
// the build does it, and it cannot be talked out of it.** Two consequences when
// writing a question:
//   - `kLevel` is not yours to choose. Pick the objective; the level follows.
//     If the level looks wrong for the question you have in mind, the objective
//     is wrong, not the level.
//   - the counts above were worse than the audit found: 70 refs needed
//     correcting, not 26, because 44 of them named a real objective about a
//     different topic. The existence check does not catch that class, and
//     nothing can. Read the objective before citing it.
//
// **On answer positions.** The correct answer is authored first or second in
// 127 of the 133 single-answer questions (`d` is still never correct in the
// array, `c` six times), so on the page, as authored, two of the four options
// would be dead on almost every question. A-10a fixed the consequence
// rather than the content: `presentPaper` in src/lib/academy/exam-core.mjs
// shuffles each question's choices per attempt, so position now carries no
// information and it does not matter where in the array a new question puts
// its answer. Write them wherever reads most naturally.
//
// What still matters when adding questions is everything shuffling can't fix.
// Chief among them, and the one this comment used to note in passing without
// measuring: **the correct answer being the longest option.** A-10d's third
// slice priced it — always picking the longest choice scored 65.2% on whole
// papers, above the pass line, a strictly better exploit than the answer
// position bias A-10a was written to kill. The fourth slice rewrote 204 choice
// texts across all six chapters and took it to 31.4%, passing no paper.
//
// So, when writing a question: **keep the key to the claim and let
// `explanation` carry the reasoning**, and give every distractor enough
// substance to be worth reading. Two failure modes to avoid, neither of which
// `presentPaper` can launder:
//   - the key is the only option long enough to be a real answer;
//   - a distractor is a joke ("the office's electricity usage"), which quietly
//     turns a four-choice question into a two-choice one.
// academy-bank-check.mjs simulates the length strategy against the real draw,
// asserts it stays near chance and never passes a paper, and prints the
// per-chapter breakdown on every build. It also reports pool sizes below 5x
// their blueprint weight and the multi-answer count, and asserts that multi
// questions vary how many choices they key.
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
