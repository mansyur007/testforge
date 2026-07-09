"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { isProjectMember } from "@/lib/projects";
import { logAudit } from "@/lib/audit";
import { sanitizeCaseFilters } from "@/lib/saved-views";

// F-10 saved views. Personal views are allowed for every member incl. VIEWER
// (a view is a UI preference, not test data); sharing needs write access.

export async function createSavedView(
  _prev: { error?: string } | undefined,
  formData: FormData
) {
  const session = await requireSession();
  const projectId = String(formData.get("projectId") ?? "");
  const name = String(formData.get("name") ?? "").trim().slice(0, 60);
  const shared = formData.get("shared") === "on";
  const isDefault = formData.get("isDefault") === "on";

  if (!name) return { error: "View name is required." };
  if (shared && session.role === "VIEWER")
    return { error: "Viewers can only save personal views." };
  if (!(await isProjectMember(session.userId, projectId)))
    return { error: "Project not found." };

  let filters: Record<string, string>;
  try {
    filters = sanitizeCaseFilters(JSON.parse(String(formData.get("filtersJson") ?? "{}")));
  } catch {
    return { error: "Invalid filters." };
  }
  if (Object.keys(filters).length === 0)
    return { error: "Nothing to save — apply at least one filter first." };

  // Max one default per user+project+entity.
  if (isDefault)
    await db.savedView.updateMany({
      where: { projectId, userId: session.userId, entity: "CASES", isDefault: true },
      data: { isDefault: false },
    });

  const view = await db.savedView.create({
    data: {
      projectId,
      userId: session.userId,
      entity: "CASES",
      name,
      filtersJson: JSON.stringify(filters),
      shared,
      isDefault,
    },
    include: { project: { select: { slug: true } } },
  });

  await logAudit({
    userId: session.userId,
    action: "view.create",
    entityType: "view",
    entityId: view.id,
    detail: name,
  });
  revalidatePath(`/projects/${view.project.slug}`);
  return { ok: true as const };
}

export async function toggleDefaultSavedView(formData: FormData) {
  const session = await requireSession();
  const id = String(formData.get("viewId") ?? "");
  // Only own views can be (un)starred as the personal default.
  const view = await db.savedView.findFirst({
    where: { id, userId: session.userId },
    include: { project: { select: { slug: true } } },
  });
  if (!view) return;

  if (view.isDefault) {
    await db.savedView.update({ where: { id }, data: { isDefault: false } });
  } else {
    await db.savedView.updateMany({
      where: {
        projectId: view.projectId,
        userId: session.userId,
        entity: view.entity,
        isDefault: true,
      },
      data: { isDefault: false },
    });
    await db.savedView.update({ where: { id }, data: { isDefault: true } });
  }
  revalidatePath(`/projects/${view.project.slug}`);
}

export async function deleteSavedView(formData: FormData) {
  const session = await requireSession();
  const id = String(formData.get("viewId") ?? "");
  const view = await db.savedView.findFirst({
    where: { id, project: { members: { some: { userId: session.userId } } } },
    include: { project: { select: { id: true, slug: true } } },
  });
  if (!view) return;

  // Owner always; a shared view may also be removed by a project OWNER/ADMIN
  // or an org ADMIN.
  let allowed = view.userId === session.userId;
  if (!allowed && view.shared) {
    const membership = await db.projectMember.findUnique({
      where: {
        projectId_userId: { projectId: view.project.id, userId: session.userId },
      },
      select: { role: true },
    });
    allowed =
      session.role === "ADMIN" ||
      ["OWNER", "ADMIN"].includes(membership?.role ?? "");
  }
  if (!allowed) return;

  await db.savedView.delete({ where: { id } });
  await logAudit({
    userId: session.userId,
    action: "view.delete",
    entityType: "view",
    entityId: id,
    detail: view.name,
  });
  revalidatePath(`/projects/${view.project.slug}`);
}
