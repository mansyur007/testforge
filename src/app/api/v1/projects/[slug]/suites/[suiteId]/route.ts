import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import { resolveUserId } from "@/lib/api";

// Load the suite plus every other suite in the same project — the sibling set is
// needed both for cycle detection (PATCH) and subtree deletion (DELETE).
async function loadSuiteContext(userId: string, slug: string, suiteId: string) {
  const suite = await db.testSuite.findFirst({
    where: { id: suiteId, project: { slug, members: { some: { userId } } } },
  });
  if (!suite) return null;
  const siblings = await db.testSuite.findMany({
    where: { projectId: suite.projectId },
    select: { id: true, parentId: true, name: true },
  });
  return { suite, siblings };
}

// Ids of the suite and all of its descendants, walking the parent→child tree.
function collectSubtree(
  rootId: string,
  all: { id: string; parentId: string | null }[]
): string[] {
  const ids = [rootId];
  for (let i = 0; i < ids.length; i++) {
    for (const s of all) if (s.parentId === ids[i]) ids.push(s.id);
  }
  return ids;
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { slug: string; suiteId: string } }
) {
  const userId = await resolveUserId(req);
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const ctx = await loadSuiteContext(userId, params.slug, params.suiteId);
  if (!ctx)
    return NextResponse.json({ error: "Suite not found" }, { status: 404 });

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object")
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });

  const data: Prisma.TestSuiteUpdateInput = {};
  const bad = (msg: string) => NextResponse.json({ error: msg }, { status: 400 });

  if ("name" in body) {
    const name = String(body.name ?? "").trim();
    if (!name) return bad("name cannot be empty");
    data.name = name;
  }
  if ("description" in body) data.description = body.description ?? null;
  if ("order" in body) {
    const order = Number(body.order);
    if (!Number.isInteger(order)) return bad("order must be an integer");
    data.order = order;
  }

  // Reparent: null/"" promotes to root; an id must be in this project and must
  // not be the suite itself or one of its descendants (would create a cycle).
  if ("parentId" in body) {
    const pid = body.parentId ? String(body.parentId) : null;
    if (pid) {
      if (pid === params.suiteId) return bad("a suite cannot be its own parent");
      const inProject = ctx.siblings.some((s) => s.id === pid);
      if (!inProject) return bad("parentId not found in this project");
      const subtree = collectSubtree(params.suiteId, ctx.siblings);
      if (subtree.includes(pid))
        return bad("parentId cannot be a descendant of the suite");
      data.parent = { connect: { id: pid } };
    } else {
      data.parent = { disconnect: true };
    }
  }

  const updated = await db.testSuite.update({
    where: { id: ctx.suite.id },
    data,
  });
  await logAudit({
    userId,
    action: "suite.update",
    entityType: "suite",
    entityId: updated.id,
    detail: Object.keys(body).join(", "),
  });

  return NextResponse.json({
    id: updated.id,
    name: updated.name,
    description: updated.description,
    parentId: updated.parentId,
    order: updated.order,
  });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { slug: string; suiteId: string } }
) {
  const userId = await resolveUserId(req);
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const ctx = await loadSuiteContext(userId, params.slug, params.suiteId);
  if (!ctx)
    return NextResponse.json({ error: "Suite not found" }, { status: 404 });

  // Remove the suite and any sub-suites. Cases keep existing — their suiteId is
  // set null automatically (onDelete: SetNull), i.e. they become unassigned.
  const ids = collectSubtree(params.suiteId, ctx.siblings);
  // Delete children before parents so a parent row is never removed while a
  // child still points at it.
  await db.$transaction(
    ids
      .slice()
      .reverse()
      .map((id) => db.testSuite.delete({ where: { id } }))
  );
  await logAudit({
    userId,
    action: "suite.delete",
    entityType: "suite",
    entityId: params.suiteId,
    detail: `${ctx.suite.name} (+${ids.length - 1} sub-suite${ids.length - 1 === 1 ? "" : "s"})`,
  });

  return NextResponse.json({ id: params.suiteId, deletedSuites: ids.length });
}
