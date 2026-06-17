import Link from "next/link";
import { TFIcon } from "@/components/icons";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import type { Prisma } from "@prisma/client";
import { requireSession } from "@/lib/auth";
import { PRIORITIES, CASE_TYPES } from "@/lib/constants";
import { memberScope } from "@/lib/projects";
import { ProjectTabs } from "@/components/ProjectTabs";
import { NewSuiteForm } from "@/components/NewSuiteForm";
import { CasesTable } from "@/components/CasesTable";

export const dynamic = "force-dynamic";

export default async function ProjectPage({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams: { suite?: string; priority?: string; type?: string; q?: string; tag?: string };
}) {
  const session = await requireSession();
  const project = await db.project.findFirst({
    where: { slug: params.slug, ...memberScope(session.userId) },
    include: { suites: { orderBy: { order: "asc" } } },
  });
  if (!project) notFound();

  const where: Prisma.TestCaseWhereInput = {
    projectId: project.id,
    deletedAt: null,
  };
  if (searchParams.suite) where.suiteId = searchParams.suite;
  if (searchParams.priority) where.priority = searchParams.priority;
  if (searchParams.type) where.type = searchParams.type;
  if (searchParams.q) where.title = { contains: searchParams.q };
  if (searchParams.tag) where.tags = { contains: searchParams.tag };

  const cases = await db.testCase.findMany({
    where,
    orderBy: { seq: "asc" },
    include: { suite: true },
  });

  const rootSuites = project.suites.filter((s) => !s.parentId);
  const childrenOf = (id: string) =>
    project.suites.filter((s) => s.parentId === id);

  const filterQS = (overrides: Record<string, string | undefined>) => {
    const params2 = new URLSearchParams();
    const merged = { ...searchParams, ...overrides };
    Object.entries(merged).forEach(([k, v]) => v && params2.set(k, v));
    const s = params2.toString();
    return s ? `?${s}` : "";
  };

  return (
    <div className="space-y-6">
      <ProjectTabs slug={project.slug} name={project.name} active="cases" />

      <div className="flex gap-6">
        {/* Sidebar suite tree */}
        <aside className="w-64 shrink-0 space-y-4">
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <h3 className="mb-3 text-xs font-semibold uppercase text-slate-400">
              Test Suites
            </h3>
            <ul className="space-y-1 text-sm">
              <li>
                <Link
                  href={`/projects/${project.slug}${filterQS({ suite: undefined })}`}
                  className={`block rounded px-2 py-1 hover:bg-slate-100 ${!searchParams.suite ? "bg-indigo-50 font-medium text-indigo-700" : ""}`}
                >
                  All Test Cases
                </Link>
              </li>
              {rootSuites.map((suite) => (
                <li key={suite.id}>
                  <Link
                    href={`/projects/${project.slug}${filterQS({ suite: suite.id })}`}
                    className={`block rounded px-2 py-1 hover:bg-slate-100 ${searchParams.suite === suite.id ? "bg-indigo-50 font-medium text-indigo-700" : ""}`}
                  >
                    <span className="inline-flex items-center gap-1.5"><TFIcon name="nav-tree" className="h-4 w-4" /> {suite.name}</span>
                  </Link>
                  {childrenOf(suite.id).map((section) => (
                    <Link
                      key={section.id}
                      href={`/projects/${project.slug}${filterQS({ suite: section.id })}`}
                      className={`ml-4 block rounded px-2 py-1 text-slate-600 hover:bg-slate-100 ${searchParams.suite === section.id ? "bg-indigo-50 font-medium text-indigo-700" : ""}`}
                    >
                      └ {section.name}
                    </Link>
                  ))}
                </li>
              ))}
            </ul>
            <NewSuiteForm
              projectId={project.id}
              rootSuites={rootSuites.map((s) => ({ id: s.id, name: s.name }))}
            />
          </div>
        </aside>

        {/* Case list */}
        <div className="min-w-0 flex-1 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <form className="flex flex-1 flex-wrap items-center gap-2">
              {searchParams.suite && (
                <input type="hidden" name="suite" value={searchParams.suite} />
              )}
              <input
                name="q"
                defaultValue={searchParams.q}
                placeholder="Search test cases..."
                className="w-48 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
              />
              <select
                name="priority"
                defaultValue={searchParams.priority ?? ""}
                className="rounded-lg border border-slate-300 px-2 py-2 text-sm"
              >
                <option value="">All Priorities</option>
                {PRIORITIES.map((p) => (
                  <option key={p}>{p}</option>
                ))}
              </select>
              <select
                name="type"
                defaultValue={searchParams.type ?? ""}
                className="rounded-lg border border-slate-300 px-2 py-2 text-sm"
              >
                <option value="">All Types</option>
                {CASE_TYPES.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
              <button className="rounded-lg border border-slate-300 px-3 py-2 text-sm hover:bg-slate-100">
                Filter
              </button>
            </form>
            <a
              href={`/api/export/cases?project=${project.slug}`}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm hover:bg-slate-100"
            >
              <span className="inline-flex items-center gap-1.5"><TFIcon name="download" className="h-4 w-4" /> Export CSV</span>
            </a>
            <Link
              href={`/projects/${project.slug}/import`}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm hover:bg-slate-100"
            >
              <span className="inline-flex items-center gap-1.5"><TFIcon name="upload" className="h-4 w-4" /> Import</span>
            </Link>
            <Link
              href={`/projects/${project.slug}/cases/new${searchParams.suite ? `?suite=${searchParams.suite}` : ""}`}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
            >
              + Test Case
            </Link>
          </div>

          <CasesTable
            projectSlug={project.slug}
            projectName={project.name}
            canWrite={session.role !== "VIEWER"}
            searchParams={searchParams}
            cases={cases.map((c) => ({
              id: c.id,
              seq: c.seq,
              title: c.title,
              suiteName: c.suite?.name ?? null,
              priority: c.priority,
              type: c.type,
              automationStatus: c.automationStatus,
              tags: c.tags,
            }))}
          />
        </div>
      </div>
    </div>
  );
}
