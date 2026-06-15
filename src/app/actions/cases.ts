"use server";

import { redirect, notFound } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { isProjectMember } from "@/lib/projects";
import { logAudit } from "@/lib/audit";
import type { TestStep } from "@/lib/constants";

// Tenant guard for case-level mutations: the case must belong to a project the
// user is a member of.
async function assertCaseAccess(userId: string, caseId: string) {
  const owned = await db.testCase.findFirst({
    where: { id: caseId, project: { members: { some: { userId } } } },
    select: { id: true },
  });
  if (!owned) notFound();
}

function readCaseFields(formData: FormData) {
  let steps: TestStep[] = [];
  try {
    steps = JSON.parse(String(formData.get("stepsJson") ?? "[]"));
  } catch {
    steps = [];
  }
  return {
    title: String(formData.get("title") ?? "").trim(),
    description: String(formData.get("description") ?? "").trim() || null,
    preconditions: String(formData.get("preconditions") ?? "").trim() || null,
    expectedResult: String(formData.get("expectedResult") ?? "").trim() || null,
    priority: String(formData.get("priority") ?? "MEDIUM"),
    type: String(formData.get("type") ?? "FUNCTIONAL"),
    status: String(formData.get("status") ?? "ACTIVE"),
    automationStatus: String(formData.get("automationStatus") ?? "NOT_AUTOMATED"),
    tags: String(formData.get("tags") ?? "").trim(),
    linkedIssues: String(formData.get("linkedIssues") ?? "").trim() || null,
    suiteId: String(formData.get("suiteId") ?? "") || null,
    stepsJson: JSON.stringify(steps),
  };
}

export async function createCase(
  _prev: { error?: string } | undefined,
  formData: FormData
) {
  const session = await requireSession();
  if (session.role === "VIEWER") return { error: "Viewer tidak punya akses tulis." };

  const projectId = String(formData.get("projectId"));
  const fields = readCaseFields(formData);
  if (!fields.title) return { error: "Judul test case wajib diisi." };
  if (!(await isProjectMember(session.userId, projectId)))
    return { error: "Proyek tidak ditemukan." };

  const project = await db.project.update({
    where: { id: projectId },
    data: { caseCounter: { increment: 1 } },
  });

  const testCase = await db.testCase.create({
    data: { projectId, seq: project.caseCounter, ...fields },
  });

  await logAudit({
    userId: session.userId,
    action: "case.create",
    entityType: "case",
    entityId: testCase.id,
    detail: fields.title,
  });
  redirect(`/projects/${project.slug}/cases/${testCase.id}`);
}

export async function updateCase(
  _prev: { error?: string } | undefined,
  formData: FormData
) {
  const session = await requireSession();
  if (session.role === "VIEWER") return { error: "Viewer tidak punya akses tulis." };

  const caseId = String(formData.get("caseId"));
  const fields = readCaseFields(formData);
  if (!fields.title) return { error: "Judul test case wajib diisi." };
  await assertCaseAccess(session.userId, caseId);

  const testCase = await db.testCase.update({
    where: { id: caseId },
    data: fields,
    include: { project: true },
  });

  await logAudit({
    userId: session.userId,
    action: "case.update",
    entityType: "case",
    entityId: caseId,
    detail: fields.title,
  });
  redirect(`/projects/${testCase.project.slug}/cases/${caseId}`);
}

export async function cloneCase(formData: FormData) {
  const session = await requireSession();
  const caseId = String(formData.get("caseId"));
  await assertCaseAccess(session.userId, caseId);
  const original = await db.testCase.findUniqueOrThrow({
    where: { id: caseId },
  });

  const project = await db.project.update({
    where: { id: original.projectId },
    data: { caseCounter: { increment: 1 } },
  });

  const copy = await db.testCase.create({
    data: {
      projectId: original.projectId,
      suiteId: original.suiteId,
      seq: project.caseCounter,
      title: `${original.title} (Copy)`,
      description: original.description,
      preconditions: original.preconditions,
      stepsJson: original.stepsJson,
      expectedResult: original.expectedResult,
      priority: original.priority,
      type: original.type,
      status: "DRAFT",
      automationStatus: original.automationStatus,
      tags: original.tags,
    },
  });

  await logAudit({
    userId: session.userId,
    action: "case.clone",
    entityType: "case",
    entityId: copy.id,
  });
  redirect(`/projects/${project.slug}/cases/${copy.id}`);
}

// Soft delete (gap audit: PRD tidak menyebut recycle bin / recovery)
export async function deleteCase(formData: FormData) {
  const session = await requireSession();
  const caseId = String(formData.get("caseId"));
  await assertCaseAccess(session.userId, caseId);
  const testCase = await db.testCase.update({
    where: { id: caseId },
    data: { deletedAt: new Date() },
    include: { project: true },
  });
  await logAudit({
    userId: session.userId,
    action: "case.delete",
    entityType: "case",
    entityId: caseId,
    detail: testCase.title,
  });
  redirect(`/projects/${testCase.project.slug}`);
}

export async function bulkUpdateCases(formData: FormData) {
  const session = await requireSession();
  const slug = String(formData.get("projectSlug"));
  const ids = formData.getAll("caseIds").map(String);
  const field = String(formData.get("bulkField"));
  const value = String(formData.get("bulkValue"));
  if (!ids.length || !["priority", "type", "status"].includes(field)) return;

  await db.testCase.updateMany({
    where: {
      id: { in: ids },
      project: { members: { some: { userId: session.userId } } },
    },
    data: { [field]: value },
  });
  await logAudit({
    userId: session.userId,
    action: "case.bulk_update",
    detail: `${ids.length} case → ${field}=${value}`,
  });
  revalidatePath(`/projects/${slug}`);
}
