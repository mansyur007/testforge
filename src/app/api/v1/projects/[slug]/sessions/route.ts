import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import {
  guard,
  notFoundError,
  validationError,
  type FieldError,
  requirePerm,
  serializeSession,
} from "@/lib/api";

// F-25: exploratory / session-based testing.

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
  const status = sp.get("status");
  const cursor = sp.get("cursor");
  const limit = Math.min(parseInt(sp.get("limit") ?? "50", 10) || 50, 200);

  const items = await db.session.findMany({
    where: { projectId: project.id, ...(status ? { status } : {}) },
    orderBy: { startedAt: "desc" },
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
  });
  const nextCursor = items.length > limit ? items[limit].id : null;
  return NextResponse.json({
    items: items.slice(0, limit).map(serializeSession),
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
  const denied = await requirePerm(g.userId, project.id, "run.execute");
  if (denied) return denied;

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object")
    return validationError([{ field: "body", message: "Invalid JSON body" }]);

  const errors: FieldError[] = [];
  const charter = String(body.charter ?? "").trim();
  if (!charter) errors.push({ field: "charter", message: "charter is required" });
  const timeboxMinutes = body.timeboxMinutes
    ? Math.max(5, Math.min(240, parseInt(String(body.timeboxMinutes), 10) || 30))
    : 30;
  if (errors.length) return validationError(errors);

  const session = await db.session.create({
    data: { projectId: project.id, charter, timeboxMinutes, testerId: g.userId },
  });
  await logAudit({
    userId: g.userId,
    action: "session.start",
    entityType: "session",
    entityId: session.id,
    detail: charter,
  });

  return NextResponse.json(serializeSession(session), { status: 201 });
}
