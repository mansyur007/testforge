import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { guard, notFoundError } from "@/lib/api";
import { serializeRevision } from "@/lib/case-revisions";

// F-05: revision history of a case, newest first, cursor-paginated.
export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string; caseId: string } }
) {
  const g = await guard(req);
  if (g instanceof NextResponse) return g;

  const testCase = await db.testCase.findFirst({
    where: {
      id: params.caseId,
      project: { slug: params.slug, members: { some: { userId: g.userId } } },
    },
    select: { id: true },
  });
  if (!testCase) return notFoundError("Case not found");

  const sp = req.nextUrl.searchParams;
  const cursor = sp.get("cursor");
  const limit = Math.min(parseInt(sp.get("limit") ?? "50", 10) || 50, 200);

  const rows = await db.testCaseRevision.findMany({
    where: { caseId: testCase.id },
    include: { author: { select: { name: true } } },
    orderBy: { rev: "desc" },
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
  });

  const hasMore = rows.length > limit;
  const items = hasMore ? rows.slice(0, limit) : rows;

  return NextResponse.json({
    items: items.map(serializeRevision),
    nextCursor: hasMore ? items[items.length - 1].id : null,
  });
}
