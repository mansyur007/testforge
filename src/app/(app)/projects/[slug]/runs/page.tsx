import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { RESULT_COLORS } from "@/lib/constants";
import { ProjectTabs } from "@/components/ProjectTabs";
import { createMilestone } from "@/app/actions/projects";

export const dynamic = "force-dynamic";

export default async function RunsPage({
  params,
}: {
  params: { slug: string };
}) {
  await requireSession();
  const project = await db.project.findUnique({
    where: { slug: params.slug },
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
          + Test Run Baru
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
                        🤖 {run.source}
                      </span>
                    )}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-400">
                    {run.createdBy.name} · {run.createdAt.toLocaleDateString("id-ID")}
                    {run.milestone && <> · 🎯 {run.milestone.name}</>}
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
                    {run.status === "COMPLETED" ? "Selesai" : "Aktif"}
                  </span>
                  <p className="mt-1 text-xs text-slate-400">
                    {done}/{run.results.length} dieksekusi
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
            Belum ada test run. Buat run baru atau upload hasil automation via API.
          </p>
        )}
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <h3 className="mb-3 font-semibold">🎯 Milestones</h3>
        <ul className="mb-4 space-y-2 text-sm">
          {project.milestones.map((m) => (
            <li key={m.id} className="flex items-center justify-between">
              <span>{m.name}</span>
              <span className="text-xs text-slate-400">
                {m.runs.length} run
                {m.dueDate && <> · due {m.dueDate.toLocaleDateString("id-ID")}</>}
              </span>
            </li>
          ))}
          {project.milestones.length === 0 && (
            <p className="text-slate-400">Belum ada milestone.</p>
          )}
        </ul>
        <form action={createMilestone} className="flex gap-2">
          <input type="hidden" name="projectId" value={project.id} />
          <input
            name="name"
            required
            placeholder="Nama milestone, contoh: Release v2.0"
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
