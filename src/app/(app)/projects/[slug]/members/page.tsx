import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { memberScope, getProjectRole, canManageMembers } from "@/lib/projects";
import { ProjectTabs } from "@/components/ProjectTabs";
import { ProjectMembersManager } from "@/components/ProjectMembersManager";

export const dynamic = "force-dynamic";

export default async function ProjectMembersPage({
  params,
}: {
  params: { slug: string };
}) {
  const session = await requireSession();
  const project = await db.project.findFirst({
    where: { slug: params.slug, ...memberScope(session.userId) },
    select: { id: true, slug: true, name: true },
  });
  if (!project) notFound();

  const myRole = await getProjectRole(session.userId, project.id);
  const canManage = canManageMembers(myRole);

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

  return (
    <div className="space-y-6">
      <ProjectTabs slug={project.slug} name={project.name} active="members" />
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
      />
    </div>
  );
}
