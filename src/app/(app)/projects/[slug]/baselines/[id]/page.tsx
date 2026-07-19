import Link from "next/link";
import { BackLink } from "@/components/icons";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { memberScope } from "@/lib/projects";
import { loadPerms } from "@/lib/permissions";
import { caseDisplayId } from "@/lib/constants";
import { compareBaselineToCurrent, buildSuitePathMap } from "@/lib/baselines";
import { ProjectTabs } from "@/components/ProjectTabs";
import { deleteBaseline } from "@/app/actions/baselines";

export const dynamic = "force-dynamic";

const STATUS_BADGE: Record<string, string> = {
  UNCHANGED: "bg-green-100 text-green-800",
  CHANGED: "bg-amber-100 text-amber-800",
  MOVED: "bg-blue-100 text-blue-800",
  DELETED: "bg-red-100 text-red-800",
};

export default async function BaselineDetailPage({
  params,
}: {
  params: { slug: string; id: string };
}) {
  const session = await requireSession();
  const project = await db.project.findFirst({
    where: { slug: params.slug, ...memberScope(session.userId) },
  });
  if (!project) notFound();

  const baseline = await db.suiteBaseline.findFirst({
    where: { id: params.id, projectId: project.id },
    include: { createdBy: { select: { name: true } } },
  });
  if (!baseline) notFound();

  const perms = await loadPerms(session.userId, project.id);
  const canEdit = perms.has("case.write");

  const [comparison, cases, suites] = await Promise.all([
    compareBaselineToCurrent(baseline.id),
    db.testCase.findMany({
      where: { projectId: project.id },
      select: { id: true, seq: true },
    }),
    baseline.suiteId
      ? db.testSuite.findMany({ where: { projectId: project.id } })
      : Promise.resolve([]),
  ]);
  const seqById = new Map(cases.map((c) => [c.id, c.seq]));
  const scopeLabel = baseline.suiteId
    ? buildSuitePathMap(suites).get(baseline.suiteId) ?? "(deleted suite)"
    : "Whole project";

  const changedCount = comparison.filter((r) => r.status !== "UNCHANGED").length;

  return (
    <div className="space-y-6">
      <ProjectTabs slug={project.slug} name={project.name} active="baselines" />

      <div className="flex items-start justify-between gap-4">
        <div>
          <BackLink href={`/projects/${project.slug}/baselines`}>Baselines</BackLink>
          <h2 className="mt-1 text-xl font-bold">{baseline.name}</h2>
          <p className="mt-1 text-sm text-slate-500">
            Scope: <b>{scopeLabel}</b> · {comparison.length} case
            {comparison.length === 1 ? "" : "s"} · created by {baseline.createdBy.name}
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <Link
            href={`/projects/${project.slug}/runs/new`}
            className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700"
            data-testid="baseline-new-run-link"
          >
            Create run from baseline
          </Link>
          {canEdit && (
            <form action={deleteBaseline}>
              <input type="hidden" name="baselineId" value={baseline.id} />
              <button
                className="rounded-lg border border-red-200 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50"
                data-testid="baseline-delete-button"
              >
                Delete
              </button>
            </form>
          )}
        </div>
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-semibold">Compare to current</h3>
          <span
            className="text-xs text-slate-400"
            data-testid="baseline-changed-count"
          >
            {changedCount} of {comparison.length} differ from the baseline
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs uppercase text-slate-400">
                <th className="px-3 py-2">Case</th>
                <th className="px-3 py-2">Suite (then → now)</th>
                <th className="px-3 py-2">Rev (pinned → current)</th>
                <th className="px-3 py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {comparison.map((row) => {
                const seq = seqById.get(row.caseId);
                return (
                  <tr
                    key={row.caseId}
                    className="border-b border-slate-100 last:border-0"
                    data-testid={`baseline-compare-row-${row.caseId}`}
                  >
                    <td className="px-3 py-2">
                      {row.status === "DELETED" || seq === undefined ? (
                        <span className="text-slate-400">{row.title}</span>
                      ) : (
                        <Link
                          href={`/projects/${project.slug}/cases/${row.caseId}`}
                          className="text-indigo-600 hover:underline"
                        >
                          <span className="font-mono text-xs text-slate-400">
                            {caseDisplayId(project.slug, seq)}
                          </span>{" "}
                          {row.title}
                        </Link>
                      )}
                    </td>
                    <td className="px-3 py-2 text-xs text-slate-500">
                      {row.suitePathThen || "(root)"}
                      {row.suitePathNow !== null && row.suitePathNow !== row.suitePathThen && (
                        <> → {row.suitePathNow || "(root)"}</>
                      )}
                    </td>
                    <td className="px-3 py-2 text-xs text-slate-500">
                      {row.pinnedRev}
                      {row.currentRev !== null && row.currentRev !== row.pinnedRev && (
                        <> → {row.currentRev}</>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_BADGE[row.status]}`}
                        data-testid={`baseline-status-${row.caseId}`}
                      >
                        {row.status}
                      </span>
                      {row.changedFields.length > 0 && (
                        <span className="ml-2 text-xs text-slate-400">
                          {row.changedFields.join(", ")}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
