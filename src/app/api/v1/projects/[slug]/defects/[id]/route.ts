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
import { DEFECT_SEVERITIES, DEFECT_STATUSES } from "@/lib/defects";

// F-26: a single defect — get, update, delete.

async function resolveDefect(slug: string, id: string, userId: string) {
  const defect = await db.defect.findFirst({
    where: { id, project: { slug, members: { some: { userId } } } },
    include: { project: { select: { id: true, slug: true } } },
  });
  return defect;
}

export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string; id: string } }
) {
  const g = await guard(req);
  if (g instanceof NextResponse) return g;

  const defect = await resolveDefect(params.slug, params.id, g.userId);
  if (!defect) return notFoundError("Defect not found");

  return NextResponse.json(serializeDefect(defect.project.slug, defect));
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { slug: string; id: string } }
) {
  const g = await guard(req, { write: true });
  if (g instanceof NextResponse) return g;

  const defect = await resolveDefect(params.slug, params.id, g.userId);
  if (!defect) return notFoundError("Defect not found");
  const denied = await requirePerm(g.userId, defect.projectId, "case.write");
  if (denied) return denied;

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object")
    return validationError([{ field: "body", message: "Invalid JSON body" }]);

  const errors: FieldError[] = [];
  const data: Record<string, unknown> = {};
  if (body.title !== undefined) {
    const title = String(body.title).trim();
    if (!title) errors.push({ field: "title", message: "title cannot be blank" });
    else data.title = title;
  }
  if (body.severity !== undefined) {
    if (!(DEFECT_SEVERITIES as readonly string[]).includes(String(body.severity)))
      errors.push({ field: "severity", message: "invalid severity" });
    else data.severity = String(body.severity);
  }
  if (body.status !== undefined) {
    if (!(DEFECT_STATUSES as readonly string[]).includes(String(body.status)))
      errors.push({ field: "status", message: "invalid status" });
    else data.status = String(body.status);
  }
  if (body.bodyMd !== undefined) data.bodyMd = body.bodyMd ? String(body.bodyMd) : null;
  if (body.assigneeId !== undefined)
    data.assigneeId = body.assigneeId ? String(body.assigneeId) : null;
  if (errors.length) return validationError(errors);

  const updated = await db.defect.update({ where: { id: defect.id }, data });
  await logAudit({
    userId: g.userId,
    action: "defect.update",
    entityType: "defect",
    entityId: defect.id,
    detail: updated.title,
  });
  if (data.status && data.status !== defect.status) {
    await dispatchWebhook(defect.projectId, "defect.status_changed", {
      id: defect.id,
      status: data.status,
      previousStatus: defect.status,
    });
  }

  return NextResponse.json(serializeDefect(defect.project.slug, updated));
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { slug: string; id: string } }
) {
  const g = await guard(req, { write: true });
  if (g instanceof NextResponse) return g;

  const defect = await resolveDefect(params.slug, params.id, g.userId);
  if (!defect) return notFoundError("Defect not found");
  const denied = await requirePerm(g.userId, defect.projectId, "case.write");
  if (denied) return denied;

  await db.defect.delete({ where: { id: defect.id } });
  await logAudit({
    userId: g.userId,
    action: "defect.delete",
    entityType: "defect",
    entityId: defect.id,
    detail: defect.title,
  });

  return new NextResponse(null, { status: 204 });
}
