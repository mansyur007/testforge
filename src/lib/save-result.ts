import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import { notify, notifyBaseUrl } from "@/lib/notifications";
import { loadStatusDefs } from "@/lib/result-status-defs";
import { allowedStatusKeys, statusMeta } from "@/lib/result-statuses";
import { can } from "@/lib/permissions";
import { publishRunEvent } from "@/lib/run-events";
import {
  mergeCustomJson,
  validateCustomValues,
} from "@/lib/custom-fields";

// F-36 Part C: the single validation+write path for recording a run result,
// shared by two transports — the desktop server action (`submitResult`,
// FormData) and the offline-queue JSON route (`POST /api/runs/results/[id]`).
// One place enforces membership → run.execute permission (F-14) → status
// validation (F-14) → F-03 custom fields → side effects, so the two transports
// can never drift.

export type ConflictInfo = {
  theirStatus: string;
  theirName: string;
  theirAt: string; // ISO
};

export type SaveResultInput = {
  status: string;
  comment?: string | null;
  defectUrl?: string | null;
  elapsedSeconds?: number | null;
  // Raw custom-field values keyed by def key (validated here). Only the desktop
  // transport supplies these; the offline JSON body deliberately omits them.
  custom?: Record<string, unknown>;
  // Offline-queue idempotency + conflict inputs. Absent on desktop submits,
  // which keeps today's behavior byte-identical (no claim row, no conflict).
  clientId?: string | null;
  recordedAt?: string | null; // ISO time the tester pressed the button
};

export type SaveResultOutcome =
  | { ok: false; reason: "not-found" | "forbidden" | "invalid-status" }
  | {
      ok: true;
      idempotent: boolean;
      conflict: ConflictInfo | null;
      runId: string;
      projectSlug: string;
    };

export async function saveResult(
  userId: string,
  userName: string,
  resultId: string,
  input: SaveResultInput
): Promise<SaveResultOutcome> {
  const owned = await db.testRunResult.findFirst({
    where: {
      id: resultId,
      run: { project: { members: { some: { userId } } } },
    },
    select: {
      id: true,
      customJson: true,
      status: true,
      updatedAt: true,
      assigneeId: true,
      assignee: { select: { name: true } },
      run: { select: { projectId: true } },
    },
  });
  if (!owned) return { ok: false, reason: "not-found" };

  // F-14: recording a result is its own permission.
  if (!(await can(userId, owned.run.projectId, "run.execute")))
    return { ok: false, reason: "forbidden" };

  // F-14: only statuses defined (and active) for this project are accepted.
  const statusDefs = await loadStatusDefs(owned.run.projectId);
  if (!allowedStatusKeys(statusDefs).has(input.status))
    return { ok: false, reason: "invalid-status" };

  const comment = input.comment?.trim() || null;
  const defectUrl = input.defectUrl?.trim() || null;
  const elapsed =
    input.elapsedSeconds != null && Number.isFinite(input.elapsedSeconds)
      ? input.elapsedSeconds
      : undefined;

  // F-03: validate RESULT custom fields; invalid values fail silently-safe
  // (result still recorded, custom left unchanged) — blocking a rapid-fire P/F
  // submit on a side field is worse.
  let customJson = owned.customJson;
  if (input.custom) {
    const defs = await db.customFieldDef.findMany({
      where: { projectId: owned.run.projectId, entity: "RESULT" },
      orderBy: { order: "asc" },
    });
    if (defs.length > 0) {
      const members = await db.projectMember.findMany({
        where: { projectId: owned.run.projectId },
        select: { userId: true },
      });
      const check = validateCustomValues(
        defs,
        input.custom,
        new Set(members.map((m) => m.userId))
      );
      if (check.ok)
        customJson = mergeCustomJson(owned.customJson, defs, check.values);
    }
  }

  // Conflict: someone else wrote this result AFTER the tester recorded offline.
  // Last-write-wins is kept (my write overwrites below), but the overwritten
  // value is reported so it's never silently lost.
  let conflict: ConflictInfo | null = null;
  if (input.recordedAt) {
    const recorded = new Date(input.recordedAt);
    if (
      !Number.isNaN(recorded.getTime()) &&
      owned.updatedAt > recorded &&
      owned.assigneeId &&
      owned.assigneeId !== userId
    ) {
      conflict = {
        theirStatus: owned.status,
        theirName: owned.assignee?.name ?? "someone",
        theirAt: owned.updatedAt.toISOString(),
      };
    }
  }

  // clientId idempotency: claim the id inside the same transaction as the write
  // so a double-flush (two tabs) can't apply twice or double-fire side effects.
  // A duplicate claim rolls the whole transaction back → idempotent no-op.
  let result;
  try {
    result = await db.$transaction(async (tx) => {
      if (input.clientId)
        await tx.resultSubmission.create({
          data: { clientId: input.clientId, resultId, userId },
        });
      return tx.testRunResult.update({
        where: { id: resultId },
        data: {
          status: input.status,
          comment,
          defectUrl,
          customJson,
          assigneeId: userId,
          elapsedSeconds: elapsed,
        },
        include: { run: { include: { project: true } }, testCase: true },
      });
    });
  } catch (e) {
    if (
      e instanceof Prisma.PrismaClientKnownRequestError &&
      e.code === "P2002"
    ) {
      // Already processed this exact submission — report success, no re-apply.
      const project = await db.project.findUnique({
        where: { id: owned.run.projectId },
        select: { slug: true },
      });
      const row = await db.testRunResult.findUnique({
        where: { id: resultId },
        select: { runId: true },
      });
      return {
        ok: true,
        idempotent: true,
        conflict: null,
        runId: row?.runId ?? "",
        projectSlug: project?.slug ?? "",
      };
    }
    throw e;
  }

  await logAudit({
    userId,
    action: "result.submit",
    entityType: "result",
    entityId: resultId,
    detail: input.status,
  });
  // L-04: tell everyone else on this run page (fire-and-forget).
  publishRunEvent(result.runId, {
    type: "result",
    resultId: result.id,
    caseId: result.caseId,
    datasetName: result.datasetName,
    status: result.status,
    comment: result.comment,
    elapsedSeconds: result.elapsedSeconds,
    by: { id: userId, name: userName },
    at: new Date().toISOString(),
  });
  // F-14: any FAIL-kind status (custom ones included) triggers the alert.
  if (statusMeta(statusDefs).kindOf(input.status) === "FAIL") {
    const slug = result.run.project.slug;
    await notify(result.run.projectId, "result.failed", {
      title: `Test failed: ${result.testCase.title}`,
      url: `${notifyBaseUrl()}/projects/${slug}/runs/${result.runId}`,
      tone: "bad",
      runId: result.runId, // keys the 1-per-minute aggregation window
      fields: [
        { label: "Run", value: result.run.name },
        ...(comment ? [{ label: "Notes", value: comment }] : []),
      ],
    });
  }
  revalidatePath(`/projects/${result.run.project.slug}/runs/${result.runId}`);

  return {
    ok: true,
    idempotent: false,
    conflict,
    runId: result.runId,
    projectSlug: result.run.project.slug,
  };
}
