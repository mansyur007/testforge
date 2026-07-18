import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import {
  guardV2,
  resolveProject,
  requirePerm,
  readPage,
  listResponse,
  withRate,
  apiError,
  badRequest,
  notFoundError,
  serializeAttachmentV2,
} from "@/lib/api-v2";
import {
  ATTACHMENT_ENTITY_TYPES,
  maxUploadBytes,
  saveAttachment,
} from "@/lib/attachments";

// F-33: attachments. Upload stays multipart/form-data (binary has no business
// being base64'd through JSON); the listing gains offset pagination and a total
// so a client can show "142 files" without walking every cursor page.

export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const ctx = await guardV2(req);
  if (ctx instanceof NextResponse) return ctx;
  const project = await resolveProject(ctx, params.slug);
  if (project instanceof NextResponse) return project;

  const sp = req.nextUrl.searchParams;
  const where: { projectId: string; entityType?: string; entityId?: string } = {
    projectId: project.id,
  };
  if (sp.get("entityType"))
    where.entityType = sp.get("entityType")!.toUpperCase();
  if (sp.get("entityId")) where.entityId = sp.get("entityId")!;

  const p = readPage(req);
  const [rows, total] = await Promise.all([
    db.attachment.findMany({
      where,
      orderBy: { createdAt: "asc" },
      skip: p.skip,
      take: p.perPage,
    }),
    db.attachment.count({ where }),
  ]);

  return withRate(listResponse(rows.map(serializeAttachmentV2), total, p), ctx);
}

export async function POST(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const ctx = await guardV2(req, { write: true });
  if (ctx instanceof NextResponse) return ctx;
  const project = await resolveProject(ctx, params.slug);
  if (project instanceof NextResponse) return project;

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
    return badRequest(
      `entityType must be one of: ${ATTACHMENT_ENTITY_TYPES.join(", ")}`
    );
  if (!entityId) return badRequest("Missing `entityId` field");

  const limit = maxUploadBytes();
  if (file.size > limit)
    return apiError(
      413,
      "payload_too_large",
      `File exceeds the ${Math.round(limit / 1024 / 1024)} MB upload limit`
    );

  // The target entity must live inside this project (tenant guard).
  const owned =
    entityType === "CASE"
      ? await db.testCase.findFirst({
          where: { id: entityId, projectId: project.id, deletedAt: null },
          select: { id: true },
        })
      : entityType === "SESSION_NOTE"
      ? await db.sessionNote.findFirst({
          where: { id: entityId, session: { projectId: project.id } },
          select: { id: true },
        })
      : await db.testRunResult.findFirst({
          where: { id: entityId, run: { projectId: project.id } },
          select: { id: true },
        });
  if (!owned) return notFoundError(`${entityType} not found in this project`);

  // Case evidence needs case.write; result/session evidence follows run.execute.
  const denied = await requirePerm(
    ctx.userId,
    project.id,
    entityType === "CASE" ? "case.write" : "run.execute"
  );
  if (denied) return denied;

  const attachment = await saveAttachment({
    projectId: project.id,
    uploaderId: ctx.userId,
    entityType,
    entityId,
    filename: file.name,
    mimeType: file.type,
    data: Buffer.from(await file.arrayBuffer()),
  });

  await logAudit({
    userId: ctx.userId,
    action: "attachment.upload",
    entityType: "attachment",
    entityId: attachment.id,
    detail: attachment.filename,
  });

  return withRate(
    NextResponse.json(serializeAttachmentV2(attachment), { status: 201 }),
    ctx
  );
}
