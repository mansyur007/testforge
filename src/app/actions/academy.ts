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
import { getBlueprint } from "@/content/academy/exams";
import {
  beginAttempt,
  verifyStartTicket,
  gradeFromTicket,
  type StartedExam,
  type GradedAttempt,
} from "@/lib/academy/exam";
import { getQuestion } from "@/content/academy/questions";
import {
  findCertificateSerial,
  issueExamCertificate,
  issueTrackCertificateIfComplete,
  listMyCertificates,
  setCertificateHidden,
} from "@/lib/academy/certificates";
import type { MyCertificate } from "@/lib/academy/types";

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
  if (task.target.kind === "share") {
    // A-11a: the exercise is a settings change, not a row the learner writes,
    // so this lands on the project's own sharing panel rather than a form.
    path = `/projects/${sandbox.slug}/sharing?academy=${lessonSlug}`;
  } else if (task.target.kind === "defect") {
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

  // Both slugs arrive from the client, so resolve the pair against the
  // published registry before writing anything. `getLesson` returns undefined
  // unless the track is published, the lesson is published, and the lesson
  // really belongs to that track — so an invented, renamed or still-draft slug
  // (or a real lesson filed under the wrong track) writes no row at all.
  // `claimAcademyProgress` has always resolved slugs this way before inserting;
  // this action was the one path that took them on trust.
  const found = getLesson(trackSlug, lessonSlug);
  if (!found) return { ok: false, error: "Unknown lesson." };
  const { track, lesson } = found;

  const now = new Date();
  await db.lessonProgress.upsert({
    where: { userId_lessonSlug: { userId: session.userId, lessonSlug: lesson.slug } },
    create: {
      userId: session.userId,
      trackSlug: track.slug,
      lessonSlug: lesson.slug,
      status: "DONE",
      completedAt: now,
    },
    update: { status: "DONE", completedAt: now },
  });
  await logAudit({
    userId: session.userId,
    action: "academy.lesson_complete",
    entityType: "lesson",
    entityId: lesson.slug,
    detail: track.slug,
  });

  // A-07: the lesson that completes a track earns its certificate. The track is
  // now the registry's, not the caller's; `issueTrackCertificateIfComplete`
  // resolves it again and counts real rows either way.
  await issueTrackCertificateIfComplete(session.userId, track.slug);
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

  // A-07: a track finished anonymously and claimed at signup never passes
  // through `markLessonDoneAction`, so its certificate has to be issued here
  // too — otherwise the hybrid placement's whole funnel (§1: read anonymously,
  // sign up to keep it) would hand back progress but silently swallow the one
  // artifact worth signing up for. One check per track the claim touched.
  for (const trackSlug of Array.from(new Set(rows.map((r) => r.trackSlug)))) {
    await issueTrackCertificateIfComplete(session.userId, trackSlug);
  }
  return { claimed: rows.length };
}

// ---------------------------------------------------------------------------
// A-06: the ISTQB practice exam and the six chapter quizzes — same engine,
// same actions, a chapter quiz is just a blueprint with one chapter and no
// timer (docs/QA-ACADEMY.md §5.2). Like `gradeSelfCheck`, these deliberately
// depart from Part IV §0.2 for `startExamAction`: no session required to
// *take* the exam (the hybrid placement's whole point, §1), rate-limited
// because it's a public endpoint that reads the question bank. `submitExamAction`
// re-adds the §0.2 shape for its authed half, because that half writes real
// data: `requireSession` is not used (submission must work anonymously too),
// but persistence and the audit log only fire when a session exists.
// ---------------------------------------------------------------------------

const EXAM_RATE_LIMIT_PER_MIN = 20;

function examClientKey(action: string): string {
  const h = headers();
  const fwd = h.get("x-forwarded-for")?.split(",")[0]?.trim();
  return `academy-exam-${action}:${fwd || h.get("x-real-ip") || "unknown"}`;
}

export async function startExamAction(
  templateSlug: string,
  extraTime?: boolean,
): Promise<{ error: string } | StartedExam> {
  if (!rateLimit(examClientKey("start"), EXAM_RATE_LIMIT_PER_MIN).ok) {
    return { error: "Too many attempts. Wait a minute and try again." };
  }
  if (!getBlueprint(templateSlug)) return { error: "Unknown exam." };
  return beginAttempt(templateSlug, { extraTime });
}

export type SubmitExamResult =
  | { error: string }
  | (GradedAttempt & { attemptId?: string });

/**
 * Grade a submitted attempt. `ticket` is what `startExamAction` handed back —
 * the server never trusts anything else about when the attempt started or how
 * long it ran (docs/QA-ACADEMY.md §2.3). When a session exists the graded
 * result is persisted as an `ExamAttempt` row and its id is returned so the
 * client can navigate to the durable `/academy/istqb/practice-exam/[attemptId]`
 * view; anonymous callers get the same graded result back with nothing
 * written to the database (§2.4 — no row for a crawler or a casual visitor).
 */
export async function submitExamAction(
  ticket: string,
  rawAnswers: Record<string, string[]>,
): Promise<SubmitExamResult> {
  if (!rateLimit(examClientKey("submit"), EXAM_RATE_LIMIT_PER_MIN).ok) {
    return { error: "Too many attempts. Wait a minute and try again." };
  }

  const payload = await verifyStartTicket(ticket);
  if (!payload) return { error: "This attempt has expired or is invalid. Start again." };

  const answers: Record<string, string[]> = {};
  for (const [key, value] of Object.entries(rawAnswers ?? {})) {
    if (typeof key !== "string") continue;
    answers[key] = (Array.isArray(value) ? value : [])
      .filter((v): v is string => typeof v === "string")
      .slice(0, 12);
  }

  const graded = gradeFromTicket(payload, answers);

  const session = await getSession();
  if (!session) return graded;

  // A-10b: a start ticket buys exactly one attempt row. Verifying the
  // signature is not enough on its own — the graded response hands back
  // `correctChoiceIds` for every question (it is the review screen), so a
  // ticket that stayed submittable would let anyone submit blank, read the
  // key, and replay the same ticket for a `passed` row. `@@unique([userId,
  // seed])` on ExamAttempt is what forbids that, and `seed` is minted per
  // ticket so it needs no consumed-ticket store and nothing to expire.
  //
  // A replay is not always an attack, though: an auto-submit racing a manual
  // one, or a retried request after a flaky connection, hits this same path.
  // So the conflict resolves to the attempt that already exists rather than an
  // error — an honest double-submit lands on its own result page, and a
  // forged one gets back the score it originally earned.
  let attempt: { id: string };
  try {
    attempt = await db.examAttempt.create({
      data: {
        userId: session.userId,
        templateSlug: payload.templateSlug,
        seed: payload.seed,
        questionIdsJson: JSON.stringify(payload.questionIds),
        answersJson: JSON.stringify(answers),
        startedAt: new Date(payload.startedAt),
        submittedAt: new Date(),
        durationSec: payload.durationSec,
        score: graded.score,
        total: graded.total,
        passed: graded.passed,
        chapterScoresJson: JSON.stringify(graded.chapterScores),
      },
    });
  } catch {
    const existing = await db.examAttempt.findUnique({
      where: { userId_seed: { userId: session.userId, seed: payload.seed } },
      select: { id: true, answersJson: true },
    });
    // Anything other than the unique-constraint race is a genuine failure and
    // must not be reported as a graded attempt.
    if (!existing) return { error: "Couldn't save this attempt. Try again." };
    // Re-grade from what was actually stored, not from what this request sent:
    // returning the first attempt's id alongside the replay's verdicts would
    // describe an attempt that does not exist. The row is the record.
    let storedAnswers: Record<string, string[]> = {};
    try {
      storedAnswers = JSON.parse(existing.answersJson || "{}");
    } catch {
      /* a corrupt row still resolves to its own id below */
    }
    return { ...gradeFromTicket(payload, storedAnswers), attemptId: existing.id };
  }

  await logAudit({
    userId: session.userId,
    action: "academy.exam_submit",
    entityType: "examAttempt",
    entityId: attempt.id,
    detail: `${payload.templateSlug}:${graded.score}/${graded.total}`,
  });

  // A-07: a passing full paper earns a certificate. This runs *after* the
  // attempt row exists, which is the ordering that matters: `@@unique([userId,
  // seed])` is what makes a replayed ticket fail above (A-10b), so a forged
  // submission never reaches this line — the certificate inherits the attempt
  // row's protection instead of needing a rule of its own.
  const certificate = await issueExamCertificate(
    session.userId,
    payload.templateSlug,
    graded,
  );
  if (certificate) {
    await logAudit({
      userId: session.userId,
      action: "academy.certificate_issue",
      entityType: "certificate",
      entityId: certificate.serial,
      detail: `${certificate.kind}:${certificate.refSlug}`,
    });
  }
  revalidatePath("/academy/me");

  // The serial is deliberately *not* returned here. A signed-in submission
  // navigates to `/academy/istqb/practice-exam/[attemptId]`, which reads the
  // certificate from the database anyway — handing it back as well would put a
  // second, staler copy of the same fact on the wire.
  return { ...graded, attemptId: attempt.id };
}

export type ExamAttemptSummary = {
  id: string;
  templateSlug: string;
  score: number;
  total: number;
  passed: boolean;
  submittedAt: string | null;
  startedAt: string;
};

/** Attempt history for `/academy/me` — newest first. */
export async function getMyExamAttempts(): Promise<ExamAttemptSummary[]> {
  const session = await getSession();
  if (!session) return [];

  const rows = await db.examAttempt.findMany({
    where: { userId: session.userId },
    orderBy: { startedAt: "desc" },
    select: {
      id: true,
      templateSlug: true,
      score: true,
      total: true,
      passed: true,
      submittedAt: true,
      startedAt: true,
    },
  });
  return rows.map((r) => ({
    ...r,
    submittedAt: r.submittedAt ? r.submittedAt.toISOString() : null,
    startedAt: r.startedAt.toISOString(),
  }));
}

// ---------------------------------------------------------------------------
// A-07: certificates. Reading one is public and lives on the page itself
// (`getPublicCertificate`); these two are the holder's own controls, so they
// take the §0.2 shape — a session, a tenant guard, an audit row.
// ---------------------------------------------------------------------------

/** The viewer's certificates for `/academy/me`, hidden ones included. */
export async function getMyCertificates(): Promise<MyCertificate[]> {
  const session = await getSession();
  if (!session) return [];
  return listMyCertificates(session.userId, session.name);
}

/**
 * Take a certificate's public page down, or put it back up. The serial is the
 * only handle the UI has, and `setCertificateHidden` scopes the write to the
 * caller's own rows — so someone else's serial matches nothing and returns the
 * same "not found" a made-up one does, rather than confirming it exists.
 */
export async function setCertificateVisibilityAction(
  serial: string,
  hidden: boolean,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const session = await getSession();
  if (!session) return { ok: false, error: "Sign in to manage certificates." };

  const changed = await setCertificateHidden(session.userId, serial, hidden);
  if (!changed) return { ok: false, error: "Certificate not found." };

  await logAudit({
    userId: session.userId,
    action: hidden ? "academy.certificate_hide" : "academy.certificate_unhide",
    entityType: "certificate",
    entityId: serial,
  });
  revalidatePath("/academy/me");
  return { ok: true };
}

/**
 * Full review for `/academy/istqb/practice-exam/[attemptId]` — session-scoped
 * (the route table's "session" auth; there is no anonymous variant of this
 * route in this work order, see docs/QA-ACADEMY.md's A-06 entry). A question
 * the bank no longer has (edited slug, withdrawn question) degrades to a
 * "question withdrawn" placeholder rather than breaking the page, per the
 * `ExamAttempt` schema comment in docs/QA-ACADEMY.md §3.
 */
export async function getExamAttempt(attemptId: string): Promise<
  | { error: string }
  | (ExamAttemptSummary & {
      chapterScores: Record<string, { correct: number; total: number }>;
      /** A-07: set only when this attempt's template earned a certificate and
       *  its link is on. Read from the row, not recomputed from the score —
       *  a certificate the holder has hidden must not reappear here. */
      certificateSerial: string | null;
      review: {
        id: string;
        stem: string;
        withdrawn?: true;
        chosenIds: string[];
        correctChoiceIds: string[];
        correct: boolean;
        explanation: string;
      }[];
    })
> {
  const session = await requireSession();
  const attempt = await db.examAttempt.findFirst({
    where: { id: attemptId, userId: session.userId },
  });
  if (!attempt) return { error: "Attempt not found." };

  const questionIds: string[] = JSON.parse(attempt.questionIdsJson || "[]");
  const answers: Record<string, string[]> = JSON.parse(attempt.answersJson || "{}");

  const review = questionIds.map((id) => {
    const q = getQuestion(id);
    const chosenIds = answers[id] ?? [];
    if (!q) {
      return {
        id,
        stem: "This question has since been withdrawn from the bank.",
        withdrawn: true as const,
        chosenIds,
        correctChoiceIds: [],
        correct: false,
        explanation: "",
      };
    }
    const correctChoiceIds = q.choices.filter((c) => c.correct).map((c) => c.id);
    const correct =
      correctChoiceIds.length === chosenIds.length &&
      correctChoiceIds.every((cid) => chosenIds.includes(cid));
    return {
      id,
      stem: q.stem,
      chosenIds,
      correctChoiceIds,
      correct,
      explanation: q.explanation,
    };
  });

  return {
    id: attempt.id,
    templateSlug: attempt.templateSlug,
    score: attempt.score,
    total: attempt.total,
    passed: attempt.passed,
    submittedAt: attempt.submittedAt ? attempt.submittedAt.toISOString() : null,
    startedAt: attempt.startedAt.toISOString(),
    chapterScores: JSON.parse(attempt.chapterScoresJson || "{}"),
    certificateSerial: attempt.passed
      ? await findCertificateSerial(session.userId, "EXAM", attempt.templateSlug)
      : null,
    review,
  };
}
