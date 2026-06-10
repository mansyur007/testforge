import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AuditLogPage() {
  await requireSession();
  const logs = await db.auditLog.findMany({
    include: { user: true },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Audit Log</h1>
        <p className="text-sm text-slate-500">
          Semua aksi penting tercatat dengan timestamp dan user (PRD §5.5).
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
            <tr>
              <th className="px-5 py-3">Waktu</th>
              <th className="px-5 py-3">User</th>
              <th className="px-5 py-3">Aksi</th>
              <th className="px-5 py-3">Detail</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {logs.map((log) => (
              <tr key={log.id}>
                <td className="whitespace-nowrap px-5 py-2.5 text-xs text-slate-500">
                  {log.createdAt.toLocaleString("id-ID")}
                </td>
                <td className="px-5 py-2.5">{log.user?.name ?? "System"}</td>
                <td className="px-5 py-2.5">
                  <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs">
                    {log.action}
                  </code>
                </td>
                <td className="px-5 py-2.5 text-slate-600">{log.detail}</td>
              </tr>
            ))}
            {logs.length === 0 && (
              <tr>
                <td colSpan={4} className="px-5 py-8 text-center text-slate-400">
                  Belum ada aktivitas tercatat.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
