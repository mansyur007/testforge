import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { memberScope } from "@/lib/projects";
import { loadPerms } from "@/lib/permissions";
import { ProjectTabs } from "@/components/ProjectTabs";
import { createDashboard } from "@/app/actions/dashboards";

export const dynamic = "force-dynamic";

// F-17: dashboards list — every member can view, run.manage can create.
export default async function DashboardsPage({
  params,
}: {
  params: { slug: string };
}) {
  const session = await requireSession();
  const project = await db.project.findFirst({
    where: { slug: params.slug, ...memberScope(session.userId) },
    include: {
      dashboards: {
        include: { createdBy: true, widgets: { select: { id: true } } },
        orderBy: { createdAt: "desc" },
      },
    },
  });
  if (!project) notFound();
  const perms = await loadPerms(session.userId, project.id);
  const canEdit = perms.has("run.manage");

  return (
    <div className="space-y-6">
      <ProjectTabs slug={project.slug} name={project.name} active="dashboards" />

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Dashboards</h2>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {project.dashboards.map((d) => (
          <Link
            key={d.id}
            href={`/projects/${project.slug}/dashboards/${d.id}`}
            className="rounded-xl border border-slate-200 bg-white p-5 hover:border-indigo-300"
            data-testid={`dashboard-card-${d.name}`}
          >
            <p className="font-medium">{d.name}</p>
            <p className="mt-1 text-xs text-slate-400">
              {d.widgets.length} widget{d.widgets.length === 1 ? "" : "s"} ·{" "}
              {d.createdBy.name} · {d.createdAt.toLocaleDateString("en-US")}
            </p>
          </Link>
        ))}
        {project.dashboards.length === 0 && (
          <p className="col-span-full rounded-xl border border-dashed border-slate-300 p-10 text-center text-sm text-slate-400">
            No dashboards yet. Create one and add widgets from the report
            catalog.
          </p>
        )}
      </div>

      {canEdit && (
        <form action={createDashboard} className="flex max-w-md gap-2">
          <input type="hidden" name="projectId" value={project.id} />
          <input
            name="name"
            required
            placeholder="Dashboard name, e.g. Release Health"
            data-testid="dashboard-name-input"
            className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
          />
          <button className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
            + Dashboard
          </button>
        </form>
      )}
    </div>
  );
}
