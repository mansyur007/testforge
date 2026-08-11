// A-02: anonymous lesson progress, in the browser only.
//
// Deliberately not a database (docs/QA-ACADEMY.md §2.4): Academy is readable
// without an account, and writing a row for every stranger who opens a lesson
// would fill a table with crawler traffic. A-05 adds the persisted half and a
// one-time claim of whatever is in here at signup — which is why the shape below
// is already what that claim will post: a flat slug → ISO timestamp map.
//
// A-05: once there's a session, this file's `localStorage` becomes a local
// *cache* of the DB rather than the record of truth. `ensureSynced()` fetches
// the DB's progress, folds in (claims) whatever was recorded anonymously
// before sign-in, and overwrites the cache with the canonical result;
// `markDone`/`markNotDone` keep writing here for instant UI feedback and — once
// `ensureSynced()` has established there's a session — also fire the matching
// DB write. Every component in this file still just calls `readProgress()`;
// none of them need to know whether the answer came from a cookie-less
// browser or a signed-in one.
import {
  claimAcademyProgress,
  getMyLessonProgress,
  markLessonDoneAction,
  markLessonNotDoneAction,
} from "@/app/actions/academy";

export const PROGRESS_KEY = "tf_academy_progress";

export type Progress = Record<string, string>;

function safeParse(raw: string | null): Progress {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    const out: Progress = {};
    for (const [k, v] of Object.entries(parsed as Record<string, unknown>)) {
      if (typeof v === "string") out[k] = v;
    }
    return out;
  } catch {
    // Corrupt or hand-edited value: treat as empty rather than throwing on a
    // page whose whole job is to render a lesson.
    return {};
  }
}

export function readProgress(): Progress {
  if (typeof window === "undefined") return {};
  try {
    return safeParse(window.localStorage.getItem(PROGRESS_KEY));
  } catch {
    // Storage can throw outright — Safari private mode, disabled cookies.
    return {};
  }
}

function write(progress: Progress) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
    // Same-tab listeners: the `storage` event only fires in *other* tabs, so the
    // progress bar and the lesson button need their own signal.
    window.dispatchEvent(new CustomEvent(PROGRESS_EVENT));
  } catch {
    /* storage unavailable — progress is a nicety, never a blocker */
  }
}

export const PROGRESS_EVENT = "tf-academy-progress";

// Set by `ensureSynced()` once it knows there's a session. `markDone`/
// `markNotDone` read it rather than checking themselves, so a lesson toggled
// a second after page load (the common case — nobody marks a lesson done
// before reading it) still gets persisted, without every call site having to
// await a session check of its own.
let authed = false;

export function markDone(lessonSlug: string, trackSlug?: string) {
  const p = readProgress();
  if (p[lessonSlug]) return;
  p[lessonSlug] = new Date().toISOString();
  write(p);
  if (authed && trackSlug) {
    markLessonDoneAction(trackSlug, lessonSlug).catch(() => {
      /* best-effort — the local mark above already reflects the intent */
    });
  }
}

export function markNotDone(lessonSlug: string) {
  const p = readProgress();
  if (!p[lessonSlug]) return;
  delete p[lessonSlug];
  write(p);
  if (authed) {
    markLessonNotDoneAction(lessonSlug).catch(() => {
      /* best-effort, same reasoning as markDone */
    });
  }
}

export function countDone(lessonSlugs: string[]): number {
  const p = readProgress();
  return lessonSlugs.filter((s) => Boolean(p[s])).length;
}

/** Whether `ensureSynced()` has established there's a session — i.e. whether
 *  what `readProgress()` returns right now is a DB-backed cache rather than
 *  purely local state. Set before the `write()` inside `ensureSynced()` fires
 *  `PROGRESS_EVENT`, so a component re-rendering on that event sees the
 *  up-to-date answer. */
export function isAuthed(): boolean {
  return authed;
}

// ---------------------------------------------------------------------------
// A-05: the DB sync. Cached at module scope so however many progress
// components mount — on one page (TrackProgress, LessonDoneToggle, the
// self-check) or across several (React 18 StrictMode in dev double-invokes
// every effect, so `AcademySync`/`AcademyMeSync` alone call this twice on
// their very first mount) — the fetch-and-claim round trip runs once, not
// once per caller.
//
// Two different lifetimes share one variable, deliberately:
//
// - **Anonymous → authed, at sign-in.** `<form action={...}>` server actions
//   redirect via Next's router, not a hard browser navigation, so this
//   module survives the transition from an anonymous page (where
//   `ensureSynced()` already ran and resolved as "not authed") to the first
//   authenticated one. If a resolved promise stayed cached forever, every
//   later call would keep replaying that stale "not authed" answer and the
//   claim would never run. `settled` is what tells a *resolved* call apart
//   from an *in-flight* one — false after an anonymous check, so the next
//   caller (e.g. after login) starts over.
// - **Once authed, for the rest of the tab.** The opposite mistake is
//   re-running the fetch-and-claim sequence on every single mount once it
//   has already succeeded: `router.refresh()` inside `AcademyMeSync` causes
//   exactly that (a fresh mount right after the first one resolves), and two
//   real requests racing each other over the same claim is what produced the
//   actual bug behind this comment — one hitting a genuine `net::ERR_ABORTED`
//   understudy while the other was still resolving. `settled = true` once
//   authed short-circuits every call after the first to an already-resolved
//   promise, so there is only ever one real fetch-and-claim per tab, ever,
//   after it first succeeds — later writes still go straight to the DB via
//   `markDone`/`markNotDone`'s own `authed` check, so nothing further needs
//   re-syncing anyway.
// ---------------------------------------------------------------------------

let syncPromise: Promise<void> | null = null;
let settled = false;

export function ensureSynced(): Promise<void> {
  if (settled) return Promise.resolve();
  if (syncPromise) return syncPromise;
  syncPromise = (async () => {
    let result: Awaited<ReturnType<typeof getMyLessonProgress>>;
    try {
      result = await getMyLessonProgress();
    } catch {
      return; // offline, or the action failed — keep using localStorage as-is
    }
    if (!result.authed) return;
    authed = true;

    const local = readProgress();
    if (Object.keys(local).length === 0) {
      settled = true;
      write(result.progress);
      return;
    }
    // A claim was attempted. If the request itself never came back — a real
    // network failure, or the browser tearing down this page mid-flight
    // because the caller navigated away right after triggering this (exactly
    // what happens when a hard `page.goto` follows straight after sign-in) —
    // `local` is the only copy of that progress that still exists anywhere.
    // Overwriting it with `result.progress` (the DB's *pre-claim* state,
    // fetched a moment ago, above) would silently delete it: the next sync
    // would see nothing left to claim and the lessons would just be gone.
    // So on failure this leaves `localStorage` completely untouched, and
    // `settled` stays false too, so the very next `ensureSynced()` call — the
    // next page, or a StrictMode remount — genuinely retries instead of
    // short-circuiting on a claim that never actually happened.
    try {
      const claim = await claimAcademyProgress(local);
      const after = claim.claimed > 0 ? await getMyLessonProgress() : result;
      settled = true;
      if (after.authed) write(after.progress);
    } catch {
      /* leave local and `settled` as-is; retried on the next call */
    }
  })().finally(() => {
    syncPromise = null;
  });
  return syncPromise;
}
