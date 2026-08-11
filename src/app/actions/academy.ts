"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { ensureSandbox, findSandbox, resetSandbox } from "@/lib/academy/sandbox";
import { getLesson } from "@/content/academy";
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
