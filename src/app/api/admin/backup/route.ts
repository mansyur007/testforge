import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { buildBackup, backupFilename } from "@/lib/backup";

// L-05: download the whole instance as one portable `.tfbackup` file.
//
// Org ADMIN only, and session-only on purpose — no API-key path. This archive is
// the entire instance (every table, every upload), so it is a deliberate,
// human-initiated action, not something a CI token can pull.
export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function GET() {
  const session = await getSession();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const me = await db.user.findUnique({
    where: { id: session.userId },
    select: { role: true, organization: { select: { slug: true } } },
  });
  if (me?.role !== "ADMIN")
    return NextResponse.json(
      { error: "Only organization admins can download a backup." },
      { status: 403 }
    );

  const buffer = await buildBackup();
  const filename = backupFilename(me.organization?.slug ?? "instance");

  await logAudit({
    userId: session.userId,
    action: "org.backup",
    entityType: "ORG",
    entityId: me.organization?.slug,
    detail: `${filename} · ${buffer.length} bytes`,
  });

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/zip",
      "Content-Length": String(buffer.length),
      "Content-Disposition": `attachment; filename="${filename}"`,
      // A backup is a point-in-time snapshot — never let one be served twice.
      "Cache-Control": "no-store",
    },
  });
}
