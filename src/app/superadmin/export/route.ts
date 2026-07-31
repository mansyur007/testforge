import { NextResponse } from "next/server";
import Papa from "papaparse";
import { db } from "@/lib/db";
import { getSuperadminSession, superadminEnabled } from "@/lib/superadmin";

// F-41: CSV of every registered user. Lives under /superadmin (not /api) on
// purpose — the operator cookie is path-scoped to this console, so an /api
// route would never receive it.
export const dynamic = "force-dynamic";

export async function GET() {
  if (!superadminEnabled())
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!(await getSuperadminSession()))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const users = await db.user.findMany({
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
  });

  const csv = Papa.unparse(
    users.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      organization: u.organization?.name ?? "",
      organization_slug: u.organization?.slug ?? "",
      projects: u._count.memberships,
      email_verified: u.emailVerifiedAt ? "yes" : "no",
      two_factor: u.totpEnabledAt ? "yes" : "no",
      signed_up: u.createdAt.toISOString(),
    })),
    {
      columns: [
        "id",
        "name",
        "email",
        "role",
        "organization",
        "organization_slug",
        "projects",
        "email_verified",
        "two_factor",
        "signed_up",
      ],
    }
  );

  const stamp = new Date().toISOString().slice(0, 10);
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="testforge-users-${stamp}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
