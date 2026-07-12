import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import {
  guard,
  notFoundError,
  validationError,
  type FieldError,
  requirePerm,
} from "@/lib/api";
import { dispatchWebhook } from "@/lib/webhooks";
import { loadCaseRevs } from "@/lib/case-revisions";
import {
  buildCombinations,
  configLabel,
  serializePlan,
  MAX_COMBINATIONS,
} from "@/lib/plans";

// F-06: list & create test plans. Creation mirrors the server action exactly —
// one child run per configuration combination, capped at MAX_COMBINATIONS.

export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const g = await guard(req);
  if (g instanceof NextResponse) return g;

  const project = await db.project.findFirst({
    where: { slug: params.slug, members: { some: { userId: g.userId } } },
    select: { id: true },
  });
  if (!project) return notFoundError("Project not found");

  const sp = req.nextUrl.searchParams;
  const cursor = sp.get("cursor");
  const limit = Math.min(parseInt(sp.get("limit") ?? "50", 10) || 50, 200);

  const rows = await db.testPlan.findMany({
    where: {
      projectId: project.id,
      ...(sp.get("status") ? { status: sp.get("status")!.toUpperCase() } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    include: { _count: { select: { runs: true } } },
  });

  const hasMore = rows.length > limit;
  const items = hasMore ? rows.slice(0, limit) : rows;

  return NextResponse.json({
    items: items.map((p) => ({ ...serializePlan(p), runCount: p._count.runs })),
    nextCursor: hasMore ? items[items.length - 1].id : null,
  });
}

export async function POST(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const g = await guard(req, { write: true });
  if (g instanceof NextResponse) return g;

  const project = await db.project.findFirst({
    where: { slug: params.slug, members: { some: { userId: g.userId } } },
    select: { id: true },
  });
  if (!project) return notFoundError("Project not found");
  const denied = await requirePerm(g.userId, project.id, "run.manage"); // F-14
  if (denied) return denied;

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object")
    return validationError([{ field: "body", message: "Invalid JSON body" }]);

  const errors: FieldError[] = [];
  const name = String(body.name ?? "").trim();
  if (!name) errors.push({ field: "name", message: "name is required" });

  const caseIds: string[] = Array.isArray(body.caseIds)
    ? body.caseIds.map(String)
    : [];
  if (!caseIds.length)
    errors.push({ field: "caseIds", message: "select at least one case" });

  const optionIds: string[] = Array.isArray(body.optionIds)
    ? body.optionIds.map(String)
    : [];

  const milestoneId = body.milestoneId ? String(body.milestoneId) : null;
  if (milestoneId) {
    const ms = await db.milestone.findFirst({
      where: { id: milestoneId, projectId: project.id },
      select: { id: true },
    });
    if (!ms)
      errors.push({ field: "milestoneId", message: "not found in this project" });
  }

  if (caseIds.length) {
    const found = await db.testCase.findMany({
      where: { id: { in: caseIds }, projectId: project.id, deletedAt: null },
      select: { id: true },
    });
    const live = new Set(found.map((c) => c.id));
    const invalid = caseIds.filter((id) => !live.has(id));
    if (invalid.length)
      errors.push({
        field: "caseIds",
        message: `not in this project: ${invalid.join(", ")}`,
      });
  }

  if (errors.length) return validationError(errors);

  const groups = await db.configGroup.findMany({
    where: { projectId: project.id, options: { some: { id: { in: optionIds } } } },
    orderBy: { order: "asc" },
    include: {
      options: { where: { id: { in: optionIds } }, orderBy: { order: "asc" } },
    },
  });
  const combos = buildCombinations(
    groups.map((gr) => ({ name: gr.name, options: gr.options.map((o) => o.name) }))
  );
  if (combos.length > MAX_COMBINATIONS)
    return validationError([
      {
        field: "optionIds",
        message: `${combos.length} combinations exceed the limit of ${MAX_COMBINATIONS}`,
      },
    ]);

  const revs = await loadCaseRevs(caseIds);
  const resultRows = caseIds.map((caseId) => ({
    caseId,
    caseRev: revs.get(caseId),
  }));

  const plan = await db.$transaction(async (tx) => {
    const created = await tx.testPlan.create({
      data: {
        projectId: project.id,
        name,
        description: body.description ?? null,
        milestoneId,
        createdById: g.userId,
      },
    });
    for (const combo of combos) {
      const label = configLabel(combo);
      await tx.testRun.create({
        data: {
          projectId: project.id,
          planId: created.id,
          name: label ? `${name} — ${label}` : name,
          milestoneId,
          configJson: label ? JSON.stringify(combo) : null,
          createdById: g.userId,
          results: { create: resultRows },
        },
      });
    }
    return created;
  });

  await logAudit({
    userId: g.userId,
    action: "plan.create",
    entityType: "plan",
    entityId: plan.id,
    detail: `${name} (${combos.length} run × ${caseIds.length} cases)`,
  });
  const runs = await db.testRun.findMany({ where: { planId: plan.id } });
  await dispatchWebhook(project.id, "plan.created", serializePlan(plan, runs));

  return NextResponse.json(serializePlan(plan, runs), { status: 201 });
}
