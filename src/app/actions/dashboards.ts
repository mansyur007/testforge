"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { can } from "@/lib/permissions";
import { WIDGET_TYPES, GRID_COLS, MAX_H } from "@/lib/dashboards";

// F-17: dashboard builder — any member with run.manage can create dashboards
// and arrange widgets; every project member can view them.

async function requireDashboardEditor(
  projectId: string
): Promise<{ userId: string; slug: string } | null> {
  const session = await requireSession();
  if (!(await can(session.userId, projectId, "run.manage"))) return null;
  const project = await db.project.findUniqueOrThrow({
    where: { id: projectId },
    select: { slug: true },
  });
  return { userId: session.userId, slug: project.slug };
}

export async function createDashboard(formData: FormData): Promise<void> {
  const projectId = String(formData.get("projectId"));
  const editor = await requireDashboardEditor(projectId);
  if (!editor) return;
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;

  const dashboard = await db.dashboard.create({
    data: { projectId, name, createdById: editor.userId },
  });
  await logAudit({
    userId: editor.userId,
    action: "dashboard.create",
    entityType: "dashboard",
    entityId: dashboard.id,
    detail: name,
  });
  redirect(`/projects/${editor.slug}/dashboards/${dashboard.id}`);
}

export async function deleteDashboard(formData: FormData): Promise<void> {
  const id = String(formData.get("dashboardId"));
  const dashboard = await db.dashboard.findUnique({ where: { id } });
  if (!dashboard) return;
  const editor = await requireDashboardEditor(dashboard.projectId);
  if (!editor) return;

  await db.dashboard.delete({ where: { id } });
  await logAudit({
    userId: editor.userId,
    action: "dashboard.delete",
    entityType: "dashboard",
    entityId: id,
    detail: dashboard.name,
  });
  redirect(`/projects/${editor.slug}/dashboards`);
}

export async function addWidget(formData: FormData): Promise<void> {
  const dashboardId = String(formData.get("dashboardId"));
  const dashboard = await db.dashboard.findUnique({
    where: { id: dashboardId },
    include: { widgets: true },
  });
  if (!dashboard) return;
  const editor = await requireDashboardEditor(dashboard.projectId);
  if (!editor) return;

  const type = String(formData.get("type"));
  if (!WIDGET_TYPES.some((t) => t.key === type)) return;
  const title = String(formData.get("title") ?? "").trim() || null;
  const text = String(formData.get("text") ?? "").trim();

  // Place the new widget on the first free row below everything else.
  const nextY = dashboard.widgets.reduce((m, w) => Math.max(m, w.y + w.h), 0);
  await db.dashboardWidget.create({
    data: {
      dashboardId,
      type,
      title,
      configJson: type === "textNote" ? JSON.stringify({ text }) : "{}",
      x: 0,
      y: nextY,
      w: 2,
      h: 1,
    },
  });
  revalidatePath(`/projects/${editor.slug}/dashboards/${dashboardId}`);
}

export async function removeWidget(formData: FormData): Promise<void> {
  const id = String(formData.get("widgetId"));
  const widget = await db.dashboardWidget.findUnique({
    where: { id },
    include: { dashboard: true },
  });
  if (!widget) return;
  const editor = await requireDashboardEditor(widget.dashboard.projectId);
  if (!editor) return;

  await db.dashboardWidget.delete({ where: { id } });
  revalidatePath(`/projects/${editor.slug}/dashboards/${widget.dashboardId}`);
}

// Arrow-button repositioning (v1 per spec): each click nudges one cell.
const NUDGES: Record<string, { field: "x" | "y" | "w" | "h"; delta: number }> = {
  left: { field: "x", delta: -1 },
  right: { field: "x", delta: 1 },
  up: { field: "y", delta: -1 },
  down: { field: "y", delta: 1 },
  wider: { field: "w", delta: 1 },
  narrower: { field: "w", delta: -1 },
  taller: { field: "h", delta: 1 },
  shorter: { field: "h", delta: -1 },
};

export async function nudgeWidget(formData: FormData): Promise<void> {
  const id = String(formData.get("widgetId"));
  const nudge = NUDGES[String(formData.get("dir"))];
  if (!nudge) return;
  const widget = await db.dashboardWidget.findUnique({
    where: { id },
    include: { dashboard: true },
  });
  if (!widget) return;
  const editor = await requireDashboardEditor(widget.dashboard.projectId);
  if (!editor) return;

  const next = { x: widget.x, y: widget.y, w: widget.w, h: widget.h };
  next[nudge.field] += nudge.delta;
  // Clamp to the grid: x+w within GRID_COLS, y >= 0, 1 <= h <= MAX_H.
  next.w = Math.min(Math.max(next.w, 1), GRID_COLS);
  next.h = Math.min(Math.max(next.h, 1), MAX_H);
  next.x = Math.min(Math.max(next.x, 0), GRID_COLS - next.w);
  next.y = Math.max(next.y, 0);

  await db.dashboardWidget.update({ where: { id }, data: next });
  revalidatePath(`/projects/${editor.slug}/dashboards/${widget.dashboardId}`);
}
