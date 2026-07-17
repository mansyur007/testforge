import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import { guard, notFoundError, badRequest, requirePerm, serializeCaseDependency } from "@/lib/api";
import { wouldCreateCycle } from "@/lib/case-dependencies";

// F-32: a case's prerequisites (what it depends on) and dependents (what
// depends on it).

async function resolveCase(slug: string, caseId: string, userId: string) {
  return db.testCase.findFirst({
    where: {
      id: caseId,
      deletedAt: null,
      project: { slug, members: { some: { userId } } },
    },
    select: { id: true, projectId: true },
  });
}

export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string; caseId: string } }
) {
  const g = await guard(req);
  if (g instanceof NextResponse) return g;

  const testCase = await resolveCase(params.slug, params.caseId, g.userId);
  if (!testCase) return notFoundError("Case not found");

  const [prerequisites, dependents] = await Promise.all([
    db.caseDependency.findMany({ where: { caseId: testCase.id }, orderBy: { createdAt: "asc" } }),
    db.caseDependency.findMany({ where: { dependsOnCaseId: testCase.id }, orderBy: { createdAt: "asc" } }),
  ]);

  return NextResponse.json({
    prerequisites: prerequisites.map(serializeCaseDependency),
    dependents: dependents.map(serializeCaseDependency),
  });
}

export async function POST(
  req: NextRequest,
  { params }: { params: { slug: string; caseId: string } }
) {
  const g = await guard(req, { write: true });
  if (g instanceof NextResponse) return g;

  const testCase = await resolveCase(params.slug, params.caseId, g.userId);
  if (!testCase) return notFoundError("Case not found");
  const denied = await requirePerm(g.userId, testCase.projectId, "case.write");
  if (denied) return denied;

  const body = await req.json().catch(() => null);
  const dependsOnCaseId = body?.dependsOnCaseId ? String(body.dependsOnCaseId) : "";
  if (!dependsOnCaseId) return badRequest("dependsOnCaseId is required");
  if (dependsOnCaseId === testCase.id)
    return badRequest("A case cannot depend on itself");

  const prereq = await db.testCase.findFirst({
    where: { id: dependsOnCaseId, projectId: testCase.projectId, deletedAt: null },
    select: { id: true },
  });
  if (!prereq) return badRequest("dependsOnCaseId must be a live case in this project");

  if (await wouldCreateCycle(testCase.id, dependsOnCaseId))
    return badRequest("This would create a dependency cycle");

  const dep = await db.caseDependency.upsert({
    where: { caseId_dependsOnCaseId: { caseId: testCase.id, dependsOnCaseId } },
    create: { caseId: testCase.id, dependsOnCaseId },
    update: {},
  });

  await logAudit({
    userId: g.userId,
    action: "case_dependency.add",
    entityType: "case",
    entityId: testCase.id,
    detail: `depends on ${dependsOnCaseId}`,
  });

  return NextResponse.json(serializeCaseDependency(dep), { status: 201 });
}
