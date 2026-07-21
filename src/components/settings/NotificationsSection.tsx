import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { memberScope, getProjectRole, canManageMembers } from "@/lib/projects";
import { WEBHOOK_EVENTS } from "@/lib/webhooks";
import { readChannelConfig } from "@/lib/notifications";
import {
  NotificationChannelsManager,
  type ChannelView,
} from "@/components/NotificationChannelsManager";
import { SCHEDULE_CRONS, parseRecipients } from "@/lib/report-schedules";
import {
  createReportSchedule,
  deleteReportSchedule,
} from "@/app/actions/report-schedules";

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

export async function NotificationsSection({
  params,
}: {
  params: { slug: string };
  /** Unused here; kept so every section shares one call signature. */
  searchParams?: Record<string, string | undefined>;
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

  // F-17: scheduled email report summaries (admin-only, like channels).
  const schedules = isAdmin
    ? await db.reportSchedule.findMany({
        where: { projectId: project.id },
        orderBy: { createdAt: "desc" },
      })
    : [];

  return (
    <div className="space-y-6">

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

      {/* F-17: scheduled email report summaries. */}
      {isAdmin && (
        <section className="rounded-xl border border-slate-200 bg-white p-6">
          <h3 className="mb-1 font-semibold">Scheduled email reports</h3>
          <p className="mb-4 text-xs text-slate-400">
            A KPI summary (pass rate, executions, top failures) emailed on a
            schedule. Requires the <code>/api/cron/send-reports</code> job.
          </p>
          <ul className="mb-4 space-y-2 text-sm">
            {schedules.map((s) => {
              const recipients = parseRecipients(s.recipientsJson);
              return (
                <li
                  key={s.id}
                  className="flex flex-wrap items-center gap-2"
                  data-testid={`report-schedule-row-${s.id}`}
                >
                  <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700">
                    {SCHEDULE_CRONS.find((c) => c.key === s.cron)?.label ?? s.cron}
                  </span>
                  <span className="text-slate-600">
                    {recipients.length === 1
                      ? recipients[0]
                      : `${recipients[0]} +${recipients.length - 1}`}
                  </span>
                  <span className="text-xs text-slate-400">
                    {s.lastSentAt
                      ? `last sent ${s.lastSentAt.toLocaleDateString("en-US")}`
                      : "never sent"}
                  </span>
                  <form action={deleteReportSchedule} className="inline">
                    <input type="hidden" name="scheduleId" value={s.id} />
                    <button
                      className="rounded border border-red-200 px-2 py-0.5 text-xs text-red-600 hover:bg-red-50"
                      data-testid={`report-schedule-delete-${s.id}`}
                    >
                      Delete
                    </button>
                  </form>
                </li>
              );
            })}
            {schedules.length === 0 && (
              <li className="text-xs text-slate-400">No schedules yet.</li>
            )}
          </ul>
          <form
            action={createReportSchedule}
            className="flex flex-wrap items-center gap-2"
          >
            <input type="hidden" name="projectId" value={project.id} />
            <select
              name="cron"
              className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm"
              data-testid="report-schedule-cron-select"
            >
              {SCHEDULE_CRONS.map((c) => (
                <option key={c.key} value={c.key}>
                  {c.label}
                </option>
              ))}
            </select>
            <input
              name="recipients"
              required
              placeholder="Recipients, comma-separated emails"
              data-testid="report-schedule-recipients-input"
              className="min-w-64 flex-1 rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:border-indigo-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            />
            <button
              className="rounded-lg bg-slate-800 px-3 py-1.5 text-sm text-white hover:bg-slate-700"
              data-testid="report-schedule-create-button"
            >
              + Schedule
            </button>
          </form>
        </section>
      )}
    </div>
  );
}
