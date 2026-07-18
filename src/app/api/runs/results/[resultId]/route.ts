import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { saveResult } from "@/lib/save-result";

// F-36 Part C: JSON transport for recording a result — the endpoint the
// offline queue (and the online mobile submit) POST to. Session-cookie auth
// (same-origin fetch sends it automatically), so no API key. All validation
// and side effects live in saveResult; this is just JSON in / JSON out.
//
// Not the versioned /api/v1 surface: that's API-key-scoped for external
// automation. This is the app's own client talking to itself with a cookie.
export async function POST(
  req: Request,
  { params }: { params: { resultId: string } }
) {
  const session = await getSession();
  if (!session)
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object" || typeof body.status !== "string")
    return NextResponse.json({ error: "invalid body" }, { status: 400 });

  const elapsed =
    typeof body.elapsedSeconds === "number" ? body.elapsedSeconds : null;

  const outcome = await saveResult(
    session.userId,
    session.name,
    params.resultId,
    {
      status: body.status,
      comment: typeof body.comment === "string" ? body.comment : null,
      defectUrl: typeof body.defectUrl === "string" ? body.defectUrl : null,
      elapsedSeconds: elapsed,
      // F-03 custom fields ride along on the online submit; the offline queued
      // body deliberately omits them (the mobile fast path is status-only).
      custom:
        body.custom && typeof body.custom === "object" ? body.custom : undefined,
      clientId: typeof body.clientId === "string" ? body.clientId : null,
      recordedAt: typeof body.recordedAt === "string" ? body.recordedAt : null,
    }
  );

  if (!outcome.ok) {
    const status =
      outcome.reason === "not-found"
        ? 404
        : outcome.reason === "forbidden"
          ? 403
          : 400; // invalid-status
    return NextResponse.json({ error: outcome.reason }, { status });
  }

  return NextResponse.json({ ok: true, conflict: outcome.conflict });
}
