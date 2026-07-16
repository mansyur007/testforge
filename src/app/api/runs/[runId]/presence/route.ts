import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { heartbeat, leave } from "@/lib/run-events";

// L-04: presence heartbeat. The client posts every 20 s and on case
// navigation; `{ leave: true }` arrives via navigator.sendBeacon on pagehide
// (hence the lenient body parse — beacons can't always set a JSON
// content-type). Same auth/404 rules as the events stream.

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: { runId: string } }
) {
  const session = await getSession();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const run = await db.testRun.findFirst({
    where: {
      id: params.runId,
      project: { members: { some: { userId: session.userId } } },
    },
    select: { id: true },
  });
  if (!run)
    return NextResponse.json({ error: "Run not found" }, { status: 404 });

  let body: { caseId?: unknown; leave?: unknown } = {};
  try {
    body = JSON.parse(await req.text());
  } catch {
    /* empty/opaque beacon body → treated as a plain heartbeat */
  }

  if (body.leave === true) {
    leave(run.id, session.userId);
  } else {
    heartbeat(
      run.id,
      { id: session.userId, name: session.name },
      typeof body.caseId === "string" ? body.caseId : null
    );
  }
  return new NextResponse(null, { status: 204 });
}
