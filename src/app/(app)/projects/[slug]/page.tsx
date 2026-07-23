import Link from "next/link";
import { TFIcon } from "@/components/icons";
import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db";
import type { Prisma } from "@prisma/client";
import { requireSession } from "@/lib/auth";
import { PRIORITIES, CASE_TYPES } from "@/lib/constants";
import { memberScope } from "@/lib/projects";
import { ProjectTabs } from "@/components/ProjectTabs";
import { NewSuiteForm } from "@/components/NewSuiteForm";
import { CasesTable } from "@/components/CasesTable";
import { SuiteTree, type SuiteNode } from "@/components/SuiteTree";
import { SuiteFolderGrid } from "@/components/SuiteFolderGrid";
import { SavedViewsMenu } from "@/components/SavedViewsMenu";
import { ExportMenu } from "@/components/ExportMenu";
import { sanitizeCaseFilters, viewHref } from "@/lib/saved-views";
import { loadPerms } from "@/lib/permissions";
import { aiConfigured, orgIdForUser } from "@/lib/ai";
import { AiGenerateCases } from "@/components/AiGenerateCases";

export const dynamic = "force-dynamic";

export default async function ProjectPage({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams: { suite?: string; priority?: string; type?: string; q?: string; tag?: string; v?: string; review?: string };
}) {
  const session = await requireSession();
  const project = await db.project.findFirst({
    where: { slug: params.slug, ...memberScope(session.userId) },
    include: { suites: { orderBy: { order: "asc" } } },
  });
  if (!project) notFound();

  // F-10: opening the list with no params at all applies the user's default
  // view. `?v=all` (the "All cases" pseudo-view) suppresses this on purpose.
  if (Object.values(searchParams).every((v) => !v)) {
    const def = await db.savedView.findFirst({
      where: {
        projectId: project.id,
        userId: session.userId,
        entity: "CASES",
        isDefault: true,
      },
    });
    if (def)
      redirect(
        viewHref(project.slug, def.id, sanitizeCaseFilters(JSON.parse(def.filtersJson)))
      );
  }

  const savedViews = await db.savedView.findMany({
    where: {
      projectId: project.id,
      entity: "CASES",
      OR: [{ userId: session.userId }, { shared: true }],
    },
    orderBy: { name: "asc" },
  });

  const where: Prisma.TestCaseWhereInput = {
    projectId: project.id,
    deletedAt: null,
  };
  if (searchParams.suite) where.suiteId = searchParams.suite;
  if (searchParams.priority) where.priority = searchParams.priority;
  if (searchParams.type) where.type = searchParams.type;
  if (searchParams.q) where.title = { contains: searchParams.q };
  if (searchParams.tag) where.tags = { contains: searchParams.tag };
  // F-15: "Needs my review" — cases in review assigned to the current user.
  if (searchParams.review === "mine") {
    where.status = "IN_REVIEW";
    where.reviewerId = session.userId;
  }

  const cases = await db.testCase.findMany({
    where,
    orderBy: [{ order: "asc" }, { seq: "asc" }], // F-24: manual drag-reorder, tie-broken by creation order
    include: { suite: true },
  });

  // F-24: target project picker for "Copy to project…" — the user's other
  // projects where they have write access (VIEWER can't hold the copy).
  const otherProjects = await db.projectMember.findMany({
    where: { userId: session.userId, role: { not: "VIEWER" }, project: { slug: { not: project.slug } } },
    select: { project: { select: { id: true, slug: true, name: true } } },
    orderBy: { project: { name: "asc" } },
  });

  // F-15: how many cases are waiting on this user's review (for the chip badge).
  const needsMyReview = await db.testCase.count({
    where: {
      projectId: project.id,
      deletedAt: null,
      status: "IN_REVIEW",
      reviewerId: session.userId,
    },
  });
  const reviewMine = searchParams.review === "mine";

  // F-14: permission-derived (covers custom roles).
  const perms = await loadPerms(session.userId, project.id);
  const canWrite = perms.has("case.write");
  // F-29: only offer AI generation when the org has a key configured.
  const orgId = await orgIdForUser(session.userId);
  const aiOn = canWrite && !!orgId && (await aiConfigured(orgId));
  const childrenOf = (id: string) =>
    project.suites.filter((s) => s.parentId === id);

  // Active-case count per suite (incl. sub-suites) so the delete button can warn
  // up front instead of letting an empty-only delete be attempted.
  const grouped = await db.testCase.groupBy({
    by: ["suiteId"],
    where: { projectId: project.id, deletedAt: null },
    _count: { _all: true },
  });
  const directCaseCount = new Map<string, number>();
  for (const g of grouped)
    if (g.suiteId) directCaseCount.set(g.suiteId, g._count._all);
  // `parentId` tidak punya constraint anti-siklus di DB dan suite bisa dibuat
  // lewat REST API / importer, jadi setiap traversal membawa set id yang sudah
  // dikunjungi — data rusak memotong cabang, bukan mematikan halaman.
  const subtreeCaseCount = (id: string, seen = new Set<string>()): number => {
    if (seen.has(id)) return 0;
    seen.add(id);
    return (
      (directCaseCount.get(id) ?? 0) +
      childrenOf(id).reduce((sum, ch) => sum + subtreeCaseCount(ch.id, seen), 0)
    );
  };

  // Nesting sedalam ini tidak masuk akal untuk suite QA; lebih dalam tetap
  // dihitung di caseCount tapi tidak dirender.
  const MAX_TREE_DEPTH = 8;
  const buildTree = (
    parentId: string | null,
    depth = 0,
    seen = new Set<string>()
  ): SuiteNode[] => {
    if (depth >= MAX_TREE_DEPTH) return [];
    return project.suites
      .filter((s) => (s.parentId ?? null) === parentId && !seen.has(s.id))
      .sort((a, b) => a.order - b.order || a.name.localeCompare(b.name))
      .map((s) => ({
        id: s.id,
        name: s.name,
        caseCount: subtreeCaseCount(s.id),
        children: buildTree(s.id, depth + 1, new Set(seen).add(s.id)),
      }));
  };

  // Urutan DFS yang sama dengan tree, dipakai untuk dropdown parent di form.
  const flattenTree = (
    nodes: SuiteNode[],
    depth = 0
  ): { id: string; name: string; depth: number }[] =>
    nodes.flatMap((n) => [
      { id: n.id, name: n.name, depth },
      ...flattenTree(n.children, depth + 1),
    ]);

  const suiteTree = buildTree(null);

  // Grid folder ala Drive di atas tabel case: isi folder yang sedang dibuka.
  // Node aktif dicari di tree yang sudah dibangun supaya guard siklus & batas
  // kedalaman berlaku sama seperti di sidebar.
  const findNode = (nodes: SuiteNode[], id: string): SuiteNode | null => {
    for (const n of nodes) {
      if (n.id === id) return n;
      const hit = findNode(n.children, id);
      if (hit) return hit;
    }
    return null;
  };
  const openFolder = searchParams.suite
    ? findNode(suiteTree, searchParams.suite)
    : null;
  const folderHref = (suiteId?: string) => {
    const p = new URLSearchParams();
    Object.entries({ ...searchParams, suite: suiteId }).forEach(
      ([k, v]) => v && p.set(k, String(v))
    );
    const s = p.toString();
    return `/projects/${project.slug}${s ? `?${s}` : ""}`;
  };
  const folders = (openFolder ? openFolder.children : suiteTree).map((n) => ({
    id: n.id,
    name: n.name,
    href: folderHref(n.id),
    caseCount: n.caseCount,
    childCount: n.children.length,
  }));

  // Breadcrumb from the open folder back to the root, so users can navigate
  // back up — the folder grid itself only ever drills further in.
  const crumbs: { id: string; name: string }[] = [];
  for (let id: string | null = openFolder?.id ?? null; id; ) {
    const suite = project.suites.find((s) => s.id === id);
    if (!suite) break;
    crumbs.unshift({ id: suite.id, name: suite.name });
    id = suite.parentId ?? null;
    if (crumbs.length > MAX_TREE_DEPTH) break;
  }

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
            <SuiteTree
              slug={project.slug}
              canWrite={canWrite}
              activeSuite={searchParams.suite}
              searchParams={searchParams}
              roots={suiteTree}
            />
            <div className="mt-3">
              <NewSuiteForm
                projectId={project.id}
                suites={flattenTree(suiteTree)}
              />
            </div>
          </div>
          {/* F-04: reusable step blocks library */}
          <Link
            href={`/projects/${project.slug}/cases/shared-steps`}
            data-testid="shared-steps-link"
            className="block rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 hover:border-indigo-300 hover:text-indigo-700"
          >
            ⛓ Shared Steps
          </Link>
        </aside>

        {/* Case list */}
        <div className="min-w-0 flex-1 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <SavedViewsMenu
              projectId={project.id}
              projectSlug={project.slug}
              canShare={canWrite}
              canManageShared={session.role === "ADMIN"}
              activeViewId={searchParams.v}
              currentFilters={sanitizeCaseFilters(searchParams)}
              views={savedViews.map((v) => ({
                id: v.id,
                name: v.name,
                shared: v.shared,
                isDefault: v.isDefault,
                mine: v.userId === session.userId,
                filters: sanitizeCaseFilters(JSON.parse(v.filtersJson)),
              }))}
            />
            <form className="flex flex-1 flex-wrap items-center gap-2">
              {searchParams.suite && (
                <input type="hidden" name="suite" value={searchParams.suite} />
              )}
              <input
                name="q"
                defaultValue={searchParams.q}
                placeholder="Search test cases..."
                className="w-48 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
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
            {/* F-15: "Needs my review" toggle chip. */}
            <Link
              href={
                reviewMine
                  ? `/projects/${project.slug}?v=all${searchParams.suite ? `&suite=${searchParams.suite}` : ""}`
                  : `/projects/${project.slug}?review=mine${searchParams.suite ? `&suite=${searchParams.suite}` : ""}`
              }
              data-testid="review-filter-chip"
              className={`rounded-lg border px-3 py-2 text-sm ${
                reviewMine
                  ? "border-amber-400 bg-amber-50 text-amber-800"
                  : "border-slate-300 hover:bg-slate-100"
              }`}
            >
              <TFIcon name="review" className="mr-1 inline-block h-4 w-4 align-[-3px]" />
              Needs my review
              {needsMyReview > 0 && (
                <span
                  className="ml-1.5 rounded-full bg-amber-500 px-1.5 py-0.5 text-xs font-semibold text-white"
                  data-testid="review-filter-count"
                >
                  {needsMyReview}
                </span>
              )}
            </Link>
            <ExportMenu
              items={[
                { label: "CSV", href: `/api/export/cases?project=${project.slug}`, testid: "export-csv-link" },
                { label: "XLSX", href: `/api/export/cases-xlsx?project=${project.slug}`, testid: "export-xlsx-link" },
                { label: "JSON", href: `/api/export/cases-json?project=${project.slug}`, testid: "export-json-link" },
                {
                  label: "Gherkin (.feature)",
                  href: `/api/export/gherkin?project=${project.slug}`,
                  testid: "export-gherkin-link",
                },
              ]}
            />
            {/* F-35: printable case catalog, scoped to the active suite/view. */}
            <Link
              href={`/print/projects/${project.slug}/cases${(() => {
                const p = new URLSearchParams();
                if (searchParams.suite) p.set("suite", searchParams.suite);
                if (searchParams.v && searchParams.v !== "all") p.set("view", searchParams.v);
                const qs = p.toString();
                return qs ? `?${qs}` : "";
              })()}`}
              target="_blank"
              rel="noopener"
              data-testid="print-cases-link"
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm hover:bg-slate-100"
            >
              <span className="inline-flex items-center gap-1.5"><TFIcon name="print" className="h-4 w-4" /> Print view</span>
            </Link>
            <Link
              href={`/projects/${project.slug}/import`}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm hover:bg-slate-100"
            >
              <span className="inline-flex items-center gap-1.5"><TFIcon name="upload" className="h-4 w-4" /> Import</span>
            </Link>
            {aiOn && <AiGenerateCases projectId={project.id} />}
            {canWrite && (
              <Link
                href={`/projects/${project.slug}/cases/new${searchParams.suite ? `?suite=${searchParams.suite}` : ""}`}
                data-testid="case-new"
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
              >
                + Test Case
              </Link>
            )}
          </div>

          {openFolder && (
            <div
              data-testid="suite-breadcrumb"
              className="flex flex-wrap items-center gap-2 text-sm text-slate-400"
            >
              <Link
                href={folderHref()}
                data-testid="suite-breadcrumb-root"
                className="hover:text-slate-600"
              >
                All suites
              </Link>
              {crumbs.map((c) => (
                <span key={c.id} className="flex items-center gap-2">
                  <span>/</span>
                  <Link
                    href={folderHref(c.id)}
                    data-testid={`suite-breadcrumb-${c.id}`}
                    className="text-slate-600 hover:text-slate-800"
                  >
                    {c.name}
                  </Link>
                </span>
              ))}
            </div>
          )}

          <SuiteFolderGrid folders={folders} />

          <CasesTable
            projectSlug={project.slug}
            projectName={project.name}
            canWrite={canWrite}
            searchParams={searchParams}
            otherProjects={otherProjects.map((m) => m.project)}
            cases={cases.map((c) => ({
              id: c.id,
              seq: c.seq,
              title: c.title,
              suiteName: c.suite?.name ?? null,
              priority: c.priority,
              type: c.type,
              status: c.status,
              automationStatus: c.automationStatus,
              tags: c.tags,
            }))}
          />
        </div>
      </div>
    </div>
  );
}
