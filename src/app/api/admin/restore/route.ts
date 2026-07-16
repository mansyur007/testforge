import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import {
  restoreBackup,
  isFreshInstance,
  RestoreRefused,
  MAX_RESTORE_MB,
} from "@/lib/backup";

// L-05: restore a `.tfbackup` into THIS instance. The UI path only — it exists
// for the "I just stood up a new instance" case, so it refuses anywhere else and
// has no --force-wipe equivalent. Erasing a populated instance is deliberately
// CLI-only (`scripts/restore.mjs --force-wipe`), where consent is explicit and
// nobody can trigger it from a browser.
export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const me = await db.user.findUnique({
    where: { id: session.userId },
    select: { role: true, organization: { select: { slug: true } } },
  });
  if (me?.role !== "ADMIN")
    return NextResponse.json(
      { error: "Only organization admins can restore a backup." },
      { status: 403 }
    );

  // Re-checked inside restoreBackup; checked here too so an oversized upload on
  // a non-fresh instance is refused before it is read into memory.
  if (!(await isFreshInstance()))
    return NextResponse.json(
      {
        error:
          "This instance already has data. Restore only runs on a fresh instance (at most one user and no projects).",
      },
      { status: 409 }
    );

  const declared = Number(req.headers.get("content-length") ?? 0);
  if (declared > MAX_RESTORE_MB * 1024 * 1024)
    return NextResponse.json(
      { error: `Backup exceeds the ${MAX_RESTORE_MB} MB limit (TF_MAX_RESTORE_MB).` },
      { status: 413 }
    );

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File))
    return NextResponse.json({ error: "No backup file uploaded." }, { status: 400 });
  if (file.size > MAX_RESTORE_MB * 1024 * 1024)
    return NextResponse.json(
      { error: `Backup exceeds the ${MAX_RESTORE_MB} MB limit (TF_MAX_RESTORE_MB).` },
      { status: 413 }
    );

  const buffer = Buffer.from(await file.arrayBuffer());

  let summary;
  try {
    summary = await restoreBackup(buffer);
  } catch (e) {
    if (e instanceof RestoreRefused)
      return NextResponse.json({ error: e.message }, { status: 422 });
    console.error("[restore] failed", e);
    return NextResponse.json(
      { error: "Restore failed — the database was left unchanged." },
      { status: 500 }
    );
  }

  const totalRows = Object.values(summary.rowCounts).reduce((a, b) => a + b, 0);
  await logAudit({
    userId: session.userId,
    action: "org.restore",
    entityType: "ORG",
    entityId: me.organization?.slug,
    detail:
      `${totalRows} rows · ${summary.filesCopied} files` +
      (summary.integrationsDeactivated
        ? ` · ${summary.integrationsDeactivated} integrations deactivated`
        : ""),
  });

  return NextResponse.json({ ok: true, summary });
}
