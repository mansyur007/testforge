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
  validationError,
  serializeMilestone,
  type FieldError,
} from "@/lib/api-v2";

// F-33: milestones — v1 never exposed these at all, so v2 is their first REST
// surface. Ordered by due date ascending, then name; SQLite sorts NULLs first,
// so undated milestones lead the list. The order is applied entirely in the
// query (Prisma can't express `NULLS LAST` on SQLite) — reordering a page in
// JS would only shuffle rows within that page and break paging.

export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const ctx = await guardV2(req);
  if (ctx instanceof NextResponse) return ctx;
  const project = await resolveProject(ctx, params.slug);
  if (project instanceof NextResponse) return project;

  const status = req.nextUrl.searchParams.get("status");
  const where = {
    projectId: project.id,
    ...(status ? { status } : {}),
  };

  const p = readPage(req);
  const [rows, total] = await Promise.all([
    db.milestone.findMany({
      where,
      orderBy: [{ dueDate: "asc" }, { name: "asc" }],
      skip: p.skip,
      take: p.perPage,
      include: { _count: { select: { runs: true } } },
    }),
    db.milestone.count({ where }),
  ]);

  const items = rows.map((m) => serializeMilestone(m, { runs: m._count.runs }));
  return withRate(listResponse(items, total, p), ctx);
}

export async function POST(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const ctx = await guardV2(req, { write: true });
  if (ctx instanceof NextResponse) return ctx;
  const project = await resolveProject(ctx, params.slug);
  if (project instanceof NextResponse) return project;
  const denied = await requirePerm(ctx.userId, project.id, "run.manage");
  if (denied) return denied;

  const body = await readBody(req);
  if (body instanceof NextResponse) return body;

  const errors: FieldError[] = [];
  const name = String(body.name ?? "").trim().slice(0, 120);
  if (!name) errors.push({ field: "name", message: "name is required" });

  let dueDate: Date | null = null;
  if (body.dueDate != null && body.dueDate !== "") {
    const d = new Date(String(body.dueDate));
    if (Number.isNaN(d.getTime()))
      errors.push({ field: "dueDate", message: "must be an ISO date" });
    else dueDate = d;
  }

  const status = body.status ? String(body.status) : "OPEN";
  if (!["OPEN", "COMPLETED"].includes(status))
    errors.push({ field: "status", message: "must be OPEN or COMPLETED" });

  if (errors.length) return validationError(errors);

  const milestone = await db.milestone.create({
    data: { projectId: project.id, name, dueDate, status },
  });

  await logAudit({
    userId: ctx.userId,
    action: "milestone.create",
    entityType: "project",
    entityId: project.id,
    detail: name,
  });

  return withRate(
    NextResponse.json(serializeMilestone(milestone), { status: 201 }),
    ctx
  );
}
