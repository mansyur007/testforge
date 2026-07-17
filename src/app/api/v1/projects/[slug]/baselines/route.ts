import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import {
  guard,
  notFoundError,
  validationError,
  type FieldError,
  requirePerm,
  serializeBaseline,
} from "@/lib/api";
import { createBaseline } from "@/lib/baselines";

// F-28: suite baselines — named snapshots of a suite tree + case revisions.

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
  const cursor = sp.get("cursor");
  const limit = Math.min(parseInt(sp.get("limit") ?? "50", 10) || 50, 200);

  const items = await db.suiteBaseline.findMany({
    where: { projectId: project.id },
    include: { _count: { select: { entries: true } } },
    orderBy: { createdAt: "desc" },
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
  });
  const nextCursor = items.length > limit ? items[limit].id : null;
  return NextResponse.json({
    items: items.slice(0, limit).map((b) => serializeBaseline(b, b._count.entries)),
    nextCursor,
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
  const denied = await requirePerm(g.userId, project.id, "case.write");
  if (denied) return denied;

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object")
    return validationError([{ field: "body", message: "Invalid JSON body" }]);

  const errors: FieldError[] = [];
  const name = String(body.name ?? "").trim();
  if (!name) errors.push({ field: "name", message: "name is required" });
  const suiteId = body.suiteId ? String(body.suiteId) : null;

  if (name) {
    const dup = await db.suiteBaseline.findUnique({
      where: { projectId_name: { projectId: project.id, name } },
    });
    if (dup) errors.push({ field: "name", message: "a baseline with this name already exists" });
  }
  if (errors.length) return validationError(errors);

  const result = await createBaseline(project.id, name, suiteId, g.userId);
  if ("error" in result) return validationError([{ field: "suiteId", message: result.error }]);

  const baseline = await db.suiteBaseline.findUniqueOrThrow({
    where: { id: result.id },
    include: { _count: { select: { entries: true } } },
  });

  await logAudit({
    userId: g.userId,
    action: "baseline.create",
    entityType: "baseline",
    entityId: baseline.id,
    detail: name,
  });

  return NextResponse.json(serializeBaseline(baseline, baseline._count.entries), { status: 201 });
}
