import "server-only";
import type { SelfCheckQuestion } from "@/content/academy/types";
import type { PublicQuestion, QuestionVerdict } from "./types";

export type { PublicQuestion, QuestionVerdict };

// A-02: the boundary between the answer key and the browser. Everything the
// client is allowed to see about a question comes out of `sanitizeQuestion`;
// everything it learns after answering comes out of `gradeQuestion`. Grading is
// never done on the client, even for a three-question self-check — the exam
// simulator in A-06 reuses this exact path, and a scoring function that only
// becomes trustworthy later is a scoring function nobody trusts.

export function sanitizeQuestion(q: SelfCheckQuestion): PublicQuestion {
  return {
    id: q.id,
    stem: q.stem,
    choices: q.choices.map((c) => ({ id: c.id, text: c.text })),
    multi: q.multi ?? false,
  };
}

export function sanitizeQuestions(qs: SelfCheckQuestion[]): PublicQuestion[] {
  return qs.map(sanitizeQuestion);
}

function correctIds(q: SelfCheckQuestion): string[] {
  return q.choices.filter((c) => c.correct).map((c) => c.id);
}

/**
 * Set equality, not "contains" — picking every choice on a multi-answer question
 * is not a correct answer, and picking one of two is not either.
 */
export function gradeQuestion(
  q: SelfCheckQuestion,
  chosen: string[],
): QuestionVerdict {
  const want = correctIds(q);
  const got = Array.from(new Set(chosen));
  const correct =
    want.length === got.length && want.every((id) => got.includes(id));
  return { id: q.id, correct, correctChoiceIds: want, explanation: q.explanation };
}

export function gradeQuestions(
  questions: SelfCheckQuestion[],
  answers: Record<string, string[]>,
): { verdicts: QuestionVerdict[]; score: number; total: number } {
  const verdicts = questions.map((q) => gradeQuestion(q, answers[q.id] ?? []));
  return {
    verdicts,
    score: verdicts.filter((v) => v.correct).length,
    total: questions.length,
  };
}
