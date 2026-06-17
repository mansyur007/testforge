import { db } from "./db";

// Hard-delete test cases that have been soft-deleted (deletedAt set) for longer
// than the retention window. Cascades to their TestRunResults (schema onDelete:
// Cascade), so purged cases also leave run history. Note: a case's display id
// (TC-SLUG-NNN / seq) is drawn from an ever-incrementing project.caseCounter and
// is never reused, so purging does not free or recycle any id.
export const CASE_RETENTION_DAYS = 15;

export async function purgeExpiredCases(
  retentionDays: number = CASE_RETENTION_DAYS
): Promise<number> {
  const cutoff = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);
  const res = await db.testCase.deleteMany({
    where: { deletedAt: { not: null, lt: cutoff } },
  });
  return res.count;
}
