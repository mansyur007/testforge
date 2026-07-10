"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { CUSTOM_FIELD_TYPES, FIELD_KEY_RE } from "@/lib/custom-fields";

// F-03 custom field definitions. Managing defs is a project-admin concern:
// org ADMIN, or project OWNER/ADMIN. Keys and types are immutable after
// creation (stored values are keyed and typed by them); defs with data are
// soft-disabled via `active`, never hard-deleted.

async function assertFieldAdmin(userId: string, projectId: string) {
  const [user, membership] = await Promise.all([
    db.user.findUnique({ where: { id: userId }, select: { role: true } }),
    db.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId } },
      select: { role: true },
    }),
  ]);
  if (!membership) return { error: "Project not found." };
  const ok =
    user?.role === "ADMIN" || ["OWNER", "ADMIN"].includes(membership.role);
  return ok ? null : { error: "Only project admins can manage fields." };
}

function parseOptionsInput(raw: string): string[] {
  return raw
    .split(/[\n,]/)
    .map((s) => s.trim())
    .filter(Boolean)
    .filter((v, i, a) => a.indexOf(v) === i);
}

export async function createFieldDef(
  _prev: { error?: string; ok?: boolean } | undefined,
  formData: FormData
) {
  const session = await requireSession();
  const projectId = String(formData.get("projectId") ?? "");
  const entity = String(formData.get("entity") ?? "CASE").toUpperCase();
  const key = String(formData.get("key") ?? "").trim().toLowerCase();
  const label = String(formData.get("label") ?? "").trim().slice(0, 60);
  const type = String(formData.get("type") ?? "").toUpperCase();
  const required = formData.get("required") === "on";
  const options = parseOptionsInput(String(formData.get("options") ?? ""));

  const denied = await assertFieldAdmin(session.userId, projectId);
  if (denied) return denied;

  if (!["CASE", "RESULT"].includes(entity)) return { error: "Invalid entity." };
  if (!FIELD_KEY_RE.test(key))
    return { error: "Key must match ^[a-z][a-z0-9_]{1,30}$ (e.g. component)." };
  if (!label) return { error: "Label is required." };
  if (!(CUSTOM_FIELD_TYPES as readonly string[]).includes(type))
    return { error: "Invalid field type." };
  if (["DROPDOWN", "MULTISELECT"].includes(type) && options.length === 0)
    return { error: "Dropdown/multi-select needs at least one option." };

  const dupe = await db.customFieldDef.findUnique({
    where: { projectId_entity_key: { projectId, entity, key } },
  });
  if (dupe) return { error: `A ${entity.toLowerCase()} field "${key}" already exists.` };

  const last = await db.customFieldDef.findFirst({
    where: { projectId, entity },
    orderBy: { order: "desc" },
    select: { order: true },
  });

  const def = await db.customFieldDef.create({
    data: {
      projectId,
      entity,
      key,
      label,
      type,
      required,
      optionsJson: JSON.stringify(options),
      order: (last?.order ?? -1) + 1,
    },
    include: { project: { select: { slug: true } } },
  });

  await logAudit({
    userId: session.userId,
    action: "field.create",
    entityType: "field",
    entityId: def.id,
    detail: `${entity}:${key}`,
  });
  revalidatePath(`/projects/${def.project.slug}/fields`);
  return { ok: true as const };
}

export async function updateFieldDef(
  _prev: { error?: string; ok?: boolean } | undefined,
  formData: FormData
) {
  const session = await requireSession();
  const id = String(formData.get("fieldId") ?? "");
  const def = await db.customFieldDef.findUnique({
    where: { id },
    include: { project: { select: { slug: true } } },
  });
  if (!def) return { error: "Field not found." };
  const denied = await assertFieldAdmin(session.userId, def.projectId);
  if (denied) return denied;

  const label = String(formData.get("label") ?? "").trim().slice(0, 60);
  const required = formData.get("required") === "on";
  const options = parseOptionsInput(String(formData.get("options") ?? ""));
  if (!label) return { error: "Label is required." };
  if (["DROPDOWN", "MULTISELECT"].includes(def.type) && options.length === 0)
    return { error: "Dropdown/multi-select needs at least one option." };

  await db.customFieldDef.update({
    where: { id },
    data: {
      label,
      required,
      ...(["DROPDOWN", "MULTISELECT"].includes(def.type)
        ? { optionsJson: JSON.stringify(options) }
        : {}),
    },
  });
  await logAudit({
    userId: session.userId,
    action: "field.update",
    entityType: "field",
    entityId: id,
    detail: `${def.entity}:${def.key}`,
  });
  revalidatePath(`/projects/${def.project.slug}/fields`);
  return { ok: true as const };
}

export async function toggleFieldActive(formData: FormData) {
  const session = await requireSession();
  const id = String(formData.get("fieldId") ?? "");
  const def = await db.customFieldDef.findUnique({
    where: { id },
    include: { project: { select: { slug: true } } },
  });
  if (!def) return;
  if (await assertFieldAdmin(session.userId, def.projectId)) return;

  await db.customFieldDef.update({
    where: { id },
    data: { active: !def.active },
  });
  await logAudit({
    userId: session.userId,
    action: def.active ? "field.disable" : "field.enable",
    entityType: "field",
    entityId: id,
    detail: `${def.entity}:${def.key}`,
  });
  revalidatePath(`/projects/${def.project.slug}/fields`);
}

export async function moveFieldDef(formData: FormData) {
  const session = await requireSession();
  const id = String(formData.get("fieldId") ?? "");
  const dir = formData.get("dir") === "up" ? -1 : 1;
  const def = await db.customFieldDef.findUnique({
    where: { id },
    include: { project: { select: { slug: true } } },
  });
  if (!def) return;
  if (await assertFieldAdmin(session.userId, def.projectId)) return;

  const siblings = await db.customFieldDef.findMany({
    where: { projectId: def.projectId, entity: def.entity },
    orderBy: { order: "asc" },
  });
  const idx = siblings.findIndex((s) => s.id === id);
  const swap = siblings[idx + dir];
  if (!swap) return;

  await db.$transaction([
    db.customFieldDef.update({ where: { id }, data: { order: swap.order } }),
    db.customFieldDef.update({ where: { id: swap.id }, data: { order: def.order } }),
  ]);
  revalidatePath(`/projects/${def.project.slug}/fields`);
}
