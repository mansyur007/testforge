"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { logAudit } from "@/lib/audit";
import { wouldCreateCycle } from "@/lib/case-dependencies";

// F-32: case dependencies — authored like cases, gated on `case.write`.

type ActionResult = { error?: string; ok?: boolean } | undefined;

export async function addDependency(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const session = await requireSession();
  const caseId = String(formData.get("caseId"));
  const dependsOnCaseId = String(formData.get("dependsOnCaseId") ?? "");
  if (!dependsOnCaseId) return { error: "Pick a prerequisite case." };
  if (dependsOnCaseId === caseId) return { error: "A case cannot depend on itself." };

  const testCase = await db.testCase.findFirst({
    where: { id: caseId, project: { members: { some: { userId: session.userId } } } },
    include: { project: { select: { id: true, slug: true } } },
  });
  if (!testCase) return { error: "Case not found." };
  if (!(await can(session.userId, testCase.projectId, "case.write")))
    return { error: "You don't have permission to edit test cases." };

  const prereq = await db.testCase.findFirst({
    where: { id: dependsOnCaseId, projectId: testCase.projectId, deletedAt: null },
    select: { id: true },
  });
  if (!prereq) return { error: "That case is not live in this project." };

  if (await wouldCreateCycle(caseId, dependsOnCaseId))
    return { error: "That would create a dependency cycle." };

  await db.caseDependency.upsert({
    where: { caseId_dependsOnCaseId: { caseId, dependsOnCaseId } },
    create: { caseId, dependsOnCaseId },
    update: {},
  });
  await logAudit({
    userId: session.userId,
    action: "case_dependency.add",
    entityType: "case",
    entityId: caseId,
    detail: `depends on ${dependsOnCaseId}`,
  });
  revalidatePath(`/projects/${testCase.project.slug}/cases/${caseId}`);
  return { ok: true };
}

export async function removeDependency(formData: FormData): Promise<void> {
  const session = await requireSession();
  const linkId = String(formData.get("linkId"));
  const link = await db.caseDependency.findFirst({
    where: { id: linkId, case: { project: { members: { some: { userId: session.userId } } } } },
    include: { case: { include: { project: { select: { slug: true } } } } },
  });
  if (!link) return;
  if (!(await can(session.userId, link.case.projectId, "case.write"))) return;

  await db.caseDependency.delete({ where: { id: linkId } });
  await logAudit({
    userId: session.userId,
    action: "case_dependency.remove",
    entityType: "case",
    entityId: link.caseId,
    detail: `no longer depends on ${link.dependsOnCaseId}`,
  });
  revalidatePath(`/projects/${link.case.project.slug}/cases/${link.caseId}`);
}
