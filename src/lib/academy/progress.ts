// A-02: anonymous lesson progress, in the browser only.
//
// Deliberately not a database (docs/QA-ACADEMY.md §2.4): Academy is readable
// without an account, and writing a row for every stranger who opens a lesson
// would fill a table with crawler traffic. A-05 adds the persisted half and a
// one-time claim of whatever is in here at signup — which is why the shape below
// is already what that claim will post: a flat slug → ISO timestamp map.

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

export function markDone(lessonSlug: string) {
  const p = readProgress();
  if (p[lessonSlug]) return;
  p[lessonSlug] = new Date().toISOString();
  write(p);
}

export function markNotDone(lessonSlug: string) {
  const p = readProgress();
  if (!p[lessonSlug]) return;
  delete p[lessonSlug];
  write(p);
}

export function countDone(lessonSlugs: string[]): number {
  const p = readProgress();
  return lessonSlugs.filter((s) => Boolean(p[s])).length;
}
