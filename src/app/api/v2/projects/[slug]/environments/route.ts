import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import {
  guardV2,
  resolveProject,
  requirePerm,
  readBody,
  readPage,
  listResponse,
  withRate,
  conflict,
  validationError,
  serializeEnvironment,
  type FieldError,
} from "@/lib/api-v2";

// F-33: environments (F-19) get pagination and an item route in v2; v1 only
// ever returned the whole list from one endpoint with no way to update or
// delete a row.

export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const ctx = await guardV2(req);
  if (ctx instanceof NextResponse) return ctx;
  const project = await resolveProject(ctx, params.slug);
  if (project instanceof NextResponse) return project;

  const sp = req.nextUrl.searchParams;
  const activeParam = sp.get("active");
  const where = {
    projectId: project.id,
    ...(activeParam === null ? {} : { active: activeParam === "true" }),
  };

  const p = readPage(req);
  const [rows, total] = await Promise.all([
    db.environment.findMany({
      where,
      orderBy: { order: "asc" },
      skip: p.skip,
      take: p.perPage,
    }),
    db.environment.count({ where }),
  ]);

  return withRate(listResponse(rows.map(serializeEnvironment), total, p), ctx);
}

export async function POST(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const ctx = await guardV2(req, { write: true });
  if (ctx instanceof NextResponse) return ctx;
  const project = await resolveProject(ctx, params.slug);
  if (project instanceof NextResponse) return project;
  const denied = await requirePerm(ctx.userId, project.id, "fields.manage");
  if (denied) return denied;

  const body = await readBody(req);
  if (body instanceof NextResponse) return body;

  const errors: FieldError[] = [];
  const name = String(body.name ?? "").trim().slice(0, 60);
  if (!name) errors.push({ field: "name", message: "name is required" });
  if (errors.length) return validationError(errors);

  const dup = await db.environment.findUnique({
    where: { projectId_name: { projectId: project.id, name } },
  });
  if (dup) return conflict("An environment with that name already exists");

  const last = await db.environment.findFirst({
    where: { projectId: project.id },
    orderBy: { order: "desc" },
    select: { order: true },
  });
  const environment = await db.environment.create({
    data: {
      projectId: project.id,
      name,
      url: body.url ? String(body.url) : null,
      order: (last?.order ?? -1) + 1,
    },
  });

  await logAudit({
    userId: ctx.userId,
    action: "environment.create",
    entityType: "project",
    entityId: project.id,
    detail: name,
  });

  return withRate(
    NextResponse.json(serializeEnvironment(environment), { status: 201 }),
    ctx
  );
}
