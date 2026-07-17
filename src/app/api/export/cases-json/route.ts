import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession, authenticateApiKey } from "@/lib/auth";
import { serializeCase } from "@/lib/api";
import { loadStepGroups } from "@/lib/steps";
import { serializeRevision } from "@/lib/case-revisions";

// F-30: full-fidelity JSON export — every case field (incl. custom fields,
// steps expanded, datasets), and each case's F-05 revision history when
// `?revisions=true` (a large addition, so it's opt-in).

export async function GET(req: NextRequest) {
  const session = (await getSession()) ?? (await authenticateApiKey(req));
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = "userId" in session ? session.userId : session.id;

  const slug = req.nextUrl.searchParams.get("project") ?? "";
  const withRevisions = req.nextUrl.searchParams.get("revisions") === "true";
  const project = await db.project.findFirst({
    where: { slug, members: { some: { userId } } },
    include: {
      cases: { where: { deletedAt: null }, orderBy: { seq: "asc" } },
    },
  });
  if (!project)
    return NextResponse.json({ error: "Project not found" }, { status: 404 });

  const stepGroups = await loadStepGroups(project.id);

  let revisionsByCase: Map<string, ReturnType<typeof serializeRevision>[]> | null = null;
  if (withRevisions) {
    const revisions = await db.testCaseRevision.findMany({
      where: { caseId: { in: project.cases.map((c) => c.id) } },
      include: { author: { select: { name: true } } },
      orderBy: [{ caseId: "asc" }, { rev: "asc" }],
    });
    revisionsByCase = new Map();
    for (const r of revisions) {
      const list = revisionsByCase.get(r.caseId) ?? [];
      list.push(serializeRevision(r));
      revisionsByCase.set(r.caseId, list);
    }
  }

  const cases = project.cases.map((c) => ({
    ...serializeCase(project.slug, c, stepGroups),
    ...(revisionsByCase ? { revisions: revisionsByCase.get(c.id) ?? [] } : {}),
  }));

  const body = JSON.stringify({ project: project.slug, exportedAt: new Date().toISOString(), cases }, null, 2);
  return new NextResponse(body, {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="${project.slug}-cases.json"`,
    },
  });
}
