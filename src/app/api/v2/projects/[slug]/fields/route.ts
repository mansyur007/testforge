import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import {
  guardV2,
  resolveProject,
  requirePerm,
  readBody,
  readPage,
  listResponse,
  withRate,
  conflict,
  validationError,
  serializeFieldDef,
  type FieldError,
} from "@/lib/api-v2";
import { CUSTOM_FIELD_TYPES, FIELD_KEY_RE } from "@/lib/custom-fields";

// F-33: custom field definitions. Same validation rules as v1 — key/type/entity
// are immutable once stored values are keyed by them — but v2 returns a
// paginated envelope and 409s on a duplicate key instead of folding it into a
// field-level 422.

export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const ctx = await guardV2(req);
  if (ctx instanceof NextResponse) return ctx;
  const project = await resolveProject(ctx, params.slug);
  if (project instanceof NextResponse) return project;

  const sp = req.nextUrl.searchParams;
  const entity = sp.get("entity");
  const activeParam = sp.get("active");
  const where = {
    projectId: project.id,
    ...(entity ? { entity: entity.toUpperCase() } : {}),
    ...(activeParam === null ? {} : { active: activeParam === "true" }),
  };

  const p = readPage(req);
  const [rows, total] = await Promise.all([
    db.customFieldDef.findMany({
      where,
      orderBy: [{ entity: "asc" }, { order: "asc" }],
      skip: p.skip,
      take: p.perPage,
    }),
    db.customFieldDef.count({ where }),
  ]);

  return withRate(listResponse(rows.map(serializeFieldDef), total, p), ctx);
}

export async function POST(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const ctx = await guardV2(req, { write: true });
  if (ctx instanceof NextResponse) return ctx;
  const project = await resolveProject(ctx, params.slug);
  if (project instanceof NextResponse) return project;
  const denied = await requirePerm(ctx.userId, project.id, "fields.manage");
  if (denied) return denied;

  const body = await readBody(req);
  if (body instanceof NextResponse) return body;

  const errors: FieldError[] = [];
  const entity = String(body.entity ?? "CASE").toUpperCase();
  const key = String(body.key ?? "").trim().toLowerCase();
  const label = String(body.label ?? "").trim().slice(0, 60);
  const type = String(body.type ?? "").toUpperCase();
  const options = Array.isArray(body.options) ? body.options.map(String) : [];

  if (!["CASE", "RESULT"].includes(entity))
    errors.push({ field: "entity", message: "must be CASE or RESULT" });
  if (!FIELD_KEY_RE.test(key))
    errors.push({ field: "key", message: "must match ^[a-z][a-z0-9_]{1,30}$" });
  if (!label) errors.push({ field: "label", message: "label is required" });
  if (!(CUSTOM_FIELD_TYPES as readonly string[]).includes(type))
    errors.push({
      field: "type",
      message: `must be one of: ${CUSTOM_FIELD_TYPES.join(", ")}`,
    });
  if (["DROPDOWN", "MULTISELECT"].includes(type) && options.length === 0)
    errors.push({ field: "options", message: "at least one option required" });
  if (errors.length) return validationError(errors);

  const dupe = await db.customFieldDef.findUnique({
    where: { projectId_entity_key: { projectId: project.id, entity, key } },
  });
  if (dupe) return conflict(`A ${entity} field with key "${key}" already exists`);

  const last = await db.customFieldDef.findFirst({
    where: { projectId: project.id, entity },
    orderBy: { order: "desc" },
    select: { order: true },
  });
  const def = await db.customFieldDef.create({
    data: {
      projectId: project.id,
      entity,
      key,
      label,
      type,
      required: body.required === true,
      optionsJson: JSON.stringify(options),
      order: (last?.order ?? -1) + 1,
    },
  });

  await logAudit({
    userId: ctx.userId,
    action: "field.create",
    entityType: "field",
    entityId: def.id,
    detail: `${entity}:${key}`,
  });

  return withRate(
    NextResponse.json(serializeFieldDef(def), { status: 201 }),
    ctx
  );
}
