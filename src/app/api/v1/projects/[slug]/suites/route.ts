import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession, authenticateApiKey } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

// REST API v1: list & create suites / sub-suites.
// A sub-suite is just a suite with `parentId` pointing at another suite in the
// same project (hierarki rekursif, lihat model TestSuite).
export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const auth = (await getSession()) ?? (await authenticateApiKey(req));
  if (!auth)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = "userId" in auth ? auth.userId : auth.id;

  const project = await db.project.findFirst({
    where: { slug: params.slug, members: { some: { userId } } },
    select: { id: true },
  });
  if (!project)
    return NextResponse.json({ error: "Project not found" }, { status: 404 });

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
  const auth = (await getSession()) ?? (await authenticateApiKey(req));
  if (!auth)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = "userId" in auth ? auth.userId : auth.id;

  const body = await req.json().catch(() => null);
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  if (!name)
    return NextResponse.json({ error: "name is required" }, { status: 400 });

  const project = await db.project.findFirst({
    where: { slug: params.slug, members: { some: { userId } } },
    select: { id: true },
  });
  if (!project)
    return NextResponse.json({ error: "Project not found" }, { status: 404 });

  // Sub-suite: parent harus milik project yang sama, kalau tidak tolak agar
  // tidak bisa menempelkan sub-suite ke suite project lain.
  const parentId = body?.parentId ? String(body.parentId) : null;
  if (parentId) {
    const parent = await db.testSuite.findFirst({
      where: { id: parentId, projectId: project.id },
      select: { id: true },
    });
    if (!parent)
      return NextResponse.json(
        { error: "parentId not found in this project" },
        { status: 400 }
      );
  }

  const count = await db.testSuite.count({ where: { projectId: project.id } });
  const suite = await db.testSuite.create({
    data: {
      projectId: project.id,
      parentId,
      name,
      description: typeof body?.description === "string" ? body.description : null,
      order: count,
    },
  });

  await logAudit({
    userId,
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
