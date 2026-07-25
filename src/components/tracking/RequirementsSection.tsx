import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { memberScope } from "@/lib/projects";
import { loadPerms } from "@/lib/permissions";
import { derivedStatus } from "@/lib/requirements";
import {
  createRequirement,
  importRequirementsCsv,
} from "@/app/actions/requirements";
import type { SectionProps } from "@/lib/section-props";

const STATUS_BADGE: Record<string, string> = {
  OPEN: "bg-amber-100 text-amber-800",
  COVERED: "bg-green-100 text-green-800",
  OBSOLETE: "bg-slate-100 text-slate-500 line-through",
};

export async function RequirementsSection({ params }: SectionProps) {
  const session = await requireSession();
  const project = await db.project.findFirst({
    where: { slug: params.slug, ...memberScope(session.userId) },
    include: {
      requirements: {
        include: {
          cases: {
            include: {
              testCase: { select: { status: true, deletedAt: true } },
            },
          },
        },
        orderBy: { refId: "asc" },
      },
    },
  });
  if (!project) notFound();
  const perms = await loadPerms(session.userId, project.id);
  const canEdit = perms.has("case.write");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Requirements</h2>
        <Link
          href={`/projects/${project.slug}/requirements/matrix`}
          className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-100"
          data-testid="matrix-link"
        >
          Traceability matrix →
        </Link>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-xs uppercase text-slate-400">
              <th className="px-4 py-3">Ref</th>
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Cases</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {project.requirements.map((r) => {
              const status = derivedStatus(
                r.status,
                r.cases.map((c) => c.testCase)
              );
              const liveCases = r.cases.filter(
                (c) => c.testCase.deletedAt == null
              ).length;
              return (
                <tr
                  key={r.id}
                  className="border-b border-slate-100 last:border-0"
                  data-testid={`req-row-${r.refId}`}
                >
                  <td className="px-4 py-2.5 font-mono text-xs text-slate-500">
                    {r.refId}
                  </td>
                  <td className="px-4 py-2.5">
                    <Link
                      href={`/projects/${project.slug}/requirements/${r.id}`}
                      className="text-indigo-600 hover:underline"
                    >
                      {r.title}
                    </Link>
                  </td>
                  <td className="px-4 py-2.5 text-slate-500">{liveCases}</td>
                  <td className="px-4 py-2.5">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_BADGE[status]}`}
                      data-testid={`req-status-${r.refId}`}
                    >
                      {status}
                    </span>
                  </td>
                </tr>
              );
            })}
            {project.requirements.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-slate-400">
                  No requirements yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {canEdit && (
        <div className="grid gap-6 lg:grid-cols-2">
          <section className="rounded-xl border border-slate-200 bg-white p-6">
            <h3 className="mb-3 font-semibold">Add requirement</h3>
            <form action={createRequirement} className="space-y-2">
              <input type="hidden" name="projectId" value={project.id} />
              <div className="flex gap-2">
                <input
                  name="refId"
                  placeholder="REQ-001 (auto if blank)"
                  data-testid="req-refid-input"
                  className="w-40 rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
                <input
                  name="title"
                  required
                  placeholder="Requirement title"
                  data-testid="req-title-input"
                  className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
              <input
                name="sourceUrl"
                placeholder="Source URL (optional)"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
              <textarea
                name="descriptionMd"
                placeholder="Description (Markdown, optional)"
                rows={2}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
              <button
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
                data-testid="req-create-button"
              >
                + Requirement
              </button>
            </form>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-6">
            <h3 className="mb-3 font-semibold">Import CSV</h3>
            <p className="mb-2 text-xs text-slate-400">
              Header row with columns <code>refId,title,description,sourceUrl</code>{" "}
              (title required; blank refId auto-numbers).
            </p>
            <form action={importRequirementsCsv} className="space-y-2">
              <input type="hidden" name="projectId" value={project.id} />
              <textarea
                name="csv"
                required
                rows={5}
                placeholder={"refId,title,description,sourceUrl\nREQ-100,Login works,,https://jira/PROJ-1"}
                data-testid="req-csv-input"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-xs"
              />
              <button
                className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
                data-testid="req-import-button"
              >
                Import
              </button>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}
