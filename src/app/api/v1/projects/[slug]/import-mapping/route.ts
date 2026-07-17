import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import { guard, notFoundError, validationError, requirePerm } from "@/lib/api";
import { loadColumnMapping, saveColumnMapping } from "@/lib/import-mapping";

// F-30: the CSV case-import column mapping a project has settled on.

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

  const mapping = await loadColumnMapping(project.id);
  return NextResponse.json({ mapping });
}

export async function PUT(
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
  const denied = await requirePerm(g.userId, project.id, "case.write");
  if (denied) return denied;

  const body = await req.json().catch(() => null);
  if (!body || typeof body.mapping !== "object" || body.mapping === null)
    return validationError([{ field: "mapping", message: "mapping object is required" }]);

  const mapping: Record<string, string> = {};
  for (const [k, v] of Object.entries(body.mapping)) mapping[k] = String(v);

  await saveColumnMapping(project.id, mapping);
  await logAudit({
    userId: g.userId,
    action: "import_mapping.save",
    entityType: "project",
    entityId: project.id,
    detail: `${Object.keys(mapping).length} fields mapped`,
  });

  return NextResponse.json({ mapping });
}

export async function DELETE(
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
  const denied = await requirePerm(g.userId, project.id, "case.write");
  if (denied) return denied;

  await db.importColumnMapping.deleteMany({ where: { projectId: project.id } });
  await logAudit({
    userId: g.userId,
    action: "import_mapping.clear",
    entityType: "project",
    entityId: project.id,
  });

  return new NextResponse(null, { status: 204 });
}
