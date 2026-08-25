import type { Metadata } from "next";
import Link from "next/link";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { NOINDEX } from "@/lib/seo";
import { Logo } from "@/components/icons";
import { MEMBERSHIP_NOT_SANDBOX, SANDBOX_KIND } from "@/lib/academy/sandbox";
import { requireSuperadmin } from "@/lib/superadmin";
import { superadminLogout } from "@/app/actions/superadmin";

export const metadata: Metadata = {
  title: "Registered Users — TestForge Instance Console",
  robots: NOINDEX,
};

export const dynamic = "force-dynamic";

const PAGE_SIZE = 50;

type Dir = "asc" | "desc";

// Every column header is a sort link. The direction a column opens in is the
// one an operator wants first: newest dates, busiest accounts, A–Z for text.
const SORTS = {
  user: { dir: "asc", orderBy: (d: Dir) => ({ name: d }) },
  org: { dir: "asc", orderBy: (d: Dir) => ({ organization: { name: d } }) },
  role: { dir: "asc", orderBy: (d: Dir) => ({ role: d }) },
  // Prisma can order by a relation count but not by a *filtered* one, and this
  // column has to exclude Academy sandboxes to agree with the number it sorts
  // — so it takes the same raw-SQL route as "Last action" below.
  projects: { dir: "desc", orderBy: null },
  status: { dir: "asc", orderBy: (d: Dir) => ({ emailVerifiedAt: d }) },
  created: { dir: "desc", orderBy: (d: Dir) => ({ createdAt: d }) },
  // "Last action" lives in AuditLog, not User — see the raw ordering below.
  last: { dir: "desc", orderBy: null },
} satisfies Record<
  string,
  { dir: Dir; orderBy: ((d: Dir) => Prisma.UserOrderByWithRelationInput) | null }
>;

type SortKey = keyof typeof SORTS;

const DEFAULT_SORT: SortKey = "created";

function isDefaultSort(sort: SortKey, dir: Dir) {
  return sort === DEFAULT_SORT && dir === SORTS[DEFAULT_SORT].dir;
}

function fmtDate(d: Date) {
  return d.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// The audit log only records write actions, so this is "last thing they did",
// not "last time they were online" — a reader who never writes stays frozen at
// their login. Labelled "Last action" for that reason.
function LastAction({ at }: { at: Date | null | undefined }) {
  if (!at) return <span className="text-content-subtle">—</span>;
  return <>{fmtDate(at)}</>;
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-xl border border-hairline bg-surface px-5 py-4">
      <div className="text-2xl font-bold text-content-strong">{value}</div>
      <div className="text-xs uppercase tracking-wide text-content-muted">
        {label}
      </div>
    </div>
  );
}

function SortHeader({
  col,
  label,
  sort,
  dir,
  q,
}: {
  col: SortKey;
  label: string;
  sort: SortKey;
  dir: Dir;
  q: string;
}) {
  const active = sort === col;
  // Clicking the active column flips it; a fresh column opens in its own
  // preferred direction. No `page` — a new sort sends you back to page 1.
  const next = active ? (dir === "asc" ? "desc" : "asc") : SORTS[col].dir;
  const href = `/superadmin?${new URLSearchParams({
    ...(q ? { q } : {}),
    sort: col,
    dir: next,
  })}`;

  return (
    <th
      className="px-5 py-3"
      aria-sort={active ? (dir === "asc" ? "ascending" : "descending") : "none"}
    >
      <Link
        href={href}
        data-testid={`superadmin-sort-${col}`}
        className="group inline-flex items-center gap-1 hover:text-content-strong"
      >
        {label}
        <span
          aria-hidden
          className={
            active
              ? "text-content-strong"
              : "opacity-0 transition-opacity group-hover:opacity-60"
          }
        >
          {/* Active: where you are. Inactive (hover only): where a click goes. */}
          {(active ? dir : next) === "asc" ? "▲" : "▼"}
        </span>
      </Link>
    </th>
  );
}

// SQLite's LIKE treats % and _ as wildcards; Prisma escapes them inside
// `contains`, so the raw path below has to do the same or the two orderings
// would disagree on a query like "50%".
function likeParam(q: string) {
  return `%${q.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;
}

export default async function SuperadminUsersPage({
  searchParams,
}: {
  searchParams: { q?: string; page?: string; sort?: string; dir?: string };
}) {
  const session = await requireSuperadmin();

  const q = (searchParams.q ?? "").trim();
  const page = Math.max(1, Number(searchParams.page ?? "1") || 1);
  const sort: SortKey =
    searchParams.sort && searchParams.sort in SORTS
      ? (searchParams.sort as SortKey)
      : DEFAULT_SORT;
  const dir: Dir = searchParams.dir === "asc" ? "asc" : "desc";
  const skip = (page - 1) * PAGE_SIZE;

  // SQLite's LIKE is case-insensitive for ASCII, so `contains` needs no mode.
  const where = q
    ? {
        OR: [
          { name: { contains: q } },
          { email: { contains: q } },
        ],
      }
    : {};

  const select = {
    id: true,
    name: true,
    email: true,
    role: true,
    emailVerifiedAt: true,
    totpEnabledAt: true,
    createdAt: true,
    organization: { select: { name: true, slug: true } },
    // A-04: the Academy sandbox is the learner's scratch space, not their work.
    // Every "my projects" listing already filters it out; this count did not,
    // so an account that had opened one hands-on lesson and nothing else read
    // as having a project in the one column an operator uses to tell active
    // accounts from dormant ones.
    _count: { select: { memberships: MEMBERSHIP_NOT_SANDBOX } },
  };

  const nameOrEmailFilter = () =>
    q
      ? Prisma.sql`WHERE u."name" LIKE ${likeParam(q)} ESCAPE '\\' OR u."email" LIKE ${likeParam(q)} ESCAPE '\\'`
      : Prisma.empty;

  // Sorting by "Last action" orders on an aggregate of another table, which
  // Prisma's orderBy cannot express — so that one column picks the page's ids
  // in SQL first and hydrates them afterwards. Accounts that never wrote
  // anything sort last in both directions: "never" is not "oldest".
  const idsByLastAction = async () => {
    const filter = nameOrEmailFilter();
    // `dir` is narrowed to the two literals above, so Prisma.raw sees no input.
    const rows = await db.$queryRaw<{ id: string }[]>`
      SELECT u."id" AS id
      FROM "User" u
      LEFT JOIN (
        SELECT "userId", MAX("createdAt") AS "lastAt"
        FROM "AuditLog"
        WHERE "userId" IS NOT NULL
        GROUP BY "userId"
      ) a ON a."userId" = u."id"
      ${filter}
      ORDER BY a."lastAt" IS NULL, a."lastAt" ${Prisma.raw(dir.toUpperCase())}, u."id"
      LIMIT ${PAGE_SIZE} OFFSET ${skip}
    `;
    return rows.map((r) => r.id);
  };

  // Same escape hatch, for the same reason one step further along: the count
  // this sorts on is filtered, and Prisma's `orderBy` has no filtered form — so
  // ordering through it would rank rows by a number the table does not show.
  const idsByProjects = async () => {
    const filter = nameOrEmailFilter();
    const rows = await db.$queryRaw<{ id: string }[]>`
      SELECT u."id" AS id
      FROM "User" u
      ${filter}
      ORDER BY (
        SELECT COUNT(*)
        FROM "ProjectMember" m
        JOIN "Project" p ON p."id" = m."projectId"
        WHERE m."userId" = u."id" AND p."kind" <> ${SANDBOX_KIND}
      ) ${Prisma.raw(dir.toUpperCase())}, u."id"
      LIMIT ${PAGE_SIZE} OFFSET ${skip}
    `;
    return rows.map((r) => r.id);
  };

  const findPage = async () => {
    const byColumn = SORTS[sort].orderBy;
    if (byColumn) {
      return db.user.findMany({
        where,
        select,
        orderBy: byColumn(dir),
        skip,
        take: PAGE_SIZE,
      });
    }
    const ids = sort === "projects" ? await idsByProjects() : await idsByLastAction();
    if (ids.length === 0) return [];
    const rows = await db.user.findMany({ where: { id: { in: ids } }, select });
    // `in` promises no ordering — restore the one the raw query chose.
    const byId = new Map(rows.map((r) => [r.id, r]));
    return ids.flatMap((id) => byId.get(id) ?? []);
  };

  const [total, matching, verified, admins, orgCount, users] = await Promise.all([
    db.user.count(),
    db.user.count({ where }),
    db.user.count({ where: { emailVerifiedAt: { not: null } } }),
    db.user.count({ where: { role: "ADMIN" } }),
    db.organization.count(),
    findPage(),
  ]);

  // Second round-trip on purpose: the ids only exist once the page is sliced,
  // and this keeps the scan to the 50 rows actually rendered.
  const lastActions = users.length
    ? await db.auditLog.groupBy({
        by: ["userId"],
        where: { userId: { in: users.map((u) => u.id) } },
        _max: { createdAt: true },
      })
    : [];
  const lastActionBy = new Map(
    lastActions.map((a) => [a.userId, a._max.createdAt])
  );

  const pages = Math.max(1, Math.ceil(matching / PAGE_SIZE));
  const qs = (p: number) =>
    `/superadmin?${new URLSearchParams({
      ...(q ? { q } : {}),
      ...(isDefaultSort(sort, dir) ? {} : { sort, dir }),
      page: String(p),
    })}`;

  return (
    <main className="min-h-screen bg-canvas px-4 py-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Logo />
            <div>
              <h1 className="text-xl font-bold text-content-strong">
                Registered users
              </h1>
              <p className="text-sm text-content-muted">
                Every account on this instance, across all organizations.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-content-subtle">
              signed in as{" "}
              <code className="rounded bg-surface-muted px-1.5 py-0.5">
                {session.username}
              </code>
            </span>
            <Link
              href="/superadmin/export"
              prefetch={false}
              className="rounded-lg border border-hairline-strong px-3 py-1.5 text-sm font-medium text-content hover:bg-surface"
            >
              Download CSV
            </Link>
            <form action={superadminLogout}>
              <button
                type="submit"
                data-testid="superadmin-logout"
                className="rounded-lg border border-hairline-strong px-3 py-1.5 text-sm font-medium text-content hover:bg-surface"
              >
                Sign out
              </button>
            </form>
          </div>
        </header>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="Users" value={total} />
          <Stat label="Email verified" value={verified} />
          <Stat label="Org admins" value={admins} />
          <Stat label="Organizations" value={orgCount} />
        </div>

        <form method="get" className="flex gap-2">
          <input
            name="q"
            defaultValue={q}
            placeholder="Search name or email…"
            data-testid="superadmin-search"
            className="w-full max-w-sm rounded-lg border border-hairline-strong bg-surface px-3 py-2 text-sm text-content-strong focus:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-ring"
          />
          {/* Searching keeps whichever column you were sorting by. */}
          {!isDefaultSort(sort, dir) && (
            <>
              <input type="hidden" name="sort" value={sort} />
              <input type="hidden" name="dir" value={dir} />
            </>
          )}
          <button
            type="submit"
            className="rounded-lg border border-hairline-strong px-4 py-2 text-sm font-medium text-content hover:bg-surface"
          >
            Search
          </button>
          {q && (
            <Link
              href="/superadmin"
              className="self-center text-sm text-accent-text hover:underline"
            >
              Clear
            </Link>
          )}
        </form>

        <div className="overflow-x-auto rounded-xl border border-hairline bg-surface">
          <table className="w-full text-sm" data-testid="superadmin-users">
            <thead className="bg-canvas text-left text-xs uppercase text-content-muted">
              <tr>
                <SortHeader col="user" label="User" sort={sort} dir={dir} q={q} />
                <SortHeader
                  col="org"
                  label="Organization"
                  sort={sort}
                  dir={dir}
                  q={q}
                />
                <SortHeader col="role" label="Role" sort={sort} dir={dir} q={q} />
                <SortHeader
                  col="projects"
                  label="Projects"
                  sort={sort}
                  dir={dir}
                  q={q}
                />
                <SortHeader
                  col="status"
                  label="Status"
                  sort={sort}
                  dir={dir}
                  q={q}
                />
                <SortHeader
                  col="created"
                  label="Signed up"
                  sort={sort}
                  dir={dir}
                  q={q}
                />
                <SortHeader
                  col="last"
                  label="Last action"
                  sort={sort}
                  dir={dir}
                  q={q}
                />
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline-subtle">
              {users.map((u) => (
                <tr key={u.id}>
                  <td className="px-5 py-2.5">
                    <div className="font-medium text-content-strong">{u.name}</div>
                    <div className="text-xs text-content-muted">{u.email}</div>
                  </td>
                  <td className="px-5 py-2.5 text-content">
                    {u.organization?.name ?? (
                      <span className="text-content-subtle">—</span>
                    )}
                  </td>
                  <td className="px-5 py-2.5">
                    <code className="rounded bg-surface-muted px-1.5 py-0.5 text-xs">
                      {u.role}
                    </code>
                  </td>
                  <td className="px-5 py-2.5 text-content">
                    {u._count.memberships}
                  </td>
                  <td className="whitespace-nowrap px-5 py-2.5 text-xs">
                    {u.emailVerifiedAt ? (
                      <span className="text-success-soft-fg">verified</span>
                    ) : (
                      <span className="text-warning-soft-fg">unverified</span>
                    )}
                    {u.totpEnabledAt && (
                      <span className="ml-2 text-content-muted">2FA</span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-5 py-2.5 text-xs text-content-muted">
                    {fmtDate(u.createdAt)}
                  </td>
                  <td className="whitespace-nowrap px-5 py-2.5 text-xs text-content-muted">
                    <LastAction at={lastActionBy.get(u.id)} />
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-5 py-8 text-center text-content-subtle"
                  >
                    {q ? `No user matches “${q}”.` : "No users yet."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between text-sm text-content-muted">
          <span>
            {matching} {matching === 1 ? "user" : "users"}
            {q ? ` matching “${q}”` : ""} · page {page} of {pages}
          </span>
          <div className="flex gap-2">
            {page > 1 && (
              <Link
                href={qs(page - 1)}
                className="rounded-lg border border-hairline-strong px-3 py-1.5 hover:bg-surface"
              >
                Previous
              </Link>
            )}
            {page < pages && (
              <Link
                href={qs(page + 1)}
                className="rounded-lg border border-hairline-strong px-3 py-1.5 hover:bg-surface"
              >
                Next
              </Link>
            )}
          </div>
        </div>

        <p className="text-xs text-content-subtle">
          Read-only view. Use an organization admin account for member management.
        </p>
      </div>
    </main>
  );
}
