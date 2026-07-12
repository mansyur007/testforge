import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import {guard, notFoundError, requirePerm } from "@/lib/api";
import { displayIssueKey } from "@/lib/issue-providers";

// F-07: unlink an issue from its entity. The issue itself is untouched upstream.
export async function DELETE(
  req: NextRequest,
  { params }: { params: { slug: string; id: string } }
) {
  const g = await guard(req, { write: true });
  if (g instanceof NextResponse) return g;

  const link = await db.issueLink.findFirst({
    where: {
      id: params.id,
      project: { slug: params.slug, members: { some: { userId: g.userId } } },
    },
  });
  if (!link) return notFoundError("Issue link not found");
  const denied = await requirePerm(g.userId, link.projectId, "run.execute"); // F-14
  if (denied) return denied;

  await db.issueLink.delete({ where: { id: link.id } });
  await logAudit({
    userId: g.userId,
    action: "issue.unlink",
    entityType: link.entityType.toLowerCase(),
    entityId: link.entityId,
    detail: `${link.provider} ${displayIssueKey(link.provider, link.issueKey)}`,
  });

  return NextResponse.json({ id: link.id, unlinked: true });
}
