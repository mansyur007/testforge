import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import type { Prisma } from "@prisma/client";
import { caseDisplayId, PRIORITIES, CASE_TYPES } from "@/lib/constants";
import {
  guard,
  notFoundError,
  validationError,
  serializeCase,
  type FieldError,
} from "@/lib/api";
import { dispatchWebhook } from "@/lib/webhooks";

// REST API v1 (PRD §5.3): list & create test case.
// Filtering via query params: ?priority=HIGH&type=SMOKE&tag=login&q=...
export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const g = await guard(req);
  if (g instanceof NextResponse) return g;

  const project = await db.project.findFirst({
    where: { slug: params.slug, members: { some: { userId: g.userId } } },
  });
  if (!project) return notFoundError("Project not found");

  const sp = req.nextUrl.searchParams;
  const where: Prisma.TestCaseWhereInput = {
    projectId: project.id,
    deletedAt: null,
  };
  if (sp.get("priority")) where.priority = sp.get("priority")!.toUpperCase();
  if (sp.get("type")) where.type = sp.get("type")!.toUpperCase();
  if (sp.get("tag")) where.tags = { contains: sp.get("tag")! };
  if (sp.get("q")) where.title = { contains: sp.get("q")! };
  // ?suiteId=<id> filters to one suite; ?suiteId=none returns unassigned cases.
  const suiteId = sp.get("suiteId");
  if (suiteId) where.suiteId = suiteId === "none" ? null : suiteId;
  // ?updatedSince=<ISO> for incremental sync — only cases changed since then.
  const updatedSince = sp.get("updatedSince");
  if (updatedSince) {
    const since = new Date(updatedSince);
    if (!Number.isNaN(since.getTime())) where.updatedAt = { gte: since };
  }

  // cursor-based pagination (PRD §5.3)
  const cursor = sp.get("cursor");
  const limit = Math.min(parseInt(sp.get("limit") ?? "50", 10) || 50, 200);

  const [total, cases] = await Promise.all([
    db.testCase.count({ where }),
    db.testCase.findMany({
      where,
      orderBy: { seq: "asc" },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    }),
  ]);

  const hasMore = cases.length > limit;
  const items = hasMore ? cases.slice(0, limit) : cases;

  return NextResponse.json({
    data: items.map((c) => serializeCase(project.slug, c)),
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

  const allowed = await db.project.findFirst({
    where: { slug: params.slug, members: { some: { userId: g.userId } } },
    select: { id: true },
  });
  if (!allowed) return notFoundError("Project not found");

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object")
    return validationError([{ field: "body", message: "Invalid JSON body" }]);

  const errors: FieldError[] = [];
  const title = String(body.title ?? "").trim();
  if (!title) errors.push({ field: "title", message: "title is required" });

  const priority = body.priority
    ? String(body.priority).toUpperCase()
    : "MEDIUM";
  if (!PRIORITIES.includes(priority as (typeof PRIORITIES)[number]))
    errors.push({
      field: "priority",
      message: `must be one of: ${PRIORITIES.join(", ")}`,
    });

  const type = body.type ? String(body.type).toUpperCase() : "FUNCTIONAL";
  if (!CASE_TYPES.includes(type as (typeof CASE_TYPES)[number]))
    errors.push({
      field: "type",
      message: `must be one of: ${CASE_TYPES.join(", ")}`,
    });

  // Optional suite assignment — must be a suite in this project.
  const suiteId = body.suiteId ? String(body.suiteId) : null;
  if (suiteId) {
    const suite = await db.testSuite.findFirst({
      where: { id: suiteId, projectId: allowed.id },
      select: { id: true },
    });
    if (!suite)
      errors.push({ field: "suiteId", message: "not found in this project" });
  }

  if (errors.length) return validationError(errors);

  const project = await db.project.update({
    where: { slug: params.slug },
    data: { caseCounter: { increment: 1 } },
  });

  const testCase = await db.testCase.create({
    data: {
      projectId: project.id,
      seq: project.caseCounter,
      suiteId,
      title,
      description: body.description ?? null,
      preconditions: body.preconditions ?? null,
      stepsJson: JSON.stringify(body.steps ?? []),
      expectedResult: body.expectedResult ?? null,
      priority,
      type,
      tags: body.tags ?? "",
    },
  });

  await dispatchWebhook(project.id, "case.created", serializeCase(project.slug, testCase));

  return NextResponse.json(
    { id: testCase.id, displayId: caseDisplayId(project.slug, testCase.seq) },
    { status: 201 }
  );
}
