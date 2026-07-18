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
  serializeFieldDef,
  type FieldError,
} from "@/lib/api-v2";

// F-33: single custom field. entity/key/type stay immutable (stored values are
// keyed and typed by them); DELETE is a hard delete of the *definition* only —
// values already written into a case's customJson are left untouched, which is
// why deactivating (`active: false`) is the gentler option and stays available.

async function load(slug: string, id: string, userId: string) {
  return db.customFieldDef.findFirst({
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

  const def = await load(params.slug, params.id, ctx.userId);
  if (!def) return notFoundError("Field not found");
  return withRate(NextResponse.json(serializeFieldDef(def)), ctx);
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

  const def = await load(params.slug, params.id, ctx.userId);
  if (!def) return notFoundError("Field not found");

  const body = await readBody(req);
  if (body instanceof NextResponse) return body;

  const errors: FieldError[] = [];
  for (const immutable of ["entity", "key", "type"]) {
    if (immutable in body && String(body[immutable]) !== String((def as never)[immutable]))
      errors.push({ field: immutable, message: "is immutable" });
  }

  const data: {
    label?: string;
    required?: boolean;
    active?: boolean;
    order?: number;
    optionsJson?: string;
  } = {};

  if ("label" in body) {
    const label = String(body.label ?? "").trim().slice(0, 60);
    if (!label) errors.push({ field: "label", message: "cannot be empty" });
    else data.label = label;
  }
  if ("required" in body) data.required = body.required === true;
  if ("active" in body) data.active = body.active === true;
  if ("order" in body) {
    const n = Number(body.order);
    if (!Number.isInteger(n))
      errors.push({ field: "order", message: "must be an integer" });
    else data.order = n;
  }
  if ("options" in body) {
    if (!Array.isArray(body.options))
      errors.push({ field: "options", message: "must be an array" });
    else if (
      ["DROPDOWN", "MULTISELECT"].includes(def.type) &&
      body.options.length === 0
    )
      errors.push({ field: "options", message: "at least one option required" });
    else data.optionsJson = JSON.stringify(body.options.map(String));
  }
  if (errors.length) return validationError(errors);

  const updated = await db.customFieldDef.update({
    where: { id: def.id },
    data,
  });

  await logAudit({
    userId: ctx.userId,
    action: "field.update",
    entityType: "field",
    entityId: def.id,
    detail: `${def.entity}:${def.key}`,
  });

  return withRate(NextResponse.json(serializeFieldDef(updated)), ctx);
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

  const def = await load(params.slug, params.id, ctx.userId);
  if (!def) return notFoundError("Field not found");

  await db.customFieldDef.delete({ where: { id: def.id } });

  await logAudit({
    userId: ctx.userId,
    action: "field.delete",
    entityType: "field",
    entityId: def.id,
    detail: `${def.entity}:${def.key}`,
  });

  return withRate(new NextResponse(null, { status: 204 }), ctx);
}
