"use server";

import { redirect, notFound } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { isProjectMember } from "@/lib/projects";
import { logAudit } from "@/lib/audit";
import { dispatchWebhook } from "@/lib/webhooks";
import { notify, notifyBaseUrl } from "@/lib/notifications";
import { serializeRun } from "@/lib/api";
import { buildResultSeeds } from "@/lib/datasets";
import { loadCaseRevs } from "@/lib/case-revisions";
import { loadStatusDefs } from "@/lib/result-status-defs";
import { statusMeta } from "@/lib/result-statuses";
import { can } from "@/lib/permissions";
import { saveResult } from "@/lib/save-result";
import { collectCustomFromForm } from "@/lib/custom-fields";

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

  const projectId = String(formData.get("projectId"));
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const milestoneId = String(formData.get("milestoneId") ?? "") || null;
  const environmentId = String(formData.get("environmentId") ?? "") || null; // F-19
  const baselineId = String(formData.get("baselineId") ?? "") || null; // F-28
  const caseIds = formData.getAll("caseIds").map(String);

  if (!name) return { error: "Test run name is required." };
  if (!caseIds.length) return { error: "Select at least one test case." };
  if (!(await isProjectMember(session.userId, projectId)))
    return { error: "Project not found." };
  // F-14: permission, not role name — covers custom roles too.
  if (!(await can(session.userId, projectId, "run.manage")))
    return { error: "You don't have permission to create runs." };
  if (environmentId) {
    const env = await db.environment.findFirst({
      where: { id: environmentId, projectId },
      select: { id: true },
    });
    if (!env) return { error: "Environment not found in this project." };
  }

  // F-28: pin caseRev to what the baseline captured, not the current rev.
  let revOverride: Map<string, number> | undefined;
  if (baselineId) {
    const baseline = await db.suiteBaseline.findFirst({
      where: { id: baselineId, projectId },
      include: { entries: { where: { caseId: { in: caseIds } } } },
    });
    if (!baseline) return { error: "Baseline not found in this project." };
    revOverride = new Map(baseline.entries.map((e) => [e.caseId, e.caseRev]));
  }

  const project = await db.project.findUniqueOrThrow({ where: { id: projectId } });

  // F-05: remember which revision of each case this run executes.
  // F-13: cases with dataset rows seed one result per row instead of one.
  const seeds = await buildResultSeeds(caseIds, revOverride);
  const run = await db.testRun.create({
    data: {
      projectId,
      name,
      description: description || null,
      milestoneId,
      environmentId,
      baselineId,
      createdById: session.userId,
      results: { create: seeds },
    },
  });

  await logAudit({
    userId: session.userId,
    action: "run.create",
    entityType: "run",
    entityId: run.id,
    detail: `${name} (${caseIds.length} cases)`,
  });
  await dispatchWebhook(projectId, "run.created", serializeRun(run));
  await notify(projectId, "run.created", {
    title: `Run created: ${name}`,
    url: `${notifyBaseUrl()}/projects/${project.slug}/runs/${run.id}`,
    fields: [
      { label: "Project", value: project.name },
      { label: "Cases", value: String(caseIds.length) },
    ],
  });
  redirect(`/projects/${project.slug}/runs/${run.id}`);
}

// F-36 Part C: thin FormData adapter over saveResult (the shared write path).
// Custom fields are collected here because that's form-shape-specific; the
// membership/permission/status/validation/side-effect logic all lives in
// saveResult so the offline JSON route and this action never drift.
export async function submitResult(formData: FormData) {
  const session = await requireSession();
  const resultId = String(formData.get("resultId"));
  const projectId = await db.testRunResult
    .findFirst({
      where: {
        id: resultId,
        run: { project: { members: { some: { userId: session.userId } } } },
      },
      select: { run: { select: { projectId: true } } },
    })
    .then((r) => r?.run.projectId);

  let custom: Record<string, unknown> | undefined;
  if (projectId) {
    const defs = await db.customFieldDef.findMany({
      where: { projectId, entity: "RESULT" },
      orderBy: { order: "asc" },
    });
    if (defs.length > 0) custom = collectCustomFromForm(defs, formData);
  }

  const elapsed = parseInt(String(formData.get("elapsedSeconds") ?? ""), 10);
  const outcome = await saveResult(session.userId, session.name, resultId, {
    status: String(formData.get("status")),
    comment: String(formData.get("comment") ?? ""),
    defectUrl: String(formData.get("defectUrl") ?? ""),
    elapsedSeconds: Number.isFinite(elapsed) ? elapsed : null,
    custom,
  });
  // Preserve today's behavior: a missing/foreign result 404s; permission and
  // invalid-status failures fail silently-safe (the executor is rapid-fire).
  if (!outcome.ok && outcome.reason === "not-found") notFound();
}

export async function completeRun(formData: FormData) {
  const session = await requireSession();
  const runId = String(formData.get("runId"));
  await assertRunAccess(session.userId, runId);
  // F-14: closing a run is run management.
  const target = await db.testRun.findUniqueOrThrow({
    where: { id: runId },
    select: { projectId: true },
  });
  if (!(await can(session.userId, target.projectId, "run.manage"))) return;
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
  const counts = await db.testRunResult.groupBy({
    by: ["status"],
    where: { runId },
    _count: true,
  });
  // F-14: tally by kind so custom statuses land in the right bucket.
  const { kindOf } = statusMeta(await loadStatusDefs(run.projectId));
  const byKind = (kind: string) =>
    counts.reduce((n, c) => (kindOf(c.status) === kind ? n + c._count : n), 0);
  const failed = byKind("FAIL");
  await notify(run.projectId, "run.completed", {
    title: `Run completed: ${run.name}`,
    url: `${notifyBaseUrl()}/projects/${run.project.slug}/runs/${runId}`,
    tone: failed > 0 ? "bad" : "good",
    fields: [
      { label: "Passed", value: String(byKind("PASS")) },
      { label: "Failed", value: String(failed) },
      {
        label: "Total",
        value: String(counts.reduce((n, c) => n + c._count, 0)),
      },
    ],
  });
  revalidatePath(`/projects/${run.project.slug}/runs/${runId}`);
}

// Gap audit: "rerun failed only" tidak ada di PRD — fitur standar industri,
// buat run baru hanya berisi case berstatus FAILED/BLOCKED/RETEST.
export async function rerunFailed(formData: FormData) {
  const session = await requireSession();
  const runId = String(formData.get("runId"));
  const scoped = await db.testRun.findFirst({
    where: {
      id: runId,
      project: { members: { some: { userId: session.userId } } },
    },
    select: { projectId: true },
  });
  if (!scoped) notFound();
  // F-14: creating the rerun is run management.
  if (!(await can(session.userId, scoped.projectId, "run.manage"))) return;

  // F-14: "failure-ish" = any FAIL/BLOCKED-kind status (custom ones included),
  // plus the system RETEST key — the one key-based rule this flow keeps.
  const defs = await loadStatusDefs(scoped.projectId);
  const rerunKeys = defs
    .filter((d) => ["FAIL", "BLOCKED"].includes(d.kind) || d.key === "RETEST")
    .map((d) => d.key);

  const run = await db.testRun.findFirst({
    where: { id: runId },
    include: {
      project: true,
      results: { where: { status: { in: rerunKeys } } },
    },
  });
  if (!run) notFound();
  if (!run.results.length) return;

  // F-05: the rerun executes the cases as they are NOW, not at the old run's rev.
  const revs = await loadCaseRevs(run.results.map((r) => r.caseId));
  const newRun = await db.testRun.create({
    data: {
      projectId: run.projectId,
      name: `${run.name} — Rerun Failed`,
      description: `Automatic rerun of "${run.name}" (${run.results.length} failed/blocked/retest cases).`,
      createdById: session.userId,
      // F-13: preserve which dataset row each rerun result belongs to.
      results: {
        create: run.results.map((r) => ({
          caseId: r.caseId,
          caseRev: revs.get(r.caseId),
          datasetName: r.datasetName,
        })),
      },
    },
  });

  await logAudit({
    userId: session.userId,
    action: "run.rerun_failed",
    entityType: "run",
    entityId: newRun.id,
  });
  await dispatchWebhook(run.projectId, "run.created", serializeRun(newRun));
  await notify(run.projectId, "run.created", {
    title: `Run created: ${newRun.name}`,
    url: `${notifyBaseUrl()}/projects/${run.project.slug}/runs/${newRun.id}`,
    fields: [
      { label: "Project", value: run.project.name },
      { label: "Cases", value: String(run.results.length) },
    ],
  });
  redirect(`/projects/${run.project.slug}/runs/${newRun.id}`);
}
