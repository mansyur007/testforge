import type { PublicQuestion } from "./types";

// A-10c: the browser-side mirror of an in-progress exam attempt.
//
// Before this, `ExamRunner` held the ticket, the answers, the flags and the
// current index in React state and nowhere else — so a reload, a
// back-navigation or a phone locking 40 minutes into a 60-minute paper threw
// away every answer *and* the ticket, with no way back into that attempt.
// A-04b already went to real trouble to keep the coach's `since` across a
// redirect for a far lower-stakes flow (docs/QA-ACADEMY.md §8, A-04b "the
// attempt clock"); this is the same idea applied where it actually hurts.
//
// **This changes no trust boundary.** Everything stored here either came from
// the client to begin with (answers, flags, which question is on screen) or is
// already in the client's hands (the signed ticket, the sanitized questions).
// The server stays authoritative for both the clock and the grade: `startedAt`
// and `durationSec` below only drive the countdown *display*, exactly as they
// did when they lived in React state, and `submitExamAction` re-derives both
// from the ticket's own signed payload (§2.3).
//
// `sessionStorage`, not `localStorage`, and per-template: an attempt belongs to
// the tab it was started in, and a chapter quiz opened in the same tab must not
// clobber the full paper's snapshot.

const KEY_PREFIX = "tf_academy_exam:";

/**
 * Mirrors `TICKET_MAX_AGE_SEC` in `src/lib/academy/exam.ts`. A stale copy here
 * is harmless in both directions — this only decides whether we bother
 * *offering* a resume; the server rejects an expired ticket regardless, and it
 * is the only opinion that counts.
 */
const TICKET_MAX_AGE_MS = 6 * 60 * 60 * 1000;

/**
 * What an auto-submit at the deadline waits before each retry, in order. Fires
 * once, then backs off, then gives up and hands the candidate a manual button.
 *
 * Bounded on purpose. A-06's version called `doSubmit()` from every one-second
 * tick once the deadline passed, and `pending` cleared in a `finally`, so a
 * failing submit retried once a second into an endpoint rate-limited at 20 a
 * minute: twenty seconds of a bad connection at the deadline and the candidate
 * is locked out of submitting *at all* for the rest of the minute, repeatedly.
 * Four requests over ~26 seconds leaves the rate limit with room for the manual
 * retry that follows.
 */
export const AUTO_SUBMIT_BACKOFF_MS = [2_000, 6_000, 18_000];

export type ExamSnapshot = {
  v: 1;
  templateSlug: string;
  ticket: string;
  questions: PublicQuestion[];
  answers: Record<string, string[]>;
  flagged: string[];
  index: number;
  /** Server clock, ms — the value `startExamAction` returned. Display only. */
  startedAt: number;
  durationSec: number;
  timed: boolean;
};

function keyFor(templateSlug: string): string {
  return `${KEY_PREFIX}${templateSlug}`;
}

/**
 * Re-apply `sanitizeExamQuestion`'s shape (src/lib/academy/exam.ts) on the way
 * back in. The questions written out were already sanitized, so this is
 * belt-and-braces — but this is *client-visible storage*, and the one rule that
 * must hold for it is that nothing the server strips can re-enter the runner
 * through it. Rebuilding the object field by field means a snapshot someone
 * hand-edited into `{ correct: true }` still hydrates to a plain question.
 */
function hydrateQuestion(raw: unknown): PublicQuestion | null {
  if (!raw || typeof raw !== "object") return null;
  const q = raw as Record<string, unknown>;
  if (typeof q.id !== "string" || typeof q.stem !== "string") return null;
  if (!Array.isArray(q.choices)) return null;

  const choices: { id: string; text: string }[] = [];
  for (const c of q.choices) {
    if (!c || typeof c !== "object") return null;
    const choice = c as Record<string, unknown>;
    if (typeof choice.id !== "string" || typeof choice.text !== "string") return null;
    choices.push({ id: choice.id, text: choice.text });
  }
  if (choices.length === 0) return null;

  return { id: q.id, stem: q.stem, choices, multi: q.multi === true };
}

/**
 * The attempt in progress for `templateSlug`, or `null` when there is nothing
 * resumable. Anything unparseable, from a different template, or older than the
 * ticket's own lifetime is dropped rather than shown — offering to resume into
 * a "this attempt has expired" error is worse than not offering.
 */
export function readSnapshot(templateSlug: string, now = Date.now()): ExamSnapshot | null {
  if (typeof window === "undefined") return null;

  let raw: string | null = null;
  try {
    raw = window.sessionStorage.getItem(keyFor(templateSlug));
  } catch {
    return null; // storage disabled (private mode, blocked cookies) — no resume, no crash
  }
  if (!raw) return null;

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    clearSnapshot(templateSlug);
    return null;
  }

  if (!parsed || typeof parsed !== "object") return null;
  const s = parsed as Record<string, unknown>;
  if (s.v !== 1 || s.templateSlug !== templateSlug) return null;
  if (typeof s.ticket !== "string" || !s.ticket) return null;
  if (typeof s.startedAt !== "number" || typeof s.durationSec !== "number") return null;
  if (!Array.isArray(s.questions) || s.questions.length === 0) return null;

  if (now - s.startedAt >= TICKET_MAX_AGE_MS) {
    clearSnapshot(templateSlug);
    return null;
  }

  const questions: PublicQuestion[] = [];
  for (const raw of s.questions) {
    const q = hydrateQuestion(raw);
    if (!q) {
      clearSnapshot(templateSlug);
      return null;
    }
    questions.push(q);
  }

  const known = new Set(questions.map((q) => q.id));
  const answers: Record<string, string[]> = {};
  const rawAnswers = (s.answers ?? {}) as Record<string, unknown>;
  for (const [id, value] of Object.entries(rawAnswers)) {
    if (!known.has(id) || !Array.isArray(value)) continue;
    answers[id] = value.filter((v): v is string => typeof v === "string");
  }

  const flagged = (Array.isArray(s.flagged) ? s.flagged : []).filter(
    (id): id is string => typeof id === "string" && known.has(id),
  );

  const index =
    typeof s.index === "number" && s.index >= 0 && s.index < questions.length
      ? Math.floor(s.index)
      : 0;

  return {
    v: 1,
    templateSlug,
    ticket: s.ticket,
    questions,
    answers,
    flagged,
    index,
    startedAt: s.startedAt,
    durationSec: s.durationSec,
    timed: s.timed === true,
  };
}

export function writeSnapshot(snapshot: ExamSnapshot): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(keyFor(snapshot.templateSlug), JSON.stringify(snapshot));
  } catch {
    // Quota or disabled storage. Losing the mirror is a downgrade to A-06's
    // behaviour, not a reason to interrupt someone mid-exam.
  }
}

export function clearSnapshot(templateSlug: string): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(keyFor(templateSlug));
  } catch {
    /* nothing to do */
  }
}

/** How many answers a snapshot actually carries — the resume prompt says so. */
export function answeredCount(snapshot: ExamSnapshot): number {
  return Object.values(snapshot.answers).filter((a) => a.length > 0).length;
}
