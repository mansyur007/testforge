import "server-only";
import crypto from "crypto";
import { SignJWT, jwtVerify, type JWTPayload } from "jose";
import { QUESTION_BANK, getQuestions } from "@/content/academy/questions";
import { getBlueprint } from "@/content/academy/exams";
import type { ExamBlueprint } from "@/content/academy/types";
import type { PublicQuestion } from "./types";
import { drawQuestionIds, gradeAttempt as gradeAttemptCore, isLate } from "./exam-core.mjs";

// A-06: the exam engine. `server-only` — this module can see `correct`
// answers via the question bank, so an accidental client import is a build
// error, same guarantee as `src/lib/academy/questions.ts` (§2.2).
//
// Deterministic drawing and grading live in `exam-core.mjs` as plain,
// database-free functions — §8 A-06's unit-test acceptance criteria
// (`scripts/academy-exam-selftest.mjs`) run against that file directly, no
// ticket, no DB, no Next runtime. This file is the thin, typed layer around
// it: turning a bank entry into what the client may see, and signing/
// verifying the ticket that makes the timer server-authoritative (§2.3).

const SECRET = new TextEncoder().encode(
  process.env.AUTH_SECRET ?? "testforge-dev-secret",
);
const PURPOSE = "academy-exam";
/** Server-side clock grace beyond the blueprint's own duration, per §2.3. */
const GRACE_MS = 30_000;
/** Hard outer bound so a signed ticket can't be replayed indefinitely. */
const TICKET_MAX_AGE_SEC = 6 * 60 * 60;

export function sanitizeExamQuestion(q: {
  id: string;
  stem: string;
  choices: { id: string; text: string }[];
  multi?: boolean;
}): PublicQuestion {
  return {
    id: q.id,
    stem: q.stem,
    choices: q.choices.map((c) => ({ id: c.id, text: c.text })),
    multi: q.multi ?? false,
  };
}

export type StartTicketPayload = JWTPayload & {
  purpose: typeof PURPOSE;
  templateSlug: string;
  questionIds: string[];
  seed: string;
  startedAt: number; // ms epoch, server clock
  durationSec: number;
};

export type StartedExam = {
  ticket: string;
  templateSlug: string;
  title: string;
  timed: boolean;
  startedAt: number;
  durationSec: number;
  questions: PublicQuestion[];
};

function drawQuestionIdsFor(blueprint: ExamBlueprint, seed: string): string[] {
  const bank = QUESTION_BANK.map((q) => ({ id: q.id, chapter: q.chapter }));
  return drawQuestionIds(
    bank,
    blueprint.chapters.map((c) => ({ chapter: c.chapter, count: c.count })),
    seed,
  );
}

/**
 * Start an attempt at `templateSlug` (a full paper or a chapter quiz — same
 * code path, docs/QA-ACADEMY.md §5.2's "reusing the same engine"). No DB row
 * is written here regardless of whether a session exists — see `submitExam`
 * in `src/app/actions/academy.ts` for where the authed/anonymous paths
 * actually diverge, at submission.
 */
export async function beginAttempt(
  templateSlug: string,
  opts?: { extraTime?: boolean },
): Promise<{ error: string } | StartedExam> {
  const blueprint = getBlueprint(templateSlug);
  if (!blueprint) return { error: "Unknown exam." };

  const seed = crypto.randomBytes(16).toString("hex");
  const questionIds = drawQuestionIdsFor(blueprint, seed);
  const startedAt = Date.now();
  const durationSec =
    opts?.extraTime && blueprint.extraTimeSec ? blueprint.extraTimeSec : blueprint.durationSec;

  const ticket = await new SignJWT({
    purpose: PURPOSE,
    templateSlug,
    questionIds,
    seed,
    startedAt,
    durationSec,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${TICKET_MAX_AGE_SEC}s`)
    .sign(SECRET);

  return {
    ticket,
    templateSlug,
    title: blueprint.title,
    timed: blueprint.timed,
    startedAt,
    durationSec,
    questions: getQuestions(questionIds).map(sanitizeExamQuestion),
  };
}

export async function verifyStartTicket(token: string): Promise<StartTicketPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    if (payload.purpose !== PURPOSE) return null;
    return payload as StartTicketPayload;
  } catch {
    return null;
  }
}

export type GradedVerdict = {
  id: string;
  correct: boolean;
  correctChoiceIds: string[];
  chosenIds: string[];
  explanation: string;
  stem: string;
  chapter: number;
};

export type GradedAttempt = {
  score: number;
  total: number;
  passed: boolean;
  chapterScores: Record<string, { correct: number; total: number }>;
  verdicts: GradedVerdict[];
  /** True when the server's own clock (never the client's) is past
   *  `startedAt + durationSec + grace`. The attempt is still graded exactly
   *  as submitted — see the module comment on why "late" is a flag, not a
   *  rejection. */
  late: boolean;
};

/**
 * Grade a submission against a verified start ticket. The client's own
 * notion of elapsed time is never consulted — only the ticket's server-set
 * `startedAt`/`durationSec` (tamper-proof, since it's signed) against the
 * server's clock right now decide `late`. Answers are graded exactly as
 * submitted either way: a client that raced the timer and only got partway
 * through the form should see a score for what it actually answered, not a
 * hard rejection of the whole attempt (docs/QA-ACADEMY.md §2.3).
 */
export function gradeFromTicket(
  ticket: StartTicketPayload,
  answers: Record<string, string[]>,
): GradedAttempt {
  const blueprint = getBlueprint(ticket.templateSlug);
  const passPct = blueprint?.passPct ?? 65;
  const questions = getQuestions(ticket.questionIds);
  const graded = gradeAttemptCore(questions, answers, passPct) as {
    score: number;
    total: number;
    passed: boolean;
    chapterScores: Record<string, { correct: number; total: number }>;
    verdicts: { id: string; correct: boolean; correctChoiceIds: string[] }[];
  };

  const late = isLate(ticket.startedAt, ticket.durationSec, Date.now(), GRACE_MS);

  const byId = new Map(questions.map((q) => [q.id, q]));
  const verdicts: GradedVerdict[] = graded.verdicts.map((v) => {
    const q = byId.get(v.id)!;
    return {
      ...v,
      chosenIds: answers[v.id] ?? [],
      explanation: q.explanation,
      stem: q.stem,
      chapter: q.chapter,
    };
  });

  return { ...graded, verdicts, late };
}
