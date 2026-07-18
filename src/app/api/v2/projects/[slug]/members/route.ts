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
  serializeMember,
  type FieldError,
} from "@/lib/api-v2";
import { BUILT_IN_ROLES } from "@/lib/permissions";

// F-33: project members. Adding a member here binds an *existing* user to the
// project — it never creates or invites a user, because account creation and
// email invitations are their own flows (see Invitation). A caller that passes
// an email with no matching account gets a 422, not a silent invite.

async function roleExists(organizationId: string | null, role: string) {
  if ((BUILT_IN_ROLES as readonly string[]).includes(role)) return true;
  if (!organizationId) return false;
  const custom = await db.roleDef.findFirst({
    where: { organizationId, name: role },
    select: { id: true },
  });
  return custom != null;
}

export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const ctx = await guardV2(req);
  if (ctx instanceof NextResponse) return ctx;
  const project = await resolveProject(ctx, params.slug);
  if (project instanceof NextResponse) return project;

  const where = { projectId: project.id };
  const p = readPage(req);
  const [rows, total] = await Promise.all([
    db.projectMember.findMany({
      where,
      orderBy: { user: { name: "asc" } },
      skip: p.skip,
      take: p.perPage,
      include: { user: { select: { id: true, name: true, email: true } } },
    }),
    db.projectMember.count({ where }),
  ]);

  return withRate(listResponse(rows.map(serializeMember), total, p), ctx);
}

export async function POST(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const ctx = await guardV2(req, { write: true });
  if (ctx instanceof NextResponse) return ctx;
  const project = await resolveProject(ctx, params.slug);
  if (project instanceof NextResponse) return project;
  const denied = await requirePerm(ctx.userId, project.id, "members.manage");
  if (denied) return denied;

  const body = await readBody(req);
  if (body instanceof NextResponse) return body;

  const errors: FieldError[] = [];
  const role = String(body.role ?? "MEMBER");
  const userId = body.userId ? String(body.userId) : null;
  const email = body.email ? String(body.email).trim().toLowerCase() : null;
  if (!userId && !email)
    errors.push({ field: "userId", message: "userId or email is required" });
  if (errors.length) return validationError(errors);

  const user = await db.user.findFirst({
    where: userId ? { id: userId } : { email: email! },
    select: { id: true, name: true, email: true, organizationId: true },
  });
  if (!user)
    return validationError([
      { field: userId ? "userId" : "email", message: "no such user" },
    ]);

  if (!(await roleExists(user.organizationId, role)))
    return validationError([{ field: "role", message: "unknown role" }]);

  const existing = await db.projectMember.findUnique({
    where: { projectId_userId: { projectId: project.id, userId: user.id } },
  });
  if (existing) return conflict("User is already a member of this project");

  const member = await db.projectMember.create({
    data: { projectId: project.id, userId: user.id, role },
    include: { user: { select: { id: true, name: true, email: true } } },
  });

  await logAudit({
    userId: ctx.userId,
    action: "member.add",
    entityType: "project",
    entityId: project.id,
    detail: `${user.email} as ${role}`,
  });

  return withRate(
    NextResponse.json(serializeMember(member), { status: 201 }),
    ctx
  );
}
