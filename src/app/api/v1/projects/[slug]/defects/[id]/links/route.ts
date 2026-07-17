import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import {
  guard,
  notFoundError,
  badRequest,
  validationError,
  type FieldError,
  requirePerm,
  serializeDefectLink,
} from "@/lib/api";
import { DEFECT_LINK_ENTITY_TYPES } from "@/lib/defects";

// F-26: link an existing defect to a case or run result.

export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string; id: string } }
) {
  const g = await guard(req);
  if (g instanceof NextResponse) return g;

  const defect = await db.defect.findFirst({
    where: { id: params.id, project: { slug: params.slug, members: { some: { userId: g.userId } } } },
  });
  if (!defect) return notFoundError("Defect not found");

  const links = await db.defectLink.findMany({
    where: { defectId: defect.id },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json({ items: links.map(serializeDefectLink) });
}

export async function POST(
  req: NextRequest,
  { params }: { params: { slug: string; id: string } }
) {
  const g = await guard(req, { write: true });
  if (g instanceof NextResponse) return g;

  const defect = await db.defect.findFirst({
    where: { id: params.id, project: { slug: params.slug, members: { some: { userId: g.userId } } } },
  });
  if (!defect) return notFoundError("Defect not found");
  const denied = await requirePerm(g.userId, defect.projectId, "run.execute");
  if (denied) return denied;

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object")
    return validationError([{ field: "body", message: "Invalid JSON body" }]);

  const errors: FieldError[] = [];
  const entityType = String(body.entityType ?? "").toUpperCase();
  if (!(DEFECT_LINK_ENTITY_TYPES as readonly string[]).includes(entityType))
    errors.push({ field: "entityType", message: "entityType must be CASE or RESULT" });
  const entityId = String(body.entityId ?? "");
  if (!entityId) errors.push({ field: "entityId", message: "entityId is required" });
  if (errors.length) return validationError(errors);

  const owned =
    entityType === "CASE"
      ? await db.testCase.findFirst({ where: { id: entityId, projectId: defect.projectId } })
      : await db.testRunResult.findFirst({
          where: { id: entityId, run: { projectId: defect.projectId } },
        });
  if (!owned) return badRequest(`${entityType} not found in this project`);

  const link = await db.defectLink.upsert({
    where: {
      defectId_entityType_entityId: { defectId: defect.id, entityType, entityId },
    },
    create: { defectId: defect.id, entityType, entityId },
    update: {},
  });

  await logAudit({
    userId: g.userId,
    action: "defect.link",
    entityType: entityType.toLowerCase(),
    entityId,
    detail: `defect ${defect.id}`,
  });

  return NextResponse.json(serializeDefectLink(link), { status: 201 });
}
