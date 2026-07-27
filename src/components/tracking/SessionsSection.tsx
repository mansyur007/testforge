import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { memberScope } from "@/lib/projects";
import { loadPerms } from "@/lib/permissions";
import { startSession } from "@/app/actions/sessions";
import type { SectionProps } from "@/lib/section-props";

const STATUS_BADGE: Record<string, string> = {
  ACTIVE: "bg-success-soft text-success-soft-fg",
  ENDED: "bg-surface-muted text-content-muted",
};

export async function SessionsSection({ params }: SectionProps) {
  const session = await requireSession();
  const project = await db.project.findFirst({
    where: { slug: params.slug, ...memberScope(session.userId) },
  });
  if (!project) notFound();
  const perms = await loadPerms(session.userId, project.id);
  const canStart = perms.has("run.execute");

  const sessions = await db.session.findMany({
    where: { projectId: project.id },
    include: {
      tester: { select: { name: true } },
      _count: { select: { notes: true } },
    },
    orderBy: { startedAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Exploratory Sessions</h2>
      </div>

      <div className="overflow-x-auto rounded-xl border border-hairline bg-surface">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-hairline text-left text-xs uppercase text-content-subtle">
              <th className="px-4 py-3">Charter</th>
              <th className="px-4 py-3">Tester</th>
              <th className="px-4 py-3">Timebox</th>
              <th className="px-4 py-3">Notes</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {sessions.map((s) => (
              <tr
                key={s.id}
                className="border-b border-hairline-subtle last:border-0"
                data-testid={`session-row-${s.id}`}
              >
                <td className="px-4 py-2.5">
                  <Link
                    href={`/projects/${project.slug}/sessions/${s.id}`}
                    className="text-accent-text hover:underline"
                  >
                    {s.charter}
                  </Link>
                </td>
                <td className="px-4 py-2.5 text-content-muted">{s.tester.name}</td>
                <td className="px-4 py-2.5 text-content-muted">{s.timeboxMinutes}m</td>
                <td className="px-4 py-2.5 text-content-muted">{s._count.notes}</td>
                <td className="px-4 py-2.5">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_BADGE[s.status]}`}
                  >
                    {s.status}
                  </span>
                </td>
              </tr>
            ))}
            {sessions.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-content-subtle">
                  No exploratory sessions yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {canStart && (
        <section className="max-w-xl rounded-xl border border-hairline bg-surface p-6">
          <h3 className="mb-3 font-semibold">Start a session</h3>
          <form action={startSession} className="space-y-2">
            <input type="hidden" name="projectId" value={project.id} />
            <textarea
              name="charter"
              required
              rows={2}
              placeholder="Charter — what are you exploring? e.g. Explore checkout on mobile Safari"
              data-testid="session-charter-input"
              className="bg-surface text-content-strong w-full rounded-lg border border-hairline-strong px-3 py-2 text-sm"
            />
            <div className="flex items-center gap-2">
              <label className="text-xs text-content-muted">Timebox</label>
              <input
                name="timeboxMinutes"
                type="number"
                min={5}
                max={240}
                defaultValue={30}
                data-testid="session-timebox-input"
                className="bg-surface text-content-strong w-24 rounded-lg border border-hairline-strong px-3 py-1.5 text-sm"
              />
              <span className="text-xs text-content-subtle">minutes</span>
            </div>
            <button
              className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover"
              data-testid="session-start-button"
            >
              Start session
            </button>
          </form>
        </section>
      )}
    </div>
  );
}
