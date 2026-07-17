import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { guard, notFoundError } from "@/lib/api";
import { compareBaselineToCurrent } from "@/lib/baselines";

// F-28: compare a baseline's pinned case revisions to their current state.

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
  });
  if (!baseline) return notFoundError("Baseline not found");

  const rows = await compareBaselineToCurrent(baseline.id);
  return NextResponse.json({ items: rows });
}
