import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import {
  guardV2,
  resolveProject,
  requirePerm,
  readBody,
  withRate,
  conflict,
  notFoundError,
  validationError,
  serializeMember,
} from "@/lib/api-v2";
import { BUILT_IN_ROLES } from "@/lib/permissions";

// F-33: a single membership — change its role or remove it from the project.
// `id` is the ProjectMember id, not the user id.

const INCLUDE_USER = {
  user: { select: { id: true, name: true, email: true } },
} as const;

async function load(slug: string, id: string, userId: string) {
  return db.projectMember.findFirst({
    where: { id, project: { slug, members: { some: { userId } } } },
    include: INCLUDE_USER,
  });
}

/**
 * A project must keep at least one OWNER, otherwise nobody can administer it
 * again. Both the role change and the delete path run this before mutating.
 */
async function wouldOrphanProject(projectId: string, memberId: string) {
  const owners = await db.projectMember.findMany({
    where: { projectId, role: "OWNER" },
    select: { id: true },
  });
  return owners.length === 1 && owners[0].id === memberId;
}

export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string; id: string } }
) {
  const ctx = await guardV2(req);
  if (ctx instanceof NextResponse) return ctx;
  const project = await resolveProject(ctx, params.slug);
  if (project instanceof NextResponse) return project;

  const m = await load(params.slug, params.id, ctx.userId);
  if (!m) return notFoundError("Member not found");
  return withRate(NextResponse.json(serializeMember(m)), ctx);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { slug: string; id: string } }
) {
  const ctx = await guardV2(req, { write: true });
  if (ctx instanceof NextResponse) return ctx;
  const project = await resolveProject(ctx, params.slug);
  if (project instanceof NextResponse) return project;
  const denied = await requirePerm(ctx.userId, project.id, "members.manage");
  if (denied) return denied;

  const m = await load(params.slug, params.id, ctx.userId);
  if (!m) return notFoundError("Member not found");

  const body = await readBody(req);
  if (body instanceof NextResponse) return body;
  if (!("role" in body))
    return validationError([{ field: "role", message: "role is required" }]);

  const role = String(body.role);
  const user = await db.user.findUnique({
    where: { id: m.userId },
    select: { organizationId: true },
  });
  const known =
    (BUILT_IN_ROLES as readonly string[]).includes(role) ||
    (user?.organizationId
      ? (await db.roleDef.findFirst({
          where: { organizationId: user.organizationId, name: role },
          select: { id: true },
        })) != null
      : false);
  if (!known) return validationError([{ field: "role", message: "unknown role" }]);

  if (m.role === "OWNER" && role !== "OWNER" && (await wouldOrphanProject(project.id, m.id)))
    return conflict("Cannot demote the last owner of this project");

  const updated = await db.projectMember.update({
    where: { id: m.id },
    data: { role },
    include: INCLUDE_USER,
  });

  await logAudit({
    userId: ctx.userId,
    action: "member.role_change",
    entityType: "project",
    entityId: project.id,
    detail: `${m.user.email} → ${role}`,
  });

  return withRate(NextResponse.json(serializeMember(updated)), ctx);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { slug: string; id: string } }
) {
  const ctx = await guardV2(req, { write: true });
  if (ctx instanceof NextResponse) return ctx;
  const project = await resolveProject(ctx, params.slug);
  if (project instanceof NextResponse) return project;
  const denied = await requirePerm(ctx.userId, project.id, "members.manage");
  if (denied) return denied;

  const m = await load(params.slug, params.id, ctx.userId);
  if (!m) return notFoundError("Member not found");

  if (m.role === "OWNER" && (await wouldOrphanProject(project.id, m.id)))
    return conflict("Cannot remove the last owner of this project");

  await db.projectMember.delete({ where: { id: m.id } });

  await logAudit({
    userId: ctx.userId,
    action: "member.remove",
    entityType: "project",
    entityId: project.id,
    detail: m.user.email,
  });

  return withRate(new NextResponse(null, { status: 204 }), ctx);
}
