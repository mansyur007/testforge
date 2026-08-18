"use client";

import { useState } from "react";
import { gradeSelfCheck } from "@/app/actions/academy";
import { markDone } from "@/lib/academy/progress";
import type { PublicQuestion, QuestionVerdict } from "@/lib/academy/types";
import type { Lang } from "@/lib/i18n";
import { academyChrome } from "@/lib/academy/chrome";

// A-02: the in-lesson self-check. The questions arrive already sanitized (no
// `correct`, no explanation — see src/lib/academy/questions.ts), and grading is
// a server action, so this component genuinely cannot tell you the answer until
// the server has been asked. That is the point: the exam simulator in A-06 runs
// the same path, and a grader that is only trustworthy later is not one.

export function SelfCheck({
  track,
  lesson,
  questions,
  lang = "en",
}: {
  track: string;
  lesson: string;
  questions: PublicQuestion[];
  lang?: Lang;
}) {
  const t = academyChrome[lang];
  const [answers, setAnswers] = useState<Record<string, string[]>>({});
  const [verdicts, setVerdicts] = useState<QuestionVerdict[] | null>(null);
  const [score, setScore] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const answeredAll = questions.every((q) => (answers[q.id]?.length ?? 0) > 0);

  function toggle(q: PublicQuestion, choiceId: string) {
    if (verdicts) return; // locked until "Try again"
    setAnswers((prev) => {
      const current = prev[q.id] ?? [];
      if (!q.multi) return { ...prev, [q.id]: [choiceId] };
      return {
        ...prev,
        [q.id]: current.includes(choiceId)
          ? current.filter((id) => id !== choiceId)
          : [...current, choiceId],
      };
    });
  }

  async function submit() {
    setPending(true);
    setError(null);
    try {
      const result = await gradeSelfCheck({ track, lesson, answers, lang });
      if ("error" in result) {
        setError(result.error);
        return;
      }
      setVerdicts(result.verdicts);
      setScore(result.score);
      // A perfect run marks the lesson done. Anything less doesn't: the quiz is
      // the check, so "I got 2 of 3" is not a finished lesson — but the learner
      // can still tick it by hand with the toggle below if they disagree.
      if (result.score === result.total) markDone(lesson, track);
    } catch {
      setError(t.selfCheck.unreachable);
    } finally {
      setPending(false);
    }
  }

  function retry() {
    setVerdicts(null);
    setAnswers({});
    setError(null);
  }

  const verdictOf = (id: string) => verdicts?.find((v) => v.id === id);

  return (
    <section
      data-testid="self-check"
      className="mt-12 rounded-2xl border border-hairline bg-surface p-5"
      aria-labelledby="self-check-heading"
    >
      <h2
        id="self-check-heading"
        className="text-lg font-semibold text-content-strong"
      >
        {t.selfCheck.title}
      </h2>
      <p className="mt-1 text-sm text-content-muted">
        {t.selfCheck.intro(questions.length)}
      </p>

      <ol className="mt-6 space-y-6">
        {questions.map((q, i) => {
          const v = verdictOf(q.id);
          const chosen = answers[q.id] ?? [];
          return (
            <li key={q.id} data-testid={`self-check-q-${q.id}`}>
              <p className="font-medium text-content-strong">
                <span className="tabular-nums text-content-muted">{i + 1}.</span>{" "}
                {q.stem}
                {q.multi && (
                  <span className="ml-2 text-xs font-normal text-content-muted">
                    {t.selfCheck.chooseAll}
                  </span>
                )}
              </p>
              <div className="mt-2 space-y-1.5">
                {q.choices.map((c) => {
                  const picked = chosen.includes(c.id);
                  const isRight = v?.correctChoiceIds.includes(c.id);
                  // After grading, colour by truth rather than by what was
                  // picked: a missed correct answer has to be visible, not just
                  // the wrong one that was chosen.
                  const state = !v
                    ? picked
                      ? "border-accent-ring bg-accent-soft text-accent-soft-fg"
                      : "border-hairline hover:bg-surface-muted"
                    : isRight
                      ? "border-success-border bg-success-soft text-success-soft-fg"
                      : picked
                        ? "border-danger-border bg-danger-soft text-danger-soft-fg"
                        : "border-hairline text-content-muted";
                  return (
                    <label
                      key={c.id}
                      data-testid={`self-check-choice-${q.id}-${c.id}`}
                      className={`flex min-h-[44px] cursor-pointer items-center gap-3 rounded-lg border px-3 py-2 text-sm ${state}`}
                    >
                      <input
                        type={q.multi ? "checkbox" : "radio"}
                        name={q.id}
                        checked={picked}
                        disabled={Boolean(verdicts)}
                        onChange={() => toggle(q, c.id)}
                        className="h-4 w-4 shrink-0 accent-[rgb(var(--tf-accent))]"
                      />
                      <span>{c.text}</span>
                    </label>
                  );
                })}
              </div>
              {v && (
                <p
                  data-testid={`self-check-explanation-${q.id}`}
                  className="mt-2 rounded-lg bg-surface-muted p-3 text-sm text-content"
                >
                  <strong className="text-content-strong">
                    {v.correct ? t.selfCheck.correct : t.selfCheck.notQuite}
                  </strong>{" "}
                  {v.explanation}
                </p>
              )}
            </li>
          );
        })}
      </ol>

      {error && (
        <p data-testid="self-check-error" className="mt-4 text-sm text-danger">
          {error}
        </p>
      )}

      <div className="mt-6 flex flex-wrap items-center gap-3">
        {!verdicts ? (
          <button
            type="button"
            data-testid="self-check-submit"
            disabled={!answeredAll || pending}
            onClick={submit}
            className="min-h-[44px] rounded-lg bg-accent px-5 py-2 text-sm font-medium text-white hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-50"
          >
            {pending ? t.selfCheck.checking : t.selfCheck.check}
          </button>
        ) : (
          <>
            <p data-testid="self-check-score" className="text-sm font-medium">
              {t.selfCheck.score(score, questions.length)}
              {score === questions.length && t.selfCheck.allCorrect}
            </p>
            <button
              type="button"
              data-testid="self-check-retry"
              onClick={retry}
              className="min-h-[44px] rounded-lg border border-hairline px-4 py-2 text-sm font-medium text-content hover:bg-surface-muted"
            >
              {t.selfCheck.retry}
            </button>
          </>
        )}
        {!answeredAll && !verdicts && (
          <span className="text-xs text-content-muted">
            {t.selfCheck.answerAll}
          </span>
        )}
      </div>
    </section>
  );
}
