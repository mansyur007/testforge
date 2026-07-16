import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import {
  guard,
  notFoundError,
  validationError,
  serializeResult,
  type FieldError,
  requirePerm,
} from "@/lib/api";
import { notify, notifyBaseUrl } from "@/lib/notifications";
import { isMuted } from "@/lib/mute";
import { publishRunEvent } from "@/lib/run-events";
import { loadStatusDefs } from "@/lib/result-status-defs";
import { allowedStatusKeys, statusMeta } from "@/lib/result-statuses";

async function findScopedRun(userId: string, slug: string, runId: string) {
  return db.testRun.findFirst({
    where: { id: runId, project: { slug, members: { some: { userId } } } },
    select: { id: true, projectId: true, name: true },
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
    include: { testCase: { select: { mutedAt: true } } },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({
    data: results.map((r) => serializeResult(r, isMuted(r.testCase.mutedAt))),
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
  const g = await guard(req, { write: true });
  if (g instanceof NextResponse) return g;

  const run = await findScopedRun(g.userId, params.slug, params.runId);
  if (!run) return notFoundError("Run not found");
  const denied = await requirePerm(g.userId, run.projectId, "run.execute"); // F-14
  if (denied) return denied;

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object")
    return validationError([{ field: "body", message: "Invalid JSON body" }]);

  const errors: FieldError[] = [];

  const caseId = String(body.caseId ?? "");
  let caseRev: number | undefined;
  let caseTitle = "";
  let caseMuted = false;
  if (!caseId) {
    errors.push({ field: "caseId", message: "caseId is required" });
  } else {
    const c = await db.testCase.findFirst({
      where: { id: caseId, projectId: run.projectId, deletedAt: null },
      select: { id: true, rev: true, title: true, mutedAt: true },
    });
    if (!c)
      errors.push({ field: "caseId", message: "not a live case in this project" });
    else {
      caseRev = c.rev; // F-05: stamped when the result row is first created
      caseTitle = c.title;
      caseMuted = isMuted(c.mutedAt); // F-21
    }
  }

  // F-14: statuses are project-defined (system + active custom keys).
  const statusDefs = await loadStatusDefs(run.projectId);
  const allowed = allowedStatusKeys(statusDefs);
  const status = String(body.status ?? "").toUpperCase();
  if (!allowed.has(status))
    errors.push({
      field: "status",
      message: `must be one of: ${Array.from(allowed).join(", ")}`,
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
  // F-13: optional — which dataset row this result is for (null = no
  // parameters). Prisma's compound-unique upsert can't take a null member,
  // so this is a manual find-then-write instead.
  const datasetName = body.datasetName ? String(body.datasetName) : null;

  const existing = await db.testRunResult.findFirst({
    where: { runId: run.id, caseId, datasetName },
  });
  const result = existing
    ? await db.testRunResult.update({
        where: { id: existing.id },
        data: { status, comment, elapsedSeconds, defectUrl },
      })
    : await db.testRunResult.create({
        data: { runId: run.id, caseId, caseRev, status, comment, elapsedSeconds, defectUrl, datasetName },
      });

  await logAudit({
    userId: g.userId,
    action: "result.submit",
    entityType: "run",
    entityId: run.id,
    detail: `${caseId} → ${status}`,
  });
  // L-04: automation streaming into an open run page appears live too;
  // `by` is the API key's user.
  const writer = await db.user.findUnique({
    where: { id: g.userId },
    select: { id: true, name: true },
  });
  publishRunEvent(run.id, {
    type: "result",
    resultId: result.id,
    caseId: result.caseId,
    datasetName: result.datasetName,
    status: result.status,
    comment: result.comment,
    elapsedSeconds: result.elapsedSeconds,
    by: { id: g.userId, name: writer?.name ?? "Automation" },
    at: new Date().toISOString(),
  });
  if (statusMeta(statusDefs).kindOf(status) === "FAIL") // F-14: kind, not key
    await notify(run.projectId, "result.failed", {
      title: `Test failed: ${caseTitle}`,
      url: `${notifyBaseUrl()}/projects/${params.slug}/runs/${run.id}`,
      tone: "bad",
      runId: run.id, // keys the 1-per-minute aggregation window
      fields: [{ label: "Run", value: run.name }],
    });

  return NextResponse.json(serializeResult(result, caseMuted));
}
