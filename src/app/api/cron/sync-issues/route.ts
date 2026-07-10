import { NextResponse } from "next/server";
import {
  syncIssueStatuses,
  ISSUE_STALE_MINUTES,
  ISSUE_SYNC_BATCH,
} from "@/lib/issue-sync";

export const dynamic = "force-dynamic";

// F-07: refresh issue statuses from the configured trackers. Same shared-secret
// guard as /api/cron/purge — returns 503 until CRON_SECRET is configured so the
// job can never run unauthenticated.
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "CRON_SECRET is not configured." },
      { status: 503 }
    );
  }
  if (req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const report = await syncIssueStatuses();
  return NextResponse.json({
    ...report,
    staleMinutes: ISSUE_STALE_MINUTES,
    batchSize: ISSUE_SYNC_BATCH,
  });
}
