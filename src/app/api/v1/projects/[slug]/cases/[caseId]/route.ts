import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import { resolveUserId, serializeCase } from "@/lib/api";
import {
  PRIORITIES,
  CASE_TYPES,
  CASE_STATUSES,
  AUTOMATION_STATUSES,
} from "@/lib/constants";

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
  const userId = await resolveUserId(req);
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const c = await findScopedCase(userId, params.slug, params.caseId);
  if (!c)
    return NextResponse.json({ error: "Case not found" }, { status: 404 });

  return NextResponse.json(serializeCase(params.slug, c));
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { slug: string; caseId: string } }
) {
  const userId = await resolveUserId(req);
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const existing = await findScopedCase(userId, params.slug, params.caseId);
  if (!existing)
    return NextResponse.json({ error: "Case not found" }, { status: 404 });

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object")
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });

  const data: Prisma.TestCaseUpdateInput = {};
  const bad = (msg: string) => NextResponse.json({ error: msg }, { status: 400 });

  // Free-text fields: null/"" clears (nullable columns), string sets.
  if ("title" in body) {
    const t = String(body.title ?? "").trim();
    if (!t) return bad("title cannot be empty");
    data.title = t;
  }
  if ("description" in body) data.description = body.description ?? null;
  if ("preconditions" in body) data.preconditions = body.preconditions ?? null;
  if ("expectedResult" in body)
    data.expectedResult = body.expectedResult ?? null;
  if ("linkedIssues" in body) data.linkedIssues = body.linkedIssues ?? null;
  if ("tags" in body) data.tags = String(body.tags ?? "");
  if ("steps" in body) {
    if (!Array.isArray(body.steps)) return bad("steps must be an array");
    data.stepsJson = JSON.stringify(body.steps);
  }

  // Enum fields — reject unknown values with a clear message.
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
        return bad(`${field} must be one of: ${allowed.join(", ")}`);
      (data as Record<string, unknown>)[field] = v;
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
      if (!suite) return bad("suiteId not found in this project");
    }
    data.suite = sid
      ? { connect: { id: sid } }
      : { disconnect: true };
  }

  // Assignee must be a member of the project (or null to clear).
  if ("assigneeId" in body) {
    const aid = body.assigneeId ? String(body.assigneeId) : null;
    if (aid) {
      const member = await db.projectMember.findFirst({
        where: { projectId: existing.projectId, userId: aid },
        select: { id: true },
      });
      if (!member) return bad("assigneeId is not a member of this project");
      data.assignee = { connect: { id: aid } };
    } else {
      data.assignee = { disconnect: true };
    }
  }

  const updated = await db.testCase.update({
    where: { id: existing.id },
    data,
  });
  await logAudit({
    userId,
    action: "case.update",
    entityType: "case",
    entityId: updated.id,
    detail: Object.keys(body).join(", "),
  });

  return NextResponse.json(serializeCase(params.slug, updated));
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { slug: string; caseId: string } }
) {
  const userId = await resolveUserId(req);
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const existing = await findScopedCase(userId, params.slug, params.caseId);
  if (!existing)
    return NextResponse.json({ error: "Case not found" }, { status: 404 });

  // Soft delete — hidden now, hard-purged later (see lib/cases-purge).
  const deleted = await db.testCase.update({
    where: { id: existing.id },
    data: { deletedAt: new Date() },
  });
  await logAudit({
    userId,
    action: "case.delete",
    entityType: "case",
    entityId: deleted.id,
    detail: existing.title,
  });

  return NextResponse.json({ id: deleted.id, deletedAt: deleted.deletedAt });
}
