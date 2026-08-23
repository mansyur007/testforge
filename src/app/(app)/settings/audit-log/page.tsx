import Link from "next/link";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

const DEFAULT_PAGE_SIZE = 25;
const MAX_PAGE_SIZE = 200;

type SearchParams = { page?: string; per?: string };

export default async function AuditLogPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const session = await requireSession();

  // Scoping: hanya aktivitas dalam organization user yang login (atau aktivitas
  // user sendiri bila belum punya organization) — tidak bocor lintas-tenant.
  const me = await db.user.findUnique({
    where: { id: session.userId },
    select: { organizationId: true },
  });
  const where = me?.organizationId
    ? { user: { organizationId: me.organizationId } }
    : { userId: session.userId };

  const perSize = Math.min(
    MAX_PAGE_SIZE,
    Math.max(1, parseInt(searchParams.per ?? "", 10) || DEFAULT_PAGE_SIZE)
  );
  const total = await db.auditLog.count({ where });
  const totalPages = Math.max(1, Math.ceil(total / perSize));
  const page = Math.min(
    totalPages,
    Math.max(1, parseInt(searchParams.page ?? "", 10) || 1)
  );

  const logs = await db.auditLog.findMany({
    where,
    include: { user: true },
    orderBy: { createdAt: "desc" },
    skip: (page - 1) * perSize,
    take: perSize,
  });

  const href = (next: Partial<SearchParams>) => {
    const p = new URLSearchParams();
    Object.entries({ ...searchParams, ...next }).forEach(
      ([k, v]) => v && p.set(k, String(v))
    );
    const qs = p.toString();
    return `/settings/audit-log${qs ? `?${qs}` : ""}`;
  };

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Audit Log</h1>
          <p className="text-sm text-content-muted">
            Every important action is recorded with a timestamp and user.
          </p>
        </div>
        <Link
          href="/api/audit-log/export"
          prefetch={false}
          className="shrink-0 rounded-lg border border-hairline-strong px-4 py-2 text-sm font-medium text-content hover:bg-canvas"
        >
          Download CSV
        </Link>
      </div>

      <div className="overflow-x-auto rounded-xl border border-hairline bg-surface">
        <table className="w-full text-sm">
          <thead className="bg-canvas text-left text-xs uppercase text-content-muted">
            <tr>
              <th className="px-5 py-3">Time</th>
              <th className="px-5 py-3">User</th>
              <th className="px-5 py-3">Action</th>
              <th className="px-5 py-3">Detail</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-hairline-subtle">
            {logs.map((log) => (
              <tr key={log.id}>
                <td className="whitespace-nowrap px-5 py-2.5 text-xs text-content-muted">
                  {log.createdAt.toLocaleString("en-US")}
                </td>
                <td className="px-5 py-2.5">{log.user?.name ?? "System"}</td>
                <td className="px-5 py-2.5">
                  <code className="rounded bg-surface-muted px-1.5 py-0.5 text-xs">
                    {log.action}
                  </code>
                </td>
                <td className="px-5 py-2.5 text-content">{log.detail}</td>
              </tr>
            ))}
            {logs.length === 0 && (
              <tr>
                <td colSpan={4} className="px-5 py-8 text-center text-content-subtle">
                  No activity recorded yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between text-xs text-content-subtle">
        <span data-testid="audit-log-count">
          {total} {total === 1 ? "entry" : "entries"}
        </span>
        {totalPages > 1 && (
          <span className="flex items-center gap-2">
            {page > 1 && (
              <Link
                href={href({ page: String(page - 1) })}
                data-testid="audit-log-prev"
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
                data-testid="audit-log-next"
                className="rounded border border-hairline-strong bg-surface px-2 py-1 hover:bg-surface-muted"
              >
                Next →
              </Link>
            )}
          </span>
        )}
      </div>
    </div>
  );
}
