import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { TeamManager } from "@/components/TeamManager";

export const dynamic = "force-dynamic";

export default async function TeamPage() {
  const session = await requireSession();
  const me = await db.user.findUniqueOrThrow({
    where: { id: session.userId },
    select: { organizationId: true, role: true },
  });

  if (!me.organizationId) {
    return (
      <div className="max-w-2xl space-y-2">
        <h1 className="text-2xl font-bold">Team</h1>
        <p className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-500">
          You are not part of an organization yet. Create a project to set one
          up, then come back here to invite your team.
        </p>
      </div>
    );
  }

  const [org, members, invitations] = await Promise.all([
    db.organization.findUnique({ where: { id: me.organizationId } }),
    db.user.findMany({
      where: { organizationId: me.organizationId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        emailVerifiedAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: "asc" },
    }),
    db.invitation.findMany({
      where: { organizationId: me.organizationId, status: "PENDING" },
      select: { id: true, email: true, role: true, createdAt: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return (
    <TeamManager
      orgName={org?.name ?? "Your organization"}
      isAdmin={me.role === "ADMIN"}
      currentUserId={session.userId}
      members={members.map((m) => ({
        ...m,
        emailVerified: !!m.emailVerifiedAt,
        joinedAt: m.createdAt.toISOString(),
      }))}
      invitations={invitations.map((i) => ({
        ...i,
        invitedAt: i.createdAt.toISOString(),
      }))}
    />
  );
}
