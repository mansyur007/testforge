import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  guard,
  apiError,
  badRequest,
  forbidden,
  notFoundError,
  serializeAttachment,
} from "@/lib/api";
import {
  ATTACHMENT_ENTITY_TYPES,
  maxUploadBytes,
  saveAttachment,
} from "@/lib/attachments";
import { logAudit } from "@/lib/audit";

// F-01 REST API: list & upload attachments for a project's cases/results.

export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const g = await guard(req);
  if (g instanceof NextResponse) return g;

  const project = await db.project.findFirst({
    where: { slug: params.slug, members: { some: { userId: g.userId } } },
  });
  if (!project) return notFoundError("Project not found");

  const sp = req.nextUrl.searchParams;
  const where: { projectId: string; entityType?: string; entityId?: string } = {
    projectId: project.id,
  };
  if (sp.get("entityType")) where.entityType = sp.get("entityType")!.toUpperCase();
  if (sp.get("entityId")) where.entityId = sp.get("entityId")!;

  const cursor = sp.get("cursor");
  const limit = Math.min(parseInt(sp.get("limit") ?? "50", 10) || 50, 200);
  const items = await db.attachment.findMany({
    where,
    orderBy: { createdAt: "asc" },
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
  });

  const nextCursor = items.length > limit ? items[limit].id : null;
  return NextResponse.json({
    items: items.slice(0, limit).map(serializeAttachment),
    nextCursor,
  });
}

export async function POST(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const g = await guard(req, { write: true });
  if (g instanceof NextResponse) return g;

  const user = await db.user.findUnique({
    where: { id: g.userId },
    select: { role: true },
  });
  if (!user || user.role === "VIEWER")
    return forbidden("Viewers don't have write access");

  const project = await db.project.findFirst({
    where: { slug: params.slug, members: { some: { userId: g.userId } } },
  });
  if (!project) return notFoundError("Project not found");

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return badRequest("Expected multipart/form-data with a `file` field");
  }

  const file = form.get("file");
  const entityType = String(form.get("entityType") ?? "").toUpperCase();
  const entityId = String(form.get("entityId") ?? "");

  if (!(file instanceof File)) return badRequest("Missing `file` field");
  if (!(ATTACHMENT_ENTITY_TYPES as readonly string[]).includes(entityType))
    return badRequest("entityType must be CASE or RESULT");
  if (!entityId) return badRequest("Missing `entityId` field");

  const limit = maxUploadBytes();
  if (file.size > limit)
    return apiError(
      413,
      "payload_too_large",
      `File exceeds the ${Math.round(limit / 1024 / 1024)} MB upload limit`
    );

  // The target entity must exist inside this project (tenant guard).
  const owned =
    entityType === "CASE"
      ? await db.testCase.findFirst({
          where: { id: entityId, projectId: project.id, deletedAt: null },
          select: { id: true },
        })
      : await db.testRunResult.findFirst({
          where: { id: entityId, run: { projectId: project.id } },
          select: { id: true },
        });
  if (!owned) return notFoundError(`${entityType} not found in this project`);

  const attachment = await saveAttachment({
    projectId: project.id,
    uploaderId: g.userId,
    entityType,
    entityId,
    filename: file.name,
    mimeType: file.type,
    data: Buffer.from(await file.arrayBuffer()),
  });

  await logAudit({
    userId: g.userId,
    action: "attachment.upload",
    entityType: "attachment",
    entityId: attachment.id,
    detail: attachment.filename,
  });

  return NextResponse.json(serializeAttachment(attachment), { status: 201 });
}
