import Link from "next/link";
import { TFIcon } from "@/components/icons";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { memberScope } from "@/lib/projects";
import { RESULT_COLORS } from "@/lib/constants";
import { parseRunConfig, configLabel } from "@/lib/plans";
import { ProjectTabs } from "@/components/ProjectTabs";
import { createMilestone } from "@/app/actions/projects";

export const dynamic = "force-dynamic";

export default async function RunsPage({
  params,
}: {
  params: { slug: string };
}) {
  const session = await requireSession();
  const project = await db.project.findFirst({
    where: { slug: params.slug, ...memberScope(session.userId) },
    include: {
      runs: {
        include: { results: true, milestone: true, createdBy: true },
        orderBy: { createdAt: "desc" },
      },
      milestones: { include: { runs: true } },
    },
  });
  if (!project) notFound();

  return (
    <div className="space-y-6">
      <ProjectTabs slug={project.slug} name={project.name} active="runs" />

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Test Runs</h2>
        <Link
          href={`/projects/${project.slug}/runs/new`}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          + New Test Run
        </Link>
      </div>

      <div className="space-y-3">
        {project.runs.map((run) => {
          const total = run.results.length || 1;
          const done = run.results.filter(
            (r) => !["UNTESTED", "IN_PROGRESS"].includes(r.status)
          ).length;
          return (
            <Link
              key={run.id}
              href={`/projects/${project.slug}/runs/${run.id}`}
              className="block rounded-xl border border-slate-200 bg-white p-5 hover:border-indigo-300"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">
                    {run.name}{" "}
                    {run.source !== "MANUAL" && (
                      <span className="ml-1 rounded bg-blue-100 px-1.5 py-0.5 text-xs text-blue-700">
                        <span className="inline-flex items-center gap-1"><TFIcon name="automation" className="h-3.5 w-3.5" /> {run.source}</span>
                      </span>
                    )}
                    {run.origin && (
                      <span className="ml-1 rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-600">
                        {run.origin}
                      </span>
                    )}
                    {/* F-06: plan child runs show their config combo */}
                    {run.planId && parseRunConfig(run.configJson) && (
                      <span className="ml-1 rounded bg-indigo-50 px-1.5 py-0.5 text-xs text-indigo-700">
                        {configLabel(parseRunConfig(run.configJson))}
                      </span>
                    )}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-400">
                    {run.createdBy.name} · {run.createdAt.toLocaleDateString("en-US")}
                    {run.milestone && <> · {run.milestone.name}</>}
                  </p>
                </div>
                <div className="text-right">
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                      run.status === "COMPLETED"
                        ? "bg-green-100 text-green-700"
                        : "bg-blue-100 text-blue-700"
                    }`}
                  >
                    {run.status === "COMPLETED" ? "Completed" : "Active"}
                  </span>
                  <p className="mt-1 text-xs text-slate-400">
                    {done}/{run.results.length} executed
                  </p>
                </div>
              </div>
              <div className="mt-3 flex h-2.5 overflow-hidden rounded-full bg-gray-100">
                {["PASSED", "FAILED", "BLOCKED", "RETEST", "SKIPPED", "IN_PROGRESS"].map(
                  (st) => {
                    const count = run.results.filter((r) => r.status === st).length;
                    if (!count) return null;
                    return (
                      <div
                        key={st}
                        className={RESULT_COLORS[st]}
                        style={{ width: `${(count / total) * 100}%` }}
                        title={`${st}: ${count}`}
                      />
                    );
                  }
                )}
              </div>
            </Link>
          );
        })}
        {project.runs.length === 0 && (
          <p className="rounded-xl border border-dashed border-slate-300 p-10 text-center text-sm text-slate-400">
            No test runs yet. Create a new run or upload automation results via the API.
          </p>
        )}
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <h3 className="mb-3 flex items-center gap-2 font-semibold"><TFIcon name="target" className="h-5 w-5" /> Milestones</h3>
        <ul className="mb-4 space-y-2 text-sm">
          {project.milestones.map((m) => (
            <li key={m.id} className="flex items-center justify-between">
              <span>{m.name}</span>
              <span className="text-xs text-slate-400">
                {m.runs.length} run
                {m.dueDate && <> · due {m.dueDate.toLocaleDateString("en-US")}</>}
              </span>
            </li>
          ))}
          {project.milestones.length === 0 && (
            <p className="text-slate-400">No milestones yet.</p>
          )}
        </ul>
        <form action={createMilestone} className="flex gap-2">
          <input type="hidden" name="projectId" value={project.id} />
          <input
            name="name"
            required
            placeholder="Milestone name, e.g. Release v2.0"
            className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
          />
          <input type="date" name="dueDate" className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          <button className="rounded-lg bg-slate-800 px-4 py-2 text-sm text-white hover:bg-slate-700">
            + Milestone
          </button>
        </form>
      </section>
    </div>
  );
}
