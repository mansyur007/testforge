"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { getProjectRole, canManageMembers } from "@/lib/projects";
import { logAudit } from "@/lib/audit";

// F-06: configuration groups & options ("Browser" → Chrome/Firefox) used by
// test plans as matrix axes. OWNER/ADMIN only — same gate as custom fields.
// Deleting a group/option that an existing run references is fine: runs copy
// the NAMES into configJson at creation (see the TestRun schema comment).

type ActionResult = { error?: string; ok?: boolean };

async function requireConfigAdmin(
  projectId: string
): Promise<{ userId: string; slug: string } | { error: string }> {
  const session = await requireSession();
  const role = await getProjectRole(session.userId, projectId);
  if (!role) return { error: "Project not found." };
  if (!canManageMembers(role))
    return { error: "Only project owners/admins can manage configurations." };
  const project = await db.project.findUniqueOrThrow({
    where: { id: projectId },
    select: { slug: true },
  });
  return { userId: session.userId, slug: project.slug };
}

export async function createConfigGroup(
  _prev: ActionResult | undefined,
  formData: FormData
): Promise<ActionResult> {
  const projectId = String(formData.get("projectId"));
  const admin = await requireConfigAdmin(projectId);
  if ("error" in admin) return admin;

  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "Group name is required." };

  const dup = await db.configGroup.findUnique({
    where: { projectId_name: { projectId, name } },
  });
  if (dup) return { error: `A group named "${name}" already exists.` };

  const last = await db.configGroup.findFirst({
    where: { projectId },
    orderBy: { order: "desc" },
    select: { order: true },
  });
  await db.configGroup.create({
    data: { projectId, name, order: (last?.order ?? -1) + 1 },
  });

  await logAudit({
    userId: admin.userId,
    action: "config.create_group",
    entityType: "project",
    entityId: projectId,
    detail: name,
  });
  revalidatePath(`/projects/${admin.slug}/fields`);
  return { ok: true };
}

export async function deleteConfigGroup(formData: FormData): Promise<void> {
  const id = String(formData.get("groupId"));
  const group = await db.configGroup.findUnique({ where: { id } });
  if (!group) return;
  const admin = await requireConfigAdmin(group.projectId);
  if ("error" in admin) return;

  await db.configGroup.delete({ where: { id } }); // options cascade
  await logAudit({
    userId: admin.userId,
    action: "config.delete_group",
    entityType: "project",
    entityId: group.projectId,
    detail: group.name,
  });
  revalidatePath(`/projects/${admin.slug}/fields`);
}

export async function addConfigOption(
  _prev: ActionResult | undefined,
  formData: FormData
): Promise<ActionResult> {
  const groupId = String(formData.get("groupId"));
  const group = await db.configGroup.findUnique({ where: { id: groupId } });
  if (!group) return { error: "Group not found." };
  const admin = await requireConfigAdmin(group.projectId);
  if ("error" in admin) return admin;

  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "Option name is required." };

  const dup = await db.configOption.findUnique({
    where: { groupId_name: { groupId, name } },
  });
  if (dup) return { error: `"${name}" is already an option of ${group.name}.` };

  const last = await db.configOption.findFirst({
    where: { groupId },
    orderBy: { order: "desc" },
    select: { order: true },
  });
  await db.configOption.create({
    data: { groupId, name, order: (last?.order ?? -1) + 1 },
  });

  await logAudit({
    userId: admin.userId,
    action: "config.add_option",
    entityType: "project",
    entityId: group.projectId,
    detail: `${group.name}: ${name}`,
  });
  revalidatePath(`/projects/${admin.slug}/fields`);
  return { ok: true };
}

export async function deleteConfigOption(formData: FormData): Promise<void> {
  const id = String(formData.get("optionId"));
  const option = await db.configOption.findUnique({
    where: { id },
    include: { group: true },
  });
  if (!option) return;
  const admin = await requireConfigAdmin(option.group.projectId);
  if ("error" in admin) return;

  await db.configOption.delete({ where: { id } });
  await logAudit({
    userId: admin.userId,
    action: "config.delete_option",
    entityType: "project",
    entityId: option.group.projectId,
    detail: `${option.group.name}: ${option.name}`,
  });
  revalidatePath(`/projects/${admin.slug}/fields`);
}
