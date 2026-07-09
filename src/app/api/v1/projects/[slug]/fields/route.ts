import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  guard,
  forbidden,
  notFoundError,
  validationError,
  type FieldError,
} from "@/lib/api";
import { logAudit } from "@/lib/audit";
import {
  CUSTOM_FIELD_TYPES,
  FIELD_KEY_RE,
  parseOptions,
} from "@/lib/custom-fields";
import type { CustomFieldDef } from "@prisma/client";

// F-03 REST API: list & create custom field definitions.

export function serializeFieldDef(d: CustomFieldDef) {
  return {
    id: d.id,
    entity: d.entity,
    key: d.key,
    label: d.label,
    type: d.type,
    options: parseOptions(d),
    required: d.required,
    order: d.order,
    active: d.active,
  };
}

async function fieldAdmin(userId: string, projectId: string): Promise<boolean> {
  const [user, membership] = await Promise.all([
    db.user.findUnique({ where: { id: userId }, select: { role: true } }),
    db.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId } },
      select: { role: true },
    }),
  ]);
  return (
    user?.role === "ADMIN" || ["OWNER", "ADMIN"].includes(membership?.role ?? "")
  );
}

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
  const defs = await db.customFieldDef.findMany({
    where: {
      projectId: project.id,
      ...(sp.get("entity") ? { entity: sp.get("entity")!.toUpperCase() } : {}),
    },
    orderBy: [{ entity: "asc" }, { order: "asc" }],
  });
  return NextResponse.json({ items: defs.map(serializeFieldDef) });
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
  if (!(await fieldAdmin(g.userId, project.id)))
    return forbidden("Only project admins can manage fields");

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object")
    return validationError([{ field: "body", message: "Invalid JSON body" }]);

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
  if (dupe)
    return validationError([{ field: "key", message: "already exists" }]);

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
    userId: g.userId,
    action: "field.create",
    entityType: "field",
    entityId: def.id,
    detail: `${entity}:${key}`,
  });
  return NextResponse.json(serializeFieldDef(def), { status: 201 });
}
