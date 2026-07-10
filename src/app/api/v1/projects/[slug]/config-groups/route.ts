import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import {
  guard,
  notFoundError,
  validationError,
  type FieldError,
} from "@/lib/api";
import { loadConfigGroups } from "@/lib/plans";

// F-06: configuration groups (plan matrix axes). The list gives clients the
// option ids they need for POST /plans.

function serializeGroup(g: {
  id: string;
  name: string;
  order: number;
  options: { id: string; name: string; order: number }[];
}) {
  return {
    id: g.id,
    name: g.name,
    order: g.order,
    options: g.options.map((o) => ({ id: o.id, name: o.name, order: o.order })),
  };
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

  const groups = await loadConfigGroups(project.id);
  return NextResponse.json({ items: groups.map(serializeGroup) });
}

/** Create a group, optionally with its options in one call:
 * { "name": "Browser", "options": ["Chrome", "Firefox"] } */
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

  const optionNames: string[] = Array.isArray(body.options)
    ? Array.from(
        new Set<string>(
          body.options.map((o: unknown) => String(o).trim()).filter(Boolean)
        )
      )
    : [];

  if (name) {
    const dup = await db.configGroup.findUnique({
      where: { projectId_name: { projectId: project.id, name } },
    });
    if (dup) errors.push({ field: "name", message: "group already exists" });
  }
  if (errors.length) return validationError(errors);

  const last = await db.configGroup.findFirst({
    where: { projectId: project.id },
    orderBy: { order: "desc" },
    select: { order: true },
  });
  const group = await db.configGroup.create({
    data: {
      projectId: project.id,
      name,
      order: (last?.order ?? -1) + 1,
      options: {
        create: optionNames.map((optName, i) => ({ name: optName, order: i })),
      },
    },
    include: { options: { orderBy: { order: "asc" } } },
  });

  await logAudit({
    userId: g.userId,
    action: "config.create_group",
    entityType: "project",
    entityId: project.id,
    detail: `${name} (${optionNames.length} options)`,
  });

  return NextResponse.json(serializeGroup(group), { status: 201 });
}
