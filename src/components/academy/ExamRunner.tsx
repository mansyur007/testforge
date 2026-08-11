"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  startExamAction,
  submitExamAction,
  type SubmitExamResult,
} from "@/app/actions/academy";
import type { PublicQuestion } from "@/lib/academy/types";

// A-06: the exam UI — one component that runs both the full ISTQB practice
// exam and each untimed chapter quiz (docs/QA-ACADEMY.md §5.2: "reusing the
// same engine"). Everything about *when* the attempt started and *how long*
// it may run comes back from the server inside the signed ticket
// (`startExamAction`) and is never recomputed from the client's own clock —
// see src/lib/academy/exam.ts for why.

type ChapterWeight = { chapter: number; topic: string; count: number };

type Phase = "start" | "taking" | "result";

const WARN_AT_SEC = [600, 120]; // 10 min, 2 min

function formatClock(sec: number): string {
  const s = Math.max(0, Math.round(sec));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${String(r).padStart(2, "0")}`;
}

export function ExamRunner({
  templateSlug,
  title,
  timed,
  chapters,
  passPct,
  baseDurationSec,
  extraTimeSec,
  resumePath,
}: {
  templateSlug: string;
  title: string;
  timed: boolean;
  chapters: ChapterWeight[];
  passPct: number;
  /** The blueprint's own duration — public (a paper's length isn't a secret,
   *  only its questions are), so it's known before an attempt even starts. */
  baseDurationSec: number;
  extraTimeSec?: number;
  /** Where "Back to Academy" / a fresh attempt link should go. */
  resumePath: string;
}) {
  const router = useRouter();
  const totalQuestions = chapters.reduce((n, c) => n + c.count, 0);

  const [phase, setPhase] = useState<Phase>("start");
  const [extraTime, setExtraTime] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const [ticket, setTicket] = useState<string | null>(null);
  const [questions, setQuestions] = useState<PublicQuestion[]>([]);
  const [deadline, setDeadline] = useState<number | null>(null); // client Date.now() ms estimate
  const [answers, setAnswers] = useState<Record<string, string[]>>({});
  const [flagged, setFlagged] = useState<Set<string>>(new Set());
  const [index, setIndex] = useState(0);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [remainingSec, setRemainingSec] = useState<number | null>(null);

  const [result, setResult] = useState<SubmitExamResult | null>(null);

  async function begin() {
    setPending(true);
    setError(null);
    try {
      const started = await startExamAction(templateSlug, extraTime);
      if ("error" in started) {
        setError(started.error);
        return;
      }
      setTicket(started.ticket);
      setQuestions(started.questions);
      setDeadline(timed ? started.startedAt + started.durationSec * 1000 : null);
      setAnswers({});
      setFlagged(new Set());
      setIndex(0);
      setPhase("taking");
    } catch {
      setError("Couldn't reach the server. Try again.");
    } finally {
      setPending(false);
    }
  }

  const doSubmit = useMemo(
    () => async () => {
      if (!ticket || pending) return;
      setPending(true);
      setError(null);
      try {
        const res = await submitExamAction(ticket, answers);
        if ("error" in res) {
          setError(res.error);
          return;
        }
        if (res.attemptId) {
          router.push(`/academy/istqb/practice-exam/${res.attemptId}`);
          return;
        }
        setResult(res);
        setPhase("result");
      } catch {
        setError("Couldn't reach the server. Your answers are still on this page — try submitting again.");
      } finally {
        setPending(false);
        setConfirmOpen(false);
      }
    },
    [ticket, answers, pending, router],
  );

  // Countdown — purely a display; the server's own clock is what actually
  // decides "late" at submit time (docs/QA-ACADEMY.md §2.3). Ticking here
  // still drives the 10/2-minute warnings and the auto-submit at zero.
  useEffect(() => {
    if (phase !== "taking" || !timed || deadline === null) return;
    const tick = () => {
      const left = (deadline - Date.now()) / 1000;
      setRemainingSec(left);
      if (left <= 0) doSubmit();
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [phase, timed, deadline, doSubmit]);

  function toggle(q: PublicQuestion, choiceId: string) {
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

  function toggleFlag(id: string) {
    setFlagged((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const answeredCount = questions.filter((q) => (answers[q.id]?.length ?? 0) > 0).length;
  const unansweredCount = questions.length - answeredCount;
  const flaggedCount = flagged.size;
  const activeWarning = WARN_AT_SEC.find(
    (mark) => remainingSec !== null && remainingSec <= mark && remainingSec > mark - 1,
  );

  // -------------------------------------------------------------- start ---
  if (phase === "start") {
    return (
      <section
        data-testid="exam-start"
        className="rounded-2xl border border-hairline bg-surface p-6"
      >
        <h1 className="text-xl font-semibold text-content-strong">{title}</h1>
        <dl className="mt-4 grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
          <div>
            <dt className="text-content-muted">Questions</dt>
            <dd className="font-medium text-content-strong">{totalQuestions}</dd>
          </div>
          <div>
            <dt className="text-content-muted">Time limit</dt>
            <dd className="font-medium text-content-strong">
              {timed
                ? `${Math.round((extraTime && extraTimeSec ? extraTimeSec : baseDurationSec) / 60)} min`
                : "Untimed"}
            </dd>
          </div>
          <div>
            <dt className="text-content-muted">Pass mark</dt>
            <dd className="font-medium text-content-strong">{passPct}%</dd>
          </div>
          <div>
            <dt className="text-content-muted">Chapters covered</dt>
            <dd className="font-medium text-content-strong">{chapters.length}</dd>
          </div>
        </dl>

        <ul className="mt-4 space-y-1 text-sm text-content-muted">
          {chapters.map((c) => (
            <li key={c.chapter}>
              Ch {c.chapter} — {c.topic}: {c.count} question{c.count === 1 ? "" : "s"}
            </li>
          ))}
        </ul>

        {timed && !!extraTimeSec && (
          <label className="mt-5 flex items-center gap-2 text-sm text-content">
            <input
              type="checkbox"
              checked={extraTime}
              onChange={(e) => setExtraTime(e.target.checked)}
              className="h-4 w-4 accent-[rgb(var(--tf-accent))]"
              data-testid="exam-extra-time"
            />
            I&rsquo;m a non-native English speaker (extra time)
          </label>
        )}

        <p className="mt-5 text-sm text-content-muted">
          One question per screen. You can flag questions to revisit and jump
          to any question from the navigator.{" "}
          {timed && "The timer starts the moment you click Begin and auto-submits at zero."}
        </p>

        {error && (
          <p data-testid="exam-error" className="mt-4 text-sm text-danger">
            {error}
          </p>
        )}

        <button
          type="button"
          data-testid="exam-begin"
          disabled={pending}
          onClick={begin}
          className="mt-6 min-h-[44px] rounded-lg bg-accent px-6 py-2 text-sm font-medium text-white hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-50"
        >
          {pending ? "Starting…" : "Begin"}
        </button>
      </section>
    );
  }

  // ------------------------------------------------------------- taking ---
  if (phase === "taking") {
    const q = questions[index];
    const chosen = answers[q.id] ?? [];

    return (
      <section data-testid="exam-taking" className="grid gap-6 lg:grid-cols-[1fr_220px]">
        <div className="rounded-2xl border border-hairline bg-surface p-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-content-muted">
              Question {index + 1} of {questions.length}
            </p>
            {timed && remainingSec !== null && (
              <p
                data-testid="exam-timer"
                className={`font-mono text-sm font-medium tabular-nums ${
                  remainingSec <= 120 ? "text-danger" : "text-content-strong"
                }`}
              >
                {formatClock(remainingSec)}
              </p>
            )}
          </div>

          {activeWarning !== undefined && (
            <p
              data-testid="exam-time-warning"
              className="mt-3 rounded-lg border border-danger-border bg-danger-soft px-3 py-2 text-sm text-danger-soft-fg"
            >
              {activeWarning === 600 ? "10 minutes remaining." : "2 minutes remaining — finish up."}
            </p>
          )}

          <p className="mt-4 font-medium text-content-strong">
            {q.stem}
            {q.multi && (
              <span className="ml-2 text-xs font-normal text-content-muted">
                (choose all that apply)
              </span>
            )}
          </p>

          <div className="mt-3 space-y-1.5">
            {q.choices.map((c) => {
              const picked = chosen.includes(c.id);
              return (
                <label
                  key={c.id}
                  data-testid={`exam-choice-${q.id}-${c.id}`}
                  className={`flex min-h-[44px] cursor-pointer items-center gap-3 rounded-lg border px-3 py-2 text-sm ${
                    picked
                      ? "border-accent-ring bg-accent-soft text-accent-soft-fg"
                      : "border-hairline hover:bg-surface-muted"
                  }`}
                >
                  <input
                    type={q.multi ? "checkbox" : "radio"}
                    name={q.id}
                    checked={picked}
                    onChange={() => toggle(q, c.id)}
                    className="h-4 w-4 shrink-0 accent-[rgb(var(--tf-accent))]"
                  />
                  <span>{c.text}</span>
                </label>
              );
            })}
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <button
              type="button"
              data-testid="exam-prev"
              disabled={index === 0}
              onClick={() => setIndex((i) => Math.max(0, i - 1))}
              className="min-h-[44px] rounded-lg border border-hairline px-4 py-2 text-sm font-medium text-content hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-50"
            >
              Previous
            </button>
            <button
              type="button"
              data-testid="exam-next"
              disabled={index === questions.length - 1}
              onClick={() => setIndex((i) => Math.min(questions.length - 1, i + 1))}
              className="min-h-[44px] rounded-lg border border-hairline px-4 py-2 text-sm font-medium text-content hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next
            </button>
            <button
              type="button"
              data-testid="exam-flag"
              onClick={() => toggleFlag(q.id)}
              className={`min-h-[44px] rounded-lg border px-4 py-2 text-sm font-medium ${
                flagged.has(q.id)
                  ? "border-warning-border bg-warning-soft text-warning-soft-fg"
                  : "border-hairline text-content hover:bg-surface-muted"
              }`}
            >
              {flagged.has(q.id) ? "Flagged for review" : "Flag for review"}
            </button>
            <button
              type="button"
              data-testid="exam-review-submit"
              onClick={() => setConfirmOpen(true)}
              className="ml-auto min-h-[44px] rounded-lg bg-accent px-5 py-2 text-sm font-medium text-white hover:bg-accent-hover"
            >
              Review &amp; submit
            </button>
          </div>

          {error && (
            <p data-testid="exam-error" className="mt-4 text-sm text-danger">
              {error}
            </p>
          )}
        </div>

        <nav
          aria-label="Question navigator"
          data-testid="exam-navigator"
          className="h-fit rounded-2xl border border-hairline bg-surface p-4"
        >
          <p className="text-xs font-medium text-content-muted">Navigator</p>
          <div className="mt-2 grid grid-cols-6 gap-1.5 lg:grid-cols-5">
            {questions.map((qq, i) => {
              const isAnswered = (answers[qq.id]?.length ?? 0) > 0;
              const isFlagged = flagged.has(qq.id);
              const isCurrent = i === index;
              return (
                <button
                  key={qq.id}
                  type="button"
                  data-testid={`exam-nav-${i + 1}`}
                  onClick={() => setIndex(i)}
                  className={`flex h-8 w-8 items-center justify-center rounded-md border text-xs font-medium tabular-nums ${
                    isCurrent
                      ? "border-accent-ring bg-accent text-white"
                      : isFlagged
                        ? "border-warning-border bg-warning-soft text-warning-soft-fg"
                        : isAnswered
                          ? "border-success-border bg-success-soft text-success-soft-fg"
                          : "border-hairline text-content-muted hover:bg-surface-muted"
                  }`}
                >
                  {i + 1}
                </button>
              );
            })}
          </div>
          <p className="mt-3 text-xs text-content-muted">
            {answeredCount} answered · {flaggedCount} flagged
          </p>
        </nav>

        {confirmOpen && (
          <div
            role="dialog"
            aria-label="Confirm submit"
            data-testid="exam-confirm-submit"
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          >
            <div className="w-full max-w-sm rounded-2xl border border-hairline bg-surface p-6">
              <h2 className="font-semibold text-content-strong">Submit this attempt?</h2>
              <p className="mt-2 text-sm text-content">
                {unansweredCount} unanswered, {flaggedCount} flagged for review.
              </p>
              <div className="mt-5 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setConfirmOpen(false)}
                  className="min-h-[44px] rounded-lg border border-hairline px-4 py-2 text-sm font-medium text-content hover:bg-surface-muted"
                >
                  Keep working
                </button>
                <button
                  type="button"
                  data-testid="exam-confirm-submit-btn"
                  disabled={pending}
                  onClick={doSubmit}
                  className="min-h-[44px] rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {pending ? "Submitting…" : "Submit"}
                </button>
              </div>
            </div>
          </div>
        )}
      </section>
    );
  }

  // ------------------------------------------------------------- result ---
  if (phase === "result" && result && !("error" in result)) {
    return (
      <section data-testid="exam-result" className="space-y-6">
        <div
          className={`rounded-2xl border p-6 ${
            result.passed
              ? "border-success-border bg-success-soft"
              : "border-danger-border bg-danger-soft"
          }`}
        >
          <p
            data-testid="exam-result-headline"
            className={`text-lg font-semibold ${
              result.passed ? "text-success-soft-fg" : "text-danger-soft-fg"
            }`}
          >
            {result.passed ? "Pass" : "Not a pass"} — {result.score} / {result.total} ({passPct}% needed to pass)
          </p>
          {result.late && (
            <p className="mt-1 text-sm text-content-muted">
              This submission arrived after the time limit — graded exactly as answered.
            </p>
          )}
        </div>

        <div className="rounded-2xl border border-hairline bg-surface p-6">
          <h2 className="font-semibold text-content-strong">Per-chapter breakdown</h2>
          <ul className="mt-3 space-y-2">
            {Object.entries(result.chapterScores)
              .sort(([a], [b]) => Number(a) - Number(b))
              .map(([chapter, s]) => {
                const pct = s.total > 0 ? Math.round((s.correct / s.total) * 100) : 0;
                return (
                  <li key={chapter} data-testid={`exam-chapter-bar-${chapter}`}>
                    <div className="flex items-center justify-between text-xs text-content-muted">
                      <span>Chapter {chapter}</span>
                      <span>
                        {s.correct}/{s.total}
                      </span>
                    </div>
                    <div className="mt-1 h-2 rounded-full bg-surface-muted">
                      <div
                        className={`h-2 rounded-full ${pct >= passPct ? "bg-success" : "bg-danger"}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </li>
                );
              })}
          </ul>
        </div>

        <div className="rounded-2xl border border-hairline bg-surface p-6">
          <h2 className="font-semibold text-content-strong">Full review</h2>
          <ol className="mt-3 space-y-4">
            {result.verdicts.map((v, i) => (
              <li key={v.id} data-testid={`exam-review-${v.id}`}>
                <p className="text-sm font-medium text-content-strong">
                  {i + 1}. {v.stem}
                </p>
                <p className="mt-1 text-xs text-content-muted">
                  Your answer: {v.chosenIds.length ? v.chosenIds.join(", ") : "(none)"} · Correct:{" "}
                  {v.correctChoiceIds.join(", ")}
                </p>
                <p
                  className={`mt-1 rounded-lg p-2 text-sm ${
                    v.correct
                      ? "bg-success-soft text-success-soft-fg"
                      : "bg-danger-soft text-danger-soft-fg"
                  }`}
                >
                  {v.explanation}
                </p>
              </li>
            ))}
          </ol>
        </div>

        <div className="flex gap-3">
          <a
            href={resumePath}
            className="min-h-[44px] rounded-lg border border-hairline px-4 py-2 text-sm font-medium text-content hover:bg-surface-muted"
          >
            Back to Academy
          </a>
          <a
            href="/signup"
            data-testid="exam-result-signup-cta"
            className="min-h-[44px] rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover"
          >
            Save this attempt — sign up
          </a>
        </div>
      </section>
    );
  }

  return null;
}
