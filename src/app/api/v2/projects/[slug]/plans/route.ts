import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import {
  guardV2,
  resolveProject,
  requirePerm,
  readBody,
  readPage,
  listResponse,
  withRate,
  validationError,
  type FieldError,
} from "@/lib/api-v2";
import { dispatchWebhook } from "@/lib/webhooks";
import {
  buildCombinations,
  configLabel,
  serializePlan,
  MAX_COMBINATIONS,
} from "@/lib/plans";

// F-33: test plans (F-06). v2 swaps v1's cursor paging for the shared
// page/perPage envelope and lets `include=runs` opt into the child-run
// breakdown — v1 always embedded it, which made large plan lists expensive.

export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const ctx = await guardV2(req);
  if (ctx instanceof NextResponse) return ctx;
  const project = await resolveProject(ctx, params.slug);
  if (project instanceof NextResponse) return project;

  const sp = req.nextUrl.searchParams;
  const withRuns = (sp.get("include") ?? "").split(",").includes("runs");
  const status = sp.get("status");
  const milestoneId = sp.get("milestoneId");
  const where = {
    projectId: project.id,
    ...(status ? { status } : {}),
    ...(milestoneId ? { milestoneId } : {}),
  };

  const p = readPage(req);
  const [rows, total] = await Promise.all([
    db.testPlan.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: p.skip,
      take: p.perPage,
      ...(withRuns
        ? { include: { runs: { include: { results: { select: { status: true } } } } } }
        : {}),
    }),
    db.testPlan.count({ where }),
  ]);

  const items = rows.map((plan) =>
    withRuns
      ? serializePlan(plan, (plan as typeof plan & { runs: [] }).runs)
      : serializePlan(plan)
  );

  return withRate(listResponse(items, total, p), ctx);
}

export async function POST(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const ctx = await guardV2(req, { write: true });
  if (ctx instanceof NextResponse) return ctx;
  const project = await resolveProject(ctx, params.slug);
  if (project instanceof NextResponse) return project;
  const denied = await requirePerm(ctx.userId, project.id, "run.manage");
  if (denied) return denied;

  const body = await readBody(req);
  if (body instanceof NextResponse) return body;

  const errors: FieldError[] = [];
  const name = String(body.name ?? "").trim().slice(0, 200);
  if (!name) errors.push({ field: "name", message: "name is required" });

  const caseIds = Array.isArray(body.caseIds) ? body.caseIds.map(String) : [];
  if (caseIds.length === 0)
    errors.push({ field: "caseIds", message: "at least one case is required" });

  // Configuration axes are chosen by ConfigOption id, exactly as in v1 — the
  // cross product of the selected options becomes one child run each.
  const optionIds = Array.isArray(body.optionIds)
    ? body.optionIds.map(String)
    : [];

  const milestoneId = body.milestoneId ? String(body.milestoneId) : null;
  if (milestoneId) {
    const ms = await db.milestone.findFirst({
      where: { id: milestoneId, projectId: project.id },
      select: { id: true },
    });
    if (!ms)
      errors.push({
        field: "milestoneId",
        message: "not found in this project",
      });
  }

  // Only live cases in *this* project may seed the runs; a stray or deleted id
  // is a client error rather than something to silently drop.
  const revs = new Map<string, number>();
  if (caseIds.length) {
    const found = await db.testCase.findMany({
      where: { id: { in: caseIds }, projectId: project.id, deletedAt: null },
      select: { id: true, rev: true },
    });
    for (const c of found) revs.set(c.id, c.rev);
    const invalid = caseIds.filter((id) => !revs.has(id));
    if (invalid.length)
      errors.push({
        field: "caseIds",
        message: `not in this project: ${invalid.join(", ")}`,
      });
  }

  const groups = await db.configGroup.findMany({
    where: {
      projectId: project.id,
      options: { some: { id: { in: optionIds } } },
    },
    orderBy: { order: "asc" },
    include: {
      options: { where: { id: { in: optionIds } }, orderBy: { order: "asc" } },
    },
  });
  const combos = buildCombinations(
    groups.map((gr) => ({
      name: gr.name,
      options: gr.options.map((o) => o.name),
    }))
  );
  if (combos.length > MAX_COMBINATIONS)
    errors.push({
      field: "optionIds",
      message: `${combos.length} combinations exceed the limit of ${MAX_COMBINATIONS}`,
    });

  if (errors.length) return validationError(errors);

  const resultRows = caseIds.map((caseId) => ({
    caseId,
    caseRev: revs.get(caseId),
  }));

  const plan = await db.$transaction(async (tx) => {
    const created = await tx.testPlan.create({
      data: {
        projectId: project.id,
        name,
        description: body.description ? String(body.description) : null,
        milestoneId,
        createdById: ctx.userId,
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
          createdById: ctx.userId,
          results: { create: resultRows },
        },
      });
    }
    return created;
  });

  await logAudit({
    userId: ctx.userId,
    action: "plan.create",
    entityType: "plan",
    entityId: plan.id,
    detail: `${name} (${combos.length} run × ${caseIds.length} cases)`,
  });
  await dispatchWebhook(project.id, "plan.created", {
    planId: plan.id,
    name,
  });

  return withRate(NextResponse.json(serializePlan(plan), { status: 201 }), ctx);
}
