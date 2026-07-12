import Link from "next/link";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { loadStatusDefsForProjects } from "@/lib/result-status-defs";
import { statusMeta } from "@/lib/result-statuses";
import { bucketStatus, isMuted, NON_EXECUTED_BUCKETS } from "@/lib/mute";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await requireSession();
  const me = await db.user.findUnique({
    where: { id: session.userId },
    select: { organizationId: true },
  });

  // Tenant isolation: every stat is scoped to the user's projects (membership),
  // and recent activity to their organization.
  const mine = { members: { some: { userId: session.userId } } };
  const logScope = me?.organizationId
    ? { user: { organizationId: me.organizationId } }
    : { userId: session.userId };

  const [projects, totalCases, activeRuns, recentResults, recentLogs] =
    await Promise.all([
      db.project.findMany({
        where: { status: "ACTIVE", ...mine },
        include: { _count: { select: { cases: true, runs: true } } },
        orderBy: { createdAt: "desc" },
      }),
      db.testCase.count({ where: { deletedAt: null, project: mine } }),
      db.testRun.findMany({
        where: { status: "ACTIVE", project: mine },
        include: {
          project: true,
          results: { include: { testCase: { select: { mutedAt: true } } } },
        },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
      // F-21: fetched raw (not groupBy) so a muted case's results can be
      // bucketed as "MUTED" in JS before counting toward the KPI below.
      // F-14: projectId comes along so kind lookups use that project's defs.
      db.testRunResult.findMany({
        select: {
          status: true,
          testCase: { select: { mutedAt: true } },
          run: { select: { projectId: true } },
        },
        where: { run: { project: mine } },
      }),
      db.auditLog.findMany({
        where: logScope,
        include: { user: true },
        orderBy: { createdAt: "desc" },
        take: 8,
      }),
    ]);

  // F-14: per-project status defs (colors for the run bars, kinds for the KPI).
  const defsByProject = await loadStatusDefsForProjects([
    ...Array.from(new Set(recentResults.map((r) => r.run.projectId))),
    ...activeRuns.map((r) => r.projectId),
  ]);
  const metaOf = (projectId: string) =>
    statusMeta(defsByProject.get(projectId) ?? []);

  // F-21: bucket a muted case's result as "MUTED" — excluded from the KPI.
  // F-14: pass tally keys off each project's status KINDS, not the raw key.
  let executed = 0;
  let passedCount = 0;
  let failedCount = 0;
  for (const r of recentResults) {
    const b = bucketStatus(r.status, isMuted(r.testCase?.mutedAt));
    if (NON_EXECUTED_BUCKETS.includes(b)) continue;
    executed++;
    const kind = metaOf(r.run.projectId).kindOf(r.status);
    if (kind === "PASS") passedCount++;
    else if (kind === "FAIL") failedCount++;
  }
  const passRate = executed ? Math.round((passedCount / executed) * 100) : 0;

  const stats = [
    { label: "Active Projects", value: projects.length },
    { label: "Total Test Cases", value: totalCases },
    { label: "Pass Rate", value: `${passRate}%` },
    { label: "Failed", value: failedCount },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-sm text-slate-500">
          Overview of all projects and recent testing activity
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s) => (
          <div
            key={s.label}
            className="rounded-xl border border-slate-200 bg-white p-5"
          >
            <p className="text-sm text-slate-500">{s.label}</p>
            <p className="mt-1 text-3xl font-bold">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="mb-4 font-semibold">Active Test Runs</h2>
          {activeRuns.length === 0 && (
            <p className="text-sm text-slate-400">No active test runs yet.</p>
          )}
          <div className="space-y-4">
            {activeRuns.map((run) => {
              const total = run.results.length || 1;
              const buckets = run.results.map((r) =>
                bucketStatus(r.status, isMuted(r.testCase.mutedAt))
              );
              const done = buckets.filter(
                (b) => !NON_EXECUTED_BUCKETS.includes(b)
              ).length;
              return (
                <Link
                  key={run.id}
                  href={`/projects/${run.project.slug}/runs/${run.id}`}
                  className="block rounded-lg border border-slate-100 p-3 hover:border-indigo-200 hover:bg-indigo-50/30"
                >
                  <div className="flex items-center justify-between">
                    <p className="font-medium">{run.name}</p>
                    <span className="text-xs text-slate-400">
                      {run.project.name}
                    </span>
                  </div>
                  <div className="mt-2 flex h-2 overflow-hidden rounded-full bg-gray-100">
                    {(() => {
                      const defs = defsByProject.get(run.projectId) ?? [];
                      const { colorOf } = metaOf(run.projectId);
                      const keys = [
                        ...defs
                          .filter((d) => !["UNTESTED", "IN_PROGRESS"].includes(d.key))
                          .map((d) => d.key),
                        "MUTED",
                      ];
                      return keys.map((st) => {
                        const count = buckets.filter((b) => b === st).length;
                        if (!count) return null;
                        return (
                          <div
                            key={st}
                            style={{
                              backgroundColor: colorOf(st),
                              width: `${(count / total) * 100}%`,
                            }}
                          />
                        );
                      });
                    })()}
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    {done}/{run.results.length} executed
                  </p>
                </Link>
              );
            })}
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="mb-4 font-semibold">Activity Feed</h2>
          {recentLogs.length === 0 && (
            <p className="text-sm text-slate-400">No activity yet.</p>
          )}
          <ul className="space-y-3">
            {recentLogs.map((log) => (
              <li key={log.id} className="flex items-start gap-3 text-sm">
                <span className="mt-0.5 inline-block h-2 w-2 shrink-0 rounded-full bg-indigo-400" />
                <div>
                  <span className="font-medium">{log.user?.name ?? "System"}</span>{" "}
                  <span className="text-slate-500">{log.action}</span>
                  {log.detail && (
                    <span className="text-slate-700"> — {log.detail}</span>
                  )}
                  <p className="text-xs text-slate-400">
                    {log.createdAt.toLocaleString("en-US")}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-semibold">Projects</h2>
          <Link
            href="/projects"
            className="text-sm text-indigo-600 hover:underline"
          >
            View all →
          </Link>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {projects.slice(0, 6).map((p) => (
            <Link
              key={p.id}
              href={`/projects/${p.slug}`}
              className="rounded-lg border border-slate-100 p-4 hover:border-indigo-200 hover:bg-indigo-50/30"
            >
              <p className="font-medium">{p.name}</p>
              <p className="mt-1 text-xs text-slate-500">
                {p._count.cases} test cases · {p._count.runs} runs
              </p>
            </Link>
          ))}
          {projects.length === 0 && (
            <p className="text-sm text-slate-400">
              No projects yet.{" "}
              <Link href="/projects" className="text-indigo-600 hover:underline">
                Create your first project
              </Link>
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
