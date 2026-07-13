import { NextResponse } from "next/server";
import { sendDueReports } from "@/lib/report-schedules";

export const dynamic = "force-dynamic";

// F-17: send due scheduled report emails. Same shared-secret guard as
// /api/cron/purge and /api/cron/sync-issues — 503 until CRON_SECRET is set so
// the job can never run unauthenticated.
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

  const schedules = await sendDueReports();
  return NextResponse.json({ schedules });
}
