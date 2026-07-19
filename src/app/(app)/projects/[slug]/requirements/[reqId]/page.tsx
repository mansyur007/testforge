import Link from "next/link";
import { BackLink } from "@/components/icons";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { memberScope } from "@/lib/projects";
import { loadPerms } from "@/lib/permissions";
import { caseDisplayId } from "@/lib/constants";
import { latestKindByCase, caseBucket, derivedStatus } from "@/lib/requirements";
import { ProjectTabs } from "@/components/ProjectTabs";
import { Markdown } from "@/components/Markdown";
import {
  linkCaseToRequirement,
  unlinkCaseFromRequirement,
  deleteRequirement,
  toggleRequirementObsolete,
} from "@/app/actions/requirements";

export const dynamic = "force-dynamic";

const BUCKET_BADGE: Record<string, string> = {
  Pass: "bg-green-100 text-green-800",
  Fail: "bg-red-100 text-red-800",
  Blocked: "bg-orange-100 text-orange-800",
  Untested: "bg-gray-100 text-gray-500",
};

export default async function RequirementDetailPage({
  params,
}: {
  params: { slug: string; reqId: string };
}) {
  const session = await requireSession();
  const project = await db.project.findFirst({
    where: { slug: params.slug, ...memberScope(session.userId) },
  });
  if (!project) notFound();
  const req = await db.requirement.findFirst({
    where: { id: params.reqId, projectId: project.id },
    include: {
      cases: {
        include: {
          testCase: {
            select: { id: true, seq: true, title: true, status: true, deletedAt: true },
          },
        },
      },
    },
  });
  if (!req) notFound();

  const perms = await loadPerms(session.userId, project.id);
  const canEdit = perms.has("case.write");

  const linkedCases = req.cases
    .map((c) => c.testCase)
    .filter((c) => c.deletedAt == null);
  const latestKind = await latestKindByCase(
    project.id,
    linkedCases.map((c) => c.id)
  );
  const status = derivedStatus(req.status, req.cases.map((c) => c.testCase));

  // Cases available to link (same project, live, not already linked).
  const linkedIds = new Set(req.cases.map((c) => c.caseId));
  const linkable = canEdit
    ? await db.testCase.findMany({
        where: {
          projectId: project.id,
          deletedAt: null,
          id: { notIn: Array.from(linkedIds) },
        },
        select: { id: true, seq: true, title: true },
        orderBy: { seq: "asc" },
      })
    : [];

  return (
    <div className="space-y-6">
      <ProjectTabs slug={project.slug} name={project.name} active="requirements" />

      <div className="flex items-start justify-between gap-4">
        <div>
          <BackLink href={`/projects/${project.slug}/requirements`}>Requirements</BackLink>
          <h2 className="mt-1 text-xl font-bold">
            <span className="font-mono text-sm text-slate-400">{req.refId}</span>{" "}
            {req.title}
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Status: <b>{status}</b>
            {req.sourceUrl && (
              <>
                {" · "}
                <a
                  href={req.sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-indigo-600 hover:underline"
                >
                  source
                </a>
              </>
            )}
          </p>
        </div>
        {canEdit && (
          <div className="flex shrink-0 gap-2">
            <form action={toggleRequirementObsolete}>
              <input type="hidden" name="requirementId" value={req.id} />
              <button className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-100">
                {req.status === "OBSOLETE" ? "Reopen" : "Mark obsolete"}
              </button>
            </form>
            <form action={deleteRequirement}>
              <input type="hidden" name="requirementId" value={req.id} />
              <button
                className="rounded-lg border border-red-200 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50"
                data-testid="req-delete-button"
              >
                Delete
              </button>
            </form>
          </div>
        )}
      </div>

      {req.descriptionMd && (
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <Markdown>{req.descriptionMd}</Markdown>
        </div>
      )}

      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <h3 className="mb-3 font-semibold">Linked cases &amp; latest status</h3>
        <ul className="space-y-2 text-sm">
          {linkedCases.map((c) => {
            const bucket = caseBucket(latestKind.get(c.id) ?? null);
            return (
              <li
                key={c.id}
                className="flex items-center justify-between gap-2"
                data-testid={`req-case-${caseDisplayId(project.slug, c.seq)}`}
              >
                <Link
                  href={`/projects/${project.slug}/cases/${c.id}`}
                  className="min-w-0 truncate text-slate-700 hover:text-indigo-600"
                >
                  <span className="font-mono text-xs text-slate-400">
                    {caseDisplayId(project.slug, c.seq)}
                  </span>{" "}
                  {c.title}
                  {c.status === "DEPRECATED" && (
                    <span className="ml-1 text-xs text-slate-400">(deprecated)</span>
                  )}
                </Link>
                <span className="flex shrink-0 items-center gap-2">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${BUCKET_BADGE[bucket]}`}
                  >
                    {bucket}
                  </span>
                  {canEdit && (
                    <form action={unlinkCaseFromRequirement}>
                      <input type="hidden" name="requirementId" value={req.id} />
                      <input type="hidden" name="caseId" value={c.id} />
                      <button
                        className="text-xs text-slate-400 hover:text-red-600"
                        title="Unlink"
                        data-testid={`req-unlink-${c.id}`}
                      >
                        ✕
                      </button>
                    </form>
                  )}
                </span>
              </li>
            );
          })}
          {linkedCases.length === 0 && (
            <li className="text-slate-400">No cases linked yet.</li>
          )}
        </ul>

        {canEdit && linkable.length > 0 && (
          <form
            action={linkCaseToRequirement}
            className="mt-4 flex items-center gap-2 border-t border-slate-100 pt-4"
          >
            <input type="hidden" name="requirementId" value={req.id} />
            <select
              name="caseId"
              data-testid="req-link-select"
              className="min-w-64 flex-1 rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
            >
              {linkable.map((c) => (
                <option key={c.id} value={c.id}>
                  {caseDisplayId(project.slug, c.seq)} — {c.title}
                </option>
              ))}
            </select>
            <button
              className="rounded-lg bg-slate-800 px-3 py-1.5 text-sm text-white hover:bg-slate-700"
              data-testid="req-link-button"
            >
              + Link case
            </button>
          </form>
        )}
      </section>
    </div>
  );
}
