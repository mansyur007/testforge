import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import { dispatchWebhook } from "@/lib/webhooks";
import { guard, notFoundError, forbidden, serializeSession } from "@/lib/api";

// F-25: end an active session.

export async function POST(
  req: NextRequest,
  { params }: { params: { slug: string; id: string } }
) {
  const g = await guard(req, { write: true });
  if (g instanceof NextResponse) return g;

  const session = await db.session.findFirst({
    where: {
      id: params.id,
      project: { slug: params.slug, members: { some: { userId: g.userId } } },
    },
  });
  if (!session) return notFoundError("Session not found");
  if (session.testerId !== g.userId)
    return forbidden("Only the tester who started this session may end it.");
  if (session.status !== "ACTIVE")
    return forbidden("This session has already ended.");

  const updated = await db.session.update({
    where: { id: session.id },
    data: { status: "ENDED", endedAt: new Date() },
  });
  await logAudit({
    userId: g.userId,
    action: "session.end",
    entityType: "session",
    entityId: session.id,
  });
  await dispatchWebhook(session.projectId, "session.completed", {
    id: session.id,
    charter: session.charter,
  });

  return NextResponse.json(serializeSession(updated));
}
