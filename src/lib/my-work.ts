import { db } from "@/lib/db";

// F-31 "My work": a cross-project view of everything assigned to the current
// user — results waiting for them in active runs, cases they own, and case
// reviews requested from them (F-15). Every query is scoped to projects
// they're a member of (same tenant guard as the dashboard).

export type MyWorkCounts = { results: number; cases: number; reviews: number };

function mineScope(userId: string) {
  return { members: { some: { userId } } };
}

/** Cheap counts for the sidebar badge — no included relations. */
export async function loadMyWorkCounts(userId: string): Promise<MyWorkCounts> {
  const project = mineScope(userId);
  const [results, cases, reviews] = await Promise.all([
    db.testRunResult.count({
      where: { assigneeId: userId, run: { status: "ACTIVE", project } },
    }),
    db.testCase.count({
      where: { assigneeId: userId, deletedAt: null, project },
    }),
    db.testCase.count({
      where: { reviewerId: userId, status: "IN_REVIEW", project },
    }),
  ]);
  return { results, cases, reviews };
}

export async function loadMyWork(userId: string) {
  const project = mineScope(userId);
  const [results, cases, reviews] = await Promise.all([
    db.testRunResult.findMany({
      where: { assigneeId: userId, run: { status: "ACTIVE", project } },
      include: {
        testCase: { select: { seq: true, title: true } },
        run: { select: { id: true, name: true, project: { select: { slug: true, name: true } } } },
      },
      orderBy: { updatedAt: "desc" },
    }),
    db.testCase.findMany({
      where: { assigneeId: userId, deletedAt: null, project },
      include: { project: { select: { slug: true, name: true } } },
      orderBy: { updatedAt: "desc" },
    }),
    db.testCase.findMany({
      where: { reviewerId: userId, status: "IN_REVIEW", project },
      include: { project: { select: { slug: true, name: true } } },
      orderBy: { updatedAt: "desc" },
    }),
  ]);
  return { results, cases, reviews };
}
