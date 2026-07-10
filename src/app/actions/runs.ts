"use server";

import { redirect, notFound } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { isProjectMember } from "@/lib/projects";
import { logAudit } from "@/lib/audit";
import { dispatchWebhook } from "@/lib/webhooks";
import { serializeRun } from "@/lib/api";
import {
  collectCustomFromForm,
  mergeCustomJson,
  validateCustomValues,
} from "@/lib/custom-fields";

// Tenant guard for run-level mutations: the run must belong to a project the
// user is a member of.
async function assertRunAccess(userId: string, runId: string) {
  const owned = await db.testRun.findFirst({
    where: { id: runId, project: { members: { some: { userId } } } },
    select: { id: true },
  });
  if (!owned) notFound();
}

export async function createRun(
  _prev: { error?: string } | undefined,
  formData: FormData
) {
  const session = await requireSession();
  if (session.role === "VIEWER") return { error: "Viewers don't have write access." };

  const projectId = String(formData.get("projectId"));
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const milestoneId = String(formData.get("milestoneId") ?? "") || null;
  const caseIds = formData.getAll("caseIds").map(String);

  if (!name) return { error: "Test run name is required." };
  if (!caseIds.length) return { error: "Select at least one test case." };
  if (!(await isProjectMember(session.userId, projectId)))
    return { error: "Project not found." };

  const project = await db.project.findUniqueOrThrow({ where: { id: projectId } });

  const run = await db.testRun.create({
    data: {
      projectId,
      name,
      description: description || null,
      milestoneId,
      createdById: session.userId,
      results: {
        create: caseIds.map((caseId) => ({ caseId })),
      },
    },
  });

  await logAudit({
    userId: session.userId,
    action: "run.create",
    entityType: "run",
    entityId: run.id,
    detail: `${name} (${caseIds.length} cases)`,
  });
  redirect(`/projects/${project.slug}/runs/${run.id}`);
}

export async function submitResult(formData: FormData) {
  const session = await requireSession();
  const resultId = String(formData.get("resultId"));
  const status = String(formData.get("status"));
  const comment = String(formData.get("comment") ?? "").trim() || null;
  const defectUrl = String(formData.get("defectUrl") ?? "").trim() || null;
  const elapsed = parseInt(String(formData.get("elapsedSeconds") ?? ""), 10);

  const owned = await db.testRunResult.findFirst({
    where: {
      id: resultId,
      run: { project: { members: { some: { userId: session.userId } } } },
    },
    select: { id: true, customJson: true, run: { select: { projectId: true } } },
  });
  if (!owned) notFound();

  // F-03: validate RESULT custom fields; invalid values fail silently-safe
  // (result still recorded, custom left unchanged) — the executor is a
  // rapid-fire flow, blocking a P/F submit on a side field would be worse.
  let customJson = owned.customJson;
  const defs = await db.customFieldDef.findMany({
    where: { projectId: owned.run.projectId, entity: "RESULT" },
    orderBy: { order: "asc" },
  });
  if (defs.length > 0) {
    const members = await db.projectMember.findMany({
      where: { projectId: owned.run.projectId },
      select: { userId: true },
    });
    const check = validateCustomValues(
      defs,
      collectCustomFromForm(defs, formData),
      new Set(members.map((m) => m.userId))
    );
    if (check.ok) customJson = mergeCustomJson(owned.customJson, defs, check.values);
  }

  const result = await db.testRunResult.update({
    where: { id: resultId },
    data: {
      status,
      comment,
      defectUrl,
      customJson,
      assigneeId: session.userId,
      elapsedSeconds: Number.isFinite(elapsed) ? elapsed : undefined,
    },
    include: { run: { include: { project: true } } },
  });

  await logAudit({
    userId: session.userId,
    action: "result.submit",
    entityType: "result",
    entityId: resultId,
    detail: status,
  });
  revalidatePath(
    `/projects/${result.run.project.slug}/runs/${result.runId}`
  );
}

export async function completeRun(formData: FormData) {
  const session = await requireSession();
  const runId = String(formData.get("runId"));
  await assertRunAccess(session.userId, runId);
  const run = await db.testRun.update({
    where: { id: runId },
    data: { status: "COMPLETED", completedAt: new Date() },
    include: { project: true },
  });
  await logAudit({
    userId: session.userId,
    action: "run.complete",
    entityType: "run",
    entityId: runId,
  });
  await dispatchWebhook(run.projectId, "run.completed", serializeRun(run));
  revalidatePath(`/projects/${run.project.slug}/runs/${runId}`);
}

// Gap audit: "rerun failed only" tidak ada di PRD — fitur standar industri,
// buat run baru hanya berisi case berstatus FAILED/BLOCKED/RETEST.
export async function rerunFailed(formData: FormData) {
  const session = await requireSession();
  const runId = String(formData.get("runId"));
  const run = await db.testRun.findFirst({
    where: {
      id: runId,
      project: { members: { some: { userId: session.userId } } },
    },
    include: {
      project: true,
      results: { where: { status: { in: ["FAILED", "BLOCKED", "RETEST"] } } },
    },
  });
  if (!run) notFound();
  if (!run.results.length) return;

  const newRun = await db.testRun.create({
    data: {
      projectId: run.projectId,
      name: `${run.name} — Rerun Failed`,
      description: `Automatic rerun of "${run.name}" (${run.results.length} failed/blocked/retest cases).`,
      createdById: session.userId,
      results: {
        create: run.results.map((r) => ({ caseId: r.caseId })),
      },
    },
  });

  await logAudit({
    userId: session.userId,
    action: "run.rerun_failed",
    entityType: "run",
    entityId: newRun.id,
  });
  redirect(`/projects/${run.project.slug}/runs/${newRun.id}`);
}
