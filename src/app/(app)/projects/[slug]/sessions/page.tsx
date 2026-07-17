import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { memberScope } from "@/lib/projects";
import { loadPerms } from "@/lib/permissions";
import { ProjectTabs } from "@/components/ProjectTabs";
import { startSession } from "@/app/actions/sessions";

export const dynamic = "force-dynamic";

const STATUS_BADGE: Record<string, string> = {
  ACTIVE: "bg-green-100 text-green-800",
  ENDED: "bg-slate-100 text-slate-500",
};

export default async function SessionsPage({
  params,
}: {
  params: { slug: string };
}) {
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
      <ProjectTabs slug={project.slug} name={project.name} active="sessions" />

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Exploratory Sessions</h2>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-xs uppercase text-slate-400">
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
                className="border-b border-slate-100 last:border-0"
                data-testid={`session-row-${s.id}`}
              >
                <td className="px-4 py-2.5">
                  <Link
                    href={`/projects/${project.slug}/sessions/${s.id}`}
                    className="text-indigo-600 hover:underline"
                  >
                    {s.charter}
                  </Link>
                </td>
                <td className="px-4 py-2.5 text-slate-500">{s.tester.name}</td>
                <td className="px-4 py-2.5 text-slate-500">{s.timeboxMinutes}m</td>
                <td className="px-4 py-2.5 text-slate-500">{s._count.notes}</td>
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
                <td colSpan={5} className="px-4 py-10 text-center text-slate-400">
                  No exploratory sessions yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {canStart && (
        <section className="max-w-xl rounded-xl border border-slate-200 bg-white p-6">
          <h3 className="mb-3 font-semibold">Start a session</h3>
          <form action={startSession} className="space-y-2">
            <input type="hidden" name="projectId" value={project.id} />
            <textarea
              name="charter"
              required
              rows={2}
              placeholder="Charter — what are you exploring? e.g. Explore checkout on mobile Safari"
              data-testid="session-charter-input"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
            <div className="flex items-center gap-2">
              <label className="text-xs text-slate-500">Timebox</label>
              <input
                name="timeboxMinutes"
                type="number"
                min={5}
                max={240}
                defaultValue={30}
                data-testid="session-timebox-input"
                className="w-24 rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
              />
              <span className="text-xs text-slate-400">minutes</span>
            </div>
            <button
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
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
