"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { can } from "@/lib/permissions";
import { CASE_FORM_STATUSES } from "@/lib/constants";
import { applyTemplate } from "@/lib/templates/apply";
import { getTemplate } from "@/lib/templates/library";
import { defaultVariableValues } from "@/lib/templates/schema";

// F-47: applying a curated template into a project. Order per §0.2 —
// auth → RBAC → tenant guard → validate → mutate → audit → revalidate.

export async function applyTemplateAction(
  _prev: { error?: string } | undefined,
  formData: FormData,
): Promise<{ error?: string }> {
  const session = await requireSession();

  const projectSlug = String(formData.get("projectSlug") ?? "");
  const templateSlug = String(formData.get("templateSlug") ?? "");

  // Tenant guard: membership is what makes the project visible at all.
  const project = await db.project.findFirst({
    where: { slug: projectSlug, members: { some: { userId: session.userId } } },
    select: { id: true, slug: true },
  });
  if (!project) return { error: "Project not found." };

  // F-14: applying a template is bulk case creation, so it needs exactly the
  // permission creating a case by hand needs — nothing new.
  if (!(await can(session.userId, project.id, "case.write"))) {
    return { error: "You don't have permission to create test cases." };
  }

  const template = await getTemplate(templateSlug);
  if (!template) return { error: "Template not found." };

  // A target suite from another project is a 404-shaped refusal, not a 403:
  // the id names nothing this project can see.
  const targetSuiteId = String(formData.get("targetSuiteId") ?? "") || null;
  if (targetSuiteId) {
    const suite = await db.testSuite.findFirst({
      where: { id: targetSuiteId, projectId: project.id },
      select: { id: true },
    });
    if (!suite) return { error: "Target suite not found." };
  }

  const status = String(formData.get("status") ?? "DRAFT");
  if (!(CASE_FORM_STATUSES as readonly string[]).includes(status)) {
    return { error: "Invalid status for the created cases." };
  }

  const selection = {
    suiteKeys: formData.getAll("suiteKeys").map(String).filter(Boolean),
    caseKeys: formData.getAll("caseKeys").map(String).filter(Boolean),
  };
  if (selection.suiteKeys.length === 0 && selection.caseKeys.length === 0) {
    return { error: "Select at least one suite or test case to apply." };
  }

  // Unfilled variables fall back to their declared default, so a blank field
  // never leaves a literal {{VAR}} in the user's data.
  const variables = defaultVariableValues(template.content);
  for (const v of template.content.variables) {
    const submitted = String(formData.get(`var_${v.key}`) ?? "").trim();
    if (submitted) variables[v.key] = submitted;
  }

  const result = await applyTemplate({
    projectId: project.id,
    content: template.content,
    targetSuiteId,
    selection,
    variables,
    status,
    userId: session.userId,
  });

  if (result.suiteCount === 0) {
    return { error: "Select at least one suite or test case to apply." };
  }

  await db.templateApplication.create({
    data: {
      projectId: project.id,
      templateId: template.id,
      templateVersion: template.version,
      targetSuiteId,
      suiteCount: result.suiteCount,
      caseCount: result.caseCount,
      appliedById: session.userId,
    },
  });

  await logAudit({
    userId: session.userId,
    action: "template.apply",
    entityType: "template",
    entityId: template.id,
    detail: `${template.name} → ${project.slug} (${result.suiteCount} suites, ${result.caseCount} cases)`,
  });

  // No per-case `case.created` webhook. Bulk creation would fire one dispatch
  // per case — 34 for the Login pack, each re-querying the project's hooks —
  // and the CSV importer (src/lib/importers/commit.ts), the other bulk-create
  // path, already sets the precedent of audit-only. Noted as a deliberate
  // deviation from DoD §1.4.

  // The cases list is the project page itself — `/projects/<slug>/cases` holds
  // only `new`, `[caseId]` and `shared-steps`, with no index route, so sending
  // the user there after a successful apply lands them on a 404.
  revalidatePath(`/projects/${project.slug}`);
  revalidatePath(`/projects/${project.slug}/templates`);
  redirect(
    `/projects/${project.slug}?suite=${result.rootSuiteId ?? ""}&applied=${result.caseCount}`,
  );
}
