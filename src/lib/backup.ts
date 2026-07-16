// L-05: one-file portable backup & restore — the app-side entry point.
//
// The engine lives in backup-core.mjs (plain ESM) so `scripts/restore.mjs` can
// run it on a fresh instance without a TS loader. This file is the typed wrapper
// the routes and the settings UI use: it binds the Prisma singleton and the app
// version, and nothing else. Keep logic in the core so the CLI and the UI path
// cannot drift.
import { db } from "./db";
import {
  buildBackup as buildBackupCore,
  restoreBackup as restoreBackupCore,
  isFresh as isFreshCore,
  RestoreRefused,
  MODEL_ORDER,
  FORMAT_VERSION,
  schemaHash,
  checkModelOrder,
} from "./backup-core.mjs";
import pkg from "../../package.json";

export { RestoreRefused, MODEL_ORDER, FORMAT_VERSION, schemaHash, checkModelOrder };

export type RestoreSummary = {
  rowCounts: Record<string, number>;
  filesCopied: number;
  integrationsDeactivated: number;
  rowsWiped: number;
  elapsedMs: number;
  appVersion: string;
  createdAt: string;
};

/** Full-instance archive. Streams to an org ADMIN via GET /api/admin/backup. */
export function buildBackup(): Promise<Buffer> {
  return buildBackupCore({ db, appVersion: pkg.version });
}

/** Restore into this instance. Refuses unless the instance is fresh. */
export function restoreBackup(buffer: Buffer): Promise<RestoreSummary> {
  return restoreBackupCore(buffer, { db });
}

/** ≤1 user and 0 projects — the only state the UI offers a restore in. */
export function isFreshInstance(): Promise<boolean> {
  return isFreshCore(db);
}

/** `testforge-<org>-<YYYYMMDD-HHmm>.tfbackup` */
export function backupFilename(orgSlug: string, now = new Date()): string {
  const p = (n: number) => String(n).padStart(2, "0");
  const stamp =
    `${now.getFullYear()}${p(now.getMonth() + 1)}${p(now.getDate())}` +
    `-${p(now.getHours())}${p(now.getMinutes())}`;
  return `testforge-${orgSlug || "instance"}-${stamp}.tfbackup`;
}

export const MAX_RESTORE_MB = Number(process.env.TF_MAX_RESTORE_MB ?? 512);
