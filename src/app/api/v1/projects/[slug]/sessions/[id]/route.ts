import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { guard, notFoundError, serializeSession, serializeSessionNote } from "@/lib/api";

// F-25: a single session with its notes.

export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string; id: string } }
) {
  const g = await guard(req);
  if (g instanceof NextResponse) return g;

  const session = await db.session.findFirst({
    where: {
      id: params.id,
      project: { slug: params.slug, members: { some: { userId: g.userId } } },
    },
    include: { notes: { orderBy: { createdAt: "asc" } } },
  });
  if (!session) return notFoundError("Session not found");

  return NextResponse.json({
    ...serializeSession(session),
    notes: session.notes.map(serializeSessionNote),
  });
}
