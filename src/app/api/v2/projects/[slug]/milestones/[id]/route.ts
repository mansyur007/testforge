import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import {
  guardV2,
  resolveProject,
  requirePerm,
  readBody,
  withRate,
  notFoundError,
  validationError,
  serializeMilestone,
  type FieldError,
} from "@/lib/api-v2";

// F-33: single milestone — read, update, delete.

async function load(slug: string, id: string, userId: string) {
  return db.milestone.findFirst({
    where: { id, project: { slug, members: { some: { userId } } } },
    include: { _count: { select: { runs: true } } },
  });
}

export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string; id: string } }
) {
  const ctx = await guardV2(req);
  if (ctx instanceof NextResponse) return ctx;
  const project = await resolveProject(ctx, params.slug);
  if (project instanceof NextResponse) return project;

  const m = await load(params.slug, params.id, ctx.userId);
  if (!m) return notFoundError("Milestone not found");
  return withRate(
    NextResponse.json(serializeMilestone(m, { runs: m._count.runs })),
    ctx
  );
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { slug: string; id: string } }
) {
  const ctx = await guardV2(req, { write: true });
  if (ctx instanceof NextResponse) return ctx;
  const project = await resolveProject(ctx, params.slug);
  if (project instanceof NextResponse) return project;
  const denied = await requirePerm(ctx.userId, project.id, "run.manage");
  if (denied) return denied;

  const m = await load(params.slug, params.id, ctx.userId);
  if (!m) return notFoundError("Milestone not found");

  const body = await readBody(req);
  if (body instanceof NextResponse) return body;

  const errors: FieldError[] = [];
  const data: { name?: string; dueDate?: Date | null; status?: string } = {};

  if ("name" in body) {
    const name = String(body.name ?? "").trim().slice(0, 120);
    if (!name) errors.push({ field: "name", message: "cannot be empty" });
    else data.name = name;
  }
  // An explicit null clears the due date; omitting the key leaves it alone.
  if ("dueDate" in body) {
    if (body.dueDate == null || body.dueDate === "") data.dueDate = null;
    else {
      const d = new Date(String(body.dueDate));
      if (Number.isNaN(d.getTime()))
        errors.push({ field: "dueDate", message: "must be an ISO date" });
      else data.dueDate = d;
    }
  }
  if ("status" in body) {
    const status = String(body.status);
    if (!["OPEN", "COMPLETED"].includes(status))
      errors.push({ field: "status", message: "must be OPEN or COMPLETED" });
    else data.status = status;
  }
  if (errors.length) return validationError(errors);

  const updated = await db.milestone.update({
    where: { id: m.id },
    data,
    include: { _count: { select: { runs: true } } },
  });

  await logAudit({
    userId: ctx.userId,
    action: "milestone.update",
    entityType: "milestone",
    entityId: m.id,
    detail: updated.name,
  });

  return withRate(
    NextResponse.json(serializeMilestone(updated, { runs: updated._count.runs })),
    ctx
  );
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { slug: string; id: string } }
) {
  const ctx = await guardV2(req, { write: true });
  if (ctx instanceof NextResponse) return ctx;
  const project = await resolveProject(ctx, params.slug);
  if (project instanceof NextResponse) return project;
  const denied = await requirePerm(ctx.userId, project.id, "run.manage");
  if (denied) return denied;

  const m = await load(params.slug, params.id, ctx.userId);
  if (!m) return notFoundError("Milestone not found");

  // Runs and plans reference the milestone optionally — detach rather than
  // cascade, so deleting a milestone never destroys test history.
  await db.$transaction([
    db.testRun.updateMany({
      where: { milestoneId: m.id },
      data: { milestoneId: null },
    }),
    db.testPlan.updateMany({
      where: { milestoneId: m.id },
      data: { milestoneId: null },
    }),
    db.milestone.delete({ where: { id: m.id } }),
  ]);

  await logAudit({
    userId: ctx.userId,
    action: "milestone.delete",
    entityType: "milestone",
    entityId: m.id,
    detail: m.name,
  });

  return withRate(new NextResponse(null, { status: 204 }), ctx);
}
