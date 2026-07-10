import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { memberScope, getProjectRole, canManageMembers } from "@/lib/projects";
import { WEBHOOK_EVENTS } from "@/lib/webhooks";
import { readChannelConfig } from "@/lib/notifications";
import { ProjectTabs } from "@/components/ProjectTabs";
import {
  NotificationChannelsManager,
  type ChannelView,
} from "@/components/NotificationChannelsManager";

export const dynamic = "force-dynamic";

// Masked target summary — the stored webhook URL is a secret and is never
// sent to the client in full.
function targetSummary(type: string, config: { webhookUrl?: string; to?: string[] }) {
  if (type === "EMAIL") {
    const to = config.to ?? [];
    if (!to.length) return "—";
    return to.length === 1 ? to[0] : `${to[0]} +${to.length - 1}`;
  }
  if (!config.webhookUrl) return "—";
  try {
    const u = new URL(config.webhookUrl);
    return `${u.hostname}/…`;
  } catch {
    return "…";
  }
}

export default async function NotificationsPage({
  params,
}: {
  params: { slug: string };
}) {
  const session = await requireSession();
  const project = await db.project.findFirst({
    where: { slug: params.slug, ...memberScope(session.userId) },
  });
  if (!project) notFound();

  const role = await getProjectRole(session.userId, project.id);
  const isAdmin = canManageMembers(role);

  const channels: ChannelView[] = isAdmin
    ? (
        await db.notificationChannel.findMany({
          where: { projectId: project.id },
          orderBy: { createdAt: "desc" },
        })
      ).map((c) => ({
        id: c.id,
        type: c.type,
        name: c.name,
        events: c.events,
        active: c.active,
        target: targetSummary(c.type, readChannelConfig(c)),
      }))
    : [];

  return (
    <div className="space-y-6">
      <ProjectTabs
        slug={project.slug}
        name={project.name}
        active="notifications"
      />

      <div>
        <h2 className="text-lg font-bold">Notifications</h2>
        <p className="text-sm text-slate-500">
          Push run and case events to Slack, Discord, Microsoft Teams, or
          email.
        </p>
      </div>

      {isAdmin ? (
        <NotificationChannelsManager
          projectId={project.id}
          channels={channels}
          availableEvents={WEBHOOK_EVENTS}
        />
      ) : (
        <p className="rounded-xl border border-dashed border-slate-300 p-10 text-center text-sm text-slate-400">
          Only project owners and admins can manage notification channels.
        </p>
      )}
    </div>
  );
}
