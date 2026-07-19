import Link from "next/link";
import { BackLink } from "@/components/icons";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { memberScope } from "@/lib/projects";
import { loadPerms } from "@/lib/permissions";
import { caseDisplayId } from "@/lib/constants";
import { defectDisplayId } from "@/lib/defects";
import { ProjectTabs } from "@/components/ProjectTabs";
import { Markdown } from "@/components/Markdown";
import { DefectStatusSelect } from "@/components/DefectStatusSelect";
import { updateDefect, deleteDefect, unlinkDefect } from "@/app/actions/defects";

export const dynamic = "force-dynamic";

export default async function DefectDetailPage({
  params,
}: {
  params: { slug: string; id: string };
}) {
  const session = await requireSession();
  const project = await db.project.findFirst({
    where: { slug: params.slug, ...memberScope(session.userId) },
  });
  if (!project) notFound();

  const defect = await db.defect.findFirst({
    where: { id: params.id, projectId: project.id },
    include: {
      assignee: { select: { name: true } },
      links: { orderBy: { createdAt: "asc" } },
    },
  });
  if (!defect) notFound();

  const perms = await loadPerms(session.userId, project.id);
  const canEdit = perms.has("case.write");

  const members = await db.projectMember.findMany({
    where: { projectId: project.id },
    include: { user: { select: { id: true, name: true } } },
  });

  const caseLinkIds = defect.links.filter((l) => l.entityType === "CASE").map((l) => l.entityId);
  const resultLinkIds = defect.links.filter((l) => l.entityType === "RESULT").map((l) => l.entityId);
  const [linkedCases, linkedResults] = await Promise.all([
    caseLinkIds.length
      ? db.testCase.findMany({
          where: { id: { in: caseLinkIds } },
          select: { id: true, seq: true, title: true },
        })
      : Promise.resolve([]),
    resultLinkIds.length
      ? db.testRunResult.findMany({
          where: { id: { in: resultLinkIds } },
          include: { testCase: { select: { seq: true, title: true } }, run: { select: { id: true, name: true } } },
        })
      : Promise.resolve([]),
  ]);

  return (
    <div className="space-y-6">
      <ProjectTabs slug={project.slug} name={project.name} active="defects" />

      <div className="flex items-start justify-between gap-4">
        <div>
          <BackLink href={`/projects/${project.slug}/defects`}>Defects</BackLink>
          <h2 className="mt-1 text-xl font-bold">
            <span className="font-mono text-sm text-slate-400">
              {defectDisplayId(project.slug, defect.seq)}
            </span>{" "}
            {defect.title}
          </h2>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {canEdit && <DefectStatusSelect defectId={defect.id} status={defect.status} />}
          {canEdit && (
            <form action={deleteDefect}>
              <input type="hidden" name="defectId" value={defect.id} />
              <button
                className="rounded-lg border border-red-200 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50"
                data-testid="defect-delete-button"
              >
                Delete
              </button>
            </form>
          )}
        </div>
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <h3 className="mb-3 font-semibold">Linked cases &amp; results</h3>
        <ul className="space-y-2 text-sm" data-testid="defect-links-list">
          {linkedCases.map((c) => (
            <li key={c.id} className="flex items-center justify-between gap-2">
              <Link
                href={`/projects/${project.slug}/cases/${c.id}`}
                className="text-slate-700 hover:text-indigo-600"
              >
                <span className="font-mono text-xs text-slate-400">
                  {caseDisplayId(project.slug, c.seq)}
                </span>{" "}
                {c.title}
              </Link>
            </li>
          ))}
          {linkedResults.map((r) => {
            const link = defect.links.find((l) => l.entityType === "RESULT" && l.entityId === r.id);
            return (
              <li key={r.id} className="flex items-center justify-between gap-2">
                <Link
                  href={`/projects/${project.slug}/runs/${r.run.id}`}
                  className="text-slate-700 hover:text-indigo-600"
                >
                  <span className="font-mono text-xs text-slate-400">
                    {caseDisplayId(project.slug, r.testCase.seq)}
                  </span>{" "}
                  {r.testCase.title} — {r.run.name}
                </Link>
                {canEdit && link && (
                  <form action={unlinkDefect}>
                    <input type="hidden" name="linkId" value={link.id} />
                    <button
                      className="text-xs text-slate-400 hover:text-red-600"
                      title="Unlink"
                    >
                      ✕
                    </button>
                  </form>
                )}
              </li>
            );
          })}
          {defect.links.length === 0 && (
            <li className="text-slate-400">Not linked to any case or result yet.</li>
          )}
        </ul>
      </section>

      {canEdit ? (
        <section className="rounded-xl border border-slate-200 bg-white p-5">
          <h3 className="mb-3 font-semibold">Edit</h3>
          <form action={updateDefect} className="space-y-2">
            <input type="hidden" name="defectId" value={defect.id} />
            <input
              name="title"
              required
              defaultValue={defect.title}
              data-testid="defect-edit-title"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
            <div className="flex gap-2">
              <select
                name="severity"
                defaultValue={defect.severity}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
              >
                <option value="CRITICAL">Critical</option>
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
              </select>
              <select
                name="assigneeId"
                defaultValue={defect.assigneeId ?? ""}
                className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm"
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
              defaultValue={defect.bodyMd ?? ""}
              rows={6}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
            <button
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
              data-testid="defect-edit-save"
            >
              Save
            </button>
          </form>
        </section>
      ) : (
        defect.bodyMd && (
          <section className="rounded-xl border border-slate-200 bg-white p-5">
            <Markdown>{defect.bodyMd}</Markdown>
          </section>
        )
      )}
    </div>
  );
}
