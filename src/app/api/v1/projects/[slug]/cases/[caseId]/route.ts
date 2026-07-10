import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import {
  guard,
  notFoundError,
  validationError,
  serializeCase,
  type FieldError,
} from "@/lib/api";
import {
  PRIORITIES,
  CASE_TYPES,
  CASE_STATUSES,
  AUTOMATION_STATUSES,
} from "@/lib/constants";
import { dispatchWebhook } from "@/lib/webhooks";
import { notify, notifyBaseUrl } from "@/lib/notifications";
import { mergeCustomJson, validateCustomValues } from "@/lib/custom-fields";
import { recordRevision } from "@/lib/case-revisions";
import { loadStepGroups } from "@/lib/steps";

// Resolve the case only if it lives in a project the caller belongs to. Keeps
// tenant isolation in one place for all three verbs.
async function findScopedCase(
  userId: string,
  slug: string,
  caseId: string,
  { includeDeleted = false } = {}
) {
  return db.testCase.findFirst({
    where: {
      id: caseId,
      project: { slug, members: { some: { userId } } },
      ...(includeDeleted ? {} : { deletedAt: null }),
    },
  });
}

export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string; caseId: string } }
) {
  const g = await guard(req);
  if (g instanceof NextResponse) return g;

  const c = await findScopedCase(g.userId, params.slug, params.caseId);
  if (!c) return notFoundError("Case not found");

  return NextResponse.json(
    serializeCase(params.slug, c, await loadStepGroups(c.projectId))
  );
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { slug: string; caseId: string } }
) {
  const g = await guard(req, { write: true });
  if (g instanceof NextResponse) return g;

  const existing = await findScopedCase(g.userId, params.slug, params.caseId);
  if (!existing) return notFoundError("Case not found");

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object")
    return validationError([{ field: "body", message: "Invalid JSON body" }]);

  const data: Prisma.TestCaseUpdateInput = {};
  const errors: FieldError[] = [];

  // Free-text fields: null/"" clears (nullable columns), string sets.
  if ("title" in body) {
    const t = String(body.title ?? "").trim();
    if (!t) errors.push({ field: "title", message: "cannot be empty" });
    else data.title = t;
  }
  if ("description" in body) data.description = body.description ?? null;
  if ("preconditions" in body) data.preconditions = body.preconditions ?? null;
  if ("expectedResult" in body)
    data.expectedResult = body.expectedResult ?? null;
  if ("linkedIssues" in body) data.linkedIssues = body.linkedIssues ?? null;
  if ("tags" in body) data.tags = String(body.tags ?? "");
  if ("steps" in body) {
    if (!Array.isArray(body.steps))
      errors.push({ field: "steps", message: "must be an array" });
    else data.stepsJson = JSON.stringify(body.steps);
  }

  // F-03: `custom` merges over the stored values (validated per CASE defs).
  if ("custom" in body) {
    if (!body.custom || typeof body.custom !== "object" || Array.isArray(body.custom)) {
      errors.push({ field: "custom", message: "must be an object" });
    } else {
      const defs = await db.customFieldDef.findMany({
        where: { projectId: existing.projectId, entity: "CASE" },
      });
      const members = await db.projectMember.findMany({
        where: { projectId: existing.projectId },
        select: { userId: true },
      });
      const check = validateCustomValues(
        defs,
        body.custom,
        new Set(members.map((m) => m.userId))
      );
      if (!check.ok) errors.push(...check.errors);
      else data.customJson = mergeCustomJson(existing.customJson, defs, check.values);
    }
  }

  // Enum fields — reject unknown values.
  const enums: Array<[string, readonly string[]]> = [
    ["priority", PRIORITIES],
    ["type", CASE_TYPES],
    ["status", CASE_STATUSES],
    ["automationStatus", AUTOMATION_STATUSES],
  ];
  for (const [field, allowed] of enums) {
    if (field in body) {
      const v = String(body[field] ?? "").toUpperCase();
      if (!allowed.includes(v))
        errors.push({ field, message: `must be one of: ${allowed.join(", ")}` });
      else (data as Record<string, unknown>)[field] = v;
    }
  }

  // Suite reassignment: null/"" unassigns; an id must belong to this project.
  if ("suiteId" in body) {
    const sid = body.suiteId ? String(body.suiteId) : null;
    if (sid) {
      const suite = await db.testSuite.findFirst({
        where: { id: sid, projectId: existing.projectId },
        select: { id: true },
      });
      if (!suite)
        errors.push({ field: "suiteId", message: "not found in this project" });
      else data.suite = { connect: { id: sid } };
    } else {
      data.suite = { disconnect: true };
    }
  }

  // Assignee must be a member of the project (or null to clear).
  if ("assigneeId" in body) {
    const aid = body.assigneeId ? String(body.assigneeId) : null;
    if (aid) {
      const member = await db.projectMember.findFirst({
        where: { projectId: existing.projectId, userId: aid },
        select: { id: true },
      });
      if (!member)
        errors.push({
          field: "assigneeId",
          message: "is not a member of this project",
        });
      else data.assignee = { connect: { id: aid } };
    } else {
      data.assignee = { disconnect: true };
    }
  }

  if (errors.length) return validationError(errors);

  let updated = await db.testCase.update({
    where: { id: existing.id },
    data,
  });
  await recordRevision(updated.id, g.userId); // F-05
  // recordRevision may have bumped `rev` — re-read so the response shows it.
  updated = await db.testCase.findUniqueOrThrow({ where: { id: updated.id } });
  await logAudit({
    userId: g.userId,
    action: "case.update",
    entityType: "case",
    entityId: updated.id,
    detail: Object.keys(body).join(", "),
  });

  await dispatchWebhook(existing.projectId, "case.updated", serializeCase(params.slug, updated));
  const caseUrl = `${notifyBaseUrl()}/projects/${params.slug}/cases/${updated.id}`;
  await notify(existing.projectId, "case.updated", {
    title: `Case updated: ${updated.title}`,
    url: caseUrl,
    fields: [{ label: "Changed", value: Object.keys(body).join(", ") }],
  });
  // case.assigned fires only when the assignee actually changed to someone.
  if (updated.assigneeId && updated.assigneeId !== existing.assigneeId) {
    const assignee = await db.user.findUnique({
      where: { id: updated.assigneeId },
      select: { name: true },
    });
    await dispatchWebhook(existing.projectId, "case.assigned", serializeCase(params.slug, updated));
    await notify(existing.projectId, "case.assigned", {
      title: `Case assigned: ${updated.title}`,
      url: caseUrl,
      fields: [{ label: "Assignee", value: assignee?.name ?? updated.assigneeId }],
    });
  }

  return NextResponse.json(serializeCase(params.slug, updated));
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { slug: string; caseId: string } }
) {
  const g = await guard(req, { write: true });
  if (g instanceof NextResponse) return g;

  const existing = await findScopedCase(g.userId, params.slug, params.caseId);
  if (!existing) return notFoundError("Case not found");

  // Soft delete — hidden now, hard-purged later (see lib/cases-purge).
  const deleted = await db.testCase.update({
    where: { id: existing.id },
    data: { deletedAt: new Date() },
  });
  await logAudit({
    userId: g.userId,
    action: "case.delete",
    entityType: "case",
    entityId: deleted.id,
    detail: existing.title,
  });

  await dispatchWebhook(existing.projectId, "case.deleted", { id: deleted.id });
  await notify(existing.projectId, "case.deleted", {
    title: `Case deleted: ${existing.title}`,
    tone: "bad",
  });

  return NextResponse.json({ id: deleted.id, deletedAt: deleted.deletedAt });
}
