"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { can } from "@/lib/permissions";

// F-19: environments — OWNER/ADMIN manage the list; anyone can select one at
// run creation. Deleting an environment just clears the tag on old runs
// (schema: onDelete SetNull), it never touches run data.

type ActionResult = { error?: string; ok?: boolean };

async function requireEnvAdmin(
  projectId: string
): Promise<{ userId: string; slug: string } | { error: string }> {
  const session = await requireSession();
  // F-14: central permission check (covers custom roles too).
  if (!(await can(session.userId, projectId, "fields.manage")))
    return { error: "Only project owners/admins can manage environments." };
  const project = await db.project.findUniqueOrThrow({
    where: { id: projectId },
    select: { slug: true },
  });
  return { userId: session.userId, slug: project.slug };
}

export async function createEnvironment(
  _prev: ActionResult | undefined,
  formData: FormData
): Promise<ActionResult> {
  const projectId = String(formData.get("projectId"));
  const admin = await requireEnvAdmin(projectId);
  if ("error" in admin) return admin;

  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "Environment name is required." };
  const url = String(formData.get("url") ?? "").trim() || null;

  const dup = await db.environment.findUnique({
    where: { projectId_name: { projectId, name } },
  });
  if (dup) return { error: `An environment named "${name}" already exists.` };

  const last = await db.environment.findFirst({
    where: { projectId },
    orderBy: { order: "desc" },
    select: { order: true },
  });
  await db.environment.create({
    data: { projectId, name, url, order: (last?.order ?? -1) + 1 },
  });

  await logAudit({
    userId: admin.userId,
    action: "environment.create",
    entityType: "project",
    entityId: projectId,
    detail: name,
  });
  revalidatePath(`/projects/${admin.slug}/fields`);
  return { ok: true };
}

export async function toggleEnvironmentActive(formData: FormData): Promise<void> {
  const id = String(formData.get("environmentId"));
  const env = await db.environment.findUnique({ where: { id } });
  if (!env) return;
  const admin = await requireEnvAdmin(env.projectId);
  if ("error" in admin) return;

  await db.environment.update({
    where: { id },
    data: { active: !env.active },
  });
  await logAudit({
    userId: admin.userId,
    action: "environment.toggle",
    entityType: "project",
    entityId: env.projectId,
    detail: `${env.name}: ${env.active ? "deactivated" : "activated"}`,
  });
  revalidatePath(`/projects/${admin.slug}/fields`);
}

export async function deleteEnvironment(formData: FormData): Promise<void> {
  const id = String(formData.get("environmentId"));
  const env = await db.environment.findUnique({ where: { id } });
  if (!env) return;
  const admin = await requireEnvAdmin(env.projectId);
  if ("error" in admin) return;

  await db.environment.delete({ where: { id } }); // runs keep their history, environmentId -> null
  await logAudit({
    userId: admin.userId,
    action: "environment.delete",
    entityType: "project",
    entityId: env.projectId,
    detail: env.name,
  });
  revalidatePath(`/projects/${admin.slug}/fields`);
}

export async function setAutoCreateEnvs(formData: FormData): Promise<void> {
  const projectId = String(formData.get("projectId"));
  const admin = await requireEnvAdmin(projectId);
  if ("error" in admin) return;

  const enabled = formData.get("autoCreateEnvs") === "on";
  await db.project.update({
    where: { id: projectId },
    data: { autoCreateEnvs: enabled },
  });
  await logAudit({
    userId: admin.userId,
    action: "environment.set_auto_create",
    entityType: "project",
    entityId: projectId,
    detail: enabled ? "enabled" : "disabled",
  });
  revalidatePath(`/projects/${admin.slug}/fields`);
}
