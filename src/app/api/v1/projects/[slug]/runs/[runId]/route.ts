import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import {
  guard,
  notFoundError,
  validationError,
  serializeRun,
  type FieldError,
  requirePerm,
} from "@/lib/api";
import { dispatchWebhook } from "@/lib/webhooks";

const RUN_STATUSES = ["ACTIVE", "COMPLETED"] as const;

async function findScopedRun(userId: string, slug: string, runId: string) {
  return db.testRun.findFirst({
    where: {
      id: runId,
      project: { slug, members: { some: { userId } } },
    },
  });
}

// Tally results per status so clients get pass/fail counts without a second call.
async function runStats(runId: string): Promise<Record<string, number>> {
  const grouped = await db.testRunResult.groupBy({
    by: ["status"],
    where: { runId },
    _count: { _all: true },
  });
  const stats: Record<string, number> = {};
  for (const row of grouped) stats[row.status] = row._count._all;
  return stats;
}

export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string; runId: string } }
) {
  const g = await guard(req);
  if (g instanceof NextResponse) return g;

  const run = await findScopedRun(g.userId, params.slug, params.runId);
  if (!run) return notFoundError("Run not found");

  return NextResponse.json(serializeRun(run, await runStats(run.id)));
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { slug: string; runId: string } }
) {
  const g = await guard(req, { write: true });
  if (g instanceof NextResponse) return g;

  const run = await findScopedRun(g.userId, params.slug, params.runId);
  if (!run) return notFoundError("Run not found");
  const denied = await requirePerm(g.userId, run.projectId, "run.manage"); // F-14
  if (denied) return denied;

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object")
    return validationError([{ field: "body", message: "Invalid JSON body" }]);

  const data: Prisma.TestRunUpdateInput = {};
  const errors: FieldError[] = [];

  if ("name" in body) {
    const name = String(body.name ?? "").trim();
    if (!name) errors.push({ field: "name", message: "cannot be empty" });
    else data.name = name;
  }
  if ("description" in body) data.description = body.description ?? null;

  // Closing the run stamps completedAt; reopening clears it.
  if ("status" in body) {
    const status = String(body.status ?? "").toUpperCase();
    if (!RUN_STATUSES.includes(status as (typeof RUN_STATUSES)[number]))
      errors.push({
        field: "status",
        message: `must be one of: ${RUN_STATUSES.join(", ")}`,
      });
    else {
      data.status = status;
      data.completedAt = status === "COMPLETED" ? new Date() : null;
    }
  }

  if (errors.length) return validationError(errors);

  const updated = await db.testRun.update({ where: { id: run.id }, data });
  await logAudit({
    userId: g.userId,
    action: "run.update",
    entityType: "run",
    entityId: updated.id,
    detail: Object.keys(body).join(", "),
  });

  const stats = await runStats(updated.id);
  // Fire only on the ACTIVE → COMPLETED transition, not on every edit.
  if (updated.status === "COMPLETED" && run.status !== "COMPLETED")
    await dispatchWebhook(updated.projectId, "run.completed", serializeRun(updated, stats));

  return NextResponse.json(serializeRun(updated, stats));
}
