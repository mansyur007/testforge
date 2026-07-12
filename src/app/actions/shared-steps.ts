"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { isProjectMember } from "@/lib/projects";
import { logAudit } from "@/lib/audit";
import { caseDisplayId, type InlineStep } from "@/lib/constants";
import { findReferencingCases } from "@/lib/steps";
import { can } from "@/lib/permissions";

// F-04 shared step groups. Any writer (non-VIEWER member) can manage them —
// they're test content, like cases. Deleting is blocked while referenced.

function readSteps(formData: FormData): InlineStep[] {
  try {
    const parsed = JSON.parse(String(formData.get("stepsJson") ?? "[]"));
    return Array.isArray(parsed)
      ? parsed
          .map((s) => ({
            action: String(s?.action ?? "").trim(),
            expected: String(s?.expected ?? "").trim(),
          }))
          .filter((s) => s.action)
      : [];
  } catch {
    return [];
  }
}

export async function createSharedGroup(
  _prev: { error?: string; ok?: boolean } | undefined,
  formData: FormData
) {
  const session = await requireSession();

  const projectId = String(formData.get("projectId") ?? "");
  const title = String(formData.get("title") ?? "").trim().slice(0, 80);
  const steps = readSteps(formData);
  if (!title) return { error: "Title is required." };
  if (steps.length === 0) return { error: "Add at least one step." };
  if (!(await isProjectMember(session.userId, projectId)))
    return { error: "Project not found." };
  // F-14: shared steps are case content.
  if (!(await can(session.userId, projectId, "case.write")))
    return { error: "You don't have permission to edit shared steps." };

  const group = await db.sharedStepGroup.create({
    data: { projectId, title, stepsJson: JSON.stringify(steps) },
    include: { project: { select: { slug: true } } },
  });
  await logAudit({
    userId: session.userId,
    action: "sharedsteps.create",
    entityType: "sharedsteps",
    entityId: group.id,
    detail: title,
  });
  revalidatePath(`/projects/${group.project.slug}/cases/shared-steps`);
  return { ok: true as const };
}

export async function updateSharedGroup(
  _prev: { error?: string; ok?: boolean } | undefined,
  formData: FormData
) {
  const session = await requireSession();

  const id = String(formData.get("groupId") ?? "");
  const group = await db.sharedStepGroup.findFirst({
    where: { id, project: { members: { some: { userId: session.userId } } } },
    include: { project: { select: { slug: true } } },
  });
  if (!group) return { error: "Shared steps not found." };
  // F-14: shared steps are case content.
  if (!(await can(session.userId, group.projectId, "case.write")))
    return { error: "You don't have permission to edit shared steps." };

  const title = String(formData.get("title") ?? "").trim().slice(0, 80);
  const steps = readSteps(formData);
  if (!title) return { error: "Title is required." };
  if (steps.length === 0) return { error: "Add at least one step." };

  await db.sharedStepGroup.update({
    where: { id },
    data: { title, stepsJson: JSON.stringify(steps) },
  });
  await logAudit({
    userId: session.userId,
    action: "sharedsteps.update",
    entityType: "sharedsteps",
    entityId: id,
    detail: title,
  });
  revalidatePath(`/projects/${group.project.slug}/cases/shared-steps`);
  return { ok: true as const };
}

export async function deleteSharedGroup(
  _prev: { error?: string; ok?: boolean } | undefined,
  formData: FormData
) {
  const session = await requireSession();

  const id = String(formData.get("groupId") ?? "");
  const group = await db.sharedStepGroup.findFirst({
    where: { id, project: { members: { some: { userId: session.userId } } } },
    include: { project: { select: { slug: true } } },
  });
  if (!group) return { error: "Shared steps not found." };
  // F-14: shared steps are case content.
  if (!(await can(session.userId, group.projectId, "case.write")))
    return { error: "You don't have permission to edit shared steps." };

  const refs = await findReferencingCases(group.projectId, id);
  if (refs.length > 0) {
    const ids = refs
      .slice(0, 5)
      .map((c) => caseDisplayId(group.project.slug, c.seq))
      .join(", ");
    return {
      error: `Still used by ${refs.length} case(s): ${ids}${refs.length > 5 ? "…" : ""}. Unlink them first.`,
    };
  }

  await db.sharedStepGroup.delete({ where: { id } });
  await logAudit({
    userId: session.userId,
    action: "sharedsteps.delete",
    entityType: "sharedsteps",
    entityId: id,
    detail: group.title,
  });
  revalidatePath(`/projects/${group.project.slug}/cases/shared-steps`);
  return { ok: true as const };
}
