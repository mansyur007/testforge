// F-21: mute/quarantine — a muted case's results are still recorded with
// their real status, but every aggregate/pass-rate calculation buckets them
// as "MUTED" instead, so a flaky/known-broken case can't tank a run's color.

export function isMuted(mutedAt: Date | null | undefined): boolean {
  return mutedAt != null;
}

/** The status to use for aggregate tallies (bars, pass-rate, trend). */
export function bucketStatus(status: string, muted: boolean): string {
  return muted ? "MUTED" : status;
}

/** Statuses that never count toward "executed" (denominator for pass rate). */
export const NON_EXECUTED_BUCKETS = ["UNTESTED", "IN_PROGRESS", "MUTED"];
