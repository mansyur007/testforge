import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { guard, notFoundError } from "@/lib/api";
import { serializePlan } from "@/lib/plans";

// F-06: plan detail — child runs each carry their config and result stats.
export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string; planId: string } }
) {
  const g = await guard(req);
  if (g instanceof NextResponse) return g;

  const plan = await db.testPlan.findFirst({
    where: {
      id: params.planId,
      project: { slug: params.slug, members: { some: { userId: g.userId } } },
    },
    include: {
      runs: {
        include: { results: { select: { status: true } } },
        orderBy: { createdAt: "asc" },
      },
    },
  });
  if (!plan) return notFoundError("Plan not found");

  const { runs, ...planRow } = plan;
  return NextResponse.json(serializePlan(planRow, runs));
}
