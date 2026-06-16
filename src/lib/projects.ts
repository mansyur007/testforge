import type { Prisma } from "@prisma/client";
import { db } from "./db";

// Multi-tenant isolation. A user may read or write a project ONLY if they are a
// member of it (a ProjectMember row exists). Every project-scoped query/mutation
// must be guarded with one of these helpers — there is no organizationId on
// Project, membership is the source of truth.

/** Spread into a Project `where` clause to scope it to the user's projects. */
export function memberScope(userId: string): Prisma.ProjectWhereInput {
  return { members: { some: { userId } } };
}

/** True if the user is a member of the given project. */
export async function isProjectMember(userId: string, projectId: string) {
  const hit = await db.project.findFirst({
    where: { id: projectId, members: { some: { userId } } },
    select: { id: true },
  });
  return hit !== null;
}

/** The user's role in a project (OWNER | ADMIN | MEMBER | VIEWER), or null if
 * they are not a member. */
export async function getProjectRole(userId: string, projectId: string) {
  const m = await db.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId } },
    select: { role: true },
  });
  return m?.role ?? null;
}

/** Only OWNER/ADMIN of a project may add, remove, or re-role its members. */
export function canManageMembers(role: string | null) {
  return role === "OWNER" || role === "ADMIN";
}
