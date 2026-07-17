import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { memberScope } from "@/lib/projects";
import { loadPerms } from "@/lib/permissions";
import { buildSuitePathMap } from "@/lib/baselines";
import { ProjectTabs } from "@/components/ProjectTabs";
import { createBaselineAction } from "@/app/actions/baselines";

export const dynamic = "force-dynamic";

export default async function BaselinesPage({
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
  const canEdit = perms.has("case.write");

  const [baselines, suites] = await Promise.all([
    db.suiteBaseline.findMany({
      where: { projectId: project.id },
      include: { createdBy: { select: { name: true } }, _count: { select: { entries: true, runs: true } } },
      orderBy: { createdAt: "desc" },
    }),
    db.testSuite.findMany({ where: { projectId: project.id }, orderBy: { order: "asc" } }),
  ]);
  const pathOf = buildSuitePathMap(suites);

  return (
    <div className="space-y-6">
      <ProjectTabs slug={project.slug} name={project.name} active="baselines" />

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Suite Baselines</h2>
      </div>
      <p className="text-sm text-slate-500">
        Snapshot a suite tree (with each case&apos;s current revision) as a named baseline —
        test an older release in parallel with current work, and see exactly what changed
        since.
      </p>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-xs uppercase text-slate-400">
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Scope</th>
              <th className="px-4 py-3">Cases</th>
              <th className="px-4 py-3">Runs from it</th>
              <th className="px-4 py-3">Created by</th>
            </tr>
          </thead>
          <tbody>
            {baselines.map((b) => (
              <tr
                key={b.id}
                className="border-b border-slate-100 last:border-0"
                data-testid={`baseline-row-${b.name}`}
              >
                <td className="px-4 py-2.5">
                  <Link
                    href={`/projects/${project.slug}/baselines/${b.id}`}
                    className="text-indigo-600 hover:underline"
                  >
                    {b.name}
                  </Link>
                </td>
                <td className="px-4 py-2.5 text-slate-500">
                  {b.suiteId ? pathOf.get(b.suiteId) ?? "(deleted suite)" : "Whole project"}
                </td>
                <td className="px-4 py-2.5 text-slate-500">{b._count.entries}</td>
                <td className="px-4 py-2.5 text-slate-500">{b._count.runs}</td>
                <td className="px-4 py-2.5 text-slate-500">{b.createdBy.name}</td>
              </tr>
            ))}
            {baselines.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-slate-400">
                  No baselines yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {canEdit && (
        <section className="max-w-xl rounded-xl border border-slate-200 bg-white p-6">
          <h3 className="mb-3 font-semibold">Create baseline</h3>
          <form action={createBaselineAction} className="space-y-2">
            <input type="hidden" name="projectId" value={project.id} />
            <input
              name="name"
              required
              placeholder="e.g. Release 2.3"
              data-testid="baseline-name-input"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
            <select
              name="suiteId"
              defaultValue=""
              data-testid="baseline-suite-select"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="">Whole project</option>
              {suites
                .filter((s) => !s.parentId)
                .map((s) => (
                  <optgroup key={s.id} label={s.name}>
                    <option value={s.id}>{s.name}</option>
                    {suites
                      .filter((c) => c.parentId === s.id)
                      .map((c) => (
                        <option key={c.id} value={c.id}>
                          — {c.name}
                        </option>
                      ))}
                  </optgroup>
                ))}
            </select>
            <button
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
              data-testid="baseline-create-button"
            >
              + Baseline
            </button>
          </form>
        </section>
      )}
    </div>
  );
}
