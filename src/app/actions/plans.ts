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
import { loadCaseRevs } from "@/lib/case-revisions";
import {
  buildCombinations,
  configLabel,
  serializePlan,
  MAX_COMBINATIONS,
} from "@/lib/plans";
import { can } from "@/lib/permissions";

// F-06: test plans. createPlan turns one case selection × a configuration
// matrix into a plan plus one child run per combination. Standalone runs
// (createRun) are untouched by any of this.

export async function createPlan(
  _prev: { error?: string } | undefined,
  formData: FormData
) {
  const session = await requireSession();

  const projectId = String(formData.get("projectId"));
  // F-14: plans create & manage runs.
  if (!(await can(session.userId, projectId, "run.manage")))
    return { error: "You don't have permission to create plans." };
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim() || null;
  const milestoneId = String(formData.get("milestoneId") ?? "") || null;
  const caseIds = formData.getAll("caseIds").map(String);
  const optionIds = formData.getAll("options").map(String);

  if (!name) return { error: "Plan name is required." };
  if (!caseIds.length) return { error: "Select at least one test case." };
  if (!(await isProjectMember(session.userId, projectId)))
    return { error: "Project not found." };

  const project = await db.project.findUniqueOrThrow({ where: { id: projectId } });

  if (milestoneId) {
    const ms = await db.milestone.findFirst({
      where: { id: milestoneId, projectId },
      select: { id: true },
    });
    if (!ms) return { error: "Milestone not found in this project." };
  }

  // Only live cases from THIS project make it into the runs.
  const cases = await db.testCase.findMany({
    where: { id: { in: caseIds }, projectId, deletedAt: null },
    select: { id: true },
  });
  if (cases.length !== caseIds.length)
    return { error: "Some selected cases no longer exist in this project." };

  // Resolve the picked options into ordered axes. Scoping the query by
  // projectId means a foreign option id is silently dropped rather than
  // leaking another project's config names into this plan.
  const groups = await db.configGroup.findMany({
    where: { projectId, options: { some: { id: { in: optionIds } } } },
    orderBy: { order: "asc" },
    include: {
      options: {
        where: { id: { in: optionIds } },
        orderBy: { order: "asc" },
      },
    },
  });
  const combos = buildCombinations(
    groups.map((g) => ({ name: g.name, options: g.options.map((o) => o.name) }))
  );
  if (combos.length > MAX_COMBINATIONS)
    return {
      error: `${combos.length} combinations exceed the limit of ${MAX_COMBINATIONS}. Deselect some options.`,
    };

  // F-05: every generated result remembers the case revision it will execute.
  const revs = await loadCaseRevs(caseIds);
  const resultRows = caseIds.map((caseId) => ({
    caseId,
    caseRev: revs.get(caseId),
  }));

  // Plan + all child runs land atomically — a half-created matrix would be
  // worse than none.
  const plan = await db.$transaction(async (tx) => {
    const created = await tx.testPlan.create({
      data: { projectId, name, description, milestoneId, createdById: session.userId },
    });
    for (const combo of combos) {
      const label = configLabel(combo);
      await tx.testRun.create({
        data: {
          projectId,
          planId: created.id,
          name: label ? `${name} — ${label}` : name,
          milestoneId,
          configJson: label ? JSON.stringify(combo) : null,
          createdById: session.userId,
          results: { create: resultRows },
        },
      });
    }
    return created;
  });

  await logAudit({
    userId: session.userId,
    action: "plan.create",
    entityType: "plan",
    entityId: plan.id,
    detail: `${name} (${combos.length} run × ${caseIds.length} cases)`,
  });
  const runs = await db.testRun.findMany({ where: { planId: plan.id } });
  // One plan.created event carries the child runs — not N× run.created, which
  // would just be noise for a batch birth.
  await dispatchWebhook(projectId, "plan.created", serializePlan(plan, runs));
  await notify(projectId, "plan.created", {
    title: `Plan created: ${name}`,
    url: `${notifyBaseUrl()}/projects/${project.slug}/plans/${plan.id}`,
    fields: [
      { label: "Runs", value: String(combos.length) },
      { label: "Cases per run", value: String(caseIds.length) },
    ],
  });
  redirect(`/projects/${project.slug}/plans/${plan.id}`);
}

// Complete every ACTIVE child run, then the plan itself. Already-completed
// runs keep their original completedAt.
export async function completePlan(formData: FormData) {
  const session = await requireSession();

  const planId = String(formData.get("planId"));
  const plan = await db.testPlan.findFirst({
    where: {
      id: planId,
      project: { members: { some: { userId: session.userId } } },
    },
    include: { project: true, runs: { where: { status: "ACTIVE" } } },
  });
  if (plan && !(await can(session.userId, plan.projectId, "run.manage"))) return; // F-14
  if (!plan) notFound();
  if (plan.status === "COMPLETED") return;

  const now = new Date();
  await db.$transaction([
    db.testRun.updateMany({
      where: { planId, status: "ACTIVE" },
      data: { status: "COMPLETED", completedAt: now },
    }),
    db.testPlan.update({
      where: { id: planId },
      data: { status: "COMPLETED", completedAt: now },
    }),
  ]);

  await logAudit({
    userId: session.userId,
    action: "plan.complete",
    entityType: "plan",
    entityId: planId,
    detail: `${plan.name} (${plan.runs.length} run completed)`,
  });
  // External systems tracking runs get their per-run events; humans get one
  // plan-level message instead of N near-identical ones.
  for (const run of plan.runs) {
    await dispatchWebhook(
      plan.projectId,
      "run.completed",
      serializeRun({ ...run, status: "COMPLETED", completedAt: now })
    );
  }
  const fresh = await db.testPlan.findUniqueOrThrow({ where: { id: planId } });
  await dispatchWebhook(plan.projectId, "plan.completed", serializePlan(fresh));
  await notify(plan.projectId, "plan.completed", {
    title: `Plan completed: ${plan.name}`,
    url: `${notifyBaseUrl()}/projects/${plan.project.slug}/plans/${planId}`,
    tone: "good",
    fields: [{ label: "Runs closed", value: String(plan.runs.length) }],
  });
  revalidatePath(`/projects/${plan.project.slug}/plans/${planId}`);
}
