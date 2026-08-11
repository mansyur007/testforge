"use server";

import { headers } from "next/headers";
import { getLesson } from "@/content/academy";
import { gradeQuestions } from "@/lib/academy/questions";
import type { SelfCheckResult } from "@/lib/academy/types";
import { rateLimit } from "@/lib/rate-limit";

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
