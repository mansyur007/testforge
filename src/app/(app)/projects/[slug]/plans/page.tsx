import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { memberScope } from "@/lib/projects";
import { RESULT_COLORS } from "@/lib/constants";
import { aggregateResults } from "@/lib/plans";
import { ProjectTabs } from "@/components/ProjectTabs";

export const dynamic = "force-dynamic";

// F-06: plans list — one card per plan with the aggregate progress bar summed
// across all child runs (same color coding as the runs list).
export default async function PlansPage({
  params,
}: {
  params: { slug: string };
}) {
  const session = await requireSession();
  const project = await db.project.findFirst({
    where: { slug: params.slug, ...memberScope(session.userId) },
    include: {
      testPlans: {
        include: {
          milestone: true,
          createdBy: true,
          runs: { include: { results: { select: { status: true } } } },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });
  if (!project) notFound();

  return (
    <div className="space-y-6">
      <ProjectTabs slug={project.slug} name={project.name} active="plans" />

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Test Plans</h2>
        <Link
          href={`/projects/${project.slug}/plans/new`}
          data-testid="plan-new"
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          + New Test Plan
        </Link>
      </div>

      <div className="space-y-3">
        {project.testPlans.map((plan) => {
          const counts = aggregateResults(plan.runs);
          const totalRaw = Object.values(counts).reduce((n, c) => n + c, 0);
          const total = totalRaw || 1; // avoid /0 in the bar widths
          const done = Object.entries(counts)
            .filter(([st]) => !["UNTESTED", "IN_PROGRESS"].includes(st))
            .reduce((n, [, c]) => n + c, 0);
          return (
            <Link
              key={plan.id}
              href={`/projects/${project.slug}/plans/${plan.id}`}
              className="block rounded-xl border border-slate-200 bg-white p-5 hover:border-indigo-300"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{plan.name}</p>
                  <p className="mt-0.5 text-xs text-slate-400">
                    {plan.createdBy.name} ·{" "}
                    {plan.createdAt.toLocaleDateString("en-US")} ·{" "}
                    {plan.runs.length} run{plan.runs.length === 1 ? "" : "s"}
                    {plan.milestone && <> · {plan.milestone.name}</>}
                  </p>
                </div>
                <div className="text-right">
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                      plan.status === "COMPLETED"
                        ? "bg-green-100 text-green-700"
                        : "bg-blue-100 text-blue-700"
                    }`}
                  >
                    {plan.status === "COMPLETED" ? "Completed" : "Active"}
                  </span>
                  <p className="mt-1 text-xs text-slate-400">
                    {done}/{totalRaw} executed
                  </p>
                </div>
              </div>
              <div className="mt-3 flex h-2.5 overflow-hidden rounded-full bg-gray-100">
                {["PASSED", "FAILED", "BLOCKED", "RETEST", "SKIPPED", "IN_PROGRESS"].map(
                  (st) =>
                    counts[st] ? (
                      <div
                        key={st}
                        className={RESULT_COLORS[st]}
                        style={{ width: `${(counts[st] / total) * 100}%` }}
                        title={`${st}: ${counts[st]}`}
                      />
                    ) : null
                )}
              </div>
            </Link>
          );
        })}
        {project.testPlans.length === 0 && (
          <p className="rounded-xl border border-dashed border-slate-300 p-10 text-center text-sm text-slate-400">
            No test plans yet. A plan bundles runs generated from one case
            selection across a configuration matrix (e.g. Browser × OS).
          </p>
        )}
      </div>
    </div>
  );
}
