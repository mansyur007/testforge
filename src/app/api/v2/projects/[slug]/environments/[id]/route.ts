import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import {
  guardV2,
  resolveProject,
  requirePerm,
  readBody,
  withRate,
  conflict,
  notFoundError,
  validationError,
  serializeEnvironment,
  type FieldError,
} from "@/lib/api-v2";

// F-33: single environment. Deleting one detaches it from any runs that were
// tagged with it rather than cascading — a run's history outlives the
// environment row it was executed against.

async function load(slug: string, id: string, userId: string) {
  return db.environment.findFirst({
    where: { id, project: { slug, members: { some: { userId } } } },
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

  const e = await load(params.slug, params.id, ctx.userId);
  if (!e) return notFoundError("Environment not found");
  return withRate(NextResponse.json(serializeEnvironment(e)), ctx);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { slug: string; id: string } }
) {
  const ctx = await guardV2(req, { write: true });
  if (ctx instanceof NextResponse) return ctx;
  const project = await resolveProject(ctx, params.slug);
  if (project instanceof NextResponse) return project;
  const denied = await requirePerm(ctx.userId, project.id, "fields.manage");
  if (denied) return denied;

  const e = await load(params.slug, params.id, ctx.userId);
  if (!e) return notFoundError("Environment not found");

  const body = await readBody(req);
  if (body instanceof NextResponse) return body;

  const errors: FieldError[] = [];
  const data: {
    name?: string;
    url?: string | null;
    order?: number;
    active?: boolean;
  } = {};

  if ("name" in body) {
    const name = String(body.name ?? "").trim().slice(0, 60);
    if (!name) errors.push({ field: "name", message: "cannot be empty" });
    else if (name !== e.name) {
      const dup = await db.environment.findUnique({
        where: { projectId_name: { projectId: project.id, name } },
      });
      if (dup) return conflict("An environment with that name already exists");
      data.name = name;
    }
  }
  if ("url" in body) data.url = body.url ? String(body.url) : null;
  if ("active" in body) data.active = body.active === true;
  if ("order" in body) {
    const n = Number(body.order);
    if (!Number.isInteger(n))
      errors.push({ field: "order", message: "must be an integer" });
    else data.order = n;
  }
  if (errors.length) return validationError(errors);

  const updated = await db.environment.update({ where: { id: e.id }, data });

  await logAudit({
    userId: ctx.userId,
    action: "environment.update",
    entityType: "project",
    entityId: project.id,
    detail: updated.name,
  });

  return withRate(NextResponse.json(serializeEnvironment(updated)), ctx);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { slug: string; id: string } }
) {
  const ctx = await guardV2(req, { write: true });
  if (ctx instanceof NextResponse) return ctx;
  const project = await resolveProject(ctx, params.slug);
  if (project instanceof NextResponse) return project;
  const denied = await requirePerm(ctx.userId, project.id, "fields.manage");
  if (denied) return denied;

  const e = await load(params.slug, params.id, ctx.userId);
  if (!e) return notFoundError("Environment not found");

  await db.$transaction([
    db.testRun.updateMany({
      where: { environmentId: e.id },
      data: { environmentId: null },
    }),
    db.environment.delete({ where: { id: e.id } }),
  ]);

  await logAudit({
    userId: ctx.userId,
    action: "environment.delete",
    entityType: "project",
    entityId: project.id,
    detail: e.name,
  });

  return withRate(new NextResponse(null, { status: 204 }), ctx);
}
