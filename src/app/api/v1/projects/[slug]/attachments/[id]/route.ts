import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { guard, forbidden, notFoundError } from "@/lib/api";
import { loadPerms } from "@/lib/permissions";
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

  // F-14: the uploader may remove their own file (if they can still write at
  // all); anyone with project.admin may remove any.
  const perms = await loadPerms(g.userId, attachment.projectId);
  const mayWrite = perms.has("case.write") || perms.has("run.execute");
  const allowed =
    perms.has("project.admin") || (attachment.uploaderId === g.userId && mayWrite);
  if (!allowed)
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
