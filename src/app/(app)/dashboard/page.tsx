import Link from "next/link";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { RESULT_COLORS } from "@/lib/constants";

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
        include: { project: true, results: true },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
      db.testRunResult.groupBy({
        by: ["status"],
        _count: { status: true },
        where: { run: { project: mine } },
      }),
      db.auditLog.findMany({
        where: logScope,
        include: { user: true },
        orderBy: { createdAt: "desc" },
        take: 8,
      }),
    ]);

  const statusCounts = Object.fromEntries(
    recentResults.map((r) => [r.status, r._count.status])
  );
  const executed =
    (statusCounts.PASSED ?? 0) + (statusCounts.FAILED ?? 0) +
    (statusCounts.BLOCKED ?? 0) + (statusCounts.SKIPPED ?? 0) +
    (statusCounts.RETEST ?? 0);
  const passRate = executed
    ? Math.round(((statusCounts.PASSED ?? 0) / executed) * 100)
    : 0;

  const stats = [
    { label: "Active Projects", value: projects.length },
    { label: "Total Test Cases", value: totalCases },
    { label: "Pass Rate", value: `${passRate}%` },
    { label: "Failed", value: statusCounts.FAILED ?? 0 },
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
              const done = run.results.filter(
                (r) => r.status !== "UNTESTED" && r.status !== "IN_PROGRESS"
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
                    {["PASSED", "FAILED", "BLOCKED", "RETEST", "SKIPPED"].map(
                      (st) => {
                        const count = run.results.filter(
                          (r) => r.status === st
                        ).length;
                        if (!count) return null;
                        return (
                          <div
                            key={st}
                            className={RESULT_COLORS[st]}
                            style={{ width: `${(count / total) * 100}%` }}
                          />
                        );
                      }
                    )}
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
