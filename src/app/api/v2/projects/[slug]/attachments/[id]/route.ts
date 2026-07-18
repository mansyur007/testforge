import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import {
  guardV2,
  resolveProject,
  requirePerm,
  withRate,
  notFoundError,
  serializeAttachmentV2,
} from "@/lib/api-v2";
import { removeAttachments } from "@/lib/attachments";

// F-33: single attachment — metadata read and delete. The *bytes* are still
// served by /api/attachments/[id] (the `url` in the payload): that route
// already handles range requests, inline image disposition and caching, and
// duplicating it under /v2 would fork behaviour for no gain.

async function load(slug: string, id: string, userId: string) {
  return db.attachment.findFirst({
    where: { id, project: { slug, members: { some: { userId } } } },
  });
}

export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string; id: string } }
) {
  const ctx = await guardV2(req);
  if (ctx instanceof NextResponse) return ctx;
  const project = await resolveProject(ctx, params.slug);
  if (project instanceof NextResponse) return project;

  const a = await load(params.slug, params.id, ctx.userId);
  if (!a) return notFoundError("Attachment not found");
  return withRate(NextResponse.json(serializeAttachmentV2(a)), ctx);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { slug: string; id: string } }
) {
  const ctx = await guardV2(req, { write: true });
  if (ctx instanceof NextResponse) return ctx;
  const project = await resolveProject(ctx, params.slug);
  if (project instanceof NextResponse) return project;

  const a = await load(params.slug, params.id, ctx.userId);
  if (!a) return notFoundError("Attachment not found");

  const denied = await requirePerm(
    ctx.userId,
    project.id,
    a.entityType === "CASE" ? "case.write" : "run.execute"
  );
  if (denied) return denied;

  // removeAttachments is dedupe-aware: the file on disk only goes when no
  // other row still points at the same storageKey.
  await removeAttachments({ id: a.id });

  await logAudit({
    userId: ctx.userId,
    action: "attachment.delete",
    entityType: "attachment",
    entityId: a.id,
    detail: a.filename,
  });

  return withRate(new NextResponse(null, { status: 204 }), ctx);
}
