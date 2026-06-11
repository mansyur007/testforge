import Link from "next/link";
import { TFIcon } from "@/components/icons";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import type { Prisma } from "@prisma/client";
import { requireSession } from "@/lib/auth";
import {
  caseDisplayId,
  parseTags,
  PRIORITY_BADGES,
  PRIORITIES,
  CASE_TYPES,
} from "@/lib/constants";
import { createSuite } from "@/app/actions/projects";
import { ProjectTabs } from "@/components/ProjectTabs";
import { BulkEditBar } from "@/components/BulkEditBar";

export const dynamic = "force-dynamic";

export default async function ProjectPage({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams: { suite?: string; priority?: string; type?: string; q?: string; tag?: string };
}) {
  await requireSession();
  const project = await db.project.findUnique({
    where: { slug: params.slug },
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
                  Semua Test Case
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
            <form action={createSuite} className="mt-4 space-y-2 border-t border-slate-100 pt-3">
              <input type="hidden" name="projectId" value={project.id} />
              <input
                name="name"
                placeholder="Nama suite baru..."
                required
                className="w-full rounded border border-slate-200 px-2 py-1.5 text-xs focus:border-indigo-500 focus:outline-none"
              />
              <select
                name="parentId"
                className="w-full rounded border border-slate-200 px-2 py-1.5 text-xs"
              >
                <option value="">(root suite)</option>
                {rootSuites.map((s) => (
                  <option key={s.id} value={s.id}>
                    section di: {s.name}
                  </option>
                ))}
              </select>
              <button className="w-full rounded bg-slate-800 px-2 py-1.5 text-xs text-white hover:bg-slate-700">
                + Tambah Suite
              </button>
            </form>
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
                placeholder="Cari test case..."
                className="w-48 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
              />
              <select
                name="priority"
                defaultValue={searchParams.priority ?? ""}
                className="rounded-lg border border-slate-300 px-2 py-2 text-sm"
              >
                <option value="">Semua Priority</option>
                {PRIORITIES.map((p) => (
                  <option key={p}>{p}</option>
                ))}
              </select>
              <select
                name="type"
                defaultValue={searchParams.type ?? ""}
                className="rounded-lg border border-slate-300 px-2 py-2 text-sm"
              >
                <option value="">Semua Type</option>
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

          <BulkEditBar projectSlug={project.slug}>
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                  <tr>
                    <th className="w-8 px-3 py-3"></th>
                    <th className="px-3 py-3">ID</th>
                    <th className="px-3 py-3">Judul</th>
                    <th className="px-3 py-3">Priority</th>
                    <th className="px-3 py-3">Type</th>
                    <th className="px-3 py-3">Automation</th>
                    <th className="px-3 py-3">Tags</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {cases.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50">
                      <td className="px-3 py-2.5">
                        <input type="checkbox" name="caseIds" value={c.id} />
                      </td>
                      <td className="whitespace-nowrap px-3 py-2.5 font-mono text-xs text-slate-500">
                        {caseDisplayId(project.slug, c.seq)}
                      </td>
                      <td className="px-3 py-2.5">
                        <Link
                          href={`/projects/${project.slug}/cases/${c.id}`}
                          className="font-medium text-slate-800 hover:text-indigo-600"
                        >
                          {c.title}
                        </Link>
                        {c.suite && (
                          <p className="text-xs text-slate-400">{c.suite.name}</p>
                        )}
                      </td>
                      <td className="px-3 py-2.5">
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-medium ${PRIORITY_BADGES[c.priority]}`}
                        >
                          {c.priority}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-xs text-slate-600">{c.type}</td>
                      <td className="px-3 py-2.5 text-xs text-slate-600">
                        {c.automationStatus === "AUTOMATED" ? (<span className="inline-flex items-center gap-1"><TFIcon name="automation" className="h-4 w-4" /> Automated</span>) : (c.automationStatus.replace(/_/g, " ").toLowerCase())}
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="flex flex-wrap gap-1">
                          {parseTags(c.tags).map((tag) => (
                            <Link
                              key={tag}
                              href={`/projects/${project.slug}${filterQS({ tag })}`}
                              className="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-600 hover:bg-indigo-100"
                            >
                              {tag}
                            </Link>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {cases.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-3 py-10 text-center text-slate-400">
                        Tidak ada test case. Buat baru atau import dari CSV.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </BulkEditBar>
          <p className="text-xs text-slate-400">{cases.length} test case</p>
        </div>
      </div>
    </div>
  );
}
