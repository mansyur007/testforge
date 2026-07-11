import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import {
  guard,
  notFoundError,
  validationError,
  type FieldError,
} from "@/lib/api";
import { loadEnvironments } from "@/lib/environments";

// F-19: environments a run can be tagged against.

function serializeEnvironment(e: {
  id: string;
  name: string;
  url: string | null;
  order: number;
  active: boolean;
}) {
  return { id: e.id, name: e.name, url: e.url, order: e.order, active: e.active };
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

  const environments = await loadEnvironments(project.id);
  return NextResponse.json({ items: environments.map(serializeEnvironment) });
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

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object")
    return validationError([{ field: "body", message: "Invalid JSON body" }]);

  const errors: FieldError[] = [];
  const name = String(body.name ?? "").trim();
  if (!name) errors.push({ field: "name", message: "name is required" });
  const url = body.url ? String(body.url) : null;

  if (name) {
    const dup = await db.environment.findUnique({
      where: { projectId_name: { projectId: project.id, name } },
    });
    if (dup) errors.push({ field: "name", message: "environment already exists" });
  }
  if (errors.length) return validationError(errors);

  const last = await db.environment.findFirst({
    where: { projectId: project.id },
    orderBy: { order: "desc" },
    select: { order: true },
  });
  const environment = await db.environment.create({
    data: { projectId: project.id, name, url, order: (last?.order ?? -1) + 1 },
  });

  await logAudit({
    userId: g.userId,
    action: "environment.create",
    entityType: "project",
    entityId: project.id,
    detail: name,
  });

  return NextResponse.json(serializeEnvironment(environment), { status: 201 });
}
