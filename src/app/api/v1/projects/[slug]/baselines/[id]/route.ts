import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import { guard, notFoundError, requirePerm, serializeBaseline, serializeBaselineEntry } from "@/lib/api";

// F-28: a single baseline, with its pinned entries.

export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string; id: string } }
) {
  const g = await guard(req);
  if (g instanceof NextResponse) return g;

  const baseline = await db.suiteBaseline.findFirst({
    where: {
      id: params.id,
      project: { slug: params.slug, members: { some: { userId: g.userId } } },
    },
    include: { entries: { orderBy: { suitePath: "asc" } } },
  });
  if (!baseline) return notFoundError("Baseline not found");

  return NextResponse.json({
    ...serializeBaseline(baseline, baseline.entries.length),
    entries: baseline.entries.map(serializeBaselineEntry),
  });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { slug: string; id: string } }
) {
  const g = await guard(req, { write: true });
  if (g instanceof NextResponse) return g;

  const baseline = await db.suiteBaseline.findFirst({
    where: {
      id: params.id,
      project: { slug: params.slug, members: { some: { userId: g.userId } } },
    },
  });
  if (!baseline) return notFoundError("Baseline not found");
  const denied = await requirePerm(g.userId, baseline.projectId, "case.write");
  if (denied) return denied;

  await db.suiteBaseline.delete({ where: { id: baseline.id } });
  await logAudit({
    userId: g.userId,
    action: "baseline.delete",
    entityType: "baseline",
    entityId: baseline.id,
    detail: baseline.name,
  });

  return new NextResponse(null, { status: 204 });
}
