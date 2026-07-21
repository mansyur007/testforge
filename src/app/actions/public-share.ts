"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { can } from "@/lib/permissions";

// F-38: owner-facing controls for public "portfolio mode" sharing. The public
// pages themselves import nothing from here — they are read-only. Every action
// re-checks project.admin server-side (the settings page hiding a button is a
// UI convenience, not a guard).

async function authorize(projectId: string) {
  const session = await requireSession();
  const project = await db.project.findUnique({
    where: { id: projectId },
    select: { slug: true },
  });
  if (!project) return null;
  if (!(await can(session.userId, projectId, "project.admin"))) return null;
  return { session, project };
}

/** Purge the ISR cache for every public page of this project. Without it a
 * just-disabled share could keep serving from cache for up to `revalidate`. */
function revalidateShare(slug: string) {
  revalidatePath(`/public/${slug}`, "layout");
  revalidatePath(`/projects/${slug}/sharing`);
}

export async function enablePublicShare(formData: FormData): Promise<void> {
  const projectId = String(formData.get("projectId"));
  const ctx = await authorize(projectId);
  if (!ctx) return;

  await db.publicShare.upsert({
    where: { projectId },
    create: { projectId, enabled: true, createdById: ctx.session.userId },
    update: { enabled: true },
  });
  await logAudit({
    userId: ctx.session.userId,
    action: "public_share.enable",
    entityType: "project",
    entityId: projectId,
  });
  revalidateShare(ctx.project.slug);
}

export async function disablePublicShare(formData: FormData): Promise<void> {
  const projectId = String(formData.get("projectId"));
  const ctx = await authorize(projectId);
  if (!ctx) return;

  const existing = await db.publicShare.findUnique({ where: { projectId } });
  if (!existing) return;

  await db.publicShare.update({
    where: { projectId },
    data: { enabled: false },
  });
  await logAudit({
    userId: ctx.session.userId,
    action: "public_share.disable",
    entityType: "project",
    entityId: projectId,
  });
  revalidateShare(ctx.project.slug);
}

export async function updatePublicShare(formData: FormData): Promise<void> {
  const projectId = String(formData.get("projectId"));
  const ctx = await authorize(projectId);
  if (!ctx) return;

  const existing = await db.publicShare.findUnique({ where: { projectId } });
  if (!existing) return;

  const showCases = formData.get("showCases") != null;
  const indexable = formData.get("indexable") != null;

  await db.publicShare.update({
    where: { projectId },
    data: { showCases, indexable },
  });
  // Search-engine visibility is the one toggle here with consequences outside
  // the app, so it gets its own audit line.
  if (indexable !== existing.indexable)
    await logAudit({
      userId: ctx.session.userId,
      action: indexable
        ? "public_share.indexable_on"
        : "public_share.indexable_off",
      entityType: "project",
      entityId: projectId,
    });
  if (showCases !== existing.showCases)
    await logAudit({
      userId: ctx.session.userId,
      action: "public_share.sections",
      entityType: "project",
      entityId: projectId,
      detail: `showCases=${showCases}`,
    });
  revalidateShare(ctx.project.slug);
}
