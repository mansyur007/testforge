import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import type { Prisma } from "@prisma/client";
import { getSession, authenticateApiKey } from "@/lib/auth";
import { caseDisplayId } from "@/lib/constants";

// REST API v1 (PRD §5.3): list & create test case.
// Filtering via query params: ?priority=HIGH&type=SMOKE&tag=login&q=...
export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const auth = (await getSession()) ?? (await authenticateApiKey(req));
  if (!auth)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = "userId" in auth ? auth.userId : auth.id;

  const project = await db.project.findFirst({
    where: { slug: params.slug, members: { some: { userId } } },
  });
  if (!project)
    return NextResponse.json({ error: "Project not found" }, { status: 404 });

  const sp = req.nextUrl.searchParams;
  const where: Prisma.TestCaseWhereInput = {
    projectId: project.id,
    deletedAt: null,
  };
  if (sp.get("priority")) where.priority = sp.get("priority")!.toUpperCase();
  if (sp.get("type")) where.type = sp.get("type")!.toUpperCase();
  if (sp.get("tag")) where.tags = { contains: sp.get("tag")! };
  if (sp.get("q")) where.title = { contains: sp.get("q")! };

  // cursor-based pagination (PRD §5.3)
  const cursor = sp.get("cursor");
  const limit = Math.min(parseInt(sp.get("limit") ?? "50", 10) || 50, 200);

  const cases = await db.testCase.findMany({
    where,
    orderBy: { seq: "asc" },
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
  });

  const hasMore = cases.length > limit;
  const items = hasMore ? cases.slice(0, limit) : cases;

  return NextResponse.json({
    data: items.map((c) => ({
      id: c.id,
      displayId: caseDisplayId(project.slug, c.seq),
      title: c.title,
      priority: c.priority,
      type: c.type,
      status: c.status,
      automationStatus: c.automationStatus,
      tags: c.tags,
      steps: JSON.parse(c.stepsJson || "[]"),
      expectedResult: c.expectedResult,
    })),
    nextCursor: hasMore ? items[items.length - 1].id : null,
  });
}

export async function POST(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const auth = (await getSession()) ?? (await authenticateApiKey(req));
  if (!auth)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = "userId" in auth ? auth.userId : auth.id;

  const body = await req.json().catch(() => null);
  if (!body?.title)
    return NextResponse.json({ error: "title is required" }, { status: 400 });

  const allowed = await db.project.findFirst({
    where: { slug: params.slug, members: { some: { userId } } },
    select: { id: true },
  });
  if (!allowed)
    return NextResponse.json({ error: "Project not found" }, { status: 404 });

  // Optional suite assignment — must be a suite in this project.
  const suiteId = body.suiteId ? String(body.suiteId) : null;
  if (suiteId) {
    const suite = await db.testSuite.findFirst({
      where: { id: suiteId, projectId: allowed.id },
      select: { id: true },
    });
    if (!suite)
      return NextResponse.json(
        { error: "suiteId not found in this project" },
        { status: 400 }
      );
  }

  const project = await db.project.update({
    where: { slug: params.slug },
    data: { caseCounter: { increment: 1 } },
  });

  const testCase = await db.testCase.create({
    data: {
      projectId: project.id,
      seq: project.caseCounter,
      suiteId,
      title: String(body.title),
      description: body.description ?? null,
      preconditions: body.preconditions ?? null,
      stepsJson: JSON.stringify(body.steps ?? []),
      expectedResult: body.expectedResult ?? null,
      priority: body.priority ?? "MEDIUM",
      type: body.type ?? "FUNCTIONAL",
      tags: body.tags ?? "",
    },
  });

  return NextResponse.json(
    {
      id: testCase.id,
      displayId: caseDisplayId(project.slug, testCase.seq),
    },
    { status: 201 }
  );
}
