import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  guard,
  notFoundError,
  validationError,
  type FieldError,
  requirePerm,
} from "@/lib/api";
import { logAudit } from "@/lib/audit";
import {
  findReferencingCases,
  serializeSharedGroup,
} from "@/lib/steps";

// F-04 REST API: list & create shared step groups.

function readBodySteps(body: { steps?: unknown }): {
  steps?: { action: string; expected: string }[];
  error?: FieldError;
} {
  if (!Array.isArray(body.steps))
    return { error: { field: "steps", message: "must be an array" } };
  const steps = body.steps
    .map((s: { action?: unknown; expected?: unknown }) => ({
      action: String(s?.action ?? "").trim(),
      expected: String(s?.expected ?? "").trim(),
    }))
    .filter((s) => s.action);
  if (steps.length === 0)
    return { error: { field: "steps", message: "at least one step with an action" } };
  return { steps };
}

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

  const groups = await db.sharedStepGroup.findMany({
    where: { projectId: project.id },
    orderBy: { title: "asc" },
  });
  const usage = await Promise.all(
    groups.map(async (x) => (await findReferencingCases(project.id, x.id)).length)
  );
  return NextResponse.json({
    items: groups.map((x, i) => serializeSharedGroup(x, usage[i])),
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
  const denied = await requirePerm(g.userId, project.id, "case.write"); // F-14
  if (denied) return denied;

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object")
    return validationError([{ field: "body", message: "Invalid JSON body" }]);

  const title = String(body.title ?? "").trim().slice(0, 80);
  if (!title)
    return validationError([{ field: "title", message: "title is required" }]);
  const parsed = readBodySteps(body);
  if (parsed.error) return validationError([parsed.error]);

  const group = await db.sharedStepGroup.create({
    data: {
      projectId: project.id,
      title,
      stepsJson: JSON.stringify(parsed.steps),
    },
  });
  await logAudit({
    userId: g.userId,
    action: "sharedsteps.create",
    entityType: "sharedsteps",
    entityId: group.id,
    detail: title,
  });
  return NextResponse.json(serializeSharedGroup(group, 0), { status: 201 });
}
