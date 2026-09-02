import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import { guard, notFoundError, requirePerm, validationError } from "@/lib/api";
import { CASE_FORM_STATUSES } from "@/lib/constants";
import { applyTemplate, selectAll } from "@/lib/templates/apply";
import { getTemplate } from "@/lib/templates/library";
import { defaultVariableValues } from "@/lib/templates/schema";

// F-47 REST API v1: apply a template into a project.
//
// Body (every field optional except none):
//   targetSuiteId: string | null   — null/absent = project root
//   selection: { suiteKeys: string[], caseKeys: string[] }  — absent = everything
//   variables: { KEY: "value" }    — absent keys fall back to their default
//   status: "DRAFT" | "ACTIVE" | "DEPRECATED"  — default DRAFT
export async function POST(
  req: NextRequest,
  { params }: { params: { slug: string; templateSlug: string } },
) {
  const g = await guard(req, { write: true });
  if (g instanceof NextResponse) return g;

  const project = await db.project.findFirst({
    where: { slug: params.slug, members: { some: { userId: g.userId } } },
    select: { id: true, slug: true },
  });
  if (!project) return notFoundError("Project not found");
  const denied = await requirePerm(g.userId, project.id, "case.write"); // F-14
  if (denied) return denied;

  const template = await getTemplate(params.templateSlug);
  if (!template) return notFoundError("Template not found");

  // An absent body is a valid "apply all of it to the root", so only a present
  // but unparseable body is an error.
  const raw = await req.text();
  let body: Record<string, unknown> = {};
  if (raw.trim()) {
    try {
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
        return validationError([{ field: "body", message: "Expected a JSON object" }]);
      }
      body = parsed as Record<string, unknown>;
    } catch {
      return validationError([{ field: "body", message: "Invalid JSON body" }]);
    }
  }

  const targetSuiteId = body.targetSuiteId ? String(body.targetSuiteId) : null;
  if (targetSuiteId) {
    const suite = await db.testSuite.findFirst({
      where: { id: targetSuiteId, projectId: project.id },
      select: { id: true },
    });
    if (!suite) {
      return validationError([
        { field: "targetSuiteId", message: "not found in this project" },
      ]);
    }
  }

  const status = body.status ? String(body.status) : "DRAFT";
  if (!(CASE_FORM_STATUSES as readonly string[]).includes(status)) {
    return validationError([
      { field: "status", message: `must be one of ${CASE_FORM_STATUSES.join(", ")}` },
    ]);
  }

  const asKeys = (v: unknown): string[] =>
    Array.isArray(v) ? v.filter((x) => typeof x === "string") : [];
  const sel = body.selection as { suiteKeys?: unknown; caseKeys?: unknown } | undefined;
  const selection = sel
    ? { suiteKeys: asKeys(sel.suiteKeys), caseKeys: asKeys(sel.caseKeys) }
    : selectAll(template.content);
  if (selection.suiteKeys.length === 0 && selection.caseKeys.length === 0) {
    return validationError([
      { field: "selection", message: "select at least one suite or case" },
    ]);
  }

  const variables = defaultVariableValues(template.content);
  if (body.variables && typeof body.variables === "object") {
    for (const [k, v] of Object.entries(body.variables as Record<string, unknown>)) {
      if (k in variables && typeof v === "string" && v.trim()) variables[k] = v.trim();
    }
  }

  const result = await applyTemplate({
    projectId: project.id,
    content: template.content,
    targetSuiteId,
    selection,
    variables,
    status,
    userId: g.userId,
  });

  if (result.suiteCount === 0) {
    return validationError([
      { field: "selection", message: "nothing in this template matched the selection" },
    ]);
  }

  await db.templateApplication.create({
    data: {
      projectId: project.id,
      templateId: template.id,
      templateVersion: template.version,
      targetSuiteId,
      suiteCount: result.suiteCount,
      caseCount: result.caseCount,
      appliedById: g.userId,
    },
  });

  await logAudit({
    userId: g.userId,
    action: "template.apply",
    entityType: "template",
    entityId: template.id,
    detail: `${template.name} → ${project.slug} (${result.suiteCount} suites, ${result.caseCount} cases)`,
  });

  return NextResponse.json(
    {
      template: template.slug,
      templateVersion: template.version,
      suiteCount: result.suiteCount,
      caseCount: result.caseCount,
      rootSuiteId: result.rootSuiteId,
      suiteIds: result.suiteIds,
      caseIds: result.caseIds,
    },
    { status: 201 },
  );
}
