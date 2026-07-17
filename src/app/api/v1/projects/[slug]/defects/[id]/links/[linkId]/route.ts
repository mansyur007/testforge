import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import { guard, notFoundError, requirePerm } from "@/lib/api";

// F-26: unlink a defect from a case/result.

export async function DELETE(
  req: NextRequest,
  { params }: { params: { slug: string; id: string; linkId: string } }
) {
  const g = await guard(req, { write: true });
  if (g instanceof NextResponse) return g;

  const link = await db.defectLink.findFirst({
    where: {
      id: params.linkId,
      defectId: params.id,
      defect: { project: { slug: params.slug, members: { some: { userId: g.userId } } } },
    },
  });
  if (!link) return notFoundError("Link not found");
  const defect = await db.defect.findUniqueOrThrow({ where: { id: link.defectId } });
  const denied = await requirePerm(g.userId, defect.projectId, "run.execute");
  if (denied) return denied;

  await db.defectLink.delete({ where: { id: link.id } });
  await logAudit({
    userId: g.userId,
    action: "defect.unlink",
    entityType: link.entityType.toLowerCase(),
    entityId: link.entityId,
    detail: `defect ${link.defectId}`,
  });

  return new NextResponse(null, { status: 204 });
}
