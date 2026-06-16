"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireSession, type Session } from "@/lib/auth";
import { getProjectRole, canManageMembers } from "@/lib/projects";
import { logAudit } from "@/lib/audit";

export type ProjectMemberResult = { error?: string; ok?: string };

const VALID_ROLES = ["OWNER", "ADMIN", "MEMBER", "VIEWER"] as const;

// Caller harus OWNER/ADMIN dari project yang ditarget. Mengembalikan {error}
// ramah, bukan throw. Project juga di-resolve dari slug.
async function manageContext(
  projectId: string
): Promise<{ session: Session } | { error: string }> {
  const session = await requireSession();
  const role = await getProjectRole(session.userId, projectId);
  if (role === null) return { error: "Project not found." }; // bukan anggota → 404-equivalent
  if (!canManageMembers(role))
    return { error: "Only project owners and admins can manage members." };
  return { session };
}

async function ownerCount(projectId: string, exceptUserId?: string) {
  return db.projectMember.count({
    where: {
      projectId,
      role: "OWNER",
      ...(exceptUserId ? { userId: { not: exceptUserId } } : {}),
    },
  });
}

// Tambah anggota ke project. Target wajib berada di organisasi yang sama dengan
// pengelola (mencegah menambah user lintas-tenant sembarangan).
export async function addProjectMember(
  formData: FormData
): Promise<ProjectMemberResult> {
  const projectId = String(formData.get("projectId") ?? "");
  const ctx = await manageContext(projectId);
  if ("error" in ctx) return ctx;

  const userId = String(formData.get("userId") ?? "");
  const role = String(formData.get("role") ?? "MEMBER");
  if (!VALID_ROLES.includes(role as (typeof VALID_ROLES)[number]))
    return { error: "Invalid role." };

  const me = await db.user.findUnique({
    where: { id: ctx.session.userId },
    select: { organizationId: true },
  });
  const target = await db.user.findUnique({
    where: { id: userId },
    select: { organizationId: true, email: true },
  });
  if (!target) return { error: "User not found." };
  if (!me?.organizationId || target.organizationId !== me.organizationId)
    return {
      error: "You can only add members from your organization. Invite them in Settings → Team first.",
    };

  const exists = await db.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId } },
    select: { id: true },
  });
  if (exists) return { error: `${target.email} is already a member.` };

  await db.projectMember.create({ data: { projectId, userId, role } });
  await logAudit({
    userId: ctx.session.userId,
    action: "project.member_add",
    entityType: "project",
    entityId: projectId,
    detail: `${target.email} as ${role}`,
  });
  revalidatePath(`/projects`);
  return { ok: `${target.email} added as ${role}.` };
}

// Ubah role anggota project. Tidak boleh menurunkan OWNER terakhir.
export async function changeProjectMemberRole(
  formData: FormData
): Promise<ProjectMemberResult> {
  const projectId = String(formData.get("projectId") ?? "");
  const ctx = await manageContext(projectId);
  if ("error" in ctx) return ctx;

  const userId = String(formData.get("userId") ?? "");
  const role = String(formData.get("role") ?? "");
  if (!VALID_ROLES.includes(role as (typeof VALID_ROLES)[number]))
    return { error: "Invalid role." };

  const member = await db.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId } },
    include: { user: { select: { email: true } } },
  });
  if (!member) return { error: "Member not found." };

  if (member.role === "OWNER" && role !== "OWNER") {
    if ((await ownerCount(projectId, userId)) === 0)
      return { error: "Can't demote the last owner." };
  }

  await db.projectMember.update({
    where: { projectId_userId: { projectId, userId } },
    data: { role },
  });
  await logAudit({
    userId: ctx.session.userId,
    action: "project.member_role_change",
    entityType: "project",
    entityId: projectId,
    detail: `${member.user.email} → ${role}`,
  });
  revalidatePath(`/projects`);
  return { ok: `${member.user.email} is now ${role}.` };
}

// Keluarkan anggota dari project. Boleh mengeluarkan diri sendiri (leave),
// kecuali jika ia OWNER terakhir.
export async function removeProjectMember(
  formData: FormData
): Promise<ProjectMemberResult> {
  const projectId = String(formData.get("projectId") ?? "");
  const ctx = await manageContext(projectId);
  if ("error" in ctx) return ctx;

  const userId = String(formData.get("userId") ?? "");
  const member = await db.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId } },
    include: { user: { select: { email: true } } },
  });
  if (!member) return { error: "Member not found." };

  if (member.role === "OWNER" && (await ownerCount(projectId, userId)) === 0)
    return { error: "Can't remove the last owner. Assign another owner first." };

  await db.projectMember.delete({
    where: { projectId_userId: { projectId, userId } },
  });
  await logAudit({
    userId: ctx.session.userId,
    action: "project.member_remove",
    entityType: "project",
    entityId: projectId,
    detail: member.user.email,
  });
  revalidatePath(`/projects`);
  return { ok: `${member.user.email} removed from the project.` };
}
