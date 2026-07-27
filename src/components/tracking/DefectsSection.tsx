import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { memberScope } from "@/lib/projects";
import { loadPerms } from "@/lib/permissions";
import {
  DEFECT_STATUSES,
  DEFECT_SEVERITY_BADGES,
  defectDisplayId,
  type DefectSeverity,
} from "@/lib/defects";
import { createDefect } from "@/app/actions/defects";
import { DefectStatusSelect } from "@/components/DefectStatusSelect";
import type { SectionProps } from "@/lib/section-props";

const COLUMN_LABELS: Record<string, string> = {
  OPEN: "Open",
  CONFIRMED: "Confirmed",
  FIXED: "Fixed",
  WONT_FIX: "Won't fix",
  CLOSED: "Closed",
};

export async function DefectsSection({ params }: SectionProps) {
  const session = await requireSession();
  const project = await db.project.findFirst({
    where: { slug: params.slug, ...memberScope(session.userId) },
  });
  if (!project) notFound();
  const perms = await loadPerms(session.userId, project.id);
  const canEdit = perms.has("case.write");

  const [defects, members] = await Promise.all([
    db.defect.findMany({
      where: { projectId: project.id },
      include: { assignee: { select: { name: true } } },
      orderBy: { seq: "asc" },
    }),
    db.projectMember.findMany({
      where: { projectId: project.id },
      include: { user: { select: { id: true, name: true } } },
    }),
  ]);

  const byStatus = new Map<string, typeof defects>();
  for (const s of DEFECT_STATUSES) byStatus.set(s, []);
  for (const d of defects) byStatus.get(d.status)?.push(d);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Defects</h2>
      </div>

      <div className="grid grid-cols-1 gap-4 overflow-x-auto sm:grid-cols-2 lg:grid-cols-5">
        {DEFECT_STATUSES.map((status) => (
          <div key={status} className="min-w-[220px] rounded-xl border border-hairline bg-canvas p-3">
            <h3 className="mb-3 flex items-center justify-between text-xs font-semibold uppercase text-content-muted">
              {COLUMN_LABELS[status]}
              <span className="rounded-full bg-surface px-2 py-0.5 text-content-subtle">
                {byStatus.get(status)?.length ?? 0}
              </span>
            </h3>
            <div className="space-y-2" data-testid={`defect-column-${status}`}>
              {(byStatus.get(status) ?? []).map((d) => (
                <div
                  key={d.id}
                  className="rounded-lg border border-hairline bg-surface p-3 text-sm"
                  data-testid={`defect-card-${defectDisplayId(project.slug, d.seq)}`}
                >
                  <Link
                    href={`/projects/${project.slug}/defects/${d.id}`}
                    className="font-medium text-accent-text hover:underline"
                  >
                    {defectDisplayId(project.slug, d.seq)}
                  </Link>
                  <p className="mt-1 line-clamp-2 text-content">{d.title}</p>
                  <div className="mt-2 flex items-center justify-between gap-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${DEFECT_SEVERITY_BADGES[d.severity as DefectSeverity] ?? DEFECT_SEVERITY_BADGES.MEDIUM}`}
                    >
                      {d.severity}
                    </span>
                    {d.assignee && (
                      <span className="truncate text-xs text-content-subtle">{d.assignee.name}</span>
                    )}
                  </div>
                  {canEdit && (
                    <DefectStatusSelect
                      defectId={d.id}
                      status={d.status}
                      className="mt-2 w-full"
                    />
                  )}
                </div>
              ))}
              {(byStatus.get(status) ?? []).length === 0 && (
                <p className="text-xs text-content-subtle">No defects.</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {canEdit && (
        <section className="max-w-xl rounded-xl border border-hairline bg-surface p-6">
          <h3 className="mb-3 font-semibold">Report a defect</h3>
          <form action={createDefect} className="space-y-2">
            <input type="hidden" name="projectId" value={project.id} />
            <input
              name="title"
              required
              placeholder="Defect title"
              data-testid="defect-title-input"
              className="bg-surface text-content-strong w-full rounded-lg border border-hairline-strong px-3 py-2 text-sm"
            />
            <div className="flex gap-2">
              <select
                name="severity"
                defaultValue="MEDIUM"
                data-testid="defect-severity-input"
                className="bg-surface text-content-strong rounded-lg border border-hairline-strong px-3 py-2 text-sm"
              >
                <option value="CRITICAL">Critical</option>
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
              </select>
              <select
                name="assigneeId"
                defaultValue=""
                className="bg-surface text-content-strong flex-1 rounded-lg border border-hairline-strong px-3 py-2 text-sm"
              >
                <option value="">Unassigned</option>
                {members.map((m) => (
                  <option key={m.userId} value={m.userId}>
                    {m.user.name}
                  </option>
                ))}
              </select>
            </div>
            <textarea
              name="bodyMd"
              placeholder="Description (Markdown, optional)"
              rows={3}
              className="bg-surface text-content-strong w-full rounded-lg border border-hairline-strong px-3 py-2 text-sm"
            />
            <button
              className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover"
              data-testid="defect-create-button"
            >
              + Defect
            </button>
          </form>
        </section>
      )}
    </div>
  );
}
