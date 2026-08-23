"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  startExamAction,
  submitExamAction,
  type SubmitExamResult,
} from "@/app/actions/academy";
import type { PublicQuestion } from "@/lib/academy/types";
import {
  AUTO_SUBMIT_BACKOFF_MS,
  answeredCount as snapshotAnsweredCount,
  clearSnapshot,
  readSnapshot,
  writeSnapshot,
  type ExamSnapshot,
} from "@/lib/academy/exam-session";

// A-06: the exam UI — one component that runs both the full ISTQB practice
// exam and each untimed chapter quiz (docs/QA-ACADEMY.md §5.2: "reusing the
// same engine"). Everything about *when* the attempt started and *how long*
// it may run comes back from the server inside the signed ticket
// (`startExamAction`) and is never recomputed from the client's own clock —
// see src/lib/academy/exam.ts for why.
//
// A-10c: an attempt in progress is mirrored into `sessionStorage` on every
// change (`src/lib/academy/exam-session.ts`) and offered back on mount, so a
// reload no longer discards 40 minutes of answers along with the ticket that
// was the only way back into them. Auto-submit at the deadline fires once and
// backs off instead of retrying every second into a rate-limited endpoint.

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

  // A-10c: an attempt recovered from sessionStorage, offered on the start
  // screen rather than resumed silently — someone who deliberately went back to
  // start a fresh paper should not be dropped into the old one.
  const [resumable, setResumable] = useState<ExamSnapshot | null>(null);
  const [autoGaveUp, setAutoGaveUp] = useState(false);

  // `pending` and `answers` are read from inside the one-second timer, which
  // must not be torn down and rebuilt on every keystroke — and a `pending`
  // guard that only sees a render-old value is exactly how A-06's auto-submit
  // managed to fire again while the previous request was still in flight.
  const pendingRef = useRef(false);
  const answersRef = useRef(answers);
  answersRef.current = answers;
  const autoSubmitRef = useRef({ tries: 0, nextAt: 0, done: false });

  useEffect(() => {
    const found = readSnapshot(templateSlug);
    if (found) setResumable(found);
  }, [templateSlug]);

  // What the server said about this attempt's clock. Kept in refs rather than
  // state because nothing renders from them directly — `deadline` is the
  // rendered form — but the snapshot has to carry them so a resumed attempt
  // rebuilds the same countdown.
  const startedAtRef = useRef<number | null>(null);
  const durationSecRef = useRef(baseDurationSec);

  // Mirror every change while an attempt is live. Cheap (a JSON write of a
  // paper that is 40 questions at its largest) and the alternative is losing
  // the lot, which is what A-10c exists to fix.
  useEffect(() => {
    if (phase !== "taking" || !ticket || questions.length === 0) return;
    if (startedAtRef.current === null) return;
    writeSnapshot({
      v: 1,
      templateSlug,
      ticket,
      questions,
      answers,
      flagged: Array.from(flagged),
      index,
      startedAt: startedAtRef.current,
      durationSec: durationSecRef.current,
      timed,
    });
  }, [phase, ticket, questions, answers, flagged, index, templateSlug, timed]);

  async function begin() {
    setPending(true);
    setError(null);
    try {
      const started = await startExamAction(templateSlug, extraTime);
      if ("error" in started) {
        setError(started.error);
        return;
      }
      startedAtRef.current = started.startedAt;
      durationSecRef.current = started.durationSec;
      autoSubmitRef.current = { tries: 0, nextAt: 0, done: false };
      setAutoGaveUp(false);
      setResumable(null);
      setTicket(started.ticket);
      setQuestions(started.questions);
      setDeadline(timed ? started.startedAt + started.durationSec * 1000 : null);
      setAnswers({});
      setFlagged(new Set());
      setIndex(0);
      setPhase("taking");
      writeSnapshot({
        v: 1,
        templateSlug,
        ticket: started.ticket,
        questions: started.questions,
        answers: {},
        flagged: [],
        index: 0,
        startedAt: started.startedAt,
        durationSec: started.durationSec,
        timed,
      });
    } catch {
      setError("Couldn't reach the server. Try again.");
    } finally {
      setPending(false);
    }
  }

  function resume(snapshot: ExamSnapshot) {
    startedAtRef.current = snapshot.startedAt;
    durationSecRef.current = snapshot.durationSec;
    autoSubmitRef.current = { tries: 0, nextAt: 0, done: false };
    setAutoGaveUp(false);
    setError(null);
    setTicket(snapshot.ticket);
    setQuestions(snapshot.questions);
    setDeadline(
      snapshot.timed ? snapshot.startedAt + snapshot.durationSec * 1000 : null,
    );
    setAnswers(snapshot.answers);
    setFlagged(new Set(snapshot.flagged));
    setIndex(snapshot.index);
    setResumable(null);
    setPhase("taking");
    // A timed attempt whose deadline passed while the tab was gone needs no
    // special case: the countdown effect below runs on mount, sees zero left,
    // and auto-submits what was recovered. Grading a late paper exactly as
    // answered is already the server's behaviour (§2.3), and it beats the
    // alternative of discarding answers nobody got to submit.
  }

  function discardResumable() {
    clearSnapshot(templateSlug);
    setResumable(null);
  }

  const doSubmit = useCallback(
    async (kind: "manual" | "auto" = "manual") => {
      if (!ticket || pendingRef.current) return;
      pendingRef.current = true;
      setPending(true);
      setError(null);

      // Only an auto-submit backs off — a manual press is a person who has
      // just been told to try again, and gating that behind a timer would be
      // the same lockout in a different costume.
      const noteAutoFailure = () => {
        if (kind !== "auto") return;
        const auto = autoSubmitRef.current;
        const delay = AUTO_SUBMIT_BACKOFF_MS[auto.tries];
        auto.tries += 1;
        if (delay === undefined) {
          auto.done = true;
          setAutoGaveUp(true);
        } else {
          auto.nextAt = Date.now() + delay;
        }
      };

      try {
        const res = await submitExamAction(ticket, answersRef.current);
        if ("error" in res) {
          setError(res.error);
          noteAutoFailure();
          return;
        }
        // Graded. The ticket is spent (A-10b) and the mirror describes an
        // attempt that is over — keeping it would offer a resume that can only
        // ever resolve to the result already on screen.
        autoSubmitRef.current.done = true;
        clearSnapshot(templateSlug);
        if (res.attemptId) {
          router.push(`/academy/istqb/practice-exam/${res.attemptId}`);
          return;
        }
        setResult(res);
        setPhase("result");
      } catch {
        setError(
          "Couldn't reach the server. Your answers are still on this page — try submitting again.",
        );
        noteAutoFailure();
      } finally {
        pendingRef.current = false;
        setPending(false);
        setConfirmOpen(false);
      }
    },
    [ticket, router, templateSlug],
  );

  // Countdown — purely a display; the server's own clock is what actually
  // decides "late" at submit time (docs/QA-ACADEMY.md §2.3). Ticking here
  // still drives the 10/2-minute warnings and the auto-submit at zero.
  useEffect(() => {
    if (phase !== "taking" || !timed || deadline === null) return;
    const tick = () => {
      const left = (deadline - Date.now()) / 1000;
      setRemainingSec(left);
      if (left > 0) return;
      const auto = autoSubmitRef.current;
      if (auto.done || pendingRef.current || Date.now() < auto.nextAt) return;
      void doSubmit("auto");
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

        {resumable && (
          <div
            data-testid="exam-resume-banner"
            className="mt-4 rounded-xl border border-warning-border bg-warning-soft p-4"
          >
            <p className="text-sm font-medium text-warning-soft-fg">
              You have an attempt in progress
            </p>
            <p className="mt-1 text-sm text-warning-soft-fg">
              {snapshotAnsweredCount(resumable)} of {resumable.questions.length} questions
              answered. Resuming keeps the same paper and the same clock — starting over
              draws a new one and those answers are gone.
            </p>
            <div className="mt-3 flex flex-wrap gap-3">
              <button
                type="button"
                data-testid="exam-resume"
                onClick={() => resume(resumable)}
                className="min-h-[44px] rounded-lg bg-accent px-5 py-2 text-sm font-medium text-white hover:bg-accent-hover"
              >
                Resume attempt
              </button>
              <button
                type="button"
                data-testid="exam-resume-discard"
                onClick={discardResumable}
                className="min-h-[44px] rounded-lg border border-hairline px-4 py-2 text-sm font-medium text-content hover:bg-surface-muted"
              >
                Start over
              </button>
            </div>
          </div>
        )}

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

        {/* A-10, closed 2026-08-18. This line exists because the split above was
            for months the one number on this screen with no document behind it,
            and the plan's fallback was to label it an approximation. The
            document arrived and the split was already right, so the honest note
            is provenance rather than a hedge — and it is deliberately specific
            about *which* numbers are the published ones, because the bank, the
            questions and the chapter quizzes remain ours. See
            docs/QA-ACADEMY.md §5.1 and §7.1. */}
        {templateSlug === "ctfl-v4-full" && (
          <p className="mt-3 text-xs text-content-muted" data-testid="exam-blueprint-provenance">
            The question count, per-chapter split, time limit and pass mark
            follow the exam structure published for CTFL v4.0. The questions
            themselves are written by TestForge from the syllabus objectives and
            are not from any real examination.
          </p>
        )}

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

          <p data-testid="exam-stem" className="mt-4 font-medium text-content-strong">
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

          {/* A-10c: auto-submit has stopped retrying. Never leave a candidate
              at zero on the clock with no way to hand the paper in. */}
          {autoGaveUp && (
            <div
              data-testid="exam-autosubmit-failed"
              className="mt-4 rounded-lg border border-danger-border bg-danger-soft p-3"
            >
              <p className="text-sm text-danger-soft-fg">
                Time&rsquo;s up, and we couldn&rsquo;t submit automatically. Your answers
                are still here. Check your connection and submit.
              </p>
              <button
                type="button"
                data-testid="exam-manual-submit"
                disabled={pending}
                onClick={() => doSubmit("manual")}
                className="mt-3 min-h-[44px] rounded-lg bg-accent px-5 py-2 text-sm font-medium text-white hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-50"
              >
                {pending ? "Submitting…" : "Submit now"}
              </button>
            </div>
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
                  onClick={() => doSubmit("manual")}
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
  //
  // **Reaching this phase means the submitter was anonymous.** `submitExamAction`
  // writes an `ExamAttempt` and hands back `attemptId` whenever a session
  // exists, and `doSubmit` navigates to the durable
  // `/academy/istqb/practice-exam/[attemptId]` view rather than falling through
  // to here. So this screen is the *anonymous* result view, and the sign-up CTA
  // at the bottom needs no session prop to be correct. Written down because it
  // does not look that way locally — #230 spent a while re-deriving it.
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
