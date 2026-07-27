"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { TFIcon } from "@/components/icons";

// L-05: the fresh-instance restore path. Rendered only while the instance is
// fresh (≤1 user, 0 projects) — the server re-checks that on every request, so
// this form is a convenience, never the guard.

type Summary = {
  rowCounts: Record<string, number>;
  filesCopied: number;
  integrationsDeactivated: number;
  elapsedMs: number;
  appVersion: string;
  createdAt: string;
};

export function RestoreBackupForm({ maxMb }: { maxMb: number }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<Summary | null>(null);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const file = inputRef.current?.files?.[0];
    if (!file) return;
    setBusy(true);
    setError(null);
    const body = new FormData();
    body.append("file", file);
    try {
      const res = await fetch("/api/admin/restore", { method: "POST", body });
      const json = await res.json();
      if (!res.ok) setError(json.error ?? "Restore failed.");
      else {
        setSummary(json.summary);
        router.refresh();
      }
    } catch {
      setError("Restore failed — the upload did not complete.");
    } finally {
      setBusy(false);
    }
  }

  if (summary) {
    const totalRows = Object.values(summary.rowCounts).reduce((a, b) => a + b, 0);
    return (
      <div
        data-testid="restore-summary"
        className="rounded-xl border border-hairline bg-surface p-6"
      >
        <h2 className="text-base font-semibold">Restore complete</h2>
        <p className="mt-1 text-sm text-content-muted">
          Imported {totalRows.toLocaleString("en-US")} rows and{" "}
          {summary.filesCopied.toLocaleString("en-US")} attachment
          {summary.filesCopied === 1 ? "" : "s"} in{" "}
          {(summary.elapsedMs / 1000).toFixed(1)}s, from a backup taken{" "}
          {new Date(summary.createdAt).toLocaleString("en-US")}.
        </p>
        {summary.integrationsDeactivated > 0 && (
          <p className="mt-3 rounded-lg bg-warning-soft px-3 py-2 text-sm text-warning-soft-fg">
            {summary.integrationsDeactivated} integration
            {summary.integrationsDeactivated === 1 ? " was" : "s were"} imported
            as inactive: this instance&apos;s <code className="font-mono">TF_SECRET</code>{" "}
            does not match the one that wrote the backup, so their stored
            credentials cannot be read. Re-enter the credentials to re-enable
            them.
          </p>
        )}
        <p className="mt-3 text-sm text-content-muted">
          Log in with any account from the restored instance — passwords carry
          over unchanged.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={submit}
      className="rounded-xl border border-hairline bg-surface p-6"
    >
      <h2 className="text-base font-semibold">Restore</h2>
      <p className="mt-1 text-sm text-content-muted">
        This instance is empty, so it can accept a backup from another instance.
        Upload a <code className="font-mono">.tfbackup</code> file (max {maxMb} MB).
      </p>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <input
          ref={inputRef}
          type="file"
          name="file"
          accept=".tfbackup,application/zip"
          required
          data-testid="restore-file"
          className="text-sm text-content file:mr-3 file:rounded-lg file:border file:border-hairline file:bg-canvas file:px-3 file:py-2 file:text-sm file:font-medium file:text-content hover:file:bg-surface-muted"
        />
        <button
          type="submit"
          disabled={busy}
          data-testid="restore-submit"
          className="inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-50"
        >
          <TFIcon name="nav-backup" className="tf-onaccent h-4 w-4" />
          {busy ? "Restoring…" : "Restore this instance"}
        </button>
      </div>
      {error && (
        <p
          data-testid="restore-error"
          className="mt-3 rounded-lg bg-warning-soft px-3 py-2 text-sm text-warning-soft-fg"
        >
          {error}
        </p>
      )}
    </form>
  );
}
