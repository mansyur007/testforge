import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import {
  guard,
  notFoundError,
  validationError,
  serializeResult,
  type FieldError,
} from "@/lib/api";
import { RESULT_STATUSES } from "@/lib/constants";

async function findScopedRun(userId: string, slug: string, runId: string) {
  return db.testRun.findFirst({
    where: { id: runId, project: { slug, members: { some: { userId } } } },
    select: { id: true, projectId: true },
  });
}

export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string; runId: string } }
) {
  const g = await guard(req);
  if (g instanceof NextResponse) return g;

  const run = await findScopedRun(g.userId, params.slug, params.runId);
  if (!run) return notFoundError("Run not found");

  const results = await db.testRunResult.findMany({
    where: { runId: run.id },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({
    data: results.map(serializeResult),
    total: results.length,
  });
}

// Record (or overwrite) the result for one case in this run. Upsert keyed on the
// [runId, caseId] unique — so CI can POST the same case repeatedly (e.g. reruns)
// and the latest status wins.
export async function POST(
  req: NextRequest,
  { params }: { params: { slug: string; runId: string } }
) {
  const g = await guard(req);
  if (g instanceof NextResponse) return g;

  const run = await findScopedRun(g.userId, params.slug, params.runId);
  if (!run) return notFoundError("Run not found");

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object")
    return validationError([{ field: "body", message: "Invalid JSON body" }]);

  const errors: FieldError[] = [];

  const caseId = String(body.caseId ?? "");
  if (!caseId) {
    errors.push({ field: "caseId", message: "caseId is required" });
  } else {
    const c = await db.testCase.findFirst({
      where: { id: caseId, projectId: run.projectId, deletedAt: null },
      select: { id: true },
    });
    if (!c)
      errors.push({ field: "caseId", message: "not a live case in this project" });
  }

  const status = String(body.status ?? "").toUpperCase();
  if (!RESULT_STATUSES.includes(status as (typeof RESULT_STATUSES)[number]))
    errors.push({
      field: "status",
      message: `must be one of: ${RESULT_STATUSES.join(", ")}`,
    });

  let elapsedSeconds: number | null = null;
  if (body.elapsedSeconds != null) {
    const n = Number(body.elapsedSeconds);
    if (!Number.isInteger(n) || n < 0)
      errors.push({
        field: "elapsedSeconds",
        message: "must be a non-negative integer",
      });
    else elapsedSeconds = n;
  }

  if (errors.length) return validationError(errors);

  const comment = body.comment ?? null;
  const defectUrl = body.defectUrl ?? null;

  const result = await db.testRunResult.upsert({
    where: { runId_caseId: { runId: run.id, caseId } },
    create: { runId: run.id, caseId, status, comment, elapsedSeconds, defectUrl },
    update: { status, comment, elapsedSeconds, defectUrl },
  });

  await logAudit({
    userId: g.userId,
    action: "result.submit",
    entityType: "run",
    entityId: run.id,
    detail: `${caseId} → ${status}`,
  });

  return NextResponse.json(serializeResult(result));
}
