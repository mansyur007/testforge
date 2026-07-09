import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { caseDisplayId } from "@/lib/constants";

// F-09 global search (⌘K palette). Internal, session-only endpoint.
// The security boundary: every query is scoped to projects the user is a
// member of — nothing outside that set can ever appear in results.
export const dynamic = "force-dynamic";

const EMPTY = { cases: [], runs: [], suites: [], milestones: [] };
const PER_GROUP = 10;

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session)
    return NextResponse.json(
      { error: { code: "unauthorized", message: "Authentication required" } },
      { status: 401 }
    );

  const q = (req.nextUrl.searchParams.get("q") ?? "").trim();
  const projectFilter = req.nextUrl.searchParams.get("project");
  if (q.length < 2) return NextResponse.json(EMPTY);

  const projects = await db.project.findMany({
    where: {
      members: { some: { userId: session.userId } },
      ...(projectFilter ? { slug: projectFilter } : {}),
    },
    select: { id: true, slug: true },
  });
  if (projects.length === 0) return NextResponse.json(EMPTY);
  const ids = projects.map((p) => p.id);
  const slugOf = new Map(projects.map((p) => [p.id, p.slug]));

  // Exact display-id lookup (TC-<slug>-<seq>) ranks first in the cases group.
  const idMatch = /^tc-(.+)-(\d+)$/i.exec(q);
  const exactProject = idMatch
    ? projects.find((p) => p.slug.toLowerCase() === idMatch[1].toLowerCase())
    : undefined;
  const exact = exactProject
    ? await db.testCase.findFirst({
        where: {
          projectId: exactProject.id,
          seq: parseInt(idMatch![2], 10),
          deletedAt: null,
        },
      })
    : null;

  const [cases, runs, suites, milestones] = await Promise.all([
    db.testCase.findMany({
      where: {
        projectId: { in: ids },
        deletedAt: null,
        OR: [{ title: { contains: q } }, { description: { contains: q } }],
      },
      orderBy: { updatedAt: "desc" },
      take: PER_GROUP,
    }),
    db.testRun.findMany({
      where: { projectId: { in: ids }, name: { contains: q } },
      orderBy: { createdAt: "desc" },
      take: PER_GROUP,
    }),
    db.testSuite.findMany({
      where: { projectId: { in: ids }, name: { contains: q } },
      take: PER_GROUP,
    }),
    db.milestone.findMany({
      where: { projectId: { in: ids }, name: { contains: q } },
      take: PER_GROUP,
    }),
  ]);

  const rankedCases = [
    ...(exact ? [exact] : []),
    ...cases.filter((c) => c.id !== exact?.id),
  ].slice(0, PER_GROUP);

  return NextResponse.json({
    cases: rankedCases.map((c) => ({
      id: c.id,
      displayId: caseDisplayId(slugOf.get(c.projectId)!, c.seq),
      title: c.title,
      projectSlug: slugOf.get(c.projectId)!,
    })),
    runs: runs.map((r) => ({
      id: r.id,
      name: r.name,
      status: r.status,
      projectSlug: slugOf.get(r.projectId)!,
    })),
    suites: suites.map((s) => ({
      id: s.id,
      name: s.name,
      projectSlug: slugOf.get(s.projectId)!,
    })),
    milestones: milestones.map((m) => ({
      id: m.id,
      name: m.name,
      projectSlug: slugOf.get(m.projectId)!,
    })),
  });
}
