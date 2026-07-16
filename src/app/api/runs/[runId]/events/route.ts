import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { presenceSnapshot, subscribeRun } from "@/lib/run-events";

// L-04: SSE stream of run events (results + presence). Internal, not API-v1 —
// cookie session only, like /api/attachments. Non-members get 404 (F-01 rule)
// so run ids can't be probed for existence.

export const dynamic = "force-dynamic";

const encoder = new TextEncoder();

function sse(evt: unknown): Uint8Array {
  return encoder.encode(`data: ${JSON.stringify(evt)}\n\n`);
}

export async function GET(
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

  const stream = new ReadableStream({
    start(controller) {
      const send = (evt: unknown) => {
        try {
          controller.enqueue(sse(evt));
        } catch {
          // Controller already closed (client gone) — unsubscribe handles it.
        }
      };
      send(presenceSnapshot(run.id));
      const unsubscribe = subscribeRun(run.id, send);
      // Comment ping every 20 s keeps proxies from idling the connection out.
      const ping = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`: ping\n\n`));
        } catch {
          /* closed */
        }
      }, 20_000);
      req.signal.addEventListener("abort", () => {
        unsubscribe();
        clearInterval(ping);
        try {
          controller.close();
        } catch {
          /* already closed */
        }
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-store",
      "X-Accel-Buffering": "no",
      Connection: "keep-alive",
    },
  });
}
