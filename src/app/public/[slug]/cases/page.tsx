import Link from "next/link";
import type { Metadata } from "next";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import {
  caseDisplayId,
  parseTags,
  PRIORITY_BADGES,
  STATUS_BADGES,
} from "@/lib/constants";
import { SuiteFolderGrid } from "@/components/SuiteFolderGrid";
import {
  publicMetadata,
  requirePublicProject,
  requireSection,
} from "@/lib/public-share";

// F-38: public, read-only case browser. Presentation only — CasesTable is a
// client component wired to the bulk-edit server actions, so this page renders
// its own lean table instead of threading a "public" flag through it.
export const revalidate = 60;

const DEFAULT_PAGE_SIZE = 25;
const MAX_PAGE_SIZE = 200;
// Suites nested deeper than this are still counted, just not rendered — same
// cap the authenticated tree uses.
const MAX_TREE_DEPTH = 8;

type SearchParams = { suite?: string; q?: string; page?: string; per?: string };

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const project = await requirePublicProject(params.slug);
  requireSection(project, "cases");
  return publicMetadata(project, {
    title: "Test cases",
    description: `Test cases for ${project.name}, published with TestForge.`,
  });
}

type SuiteNode = {
  id: string;
  name: string;
  parentId: string | null;
  caseCount: number;
  children: SuiteNode[];
};

export default async function PublicCasesPage({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams: SearchParams;
}) {
  const project = await requirePublicProject(params.slug);
  requireSection(project, "cases");

  const suites = await db.testSuite.findMany({
    where: { projectId: project.id },
    orderBy: { order: "asc" },
    select: { id: true, name: true, parentId: true },
  });

  const grouped = await db.testCase.groupBy({
    by: ["suiteId"],
    where: { projectId: project.id, deletedAt: null },
    _count: { _all: true },
  });
  const directCaseCount = new Map<string, number>();
  for (const g of grouped)
    if (g.suiteId) directCaseCount.set(g.suiteId, g._count._all);

  // `parentId` has no anti-cycle constraint in the DB (suites can be created
  // through the REST API / importer), so every traversal carries the set of
  // ids already visited — corrupt data prunes a branch, it doesn't hang the page.
  const childrenOf = (id: string | null) =>
    suites.filter((s) => (s.parentId ?? null) === id);
  const subtreeCaseCount = (id: string, seen = new Set<string>()): number => {
    if (seen.has(id)) return 0;
    seen.add(id);
    return (
      (directCaseCount.get(id) ?? 0) +
      childrenOf(id).reduce((sum, ch) => sum + subtreeCaseCount(ch.id, seen), 0)
    );
  };
  const buildTree = (
    parentId: string | null,
    depth = 0,
    seen = new Set<string>()
  ): SuiteNode[] => {
    if (depth >= MAX_TREE_DEPTH) return [];
    return childrenOf(parentId)
      .filter((s) => !seen.has(s.id))
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((s) => ({
        id: s.id,
        name: s.name,
        parentId: s.parentId ?? null,
        caseCount: subtreeCaseCount(s.id),
        children: buildTree(s.id, depth + 1, new Set(seen).add(s.id)),
      }));
  };
  const tree = buildTree(null);

  const findNode = (nodes: SuiteNode[], id: string): SuiteNode | null => {
    for (const n of nodes) {
      if (n.id === id) return n;
      const hit = findNode(n.children, id);
      if (hit) return hit;
    }
    return null;
  };
  const openFolder = searchParams.suite
    ? findNode(tree, searchParams.suite)
    : null;
  // An unknown/foreign ?suite= id simply resolves to no folder; the where
  // clause below still scopes the query to this project either way.
  const activeSuiteId = openFolder?.id ?? null;

  const href = (next: Partial<SearchParams>) => {
    const p = new URLSearchParams();
    Object.entries({ ...searchParams, ...next }).forEach(
      ([k, v]) => v && p.set(k, String(v))
    );
    const qs = p.toString();
    return `/public/${project.slug}/cases${qs ? `?${qs}` : ""}`;
  };

  const folders = (openFolder ? openFolder.children : tree).map((n) => ({
    id: n.id,
    name: n.name,
    href: href({ suite: n.id, page: undefined }),
    caseCount: n.caseCount,
    childCount: n.children.length,
  }));

  // Breadcrumb from the open folder back to the root of the tree.
  const crumbs: SuiteNode[] = [];
  for (let node = openFolder; node; ) {
    crumbs.unshift(node);
    node = node.parentId ? findNode(tree, node.parentId) : null;
    if (crumbs.length > MAX_TREE_DEPTH) break;
  }

  const where: Prisma.TestCaseWhereInput = {
    projectId: project.id,
    deletedAt: null,
  };
  if (activeSuiteId) where.suiteId = activeSuiteId;
  if (searchParams.q) where.title = { contains: searchParams.q };

  const perSize = Math.min(
    MAX_PAGE_SIZE,
    Math.max(1, parseInt(searchParams.per ?? "", 10) || DEFAULT_PAGE_SIZE)
  );
  const total = await db.testCase.count({ where });
  const totalPages = Math.max(1, Math.ceil(total / perSize));
  const page = Math.min(
    totalPages,
    Math.max(1, parseInt(searchParams.page ?? "", 10) || 1)
  );
  const cases = await db.testCase.findMany({
    where,
    orderBy: [{ order: "asc" }, { seq: "asc" }],
    skip: (page - 1) * perSize,
    take: perSize,
    select: {
      id: true,
      seq: true,
      title: true,
      priority: true,
      type: true,
      status: true,
      tags: true,
      suite: { select: { name: true } },
    },
  });

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 text-sm text-content-subtle">
          <Link
            href={href({ suite: undefined, page: undefined })}
            className="hover:text-content"
          >
            All suites
          </Link>
          {crumbs.map((c) => (
            <span key={c.id} className="flex items-center gap-2">
              <span>/</span>
              <Link
                href={href({ suite: c.id, page: undefined })}
                className="text-content hover:text-content-strong"
              >
                {c.name}
              </Link>
            </span>
          ))}
        </div>
        {/* GET form — a filter, not a mutation. */}
        <form className="flex items-center gap-2">
          {activeSuiteId && (
            <input type="hidden" name="suite" value={activeSuiteId} />
          )}
          {searchParams.per && (
            <input type="hidden" name="per" value={String(perSize)} />
          )}
          <input
            name="q"
            defaultValue={searchParams.q}
            placeholder="Search test cases..."
            data-testid="public-cases-search"
            className="bg-surface text-content-strong w-52 rounded-lg border border-hairline-strong px-3 py-2 text-sm focus:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-ring"
          />
          <button className="rounded-lg border border-hairline-strong bg-surface px-3 py-2 text-sm hover:bg-surface-muted">
            Search
          </button>
        </form>
      </div>

      <SuiteFolderGrid folders={folders} />

      <div
        className="overflow-x-auto rounded-xl border border-hairline bg-surface"
        data-testid="public-cases-table"
      >
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-hairline text-left text-xs uppercase text-content-subtle">
              <th className="px-4 py-3">ID</th>
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Suite</th>
              <th className="px-4 py-3">Priority</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {cases.map((c) => (
              <tr
                key={c.id}
                className="border-b border-hairline-subtle last:border-0 hover:bg-canvas"
              >
                <td className="whitespace-nowrap px-4 py-2.5 font-mono text-xs text-content-subtle">
                  {caseDisplayId(project.slug, c.seq)}
                </td>
                <td className="px-4 py-2.5">
                  <Link
                    href={`/public/${project.slug}/cases/${c.id}`}
                    data-testid={`public-case-link-${c.id}`}
                    className="font-medium text-content-strong hover:text-accent-soft-fg"
                  >
                    {c.title}
                  </Link>
                  {parseTags(c.tags).length > 0 && (
                    <span className="ml-2 inline-flex flex-wrap gap-1 align-middle">
                      {parseTags(c.tags).map((t) => (
                        <span
                          key={t}
                          className="rounded bg-surface-muted px-1.5 py-0.5 text-xs text-content-muted"
                        >
                          {t}
                        </span>
                      ))}
                    </span>
                  )}
                </td>
                <td className="px-4 py-2.5 text-content-muted">
                  {c.suite?.name ?? "—"}
                </td>
                <td className="px-4 py-2.5">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${PRIORITY_BADGES[c.priority] ?? "bg-surface-muted text-content"}`}
                  >
                    {c.priority}
                  </span>
                </td>
                <td className="px-4 py-2.5 text-content-muted">{c.type}</td>
                <td className="px-4 py-2.5">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_BADGES[c.status] ?? "bg-surface-muted text-content"}`}
                  >
                    {c.status.replace(/_/g, " ")}
                  </span>
                </td>
              </tr>
            ))}
            {cases.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-10 text-center text-sm text-content-subtle"
                  data-testid="public-cases-empty"
                >
                  No test cases here.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between text-xs text-content-subtle">
        <span data-testid="public-cases-count">
          {total} {total === 1 ? "case" : "cases"}
        </span>
        {totalPages > 1 && (
          <span className="flex items-center gap-2">
            {page > 1 && (
              <Link
                href={href({ page: String(page - 1) })}
                data-testid="public-cases-prev"
                className="rounded border border-hairline-strong bg-surface px-2 py-1 hover:bg-surface-muted"
              >
                ← Prev
              </Link>
            )}
            <span>
              Page {page} of {totalPages}
            </span>
            {page < totalPages && (
              <Link
                href={href({ page: String(page + 1) })}
                data-testid="public-cases-next"
                className="rounded border border-hairline-strong bg-surface px-2 py-1 hover:bg-surface-muted"
              >
                Next →
              </Link>
            )}
          </span>
        )}
      </div>
    </>
  );
}
