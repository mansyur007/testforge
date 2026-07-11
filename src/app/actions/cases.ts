"use server";

import { redirect, notFound } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { isProjectMember } from "@/lib/projects";
import { logAudit } from "@/lib/audit";
import { recordRevision, type CaseSnapshot } from "@/lib/case-revisions";
import { dispatchWebhook } from "@/lib/webhooks";
import { notify, notifyBaseUrl } from "@/lib/notifications";
import { serializeCase } from "@/lib/api";
import { expandSteps, loadStepGroups } from "@/lib/steps";
import { saveAttachment } from "@/lib/attachments";
import { getStorage } from "@/lib/storage";
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
    datasetJson: readDatasetJson(formData),
  };
}

// F-13: parses & sanitizes the dataset rows submitted by CaseForm.
function readDatasetJson(formData: FormData): string {
  let datasets: { name: string; values: Record<string, string> }[] = [];
  try {
    const parsed = JSON.parse(String(formData.get("datasetJson") ?? "[]"));
    if (Array.isArray(parsed)) {
      datasets = parsed
        .filter((d) => d && typeof d.name === "string" && d.name.trim())
        .map((d) => ({ name: String(d.name).trim(), values: d.values ?? {} }));
    }
  } catch {
    datasets = [];
  }
  return JSON.stringify(datasets);
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

  await recordRevision(testCase.id, session.userId); // F-05: rev 1 "created"
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

  await recordRevision(caseId, session.userId); // F-05: no-op edits write nothing
  await logAudit({
    userId: session.userId,
    action: "case.update",
    entityType: "case",
    entityId: caseId,
    detail: fields.title,
  });
  redirect(`/projects/${testCase.project.slug}/cases/${caseId}`);
}

// F-21: mute/quarantine — exclude a case from pass-rate math everywhere
// without hiding its results. Reason is required so quarantine has a paper
// trail; unmute needs none.
export async function muteCase(formData: FormData) {
  const session = await requireSession();
  if (session.role === "VIEWER") return;
  const caseId = String(formData.get("caseId"));
  const reason = String(formData.get("reason") ?? "").trim();
  if (!reason) return;
  await assertCaseAccess(session.userId, caseId);

  const testCase = await db.testCase.update({
    where: { id: caseId },
    data: { mutedAt: new Date(), mutedReason: reason, mutedById: session.userId },
    include: { project: true },
  });
  await logAudit({
    userId: session.userId,
    action: "case.mute",
    entityType: "case",
    entityId: caseId,
    detail: reason,
  });
  revalidatePath(`/projects/${testCase.project.slug}/reports`);
  revalidatePath(`/projects/${testCase.project.slug}/cases/${caseId}`);
}

export async function unmuteCase(formData: FormData) {
  const session = await requireSession();
  if (session.role === "VIEWER") return;
  const caseId = String(formData.get("caseId"));
  await assertCaseAccess(session.userId, caseId);

  const testCase = await db.testCase.update({
    where: { id: caseId },
    data: { mutedAt: null, mutedReason: null, mutedById: null },
    include: { project: true },
  });
  await logAudit({
    userId: session.userId,
    action: "case.unmute",
    entityType: "case",
    entityId: caseId,
  });
  revalidatePath(`/projects/${testCase.project.slug}/reports`);
  revalidatePath(`/projects/${testCase.project.slug}/cases/${caseId}`);
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
      datasetJson: original.datasetJson,
    },
  });

  await recordRevision(copy.id, session.userId); // F-05: the copy starts its own history
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

  // Resolve the accessible ids first — F-05 records one revision per case.
  const owned = await db.testCase.findMany({
    where: {
      id: { in: ids },
      project: { members: { some: { userId: session.userId } } },
    },
    select: { id: true },
  });
  await db.testCase.updateMany({
    where: { id: { in: owned.map((c) => c.id) } },
    data: { [field]: value },
  });
  for (const c of owned) await recordRevision(c.id, session.userId);
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

// F-05: write a revision's snapshot fields back onto the case. History is
// append-only — restoring records a NEW revision ("restored from rev N"),
// never rewrites old ones. Snapshot steps are stored expanded, so a restore
// flattens any shared-step references into plain inline steps.
export async function restoreRevision(
  _prev: { error?: string } | undefined,
  formData: FormData
): Promise<{ error?: string } | undefined> {
  const session = await requireSession();
  if (session.role === "VIEWER") return { error: "Viewers don't have write access." };

  const revisionId = String(formData.get("revisionId"));
  const revision = await db.testCaseRevision.findFirst({
    where: {
      id: revisionId,
      testCase: { project: { members: { some: { userId: session.userId } } } },
    },
    include: { testCase: { select: { id: true, projectId: true } } },
  });
  if (!revision) notFound();

  let snapshot: CaseSnapshot;
  try {
    snapshot = JSON.parse(revision.snapshotJson);
  } catch {
    return { error: "This revision's snapshot is unreadable." };
  }

  const { projectId } = revision.testCase;
  // The referenced suite/assignee may be gone by now — drop rather than fail.
  const suite = snapshot.suiteId
    ? await db.testSuite.findFirst({
        where: { id: snapshot.suiteId, projectId },
        select: { id: true },
      })
    : null;
  const assignee = snapshot.assigneeId
    ? await db.projectMember.findFirst({
        where: { projectId, userId: snapshot.assigneeId },
        select: { userId: true },
      })
    : null;

  const updated = await db.testCase.update({
    where: { id: revision.caseId },
    data: {
      title: snapshot.title,
      description: snapshot.description,
      preconditions: snapshot.preconditions,
      stepsJson: JSON.stringify(
        snapshot.steps.map((s) => ({ action: s.action, expected: s.expected }))
      ),
      expectedResult: snapshot.expectedResult,
      priority: snapshot.priority,
      type: snapshot.type,
      status: snapshot.status,
      automationStatus: snapshot.automationStatus,
      tags: snapshot.tags,
      suiteId: suite?.id ?? null,
      assigneeId: assignee?.userId ?? null,
      linkedIssues: snapshot.linkedIssues,
      customJson: JSON.stringify(snapshot.custom ?? {}),
    },
    include: { project: true },
  });

  await recordRevision(
    revision.caseId,
    session.userId,
    `restored from rev ${revision.rev}`
  );
  await logAudit({
    userId: session.userId,
    action: "case.restore_revision",
    entityType: "case",
    entityId: revision.caseId,
    detail: `rev ${revision.rev}`,
  });
  await dispatchWebhook(
    projectId,
    "case.updated",
    serializeCase(updated.project.slug, updated)
  );
  await notify(projectId, "case.updated", {
    title: `Case updated: ${updated.title}`,
    url: `${notifyBaseUrl()}/projects/${updated.project.slug}/cases/${revision.caseId}`,
    fields: [{ label: "Changed", value: `restored from rev ${revision.rev}` }],
  });
  revalidatePath(
    `/projects/${updated.project.slug}/cases/${revision.caseId}`
  );
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

// F-24: persist a new relative order for a set of cases after a drag-and-drop
// reorder in the table. `caseIds` arrives already in its final order — every
// id gets order = its index (× 10, leaving room for a future insert-between
// optimization) so the list's default sort (order, seq) matches what was dropped.
export async function reorderCases(
  formData: FormData
): Promise<{ ok?: boolean; error?: string }> {
  const session = await requireSession();
  if (session.role === "VIEWER")
    return { error: "Viewers don't have write access." };

  const slug = String(formData.get("projectSlug"));
  const ids = formData.getAll("caseIds").map(String).filter(Boolean);
  if (ids.length < 2) return { error: "Nothing to reorder." };

  const project = await db.project.findFirst({
    where: { slug, members: { some: { userId: session.userId } } },
    select: { id: true },
  });
  if (!project) return { error: "Project not found." };

  const owned = await db.testCase.findMany({
    where: { id: { in: ids }, projectId: project.id, deletedAt: null },
    select: { id: true },
  });
  const ownedIds = new Set(owned.map((c) => c.id));
  const ordered = ids.filter((id) => ownedIds.has(id));

  await db.$transaction(
    ordered.map((id, index) =>
      db.testCase.update({ where: { id }, data: { order: index * 10 } })
    )
  );
  revalidatePath(`/projects/${slug}`);
  return { ok: true };
}

// F-24: duplicate cases into another project the user is a member of (with
// write access in both). Copies get a fresh seq in the target project;
// attachments are duplicated as genuinely new files (not shared storage rows,
// since dedupe is scoped per-project); shared-step references are flattened
// to inline steps, since SharedStepGroup is project-scoped and wouldn't
// resolve in the target project. Copies start as DRAFT, same as same-project
// clone, so the receiving team reviews before activating.
export async function copyCasesToProject(
  formData: FormData
): Promise<{ ok?: boolean; error?: string; copied?: number; targetSlug?: string }> {
  const session = await requireSession();
  if (session.role === "VIEWER")
    return { error: "Viewers don't have write access." };

  const slug = String(formData.get("projectSlug"));
  const targetProjectId = String(formData.get("targetProjectId") ?? "");
  const ids = formData.getAll("caseIds").map(String).filter(Boolean);
  if (!ids.length) return { error: "No test cases selected." };
  if (!targetProjectId) return { error: "Choose a target project." };

  const project = await db.project.findFirst({
    where: { slug, members: { some: { userId: session.userId } } },
    select: { id: true },
  });
  if (!project) return { error: "Project not found." };
  if (targetProjectId === project.id)
    return { error: "Choose a different project to copy into." };

  const targetMembership = await db.projectMember.findUnique({
    where: { projectId_userId: { projectId: targetProjectId, userId: session.userId } },
    select: { role: true, project: { select: { slug: true } } },
  });
  if (!targetMembership) return { error: "Target project not found." };
  if (targetMembership.role === "VIEWER")
    return { error: "You don't have write access to the target project." };

  const originals = await db.testCase.findMany({
    where: { id: { in: ids }, projectId: project.id, deletedAt: null },
  });
  if (!originals.length) return { error: "No test cases selected." };

  const groups = await loadStepGroups(project.id);
  let copiedCount = 0;

  for (const original of originals) {
    const flattened = expandSteps(JSON.parse(original.stepsJson || "[]"), groups).map(
      (s) => ({ action: s.action, expected: s.expected })
    );

    const targetProject = await db.project.update({
      where: { id: targetProjectId },
      data: { caseCounter: { increment: 1 } },
    });

    const copy = await db.testCase.create({
      data: {
        projectId: targetProjectId,
        seq: targetProject.caseCounter,
        title: original.title,
        description: original.description,
        preconditions: original.preconditions,
        stepsJson: JSON.stringify(flattened),
        expectedResult: original.expectedResult,
        priority: original.priority,
        type: original.type,
        status: "DRAFT",
        automationStatus: original.automationStatus,
        tags: original.tags,
        customJson: original.customJson,
        datasetJson: original.datasetJson,
      },
    });

    const attachments = await db.attachment.findMany({
      where: { projectId: project.id, entityType: "CASE", entityId: original.id },
    });
    for (const att of attachments) {
      const data = await getStorage().get(att.storageKey);
      await saveAttachment({
        projectId: targetProjectId,
        uploaderId: session.userId,
        entityType: "CASE",
        entityId: copy.id,
        filename: att.filename,
        mimeType: att.mimeType,
        data,
      });
    }

    await recordRevision(copy.id, session.userId); // rev 1 "created"
    copiedCount++;
  }

  await logAudit({
    userId: session.userId,
    action: "case.copy",
    entityType: "project",
    entityId: project.id,
    detail: `${copiedCount} case(s) → project ${targetMembership.project.slug}`,
  });
  revalidatePath(`/projects/${slug}`);
  return { ok: true, copied: copiedCount, targetSlug: targetMembership.project.slug };
}
