"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { dispatchWebhook } from "@/lib/webhooks";
import { can } from "@/lib/permissions";
import {
  DEFECT_SEVERITIES,
  DEFECT_STATUSES,
  DEFECT_LINK_ENTITY_TYPES,
} from "@/lib/defects";

// F-26: built-in defects. Authored like cases — gated on `case.write`.
// Linking a defect from a run result follows `run.execute` (same tier as
// filing an F-07 issue from a result).

async function requireDefectEditor(
  projectId: string
): Promise<{ userId: string; slug: string } | null> {
  const session = await requireSession();
  if (!(await can(session.userId, projectId, "case.write"))) return null;
  const project = await db.project.findUniqueOrThrow({
    where: { id: projectId },
    select: { slug: true },
  });
  return { userId: session.userId, slug: project.slug };
}

function readDefectFields(formData: FormData) {
  const severity = String(formData.get("severity") ?? "MEDIUM");
  const status = String(formData.get("status") ?? "OPEN");
  return {
    title: String(formData.get("title") ?? "").trim(),
    severity: (DEFECT_SEVERITIES as readonly string[]).includes(severity)
      ? severity
      : "MEDIUM",
    status: (DEFECT_STATUSES as readonly string[]).includes(status)
      ? status
      : "OPEN",
    bodyMd: String(formData.get("bodyMd") ?? "").trim() || null,
    assigneeId: String(formData.get("assigneeId") ?? "") || null,
  };
}

export async function createDefect(formData: FormData): Promise<void> {
  const projectId = String(formData.get("projectId"));
  const editor = await requireDefectEditor(projectId);
  if (!editor) return;
  const fields = readDefectFields(formData);
  if (!fields.title) return;

  const project = await db.project.update({
    where: { id: projectId },
    data: { defectCounter: { increment: 1 } },
  });
  const defect = await db.defect.create({
    data: {
      projectId,
      seq: project.defectCounter,
      title: fields.title,
      severity: fields.severity,
      bodyMd: fields.bodyMd,
      assigneeId: fields.assigneeId,
      createdById: editor.userId,
    },
  });
  await logAudit({
    userId: editor.userId,
    action: "defect.create",
    entityType: "defect",
    entityId: defect.id,
    detail: fields.title,
  });
  await dispatchWebhook(projectId, "defect.created", {
    id: defect.id,
    title: fields.title,
    severity: fields.severity,
  });
  redirect(`/projects/${editor.slug}/defects/${defect.id}`);
}

export async function updateDefect(formData: FormData): Promise<void> {
  const id = String(formData.get("defectId"));
  const defect = await db.defect.findUnique({ where: { id } });
  if (!defect) return;
  const editor = await requireDefectEditor(defect.projectId);
  if (!editor) return;
  const fields = readDefectFields(formData);
  if (!fields.title) return;

  await db.defect.update({
    where: { id },
    data: {
      title: fields.title,
      severity: fields.severity,
      bodyMd: fields.bodyMd,
      assigneeId: fields.assigneeId,
    },
  });
  await logAudit({
    userId: editor.userId,
    action: "defect.update",
    entityType: "defect",
    entityId: id,
    detail: fields.title,
  });
  revalidatePath(`/projects/${editor.slug}/defects/${id}`);
}

export async function changeDefectStatus(formData: FormData): Promise<void> {
  const id = String(formData.get("defectId"));
  const status = String(formData.get("status") ?? "");
  if (!(DEFECT_STATUSES as readonly string[]).includes(status)) return;
  const defect = await db.defect.findUnique({ where: { id } });
  if (!defect) return;
  const editor = await requireDefectEditor(defect.projectId);
  if (!editor) return;
  if (status === defect.status) return;

  await db.defect.update({ where: { id }, data: { status } });
  await logAudit({
    userId: editor.userId,
    action: "defect.status_change",
    entityType: "defect",
    entityId: id,
    detail: `${defect.status} -> ${status}`,
  });
  await dispatchWebhook(defect.projectId, "defect.status_changed", {
    id,
    status,
    previousStatus: defect.status,
  });
  revalidatePath(`/projects/${editor.slug}/defects`);
  revalidatePath(`/projects/${editor.slug}/defects/${id}`);
}

export async function deleteDefect(formData: FormData): Promise<void> {
  const id = String(formData.get("defectId"));
  const defect = await db.defect.findUnique({ where: { id } });
  if (!defect) return;
  const editor = await requireDefectEditor(defect.projectId);
  if (!editor) return;

  await db.defect.delete({ where: { id } });
  await logAudit({
    userId: editor.userId,
    action: "defect.delete",
    entityType: "defect",
    entityId: id,
    detail: defect.title,
  });
  revalidatePath(`/projects/${editor.slug}/defects`);
  redirect(`/projects/${editor.slug}/defects`);
}

// Link an EXISTING defect to a case/result (e.g. from the run executor).
export async function linkDefectToEntity(formData: FormData): Promise<void> {
  const session = await requireSession();
  const defectId = String(formData.get("defectId"));
  const entityType = String(formData.get("entityType"));
  const entityId = String(formData.get("entityId"));
  if (!(DEFECT_LINK_ENTITY_TYPES as readonly string[]).includes(entityType))
    return;

  const defect = await db.defect.findFirst({
    where: { id: defectId, project: { members: { some: { userId: session.userId } } } },
    include: { project: { select: { slug: true } } },
  });
  if (!defect) return;
  if (!(await can(session.userId, defect.projectId, "run.execute"))) return;

  // Tenant guard: the target entity must belong to the same project.
  const owned =
    entityType === "CASE"
      ? await db.testCase.findFirst({ where: { id: entityId, projectId: defect.projectId } })
      : await db.testRunResult.findFirst({
          where: { id: entityId, run: { projectId: defect.projectId } },
        });
  if (!owned) return;

  await db.defectLink.upsert({
    where: { defectId_entityType_entityId: { defectId, entityType, entityId } },
    create: { defectId, entityType, entityId },
    update: {},
  });
  await logAudit({
    userId: session.userId,
    action: "defect.link",
    entityType: entityType.toLowerCase(),
    entityId,
    detail: `defect ${defectId}`,
  });
  revalidatePath(`/projects/${defect.project.slug}/runs`);
}

// Create a new defect AND link it in one step — the "report defect" flow
// from a failed result, mirroring F-07's createIssueFromResult.
export async function createAndLinkDefect(formData: FormData): Promise<void> {
  const session = await requireSession();
  const entityType = String(formData.get("entityType"));
  const entityId = String(formData.get("entityId"));
  if (!(DEFECT_LINK_ENTITY_TYPES as readonly string[]).includes(entityType))
    return;

  const projectId =
    entityType === "CASE"
      ? (
          await db.testCase.findFirst({
            where: { id: entityId, project: { members: { some: { userId: session.userId } } } },
            select: { projectId: true },
          })
        )?.projectId
      : (
          await db.testRunResult.findFirst({
            where: {
              id: entityId,
              run: { project: { members: { some: { userId: session.userId } } } },
            },
            select: { run: { select: { projectId: true } } },
          })
        )?.run.projectId;
  if (!projectId) return;
  if (!(await can(session.userId, projectId, "run.execute"))) return;

  const title = String(formData.get("title") ?? "").trim();
  if (!title) return;
  const bodyMd = String(formData.get("bodyMd") ?? "").trim() || null;
  const severityRaw = String(formData.get("severity") ?? "MEDIUM");
  const severity = (DEFECT_SEVERITIES as readonly string[]).includes(severityRaw)
    ? severityRaw
    : "MEDIUM";

  const project = await db.project.update({
    where: { id: projectId },
    data: { defectCounter: { increment: 1 } },
  });
  const defect = await db.defect.create({
    data: {
      projectId,
      seq: project.defectCounter,
      title,
      severity,
      bodyMd,
      createdById: session.userId,
      links: { create: { entityType, entityId } },
    },
  });
  await logAudit({
    userId: session.userId,
    action: "defect.create",
    entityType: "defect",
    entityId: defect.id,
    detail: title,
  });
  await dispatchWebhook(projectId, "defect.created", {
    id: defect.id,
    title,
    severity,
  });
  revalidatePath(`/projects/${project.slug}/runs`);
}

export async function unlinkDefect(formData: FormData): Promise<void> {
  const session = await requireSession();
  const linkId = String(formData.get("linkId"));
  const link = await db.defectLink.findFirst({
    where: { id: linkId, defect: { project: { members: { some: { userId: session.userId } } } } },
    include: { defect: { include: { project: { select: { slug: true } } } } },
  });
  if (!link) return;
  if (!(await can(session.userId, link.defect.projectId, "run.execute"))) return;

  await db.defectLink.delete({ where: { id: linkId } });
  await logAudit({
    userId: session.userId,
    action: "defect.unlink",
    entityType: link.entityType.toLowerCase(),
    entityId: link.entityId,
    detail: `defect ${link.defectId}`,
  });
  revalidatePath(`/projects/${link.defect.project.slug}/runs`);
}
