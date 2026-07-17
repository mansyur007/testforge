import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import { dispatchWebhook } from "@/lib/webhooks";
import {
  guard,
  notFoundError,
  validationError,
  type FieldError,
  requirePerm,
  serializeDefect,
} from "@/lib/api";
import { DEFECT_SEVERITIES } from "@/lib/defects";

// F-26: built-in defect tracker.

export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const g = await guard(req);
  if (g instanceof NextResponse) return g;

  const project = await db.project.findFirst({
    where: { slug: params.slug, members: { some: { userId: g.userId } } },
    select: { id: true, slug: true },
  });
  if (!project) return notFoundError("Project not found");

  const sp = req.nextUrl.searchParams;
  const status = sp.get("status");
  const cursor = sp.get("cursor");
  const limit = Math.min(parseInt(sp.get("limit") ?? "50", 10) || 50, 200);

  const items = await db.defect.findMany({
    where: { projectId: project.id, ...(status ? { status } : {}) },
    orderBy: { seq: "asc" },
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
  });
  const nextCursor = items.length > limit ? items[limit].id : null;
  return NextResponse.json({
    items: items.slice(0, limit).map((d) => serializeDefect(project.slug, d)),
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
    select: { id: true, slug: true },
  });
  if (!project) return notFoundError("Project not found");
  const denied = await requirePerm(g.userId, project.id, "case.write");
  if (denied) return denied;

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object")
    return validationError([{ field: "body", message: "Invalid JSON body" }]);

  const errors: FieldError[] = [];
  const title = String(body.title ?? "").trim();
  if (!title) errors.push({ field: "title", message: "title is required" });
  const severity = body.severity ? String(body.severity) : "MEDIUM";
  if (!(DEFECT_SEVERITIES as readonly string[]).includes(severity))
    errors.push({ field: "severity", message: "invalid severity" });
  if (errors.length) return validationError(errors);

  const updated = await db.project.update({
    where: { id: project.id },
    data: { defectCounter: { increment: 1 } },
  });
  const defect = await db.defect.create({
    data: {
      projectId: project.id,
      seq: updated.defectCounter,
      title,
      severity,
      bodyMd: body.bodyMd ? String(body.bodyMd) : null,
      assigneeId: body.assigneeId ? String(body.assigneeId) : null,
      createdById: g.userId,
    },
  });

  await logAudit({
    userId: g.userId,
    action: "defect.create",
    entityType: "defect",
    entityId: defect.id,
    detail: title,
  });
  await dispatchWebhook(project.id, "defect.created", {
    id: defect.id,
    title,
    severity,
  });

  return NextResponse.json(serializeDefect(project.slug, defect), { status: 201 });
}
