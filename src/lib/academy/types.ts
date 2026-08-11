// A-02: the client-safe half of the quiz types. Deliberately its own module:
// `src/lib/academy/questions.ts` is `server-only`, and while a type-only import
// is erased before bundling, "this import is fine because the compiler removes
// it" is a thing a future edit can quietly falsify — dropping the `type` keyword
// would turn a client component into a build error at best and an answer-key
// leak at worst. Types the browser needs live here; anything that can read an
// answer key lives there.

/** Exactly what a client component may receive about a question. */
export type PublicQuestion = {
  id: string;
  stem: string;
  choices: { id: string; text: string }[];
  multi: boolean;
};

/** Returned by the grading action, after an answer has been submitted. */
export type QuestionVerdict = {
  id: string;
  correct: boolean;
  correctChoiceIds: string[];
  explanation: string;
};

export type SelfCheckResult =
  | { error: string }
  | { verdicts: QuestionVerdict[]; score: number; total: number };

/**
 * A-04b: the result of grading a sandbox exercise. Lives here rather than in
 * `src/lib/academy/checks.ts` for the same reason as everything else in this
 * file: `checks.ts` is `server-only`, and `AcademyCoach` (a client component)
 * needs the type without a chance of ever pulling in the module that touches
 * the database.
 */
export type CheckResult = { passed: boolean; feedback: string[] };
