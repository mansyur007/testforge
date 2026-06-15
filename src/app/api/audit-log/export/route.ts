import { NextResponse } from "next/server";
import Papa from "papaparse";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

// Export audit log ke CSV. Memakai scoping yang sama dengan halaman audit-log:
// hanya aktivitas dalam organization user (atau aktivitas user sendiri bila
// belum punya organization) — tidak pernah membocorkan tenant lain.
export async function GET() {
  const session = await getSession();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const me = await db.user.findUnique({
    where: { id: session.userId },
    select: { organizationId: true },
  });
  const where = me?.organizationId
    ? { user: { organizationId: me.organizationId } }
    : { userId: session.userId };

  const logs = await db.auditLog.findMany({
    where,
    include: { user: true },
    orderBy: { createdAt: "desc" },
    take: 1000,
  });

  const csv = Papa.unparse(
    logs.map((log) => ({
      waktu: log.createdAt.toISOString(),
      user: log.user?.name ?? "System",
      email: log.user?.email ?? "",
      aksi: log.action,
      detail: log.detail ?? "",
    })),
    { columns: ["waktu", "user", "email", "aksi", "detail"] }
  );

  const stamp = new Date().toISOString().slice(0, 10);
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="testforge-audit-log-${stamp}.csv"`,
    },
  });
}
