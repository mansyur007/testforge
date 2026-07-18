import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import {
  guardV2,
  resolveProject,
  requirePerm,
  readBody,
  withRate,
  notFoundError,
  validationError,
  type FieldError,
} from "@/lib/api-v2";
import { dispatchWebhook } from "@/lib/webhooks";
import { serializePlan } from "@/lib/plans";

// F-33: single test plan. A plan always reads back with its child runs and
// aggregate stats — that breakdown is the whole point of fetching one plan, so
// unlike the list endpoint it is not opt-in.

const WITH_RUNS = {
  runs: {
    include: {
      results: {
        select: { status: true, testCase: { select: { mutedAt: true } } },
      },
    },
  },
} as const;

async function load(slug: string, planId: string, userId: string) {
  return db.testPlan.findFirst({
    where: { id: planId, project: { slug, members: { some: { userId } } } },
    include: WITH_RUNS,
  });
}

export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string; planId: string } }
) {
  const ctx = await guardV2(req);
  if (ctx instanceof NextResponse) return ctx;
  const project = await resolveProject(ctx, params.slug);
  if (project instanceof NextResponse) return project;

  const plan = await load(params.slug, params.planId, ctx.userId);
  if (!plan) return notFoundError("Plan not found");
  return withRate(NextResponse.json(serializePlan(plan, plan.runs)), ctx);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { slug: string; planId: string } }
) {
  const ctx = await guardV2(req, { write: true });
  if (ctx instanceof NextResponse) return ctx;
  const project = await resolveProject(ctx, params.slug);
  if (project instanceof NextResponse) return project;
  const denied = await requirePerm(ctx.userId, project.id, "run.manage");
  if (denied) return denied;

  const plan = await load(params.slug, params.planId, ctx.userId);
  if (!plan) return notFoundError("Plan not found");

  const body = await readBody(req);
  if (body instanceof NextResponse) return body;

  const errors: FieldError[] = [];
  const data: {
    name?: string;
    description?: string | null;
    status?: string;
    milestoneId?: string | null;
    completedAt?: Date | null;
  } = {};

  if ("name" in body) {
    const name = String(body.name ?? "").trim().slice(0, 200);
    if (!name) errors.push({ field: "name", message: "cannot be empty" });
    else data.name = name;
  }
  if ("description" in body)
    data.description = body.description ? String(body.description) : null;

  if ("milestoneId" in body) {
    if (body.milestoneId == null) data.milestoneId = null;
    else {
      const id = String(body.milestoneId);
      const ms = await db.milestone.findFirst({
        where: { id, projectId: project.id },
        select: { id: true },
      });
      if (!ms)
        errors.push({
          field: "milestoneId",
          message: "not found in this project",
        });
      else data.milestoneId = id;
    }
  }

  // completedAt is derived from status, never set directly — that keeps the
  // two from disagreeing about whether a plan is finished.
  if ("status" in body) {
    const status = String(body.status);
    if (!["ACTIVE", "COMPLETED"].includes(status))
      errors.push({ field: "status", message: "must be ACTIVE or COMPLETED" });
    else {
      data.status = status;
      data.completedAt = status === "COMPLETED" ? new Date() : null;
    }
  }
  if (errors.length) return validationError(errors);

  const updated = await db.testPlan.update({
    where: { id: plan.id },
    data,
    include: WITH_RUNS,
  });

  await logAudit({
    userId: ctx.userId,
    action: "plan.update",
    entityType: "plan",
    entityId: plan.id,
    detail: updated.name,
  });

  if (data.status === "COMPLETED" && plan.status !== "COMPLETED")
    await dispatchWebhook(project.id, "plan.completed", {
      planId: plan.id,
      name: updated.name,
    });

  return withRate(NextResponse.json(serializePlan(updated, updated.runs)), ctx);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { slug: string; planId: string } }
) {
  const ctx = await guardV2(req, { write: true });
  if (ctx instanceof NextResponse) return ctx;
  const project = await resolveProject(ctx, params.slug);
  if (project instanceof NextResponse) return project;
  const denied = await requirePerm(ctx.userId, project.id, "run.manage");
  if (denied) return denied;

  const plan = await load(params.slug, params.planId, ctx.userId);
  if (!plan) return notFoundError("Plan not found");

  // Child runs are detached, not destroyed: their results are test history.
  await db.$transaction([
    db.testRun.updateMany({
      where: { planId: plan.id },
      data: { planId: null },
    }),
    db.testPlan.delete({ where: { id: plan.id } }),
  ]);

  await logAudit({
    userId: ctx.userId,
    action: "plan.delete",
    entityType: "plan",
    entityId: plan.id,
    detail: plan.name,
  });

  return withRate(new NextResponse(null, { status: 204 }), ctx);
}
