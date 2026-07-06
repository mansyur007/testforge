import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import { guard, notFoundError, validationError } from "@/lib/api";

// REST API v1: list & create suites / sub-suites.
// A sub-suite is just a suite with `parentId` pointing at another suite in the
// same project (hierarki rekursif, lihat model TestSuite).
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

  const suites = await db.testSuite.findMany({
    where: { projectId: project.id },
    orderBy: { order: "asc" },
    select: { id: true, name: true, description: true, parentId: true, order: true },
  });

  return NextResponse.json({ data: suites });
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

  const name = typeof body.name === "string" ? body.name.trim() : "";
  if (!name)
    return validationError([{ field: "name", message: "name is required" }]);

  // Sub-suite: parent harus milik project yang sama, kalau tidak tolak agar
  // tidak bisa menempelkan sub-suite ke suite project lain.
  const parentId = body.parentId ? String(body.parentId) : null;
  if (parentId) {
    const parent = await db.testSuite.findFirst({
      where: { id: parentId, projectId: project.id },
      select: { id: true },
    });
    if (!parent)
      return validationError([
        { field: "parentId", message: "not found in this project" },
      ]);
  }

  const count = await db.testSuite.count({ where: { projectId: project.id } });
  const suite = await db.testSuite.create({
    data: {
      projectId: project.id,
      parentId,
      name,
      description: typeof body.description === "string" ? body.description : null,
      order: count,
    },
  });

  await logAudit({
    userId: g.userId,
    action: "suite.create",
    entityType: "suite",
    entityId: suite.id,
    detail: name,
  });

  return NextResponse.json(
    { id: suite.id, name: suite.name, parentId: suite.parentId },
    { status: 201 }
  );
}
