import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { guard, forbidden, notFoundError } from "@/lib/api";
import { removeAttachments } from "@/lib/attachments";
import { logAudit } from "@/lib/audit";

// F-01: delete one attachment. Allowed for the uploader, a project
// OWNER/ADMIN, or an org ADMIN.
export async function DELETE(
  req: NextRequest,
  { params }: { params: { slug: string; id: string } }
) {
  const g = await guard(req, { write: true });
  if (g instanceof NextResponse) return g;

  const attachment = await db.attachment.findFirst({
    where: {
      id: params.id,
      project: { slug: params.slug, members: { some: { userId: g.userId } } },
    },
  });
  if (!attachment) return notFoundError("Attachment not found");

  const [user, membership] = await Promise.all([
    db.user.findUnique({ where: { id: g.userId }, select: { role: true } }),
    db.projectMember.findUnique({
      where: {
        projectId_userId: { projectId: attachment.projectId, userId: g.userId },
      },
      select: { role: true },
    }),
  ]);
  const allowed =
    attachment.uploaderId === g.userId ||
    user?.role === "ADMIN" ||
    ["OWNER", "ADMIN"].includes(membership?.role ?? "");
  if (!allowed || user?.role === "VIEWER")
    return forbidden("Only the uploader or a project admin can delete this");

  await removeAttachments({ id: attachment.id });
  await logAudit({
    userId: g.userId,
    action: "attachment.delete",
    entityType: "attachment",
    entityId: attachment.id,
    detail: attachment.filename,
  });

  return new NextResponse(null, { status: 204 });
}
