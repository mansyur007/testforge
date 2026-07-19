import Link from "next/link";
import { BackLink } from "@/components/icons";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { memberScope } from "@/lib/projects";
import {
  MATRIX_BUCKETS,
  latestKindByCase,
  bucketRequirement,
  derivedStatus,
} from "@/lib/requirements";
import { ProjectTabs } from "@/components/ProjectTabs";

export const dynamic = "force-dynamic";

export default async function TraceabilityMatrixPage({
  params,
}: {
  params: { slug: string };
}) {
  const session = await requireSession();
  const project = await db.project.findFirst({
    where: { slug: params.slug, ...memberScope(session.userId) },
    include: {
      requirements: {
        include: {
          cases: {
            include: {
              testCase: {
                select: { id: true, status: true, deletedAt: true },
              },
            },
          },
        },
        orderBy: { refId: "asc" },
      },
    },
  });
  if (!project) notFound();

  // Latest kind across every linked case in the project (one query).
  const allCaseIds = Array.from(
    new Set(project.requirements.flatMap((r) => r.cases.map((c) => c.caseId)))
  );
  const latestKind = await latestKindByCase(project.id, allCaseIds);

  const rows = project.requirements.map((r) => ({
    id: r.id,
    refId: r.refId,
    title: r.title,
    status: derivedStatus(r.status, r.cases.map((c) => c.testCase)),
    counts: bucketRequirement(r.cases.map((c) => c.testCase), latestKind),
  }));
  const totals = MATRIX_BUCKETS.reduce(
    (acc, b) => ({ ...acc, [b]: rows.reduce((s, r) => s + r.counts[b], 0) }),
    {} as Record<string, number>
  );

  return (
    <div className="space-y-6">
      <ProjectTabs slug={project.slug} name={project.name} active="requirements" />

      <div className="flex items-center justify-between">
        <div>
          <BackLink href={`/projects/${project.slug}/requirements`}>Requirements</BackLink>
          <h2 className="mt-1 text-lg font-semibold">Traceability Matrix</h2>
        </div>
        <a
          href={`/api/export/requirements-matrix?project=${project.slug}`}
          className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-100"
          data-testid="matrix-export"
        >
          Export CSV
        </a>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-xs uppercase text-slate-400">
              <th className="px-4 py-3">Requirement</th>
              <th className="px-4 py-3">Status</th>
              {MATRIX_BUCKETS.map((b) => (
                <th key={b} className="px-4 py-3 text-center">
                  {b}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr
                key={r.id}
                className="border-b border-slate-100 last:border-0"
                data-testid={`matrix-row-${r.refId}`}
              >
                <td className="px-4 py-2.5">
                  <Link
                    href={`/projects/${project.slug}/requirements/${r.id}`}
                    className="text-indigo-600 hover:underline"
                  >
                    <span className="font-mono text-xs text-slate-400">
                      {r.refId}
                    </span>{" "}
                    {r.title}
                  </Link>
                </td>
                <td className="px-4 py-2.5 text-xs text-slate-500">{r.status}</td>
                {MATRIX_BUCKETS.map((b) => (
                  <td
                    key={b}
                    className="px-4 py-2.5 text-center"
                    data-testid={`matrix-${r.refId}-${b.replace(/\s/g, "")}`}
                  >
                    {r.counts[b] ? (
                      <span className="font-medium">{r.counts[b]}</span>
                    ) : (
                      <span className="text-slate-300">·</span>
                    )}
                  </td>
                ))}
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td
                  colSpan={2 + MATRIX_BUCKETS.length}
                  className="px-4 py-10 text-center text-slate-400"
                >
                  No requirements yet.
                </td>
              </tr>
            )}
          </tbody>
          {rows.length > 0 && (
            <tfoot>
              <tr className="border-t border-slate-200 bg-slate-50 text-xs font-semibold">
                <td className="px-4 py-2.5">Total</td>
                <td className="px-4 py-2.5" />
                {MATRIX_BUCKETS.map((b) => (
                  <td key={b} className="px-4 py-2.5 text-center">
                    {totals[b]}
                  </td>
                ))}
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}
