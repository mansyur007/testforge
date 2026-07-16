"use server";

import crypto from "node:crypto";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { can } from "@/lib/permissions";

// L-01: public quality badge — project.admin members enable/revoke; the
// badge route itself is auth-free (the token is the auth). Re-enabling
// rotates the token in place, so a revoked URL never resurrects.

export async function enableBadge(formData: FormData): Promise<void> {
  const session = await requireSession();
  const projectId = String(formData.get("projectId"));
  const project = await db.project.findUnique({
    where: { id: projectId },
    select: { slug: true },
  });
  if (!project) return;
  if (!(await can(session.userId, projectId, "project.admin"))) return;

  const token = crypto.randomBytes(24).toString("hex");
  await db.badgeToken.upsert({
    where: { projectId },
    create: { projectId, token },
    update: { token, revokedAt: null },
  });
  await logAudit({
    userId: session.userId,
    action: "badge.enable",
    entityType: "project",
    entityId: projectId,
  });
  revalidatePath(`/projects/${project.slug}/api`);
}

export async function revokeBadge(formData: FormData): Promise<void> {
  const session = await requireSession();
  const projectId = String(formData.get("projectId"));
  const badge = await db.badgeToken.findUnique({
    where: { projectId },
    select: { revokedAt: true, project: { select: { slug: true } } },
  });
  if (!badge || badge.revokedAt) return;
  if (!(await can(session.userId, projectId, "project.admin"))) return;

  await db.badgeToken.update({
    where: { projectId },
    data: { revokedAt: new Date() },
  });
  await logAudit({
    userId: session.userId,
    action: "badge.revoke",
    entityType: "project",
    entityId: projectId,
  });
  revalidatePath(`/projects/${badge.project.slug}/api`);
}
