import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import {
  guard,
  notFoundError,
  validationError,
  type FieldError,
  requirePerm,
} from "@/lib/api";
import { caseDisplayId, PRIORITIES, CASE_TYPES } from "@/lib/constants";

const MAX_BATCH = 500;

// Bulk-create cases in one transaction — for seeding many cases at once instead
// of firing N separate POSTs. All-or-nothing: if any item is invalid the whole
// batch is rejected with per-item errors, so a partial import never happens.
export async function POST(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const g = await guard(req, { write: true });
  if (g instanceof NextResponse) return g;

  const project = await db.project.findFirst({
    where: { slug: params.slug, members: { some: { userId: g.userId } } },
    select: { id: true },
  });
  if (!project) return notFoundError("Project not found");
  const denied = await requirePerm(g.userId, project.id, "case.write"); // F-14
  if (denied) return denied;

  const body = await req.json().catch(() => null);
  if (!body || !Array.isArray(body.cases))
    return validationError([
      { field: "cases", message: "must be an array of cases" },
    ]);
  if (body.cases.length === 0)
    return validationError([{ field: "cases", message: "must not be empty" }]);
  if (body.cases.length > MAX_BATCH)
    return validationError([
      { field: "cases", message: `at most ${MAX_BATCH} cases per batch` },
    ]);

  const items = body.cases as Record<string, unknown>[];
  const errors: FieldError[] = [];

  // Resolve every referenced suite once, so we can flag unknown ids per item.
  const suiteIds = Array.from(
    new Set(items.map((c) => (c.suiteId ? String(c.suiteId) : null)).filter(Boolean))
  ) as string[];
  const validSuites = new Set(
    suiteIds.length
      ? (
          await db.testSuite.findMany({
            where: { id: { in: suiteIds }, projectId: project.id },
            select: { id: true },
          })
        ).map((s) => s.id)
      : []
  );

  items.forEach((c, i) => {
    if (!String(c.title ?? "").trim())
      errors.push({ field: `cases[${i}].title`, message: "is required" });
    if (c.priority) {
      const p = String(c.priority).toUpperCase();
      if (!PRIORITIES.includes(p as (typeof PRIORITIES)[number]))
        errors.push({
          field: `cases[${i}].priority`,
          message: `must be one of: ${PRIORITIES.join(", ")}`,
        });
    }
    if (c.type) {
      const t = String(c.type).toUpperCase();
      if (!CASE_TYPES.includes(t as (typeof CASE_TYPES)[number]))
        errors.push({
          field: `cases[${i}].type`,
          message: `must be one of: ${CASE_TYPES.join(", ")}`,
        });
    }
    if (c.suiteId && !validSuites.has(String(c.suiteId)))
      errors.push({
        field: `cases[${i}].suiteId`,
        message: "not found in this project",
      });
    if (c.estimateSeconds != null) {
      const n = Number(c.estimateSeconds);
      if (!Number.isFinite(n) || n < 0)
        errors.push({
          field: `cases[${i}].estimateSeconds`,
          message: "must be a non-negative number",
        });
    }
  });

  if (errors.length) return validationError(errors);

  // Reserve a contiguous block of seq numbers by bumping the counter once.
  const updated = await db.project.update({
    where: { id: project.id },
    data: { caseCounter: { increment: items.length } },
    select: { caseCounter: true, slug: true },
  });
  const baseSeq = updated.caseCounter - items.length;

  const created = await db.$transaction(
    items.map((c, i) =>
      db.testCase.create({
        data: {
          projectId: project.id,
          seq: baseSeq + i + 1,
          suiteId: c.suiteId ? String(c.suiteId) : null,
          title: String(c.title).trim(),
          description: (c.description as string) ?? null,
          preconditions: (c.preconditions as string) ?? null,
          stepsJson: JSON.stringify(c.steps ?? []),
          expectedResult: (c.expectedResult as string) ?? null,
          priority: c.priority ? String(c.priority).toUpperCase() : "MEDIUM",
          type: c.type ? String(c.type).toUpperCase() : "FUNCTIONAL",
          tags: (c.tags as string) ?? "",
          estimateSeconds: c.estimateSeconds != null ? Number(c.estimateSeconds) : null,
        },
        select: { id: true, seq: true },
      })
    )
  );

  await logAudit({
    userId: g.userId,
    action: "case.bulk_create",
    entityType: "project",
    entityId: project.id,
    detail: `${created.length} cases`,
  });

  return NextResponse.json(
    {
      created: created.length,
      data: created.map((c) => ({
        id: c.id,
        displayId: caseDisplayId(updated.slug, c.seq),
      })),
    },
    { status: 201 }
  );
}
