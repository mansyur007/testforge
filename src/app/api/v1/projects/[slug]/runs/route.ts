import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import type { Prisma } from "@prisma/client";
import { logAudit } from "@/lib/audit";
import { buildResultSeeds } from "@/lib/datasets";
import { dispatchWebhook } from "@/lib/webhooks";
import { notify, notifyBaseUrl } from "@/lib/notifications";
import {
  guard,
  notFoundError,
  validationError,
  serializeRun,
  type FieldError,
} from "@/lib/api";

// REST API v1: list & create test runs. Until now runs were born only from a
// JUnit upload — this lets CI (or any client) open a run and stream results.
export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const g = await guard(req);
  if (g instanceof NextResponse) return g;

  const project = await db.project.findFirst({
    where: { slug: params.slug, members: { some: { userId: g.userId } } },
    select: { id: true },
  });
  if (!project) return notFoundError("Project not found");

  const sp = req.nextUrl.searchParams;
  const where: Prisma.TestRunWhereInput = { projectId: project.id };
  if (sp.get("status")) where.status = sp.get("status")!.toUpperCase();
  if (sp.get("milestoneId")) where.milestoneId = sp.get("milestoneId")!;

  const cursor = sp.get("cursor");
  const limit = Math.min(parseInt(sp.get("limit") ?? "50", 10) || 50, 200);

  const [total, runs] = await Promise.all([
    db.testRun.count({ where }),
    db.testRun.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      include: { _count: { select: { results: true } } },
    }),
  ]);

  const hasMore = runs.length > limit;
  const items = hasMore ? runs.slice(0, limit) : runs;

  return NextResponse.json({
    data: items.map((r) => ({
      ...serializeRun(r),
      resultCount: r._count.results,
    })),
    total,
    nextCursor: hasMore ? items[items.length - 1].id : null,
  });
}

export async function POST(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const g = await guard(req, { write: true });
  if (g instanceof NextResponse) return g;

  const project = await db.project.findFirst({
    where: { slug: params.slug, members: { some: { userId: g.userId } } },
    select: { id: true },
  });
  if (!project) return notFoundError("Project not found");

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object")
    return validationError([{ field: "body", message: "Invalid JSON body" }]);

  const errors: FieldError[] = [];
  const name = String(body.name ?? "").trim();
  if (!name) errors.push({ field: "name", message: "name is required" });

  // Optional set of cases to seed the run with — every id must be a live case
  // in this project.
  let caseIds: string[] = [];
  if ("caseIds" in body && body.caseIds != null) {
    if (!Array.isArray(body.caseIds)) {
      errors.push({ field: "caseIds", message: "must be an array of case ids" });
    } else {
      caseIds = body.caseIds.map(String);
      if (caseIds.length) {
        const found = await db.testCase.findMany({
          where: { id: { in: caseIds }, projectId: project.id, deletedAt: null },
          select: { id: true },
        });
        const live = new Set(found.map((c) => c.id));
        const invalid = caseIds.filter((id) => !live.has(id));
        if (invalid.length)
          errors.push({
            field: "caseIds",
            message: `not in this project: ${invalid.join(", ")}`,
          });
      }
    }
  }

  // Optional milestone — must belong to this project.
  const milestoneId = body.milestoneId ? String(body.milestoneId) : null;
  if (milestoneId) {
    const ms = await db.milestone.findFirst({
      where: { id: milestoneId, projectId: project.id },
      select: { id: true },
    });
    if (!ms)
      errors.push({ field: "milestoneId", message: "not found in this project" });
  }

  if (errors.length) return validationError(errors);

  // F-05: stamp each seeded result with the case's current revision.
  // F-13: cases with dataset rows seed one result per row instead of one.
  const seeds = await buildResultSeeds(caseIds);
  const run = await db.testRun.create({
    data: {
      projectId: project.id,
      name,
      description: body.description ?? null,
      source: body.source ? String(body.source).toUpperCase() : "MANUAL",
      origin: body.origin ?? null,
      milestoneId,
      createdById: g.userId,
      results: { create: seeds },
    },
  });

  await logAudit({
    userId: g.userId,
    action: "run.create",
    entityType: "run",
    entityId: run.id,
    detail: `${name} (${caseIds.length} cases)`,
  });
  await dispatchWebhook(project.id, "run.created", serializeRun(run));
  await notify(project.id, "run.created", {
    title: `Run created: ${name}`,
    url: `${notifyBaseUrl()}/projects/${params.slug}/runs/${run.id}`,
    fields: [{ label: "Cases", value: String(caseIds.length) }],
  });

  return NextResponse.json(serializeRun(run), { status: 201 });
}
