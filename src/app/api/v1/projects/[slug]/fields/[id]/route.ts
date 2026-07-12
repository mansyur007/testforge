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
import { serializeFieldDef } from "@/lib/custom-fields";
import { can } from "@/lib/permissions";

// F-03: update a custom field definition. Key/type/entity are immutable
// (stored values are keyed and typed by them) — label, options, required,
// order, and active can change.
export async function PATCH(
  req: NextRequest,
  { params }: { params: { slug: string; id: string } }
) {
  const g = await guard(req, { write: true });
  if (g instanceof NextResponse) return g;

  const def = await db.customFieldDef.findFirst({
    where: {
      id: params.id,
      project: { slug: params.slug, members: { some: { userId: g.userId } } },
    },
  });
  if (!def) return notFoundError("Field not found");

  // F-14: central permission check (covers custom roles too).
  if (!(await can(g.userId, def.projectId, "fields.manage")))
    return forbidden("Only project admins can manage fields");

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object")
    return validationError([{ field: "body", message: "Invalid JSON body" }]);

  const errors: FieldError[] = [];
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
    if (!Number.isInteger(n)) errors.push({ field: "order", message: "must be an integer" });
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

  const updated = await db.customFieldDef.update({ where: { id: def.id }, data });
  await logAudit({
    userId: g.userId,
    action: "field.update",
    entityType: "field",
    entityId: def.id,
    detail: `${def.entity}:${def.key}`,
  });
  return NextResponse.json(serializeFieldDef(updated));
}
