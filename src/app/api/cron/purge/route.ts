import { NextResponse } from "next/server";
import { purgeExpiredCases, CASE_RETENTION_DAYS } from "@/lib/cases-purge";
import { sweepOrphanAttachments } from "@/lib/attachments";

export const dynamic = "force-dynamic";

// Scheduled cleanup endpoint (hit daily by .github/workflows/purge.yml).
// Guarded by a shared secret in the CRON_SECRET env var — returns 503 until it
// is configured so the job can't run unauthenticated.
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

  const purged = await purgeExpiredCases(CASE_RETENTION_DAYS);
  // F-01: also reap attachments whose owning entity was hard-deleted by other
  // paths (e.g. run deletion cascading results).
  const orphanedAttachments = await sweepOrphanAttachments();
  return NextResponse.json({
    purged,
    orphanedAttachments,
    retentionDays: CASE_RETENTION_DAYS,
  });
}
