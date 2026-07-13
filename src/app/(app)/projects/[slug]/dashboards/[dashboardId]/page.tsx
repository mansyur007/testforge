import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { memberScope } from "@/lib/projects";
import { loadPerms } from "@/lib/permissions";
import { loadReportData } from "@/lib/report-data";
import { WIDGET_TYPES, GRID_COLS } from "@/lib/dashboards";
import { ProjectTabs } from "@/components/ProjectTabs";
import { WidgetBody, widgetTypeLabel } from "@/components/DashboardWidgets";
import { ShareLinkPanel } from "@/components/ShareLinkPanel";
import {
  addWidget,
  removeWidget,
  nudgeWidget,
  deleteDashboard,
} from "@/app/actions/dashboards";

export const dynamic = "force-dynamic";

// F-17: one dashboard — widgets on a 4-column CSS grid, each positioned by
// its stored {x,y,w,h}. Editing is arrow-button repositioning (v1 per spec).
export default async function DashboardDetailPage({
  params,
}: {
  params: { slug: string; dashboardId: string };
}) {
  const session = await requireSession();
  const project = await db.project.findFirst({
    where: { slug: params.slug, ...memberScope(session.userId) },
  });
  if (!project) notFound();
  const dashboard = await db.dashboard.findFirst({
    where: { id: params.dashboardId, projectId: project.id },
    include: { widgets: { orderBy: [{ y: "asc" }, { x: "asc" }] } },
  });
  if (!dashboard) notFound();

  const perms = await loadPerms(session.userId, project.id);
  const canEdit = perms.has("run.manage");
  const data = await loadReportData(project.id);

  const nudgeButton = (widgetId: string, dir: string, glyph: string, label: string) => (
    <form action={nudgeWidget} className="inline">
      <input type="hidden" name="widgetId" value={widgetId} />
      <input type="hidden" name="dir" value={dir} />
      <button
        className="rounded px-1 text-xs text-slate-400 hover:bg-slate-100 hover:text-slate-700"
        title={label}
        data-testid={`widget-${dir}-${widgetId}`}
      >
        {glyph}
      </button>
    </form>
  );

  return (
    <div className="space-y-6">
      <ProjectTabs slug={project.slug} name={project.name} active="dashboards" />

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">{dashboard.name}</h2>
        {canEdit && (
          <form action={deleteDashboard}>
            <input type="hidden" name="dashboardId" value={dashboard.id} />
            <button className="rounded-lg border border-red-200 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50">
              Delete dashboard
            </button>
          </form>
        )}
      </div>

      <div
        className="grid gap-4"
        style={{ gridTemplateColumns: `repeat(${GRID_COLS}, minmax(0, 1fr))` }}
        data-testid="dashboard-grid"
      >
        {dashboard.widgets.map((w) => (
          <section
            key={w.id}
            className="rounded-xl border border-slate-200 bg-white p-5"
            style={{
              gridColumn: `${w.x + 1} / span ${Math.min(w.w, GRID_COLS - w.x)}`,
              gridRow: `${w.y + 1} / span ${w.h}`,
            }}
            data-testid={`widget-card-${w.id}`}
          >
            <div className="mb-3 flex items-start justify-between gap-2">
              <h3 className="font-semibold">
                {w.title || widgetTypeLabel(w.type)}
              </h3>
              {canEdit && (
                <div className="flex shrink-0 items-center gap-0.5">
                  {nudgeButton(w.id, "left", "←", "Move left")}
                  {nudgeButton(w.id, "right", "→", "Move right")}
                  {nudgeButton(w.id, "up", "↑", "Move up")}
                  {nudgeButton(w.id, "down", "↓", "Move down")}
                  {nudgeButton(w.id, "narrower", "⊟", "Narrower")}
                  {nudgeButton(w.id, "wider", "⊞", "Wider")}
                  <form action={removeWidget} className="inline">
                    <input type="hidden" name="widgetId" value={w.id} />
                    <button
                      className="rounded px-1 text-xs text-slate-400 hover:bg-red-50 hover:text-red-600"
                      title="Remove widget"
                      data-testid={`widget-remove-${w.id}`}
                    >
                      ✕
                    </button>
                  </form>
                </div>
              )}
            </div>
            <WidgetBody widget={w} data={data} slug={project.slug} />
          </section>
        ))}
      </div>
      {dashboard.widgets.length === 0 && (
        <p className="rounded-xl border border-dashed border-slate-300 p-10 text-center text-sm text-slate-400">
          No widgets yet — add one below.
        </p>
      )}

      {/* F-17: public share links (run.manage only). */}
      {canEdit && (
        <ShareLinkPanel entityType="DASHBOARD" entityId={dashboard.id} />
      )}

      {canEdit && (
        <section className="rounded-xl border border-slate-200 bg-white p-6">
          <h3 className="mb-3 font-semibold">Add widget</h3>
          <form action={addWidget} className="flex flex-wrap items-end gap-2">
            <input type="hidden" name="dashboardId" value={dashboard.id} />
            <label className="text-sm">
              <span className="mb-1 block text-xs text-slate-500">Type</span>
              <select
                name="type"
                data-testid="widget-type-select"
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
              >
                {WIDGET_TYPES.map((t) => (
                  <option key={t.key} value={t.key}>
                    {t.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm">
              <span className="mb-1 block text-xs text-slate-500">
                Title (optional)
              </span>
              <input
                name="title"
                data-testid="widget-title-input"
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </label>
            <label className="min-w-64 flex-1 text-sm">
              <span className="mb-1 block text-xs text-slate-500">
                Note text (Text Note only, Markdown)
              </span>
              <input
                name="text"
                data-testid="widget-text-input"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </label>
            <button
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
              data-testid="widget-add-button"
            >
              + Add widget
            </button>
          </form>
        </section>
      )}
    </div>
  );
}
