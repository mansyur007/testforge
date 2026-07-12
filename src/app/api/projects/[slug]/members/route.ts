import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

// F-16: internal (cookie-auth) member autocomplete for the @mention picker.
// Tenant-scoped: only members of a project the caller belongs to are returned.
export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const session = await getSession();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const project = await db.project.findFirst({
    where: { slug: params.slug, members: { some: { userId: session.userId } } },
    select: { id: true },
  });
  if (!project)
    return NextResponse.json({ error: "Project not found" }, { status: 404 });

  const q = (req.nextUrl.searchParams.get("q") ?? "").trim().toLowerCase();
  const members = await db.projectMember.findMany({
    where: { projectId: project.id },
    include: { user: { select: { id: true, name: true, email: true } } },
    orderBy: { user: { name: "asc" } },
  });

  const data = members
    .map((m) => m.user)
    .filter(
      (u) =>
        !q ||
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q)
    )
    .slice(0, 8);

  return NextResponse.json({ data });
}
