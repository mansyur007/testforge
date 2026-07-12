"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import {
  BUILT_IN_ROLES,
  PERMISSIONS,
  type Permission,
} from "@/lib/permissions";

// F-14: custom role definitions, managed by org admins on Settings → Team.
// A RoleDef's name is what ProjectMember.role stores; built-in names are
// reserved. Deleting is blocked while any project member holds the role.

type ActionResult = { error?: string; ok?: boolean };

const NAME_RE = /^[A-Za-z][A-Za-z0-9 _-]{1,29}$/;

async function requireOrgAdmin(): Promise<
  { userId: string; organizationId: string } | { error: string }
> {
  const session = await requireSession();
  const user = await db.user.findUnique({
    where: { id: session.userId },
    select: { role: true, organizationId: true },
  });
  if (!user?.organizationId)
    return { error: "You are not part of an organization." };
  if (user.role !== "ADMIN")
    return { error: "Only organization admins can manage roles." };
  return { userId: session.userId, organizationId: user.organizationId };
}

function readPermissions(formData: FormData): Permission[] {
  return formData
    .getAll("permissions")
    .map(String)
    .filter((p): p is Permission =>
      (PERMISSIONS as readonly string[]).includes(p)
    );
}

export async function createRole(
  _prev: ActionResult | undefined,
  formData: FormData
): Promise<ActionResult> {
  const admin = await requireOrgAdmin();
  if ("error" in admin) return admin;

  const name = String(formData.get("name") ?? "").trim();
  if (!NAME_RE.test(name))
    return { error: "Role name: 2–30 chars, letters/digits/space/-/_ only." };
  if ((BUILT_IN_ROLES as readonly string[]).includes(name.toUpperCase()))
    return { error: `"${name}" is a built-in role.` };

  const permissions = readPermissions(formData);
  const dup = await db.roleDef.findUnique({
    where: {
      organizationId_name: { organizationId: admin.organizationId, name },
    },
  });
  if (dup) return { error: `A role named "${name}" already exists.` };

  await db.roleDef.create({
    data: {
      organizationId: admin.organizationId,
      name,
      permissionsJson: JSON.stringify(permissions),
    },
  });
  await logAudit({
    userId: admin.userId,
    action: "role.create",
    entityType: "organization",
    entityId: admin.organizationId,
    detail: `${name}: ${permissions.join(", ") || "(no permissions)"}`,
  });
  revalidatePath("/settings/team");
  return { ok: true };
}

export async function updateRole(
  _prev: ActionResult | undefined,
  formData: FormData
): Promise<ActionResult> {
  const admin = await requireOrgAdmin();
  if ("error" in admin) return admin;

  const id = String(formData.get("id"));
  const def = await db.roleDef.findFirst({
    where: { id, organizationId: admin.organizationId },
  });
  if (!def) return { error: "Role not found." };

  const permissions = readPermissions(formData);
  await db.roleDef.update({
    where: { id },
    data: { permissionsJson: JSON.stringify(permissions) },
  });
  await logAudit({
    userId: admin.userId,
    action: "role.update",
    entityType: "organization",
    entityId: admin.organizationId,
    detail: `${def.name}: ${permissions.join(", ") || "(no permissions)"}`,
  });
  revalidatePath("/settings/team");
  return { ok: true };
}

export async function deleteRole(
  _prev: ActionResult | undefined,
  formData: FormData
): Promise<ActionResult> {
  const admin = await requireOrgAdmin();
  if ("error" in admin) return admin;

  const id = String(formData.get("id"));
  const def = await db.roleDef.findFirst({
    where: { id, organizationId: admin.organizationId },
  });
  if (!def) return { error: "Role not found." };

  // Blocked while assigned: a dangling role name would silently degrade the
  // member to read-only (see lib/permissions fallback).
  const inUse = await db.projectMember.count({
    where: {
      role: def.name,
      project: { members: { some: { user: { organizationId: admin.organizationId } } } },
    },
  });
  if (inUse > 0)
    return {
      error: `"${def.name}" is assigned to ${inUse} project member${inUse === 1 ? "" : "s"} — reassign them first.`,
    };

  await db.roleDef.delete({ where: { id } });
  await logAudit({
    userId: admin.userId,
    action: "role.delete",
    entityType: "organization",
    entityId: admin.organizationId,
    detail: def.name,
  });
  revalidatePath("/settings/team");
  return { ok: true };
}
