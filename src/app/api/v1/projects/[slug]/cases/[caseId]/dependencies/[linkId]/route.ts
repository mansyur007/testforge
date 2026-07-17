import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import { guard, notFoundError, requirePerm } from "@/lib/api";

// F-32: remove a case dependency link.

export async function DELETE(
  req: NextRequest,
  { params }: { params: { slug: string; caseId: string; linkId: string } }
) {
  const g = await guard(req, { write: true });
  if (g instanceof NextResponse) return g;

  const link = await db.caseDependency.findFirst({
    where: {
      id: params.linkId,
      caseId: params.caseId,
      case: { project: { slug: params.slug, members: { some: { userId: g.userId } } } },
    },
  });
  if (!link) return notFoundError("Dependency not found");
  const denied = await requirePerm(g.userId, (await db.testCase.findUniqueOrThrow({
    where: { id: link.caseId },
    select: { projectId: true },
  })).projectId, "case.write");
  if (denied) return denied;

  await db.caseDependency.delete({ where: { id: link.id } });
  await logAudit({
    userId: g.userId,
    action: "case_dependency.remove",
    entityType: "case",
    entityId: link.caseId,
    detail: `no longer depends on ${link.dependsOnCaseId}`,
  });

  return new NextResponse(null, { status: 204 });
}
