import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  guard,
  apiError,
  notFoundError,
  validationError,
  type FieldError,
  requirePerm,
} from "@/lib/api";
import { logAudit } from "@/lib/audit";
import { caseDisplayId } from "@/lib/constants";
import { findReferencingCases, serializeSharedGroup } from "@/lib/steps";

async function findScoped(userId: string, slug: string, id: string) {
  return db.sharedStepGroup.findFirst({
    where: {
      id,
      project: { slug, members: { some: { userId } } },
    },
    include: { project: { select: { slug: true } } },
  });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { slug: string; id: string } }
) {
  const g = await guard(req, { write: true });
  if (g instanceof NextResponse) return g;

  const group = await findScoped(g.userId, params.slug, params.id);
  if (!group) return notFoundError("Shared steps not found");
  const denied = await requirePerm(g.userId, group.projectId, "case.write"); // F-14
  if (denied) return denied;

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object")
    return validationError([{ field: "body", message: "Invalid JSON body" }]);

  const errors: FieldError[] = [];
  const data: { title?: string; stepsJson?: string } = {};
  if ("title" in body) {
    const title = String(body.title ?? "").trim().slice(0, 80);
    if (!title) errors.push({ field: "title", message: "cannot be empty" });
    else data.title = title;
  }
  if ("steps" in body) {
    if (!Array.isArray(body.steps))
      errors.push({ field: "steps", message: "must be an array" });
    else {
      const steps = body.steps
        .map((s: { action?: unknown; expected?: unknown }) => ({
          action: String(s?.action ?? "").trim(),
          expected: String(s?.expected ?? "").trim(),
        }))
        .filter((s: { action: string }) => s.action);
      if (steps.length === 0)
        errors.push({ field: "steps", message: "at least one step with an action" });
      else data.stepsJson = JSON.stringify(steps);
    }
  }
  if (errors.length) return validationError(errors);

  const updated = await db.sharedStepGroup.update({
    where: { id: group.id },
    data,
  });
  await logAudit({
    userId: g.userId,
    action: "sharedsteps.update",
    entityType: "sharedsteps",
    entityId: group.id,
    detail: updated.title,
  });
  return NextResponse.json(serializeSharedGroup(updated));
}

// 409 while any non-deleted case still references the group.
export async function DELETE(
  req: NextRequest,
  { params }: { params: { slug: string; id: string } }
) {
  const g = await guard(req, { write: true });
  if (g instanceof NextResponse) return g;

  const group = await findScoped(g.userId, params.slug, params.id);
  if (!group) return notFoundError("Shared steps not found");
  const denied = await requirePerm(g.userId, group.projectId, "case.write"); // F-14
  if (denied) return denied;

  const refs = await findReferencingCases(group.projectId, group.id);
  if (refs.length > 0)
    return apiError(
      409,
      "conflict",
      `Still referenced by ${refs.length} case(s): ${refs
        .slice(0, 5)
        .map((c) => caseDisplayId(group.project.slug, c.seq))
        .join(", ")}${refs.length > 5 ? "…" : ""}`
    );

  await db.sharedStepGroup.delete({ where: { id: group.id } });
  await logAudit({
    userId: g.userId,
    action: "sharedsteps.delete",
    entityType: "sharedsteps",
    entityId: group.id,
    detail: group.title,
  });
  return new NextResponse(null, { status: 204 });
}
