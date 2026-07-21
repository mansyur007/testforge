import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { memberScope } from "@/lib/projects";
import { loadPerms } from "@/lib/permissions";
import { ProjectMembersManager } from "@/components/ProjectMembersManager";

export async function MembersSection({
  params,
}: {
  params: { slug: string };
  /** Unused here; kept so every section shares one call signature. */
  searchParams?: Record<string, string | undefined>;
}) {
  const session = await requireSession();
  const project = await db.project.findFirst({
    where: { slug: params.slug, ...memberScope(session.userId) },
    select: { id: true, slug: true, name: true },
  });
  if (!project) notFound();

  // F-14: central permission check (covers custom roles too).
  const perms = await loadPerms(session.userId, project.id);
  const canManage = perms.has("members.manage");

  const members = await db.projectMember.findMany({
    where: { projectId: project.id },
    include: { user: { select: { id: true, name: true, email: true } } },
    orderBy: { role: "asc" },
  });

  // Kandidat yang bisa ditambahkan: anggota organisasi yang sama & belum jadi
  // anggota project. Hanya relevan jika pengelola punya organisasi.
  const me = await db.user.findUnique({
    where: { id: session.userId },
    select: { organizationId: true },
  });
  const memberIds = new Set(members.map((m) => m.userId));
  const addable =
    canManage && me?.organizationId
      ? (
          await db.user.findMany({
            where: { organizationId: me.organizationId },
            select: { id: true, name: true, email: true },
            orderBy: { name: "asc" },
          })
        ).filter((u) => !memberIds.has(u.id))
      : [];

  // F-14: custom role names are assignable alongside the built-ins.
  const customRoles = me?.organizationId
    ? (
        await db.roleDef.findMany({
          where: { organizationId: me.organizationId },
          select: { name: true },
          orderBy: { name: "asc" },
        })
      ).map((r) => r.name)
    : [];

  return (
    <div className="space-y-6">
      <ProjectMembersManager
        projectId={project.id}
        canManage={canManage}
        currentUserId={session.userId}
        members={members.map((m) => ({
          userId: m.userId,
          name: m.user.name,
          email: m.user.email,
          role: m.role,
        }))}
        addable={addable}
        hasOrg={!!me?.organizationId}
        customRoles={customRoles}
      />
    </div>
  );
}
