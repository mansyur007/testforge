import Link from "next/link";
import { TFIcon } from "@/components/icons";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { memberScope } from "@/lib/projects";
import { parseRunConfig, configLabel } from "@/lib/plans";
import { loadEnvironments } from "@/lib/environments";
import { loadStatusDefs } from "@/lib/result-status-defs";
import { statusMeta } from "@/lib/result-statuses";
import { bucketStatus, isMuted, NON_EXECUTED_BUCKETS } from "@/lib/mute";
import { ProjectTabs } from "@/components/ProjectTabs";
import {
  CompareProvider,
  CompareCheckbox,
  CompareBar,
} from "@/components/RunCompare";
import { createMilestone } from "@/app/actions/projects";

export const dynamic = "force-dynamic";

export default async function RunsPage({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams: { env?: string };
}) {
  const session = await requireSession();
  const project = await db.project.findFirst({
    where: { slug: params.slug, ...memberScope(session.userId) },
    include: {
      runs: {
        include: {
          results: { include: { testCase: { select: { mutedAt: true } } } },
          milestone: true,
          createdBy: true,
          environment: true,
        },
        orderBy: { createdAt: "desc" },
      },
      milestones: { include: { runs: true } },
    },
  });
  if (!project) notFound();

  // F-19: filter chip by environment.
  const environments = await loadEnvironments(project.id);
  const activeEnv = searchParams.env ?? "";
  const filteredRuns = activeEnv
    ? project.runs.filter((r) => r.environmentId === activeEnv)
    : project.runs;

  // F-14: colors + bar order come from the project's status defs.
  const statusDefs = await loadStatusDefs(project.id);
  const { colorOf, labelOf } = statusMeta(statusDefs);
  const barKeys = [
    ...statusDefs.filter((d) => d.key !== "UNTESTED").map((d) => d.key),
    "MUTED",
  ];

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

      {environments.length > 0 && (
        <div className="flex flex-wrap gap-2" data-testid="env-filter-chips">
          <Link
            href={`/projects/${project.slug}/runs`}
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              !activeEnv
                ? "bg-indigo-600 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            All
          </Link>
          {environments.map((e) => (
            <Link
              key={e.id}
              href={`/projects/${project.slug}/runs?env=${e.id}`}
              data-testid={`env-filter-${e.name}`}
              className={`rounded-full px-3 py-1 text-xs font-medium ${
                activeEnv === e.id
                  ? "bg-indigo-600 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {e.name}
            </Link>
          ))}
        </div>
      )}

      {/* F-17: check two runs -> Compare A -> B */}
      <CompareProvider>
      <CompareBar slug={project.slug} />
      <div className="space-y-3">
        {filteredRuns.map((run) => {
          const total = run.results.length || 1;
          // F-21: muted cases bucket separately, excluded from "executed".
          const buckets = run.results.map((r) =>
            bucketStatus(r.status, isMuted(r.testCase.mutedAt))
          );
          const done = buckets.filter(
            (b) => !NON_EXECUTED_BUCKETS.includes(b)
          ).length;
          return (
            <div key={run.id} className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2">
              <CompareCheckbox runId={run.id} />
            </div>
            <Link
              href={`/projects/${project.slug}/runs/${run.id}`}
              className="block rounded-xl border border-slate-200 bg-white p-5 pl-12 hover:border-indigo-300"
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
                    {run.environment && (
                      <span
                        className="ml-1 rounded bg-teal-50 px-1.5 py-0.5 text-xs text-teal-700"
                        data-testid="run-env-badge"
                      >
                        {run.environment.name}
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
                {barKeys.map((st) => {
                  const count = buckets.filter((b) => b === st).length;
                  if (!count) return null;
                  return (
                    <div
                      key={st}
                      style={{
                        backgroundColor: colorOf(st),
                        width: `${(count / total) * 100}%`,
                      }}
                      title={`${labelOf(st)}: ${count}`}
                    />
                  );
                })}
              </div>
            </Link>
            </div>
          );
        })}
        {filteredRuns.length === 0 && (
          <p className="rounded-xl border border-dashed border-slate-300 p-10 text-center text-sm text-slate-400">
            {activeEnv
              ? "No runs tagged with this environment."
              : "No test runs yet. Create a new run or upload automation results via the API."}
          </p>
        )}
      </div>
      </CompareProvider>

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
