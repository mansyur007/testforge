import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { isFreshInstance, MAX_RESTORE_MB } from "@/lib/backup";
import { RestoreBackupForm } from "@/components/RestoreBackupForm";
import { TFIcon } from "@/components/icons";

// L-05: Settings → Backup & restore. Org admins only — the archive is the whole
// instance, so this page never renders anything for a non-admin.
export const dynamic = "force-dynamic";

export default async function BackupPage() {
  const session = await requireSession();
  const me = await db.user.findUniqueOrThrow({
    where: { id: session.userId },
    select: { role: true },
  });

  if (me.role !== "ADMIN") {
    return (
      <div className="max-w-3xl space-y-2">
        <h1 className="text-2xl font-bold">Backup &amp; restore</h1>
        <p className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-500">
          Only organization admins can download or restore a backup.
        </p>
      </div>
    );
  }

  const fresh = await isFreshInstance();

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Backup &amp; restore</h1>
        <p className="text-sm text-slate-500">
          A backup is a single <code className="font-mono">.tfbackup</code> file
          holding every table and every attachment — enough to stand this
          instance up somewhere else.{" "}
          <a
            href="https://github.com/mansyur007/testforge/blob/main/docs/SELF-HOSTED-MIGRATION.md"
            target="_blank"
            rel="noreferrer"
            className="font-medium text-indigo-600 hover:underline"
          >
            Migration guide →
          </a>
        </p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="text-base font-semibold">Download backup</h2>
        <p className="mt-1 text-sm text-slate-500">
          Includes users, projects, cases, runs, results, comments and uploaded
          files. Stored secrets stay encrypted exactly as they are in the
          database — nothing is ever decrypted into the archive.
        </p>
        <a
          href="/api/admin/backup"
          data-testid="backup-download"
          className="mt-4 inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          <TFIcon name="nav-backup" className="tf-onaccent h-4 w-4" />
          Download backup
        </a>
      </div>

      {fresh ? (
        <RestoreBackupForm maxMb={MAX_RESTORE_MB} />
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="text-base font-semibold">Restore</h2>
          <p className="mt-1 text-sm text-slate-500">
            Restoring is only offered on a fresh instance — one with at most one
            user and no projects — so an import can never land on top of live
            data. This instance already has data.
          </p>
          <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
            To move this instance to a backup anyway, run{" "}
            <code className="font-mono">
              node scripts/restore.mjs &lt;file&gt; --force-wipe
            </code>{" "}
            on the server. It erases everything here first, and asks you to
            confirm before it does.
          </p>
        </div>
      )}
    </div>
  );
}
