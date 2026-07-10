"use server";

import { redirect, notFound } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { isProjectMember } from "@/lib/projects";
import { logAudit } from "@/lib/audit";
import type { TestStep } from "@/lib/constants";
import {
  collectCustomFromForm,
  mergeCustomJson,
  validateCustomValues,
} from "@/lib/custom-fields";

// F-03: collect & validate custom_<key> form entries against the project's
// CASE field defs. Returns the merged customJson or a user-facing error.
async function readCustomJson(
  projectId: string,
  formData: FormData,
  existingJson?: string | null
): Promise<{ customJson: string } | { error: string }> {
  const defs = await db.customFieldDef.findMany({
    where: { projectId, entity: "CASE" },
    orderBy: { order: "asc" },
  });
  if (defs.length === 0) return { customJson: existingJson ?? "{}" };

  const members = await db.projectMember.findMany({
    where: { projectId },
    select: { userId: true },
  });
  const check = validateCustomValues(
    defs,
    collectCustomFromForm(defs, formData),
    new Set(members.map((m) => m.userId))
  );
  if (!check.ok) return { error: check.errors.map((e) => e.message).join(" · ") };
  return { customJson: mergeCustomJson(existingJson, defs, check.values) };
}

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
  if (session.role === "VIEWER") return { error: "Viewers don't have write access." };

  const projectId = String(formData.get("projectId"));
  const fields = readCaseFields(formData);
  if (!fields.title) return { error: "Test case title is required." };
  if (!(await isProjectMember(session.userId, projectId)))
    return { error: "Project not found." };

  const custom = await readCustomJson(projectId, formData);
  if ("error" in custom) return { error: custom.error };

  const project = await db.project.update({
    where: { id: projectId },
    data: { caseCounter: { increment: 1 } },
  });

  const testCase = await db.testCase.create({
    data: {
      projectId,
      seq: project.caseCounter,
      customJson: custom.customJson,
      ...fields,
    },
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
  if (session.role === "VIEWER") return { error: "Viewers don't have write access." };

  const caseId = String(formData.get("caseId"));
  const fields = readCaseFields(formData);
  if (!fields.title) return { error: "Test case title is required." };
  await assertCaseAccess(session.userId, caseId);

  const existing = await db.testCase.findUniqueOrThrow({
    where: { id: caseId },
    select: { projectId: true, customJson: true },
  });
  const custom = await readCustomJson(
    existing.projectId,
    formData,
    existing.customJson
  );
  if ("error" in custom) return { error: custom.error };

  const testCase = await db.testCase.update({
    where: { id: caseId },
    data: { ...fields, customJson: custom.customJson },
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
      customJson: original.customJson,
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
  if (
    !ids.length ||
    !["priority", "type", "status", "automationStatus"].includes(field)
  )
    return;

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

// Bulk soft delete. Cases are hidden (deletedAt) now and hard-purged after a
// retention window (see lib/cases-purge). Requires the exact project name as a
// destructive-action gate — validated server-side, not just in the UI.
export async function bulkDeleteCases(
  formData: FormData
): Promise<{ ok?: boolean; error?: string; deleted?: number }> {
  const session = await requireSession();
  if (session.role === "VIEWER")
    return { error: "Viewers don't have write access." };

  const slug = String(formData.get("projectSlug"));
  const ids = formData.getAll("caseIds").map(String);
  const confirmName = String(formData.get("confirmName") ?? "").trim();
  if (!ids.length) return { error: "No test cases selected." };

  const project = await db.project.findFirst({
    where: { slug, members: { some: { userId: session.userId } } },
    select: { id: true, name: true },
  });
  if (!project) return { error: "Project not found." };
  if (confirmName !== project.name)
    return { error: "Project name does not match." };

  const res = await db.testCase.updateMany({
    where: { id: { in: ids }, projectId: project.id, deletedAt: null },
    data: { deletedAt: new Date() },
  });
  await logAudit({
    userId: session.userId,
    action: "case.bulk_delete",
    entityType: "project",
    entityId: project.id,
    detail: `${res.count} case(s) soft-deleted`,
  });
  revalidatePath(`/projects/${slug}`);
  return { ok: true, deleted: res.count };
}

// Move one or more cases into a suite/sub-suite, or unassign them (suiteId
// null) — used by the drag-and-drop on the project page, including a
// multi-selection drop. Only cases in a project the user belongs to are
// touched, and the target suite (if any) must live in that same project.
export async function moveCases(
  formData: FormData
): Promise<{ ok?: boolean; error?: string; moved?: number }> {
  const session = await requireSession();
  if (session.role === "VIEWER")
    return { error: "Viewers don't have write access." };

  const slug = String(formData.get("projectSlug"));
  const ids = formData.getAll("caseIds").map(String).filter(Boolean);
  const suiteId = String(formData.get("suiteId") ?? "") || null;
  if (!ids.length) return { error: "No test cases selected." };

  const project = await db.project.findFirst({
    where: { slug, members: { some: { userId: session.userId } } },
    select: { id: true },
  });
  if (!project) return { error: "Project not found." };

  // Guard against dropping into another project's suite.
  if (suiteId) {
    const suite = await db.testSuite.findFirst({
      where: { id: suiteId, projectId: project.id },
      select: { id: true },
    });
    if (!suite) return { error: "Target suite not found in this project." };
  }

  const res = await db.testCase.updateMany({
    where: { id: { in: ids }, projectId: project.id, deletedAt: null },
    data: { suiteId },
  });
  await logAudit({
    userId: session.userId,
    action: "case.move",
    entityType: "project",
    entityId: project.id,
    detail: `${res.count} case(s) → suite ${suiteId ?? "(none)"}`,
  });
  revalidatePath(`/projects/${slug}`);
  return { ok: true, moved: res.count };
}
