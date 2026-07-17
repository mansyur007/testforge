"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { logAudit } from "@/lib/audit";
import { createBaseline as buildBaseline } from "@/lib/baselines";

// F-28: suite baselines. Authored like cases — gated on `case.write` (it's a
// snapshot of case content, not an execution activity).

export async function createBaselineAction(formData: FormData): Promise<void> {
  const session = await requireSession();
  const projectId = String(formData.get("projectId"));
  if (!(await can(session.userId, projectId, "case.write"))) return;

  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;
  const suiteId = String(formData.get("suiteId") ?? "") || null;

  const project = await db.project.findUniqueOrThrow({
    where: { id: projectId },
    select: { slug: true },
  });

  const dup = await db.suiteBaseline.findUnique({
    where: { projectId_name: { projectId, name } },
  });
  if (dup) return; // idempotent — matches the requirements refId dup-skip pattern

  const result = await buildBaseline(projectId, name, suiteId, session.userId);
  if ("error" in result) return;

  await logAudit({
    userId: session.userId,
    action: "baseline.create",
    entityType: "baseline",
    entityId: result.id,
    detail: name,
  });
  redirect(`/projects/${project.slug}/baselines/${result.id}`);
}

export async function deleteBaseline(formData: FormData): Promise<void> {
  const session = await requireSession();
  const id = String(formData.get("baselineId"));
  const baseline = await db.suiteBaseline.findUnique({
    where: { id },
    include: { project: { select: { slug: true } } },
  });
  if (!baseline) return;
  if (!(await can(session.userId, baseline.projectId, "case.write"))) return;

  await db.suiteBaseline.delete({ where: { id } });
  await logAudit({
    userId: session.userId,
    action: "baseline.delete",
    entityType: "baseline",
    entityId: id,
    detail: baseline.name,
  });
  revalidatePath(`/projects/${baseline.project.slug}/baselines`);
  redirect(`/projects/${baseline.project.slug}/baselines`);
}
