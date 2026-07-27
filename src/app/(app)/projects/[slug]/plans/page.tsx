import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { memberScope } from "@/lib/projects";
import { aggregateResults } from "@/lib/plans";
import { loadStatusDefs } from "@/lib/result-status-defs";
import { statusMeta } from "@/lib/result-statuses";
import { NON_EXECUTED_BUCKETS } from "@/lib/mute";
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
          runs: {
            include: {
              results: {
                select: { status: true, testCase: { select: { mutedAt: true } } },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });
  if (!project) notFound();

  // F-14: colors + bar order come from the project's status defs.
  const statusDefs = await loadStatusDefs(project.id);
  const { colorOf, labelOf } = statusMeta(statusDefs);
  const barKeys = [
    ...statusDefs.filter((d) => d.key !== "UNTESTED").map((d) => d.key),
    "MUTED",
  ];

  return (
    <div className="space-y-6">
      <ProjectTabs slug={project.slug} name={project.name} active="plans" />

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Test Plans</h2>
        <Link
          href={`/projects/${project.slug}/plans/new`}
          data-testid="plan-new"
          className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover"
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
            .filter(([st]) => !NON_EXECUTED_BUCKETS.includes(st))
            .reduce((n, [, c]) => n + c, 0);
          return (
            <Link
              key={plan.id}
              href={`/projects/${project.slug}/plans/${plan.id}`}
              className="block rounded-xl border border-hairline bg-surface p-5 hover:border-accent-ring"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{plan.name}</p>
                  <p className="mt-0.5 text-xs text-content-subtle">
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
                        ? "bg-success-soft text-success-soft-fg"
                        : "bg-info-soft text-info-soft-fg"
                    }`}
                  >
                    {plan.status === "COMPLETED" ? "Completed" : "Active"}
                  </span>
                  <p className="mt-1 text-xs text-content-subtle">
                    {done}/{totalRaw} executed
                  </p>
                </div>
              </div>
              <div className="mt-3 flex h-2.5 overflow-hidden rounded-full bg-surface-muted">
                {barKeys.map((st) =>
                  counts[st] ? (
                    <div
                      key={st}
                      style={{
                        backgroundColor: colorOf(st),
                        width: `${(counts[st] / total) * 100}%`,
                      }}
                      title={`${labelOf(st)}: ${counts[st]}`}
                    />
                  ) : null
                )}
              </div>
            </Link>
          );
        })}
        {project.testPlans.length === 0 && (
          <p className="rounded-xl border border-dashed border-hairline-strong p-10 text-center text-sm text-content-subtle">
            No test plans yet. A plan bundles runs generated from one case
            selection across a configuration matrix (e.g. Browser × OS).
          </p>
        )}
      </div>
    </div>
  );
}
