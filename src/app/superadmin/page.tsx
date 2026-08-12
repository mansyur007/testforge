import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { NOINDEX } from "@/lib/seo";
import { Logo } from "@/components/icons";
import { requireSuperadmin } from "@/lib/superadmin";
import { superadminLogout } from "@/app/actions/superadmin";

export const metadata: Metadata = {
  title: "Registered Users — TestForge Instance Console",
  robots: NOINDEX,
};

export const dynamic = "force-dynamic";

const PAGE_SIZE = 50;

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

export default async function SuperadminUsersPage({
  searchParams,
}: {
  searchParams: { q?: string; page?: string };
}) {
  const session = await requireSuperadmin();

  const q = (searchParams.q ?? "").trim();
  const page = Math.max(1, Number(searchParams.page ?? "1") || 1);

  // SQLite's LIKE is case-insensitive for ASCII, so `contains` needs no mode.
  const where = q
    ? {
        OR: [
          { name: { contains: q } },
          { email: { contains: q } },
        ],
      }
    : {};

  const [total, matching, verified, admins, orgCount, users] = await Promise.all([
    db.user.count(),
    db.user.count({ where }),
    db.user.count({ where: { emailVerifiedAt: { not: null } } }),
    db.user.count({ where: { role: "ADMIN" } }),
    db.organization.count(),
    db.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        emailVerifiedAt: true,
        totpEnabledAt: true,
        createdAt: true,
        organization: { select: { name: true, slug: true } },
        _count: { select: { memberships: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
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
    `/superadmin?${new URLSearchParams({ ...(q ? { q } : {}), page: String(p) })}`;

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
                <th className="px-5 py-3">User</th>
                <th className="px-5 py-3">Organization</th>
                <th className="px-5 py-3">Role</th>
                <th className="px-5 py-3">Projects</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Signed up</th>
                <th className="px-5 py-3">Last action</th>
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
