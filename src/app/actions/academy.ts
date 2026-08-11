"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getSession, requireSession } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { ensureSandbox, findSandbox, resetSandbox } from "@/lib/academy/sandbox";
import { findLessonTrack, getLesson } from "@/content/academy";
import { gradeQuestions } from "@/lib/academy/questions";
import type { SelfCheckResult } from "@/lib/academy/types";
import { rateLimit } from "@/lib/rate-limit";
import { getSandboxTask } from "@/content/academy/sandbox";
import { runChecker } from "@/lib/academy/checks";
import type { CheckResult } from "@/lib/academy/types";
import { db } from "@/lib/db";

// A-02: grading for the in-lesson self-check.
//
// This deliberately does NOT follow the server-action shape in Part IV §0.2 of
// docs/DOCUMENTATION.md, and the departures are the whole point of the feature:
//
// - **No `requireSession`.** Academy is readable without an account (the hybrid
//   placement, docs/QA-ACADEMY.md §1); a quiz that demanded a login would undo
//   that. There is no RBAC and no tenant guard either, because it touches no
//   tenant data.
// - **No `logAudit`.** The audit log is a record of changes to a project's data.
//   An anonymous stranger answering a quiz is not that, and writing a row per
//   answer would turn the log into traffic.
// - **No DB write at all.** Anonymous progress lives in `localStorage`
//   (`tf_academy_progress`); persistence arrives with A-05.
//
// What it does have is a rate limit, because it is a public endpoint that reads
// the answer key.

const RATE_LIMIT_PER_MIN = 60;

function clientKey(): string {
  const h = headers();
  // Behind the Caddy front door the real address is the first x-forwarded-for
  // hop; direct hits fall back to a shared bucket, which is the safe direction
  // to fail (stricter, never more permissive).
  const fwd = h.get("x-forwarded-for")?.split(",")[0]?.trim();
  return `academy-selfcheck:${fwd || h.get("x-real-ip") || "unknown"}`;
}

export async function gradeSelfCheck(input: {
  track: string;
  lesson: string;
  answers: Record<string, string[]>;
}): Promise<SelfCheckResult> {
  if (!rateLimit(clientKey(), RATE_LIMIT_PER_MIN).ok) {
    return { error: "Too many attempts. Wait a minute and try again." };
  }

  const found = getLesson(input.track, input.lesson);
  if (!found?.lesson.selfCheck?.length) {
    return { error: "That lesson has no self-check." };
  }

  // Answers arrive from the browser, so nothing about their shape is trusted:
  // unknown ids are ignored by `gradeQuestions` (a question with no entry grades
  // as unanswered) and each value is coerced to a string array here.
  const answers: Record<string, string[]> = {};
  for (const [key, value] of Object.entries(input.answers ?? {})) {
    if (typeof key !== "string") continue;
    answers[key] = (Array.isArray(value) ? value : [])
      .filter((v): v is string => typeof v === "string")
      .slice(0, 12);
  }

  return gradeQuestions(found.lesson.selfCheck, answers);
}

// ---------------------------------------------------------------------------
// A-04: sandbox provisioning. Unlike gradeSelfCheck above, these DO follow the
// §0.2 shape — they create and destroy real project data, so they need a
// session, and they are audited. There is no RBAC check on top of it: the
// sandbox is the learner's own project and they are its OWNER, so "may this
// user do it" is answered by the fact that it is theirs.
// ---------------------------------------------------------------------------

/** Open (creating on first use) the learner's sandbox. */
export async function openSandbox(formData?: FormData) {
  const session = await requireSession();
  const sandbox = await ensureSandbox(session.userId);

  await logAudit({
    userId: session.userId,
    action: "academy.sandbox_open",
    entityType: "project",
    entityId: sandbox.id,
    detail: sandbox.slug,
  });

  // A lesson can pass a suite to land on, so "do the exercise" opens where the
  // exercise happens rather than at the project root.
  const to = String(formData?.get("to") ?? "").trim();
  redirect(to.startsWith("/") ? to.replace("{slug}", sandbox.slug) : `/projects/${sandbox.slug}`);
}

/**
 * Wipe the sandbox back to the ShopMini fixture. Both parameters are required
 * by `useFormState`'s call signature and neither carries anything — the target
 * is always the caller's own sandbox.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function resetSandboxAction(_prev: unknown, _formData: FormData) {
  const session = await requireSession();
  const sandbox = await resetSandbox(session.userId);

  await logAudit({
    userId: session.userId,
    action: "academy.sandbox_reset",
    entityType: "project",
    entityId: sandbox.id,
    detail: sandbox.slug,
  });

  revalidatePath(`/projects/${sandbox.slug}`);
  return { ok: true as const };
}

// ---------------------------------------------------------------------------
// A-04b: the coach overlay. `openSandboxTask` is the "Start this exercise"
// button on a hands-on lesson — it lands on the real form, pre-scoped to the
// suite the task lives in, with `?academy=<lessonSlug>` for `AcademyCoach` to
// pick up. `verifyTask` is "Check my work".
// ---------------------------------------------------------------------------

/** Open (creating on first use) the sandbox, scoped to one lesson's exercise. */
export async function openSandboxTask(formData: FormData) {
  const session = await requireSession();
  const lessonSlug = String(formData.get("lesson") ?? "").trim();
  const task = getSandboxTask(lessonSlug);
  if (!task) redirect("/academy/sandbox");

  const sandbox = await ensureSandbox(session.userId);

  await logAudit({
    userId: session.userId,
    action: "academy.task_open",
    entityType: "project",
    entityId: sandbox.id,
    detail: lessonSlug,
  });

  let path: string;
  if (task.target.kind === "defect") {
    path = `/projects/${sandbox.slug}/defects?academy=${lessonSlug}`;
  } else {
    // Suites are seeded by name (src/content/academy/sandbox.ts), not a fixed
    // id, so the exercise resolves the id at redirect time rather than the
    // lesson content trying to know it in advance.
    const suite = await db.testSuite.findFirst({
      where: { projectId: sandbox.id, name: task.target.suite },
      select: { id: true },
    });
    const qs = suite
      ? `?suite=${suite.id}&academy=${lessonSlug}`
      : `?academy=${lessonSlug}`;
    path = `/projects/${sandbox.slug}/cases/new${qs}`;
  }
  redirect(path);
}

/**
 * Grade the learner's sandbox work for one lesson. `sinceIso` is when the
 * coach panel was opened (docs/QA-ACADEMY.md §6.2) — captured client-side so it
 * survives the redirect that saving a case causes; only rows created after
 * that count, so a checker can't be passed by something left over from a
 * previous attempt.
 */
export async function verifyTask(
  lessonSlug: string,
  sinceIso: string,
): Promise<CheckResult | { error: string }> {
  const session = await requireSession();
  const sandbox = await findSandbox(session.userId);
  if (!sandbox) return { error: "Open your sandbox first." };

  const since = new Date(sinceIso);
  if (Number.isNaN(since.getTime())) {
    return { error: "Something went wrong — reopen the exercise from the lesson." };
  }

  const result = await runChecker(lessonSlug, sandbox.id, since);
  if ("error" in result) return result;

  await logAudit({
    userId: session.userId,
    action: "academy.task_check",
    entityType: "project",
    entityId: sandbox.id,
    detail: `${lessonSlug}:${result.passed ? "pass" : "fail"}`,
  });

  return result;
}

// ---------------------------------------------------------------------------
// A-05: persisted lesson progress. `getSession`, not `requireSession` — like
// `gradeSelfCheck` above, this has to work for a stranger reading a lesson;
// the difference here is the DB path only activates once one exists.
// `src/lib/academy/progress.ts` (client) is what decides whether to call
// these or fall back to `localStorage`, and syncs the two on the way in.
// ---------------------------------------------------------------------------

/** DB-backed progress for the signed-in viewer, or `{ authed: false }` for
 *  anyone else — the client's cue to keep using `localStorage`. */
export async function getMyLessonProgress(): Promise<
  { authed: false } | { authed: true; progress: Record<string, string> }
> {
  const session = await getSession();
  if (!session) return { authed: false };

  const rows = await db.lessonProgress.findMany({
    where: { userId: session.userId },
    select: { lessonSlug: true, completedAt: true, createdAt: true },
  });
  const progress: Record<string, string> = {};
  for (const r of rows) {
    progress[r.lessonSlug] = (r.completedAt ?? r.createdAt).toISOString();
  }
  return { authed: true, progress };
}

/** "Mark as done", persisted. Returns `ok: false` for a signed-out caller
 *  rather than throwing — the client's own toggle already writes
 *  `localStorage` regardless and only calls this when it already knows
 *  there's a session, but a cookie can expire between the two. */
export async function markLessonDoneAction(
  trackSlug: string,
  lessonSlug: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const session = await getSession();
  if (!session) return { ok: false, error: "Sign in to save progress." };

  const now = new Date();
  await db.lessonProgress.upsert({
    where: { userId_lessonSlug: { userId: session.userId, lessonSlug } },
    create: { userId: session.userId, trackSlug, lessonSlug, status: "DONE", completedAt: now },
    update: { status: "DONE", completedAt: now },
  });
  await logAudit({
    userId: session.userId,
    action: "academy.lesson_complete",
    entityType: "lesson",
    entityId: lessonSlug,
    detail: trackSlug,
  });
  return { ok: true };
}

/** The undo side of the toggle — a learner who disagrees with a perfect quiz
 *  score (or a bad "Mark done anyway") can always untick it. */
export async function markLessonNotDoneAction(
  lessonSlug: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const session = await getSession();
  if (!session) return { ok: false, error: "Sign in to save progress." };

  await db.lessonProgress.deleteMany({
    where: { userId: session.userId, lessonSlug },
  });
  return { ok: true };
}

/**
 * Fold anonymous `localStorage` progress into the DB, once, on first
 * authenticated load. `@@unique([userId, lessonSlug])` is what makes this
 * idempotent — running it twice (a second tab, a retried request) inserts
 * nothing new the second time, by construction rather than by a flag.
 */
export async function claimAcademyProgress(
  local: Record<string, string>,
): Promise<{ claimed: number }> {
  const session = await getSession();
  if (!session) return { claimed: 0 };

  const entries = Object.entries(local ?? {}).filter(
    (e): e is [string, string] =>
      typeof e[0] === "string" &&
      typeof e[1] === "string" &&
      !Number.isNaN(Date.parse(e[1])),
  );
  if (entries.length === 0) return { claimed: 0 };

  const existing = await db.lessonProgress.findMany({
    where: {
      userId: session.userId,
      lessonSlug: { in: entries.map(([slug]) => slug) },
    },
    select: { lessonSlug: true },
  });
  const already = new Set(existing.map((r) => r.lessonSlug));

  const rows = entries
    .filter(([slug]) => !already.has(slug))
    .map(([lessonSlug, ts]) => {
      // A lesson that no longer exists (renamed, removed, still draft) has
      // nowhere to point `trackSlug` at — skip it rather than guess.
      const track = findLessonTrack(lessonSlug);
      if (!track) return null;
      return {
        userId: session.userId,
        trackSlug: track.slug,
        lessonSlug,
        status: "DONE",
        completedAt: new Date(ts),
      };
    })
    .filter((r): r is NonNullable<typeof r> => r !== null);

  if (rows.length === 0) return { claimed: 0 };

  try {
    await db.lessonProgress.createMany({ data: rows });
  } catch {
    // A concurrent claim (two tabs signing up at once) can race the
    // `already` check above and hit the unique constraint. Harmless — the
    // caller re-fetches from getMyLessonProgress() right after this returns,
    // so nothing is lost either way, just possibly double-counted here.
    return { claimed: 0 };
  }

  await logAudit({
    userId: session.userId,
    action: "academy.progress_claim",
    entityType: "user",
    entityId: session.userId,
    detail: `${rows.length} lesson(s)`,
  });
  return { claimed: rows.length };
}
