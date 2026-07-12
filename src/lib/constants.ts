// Enum & warna sesuai PRD §4.2.1 dan §4.3.2

export const PRIORITIES = ["CRITICAL", "HIGH", "MEDIUM", "LOW"] as const;
export const CASE_TYPES = [
  "FUNCTIONAL",
  "REGRESSION",
  "SMOKE",
  "PERFORMANCE",
  "SECURITY",
  "E2E",
] as const;
// F-15: IN_REVIEW & APPROVED are driven by the review flow (a reviewer acts on
// them), never set directly from the case form or bulk edit — those use
// CASE_FORM_STATUSES. ACTIVE stays the "approved-legacy" runnable state.
export const CASE_STATUSES = [
  "DRAFT",
  "IN_REVIEW",
  "APPROVED",
  "ACTIVE",
  "DEPRECATED",
] as const;
export const CASE_FORM_STATUSES = ["DRAFT", "ACTIVE", "DEPRECATED"] as const;
// Cases in these statuses are considered ready to run; the rest trigger the
// F-15 "not approved" warning on run creation.
export const RUNNABLE_CASE_STATUSES = ["APPROVED", "ACTIVE"] as const;

export const STATUS_BADGES: Record<string, string> = {
  DRAFT: "bg-slate-100 text-slate-600",
  IN_REVIEW: "bg-amber-100 text-amber-800",
  APPROVED: "bg-green-100 text-green-800",
  ACTIVE: "bg-blue-100 text-blue-800",
  DEPRECATED: "bg-gray-100 text-gray-500 line-through",
};
export const AUTOMATION_STATUSES = [
  "NOT_AUTOMATED",
  "IN_PROGRESS",
  "AUTOMATED",
  "TO_BE_UPDATED",
] as const;

// Status eksekusi — warna mengikuti tabel PRD §4.3.2
export const RESULT_STATUSES = [
  "PASSED",
  "FAILED",
  "BLOCKED",
  "SKIPPED",
  "IN_PROGRESS",
  "UNTESTED",
  "RETEST",
] as const;

export const RESULT_COLORS: Record<string, string> = {
  PASSED: "bg-green-500",
  FAILED: "bg-red-500",
  BLOCKED: "bg-orange-500",
  SKIPPED: "bg-gray-400",
  IN_PROGRESS: "bg-blue-500",
  UNTESTED: "bg-gray-200",
  RETEST: "bg-purple-500",
  MUTED: "bg-slate-300", // F-21: bucket label, not a real TestRunResult.status value
};

export const RESULT_BADGES: Record<string, string> = {
  PASSED: "bg-green-100 text-green-800",
  FAILED: "bg-red-100 text-red-800",
  BLOCKED: "bg-orange-100 text-orange-800",
  SKIPPED: "bg-gray-100 text-gray-600",
  IN_PROGRESS: "bg-blue-100 text-blue-800",
  UNTESTED: "bg-gray-50 text-gray-500 border border-gray-200",
  RETEST: "bg-purple-100 text-purple-800",
  MUTED: "bg-slate-100 text-slate-500",
};

export const PRIORITY_BADGES: Record<string, string> = {
  CRITICAL: "bg-red-100 text-red-800",
  HIGH: "bg-orange-100 text-orange-800",
  MEDIUM: "bg-yellow-100 text-yellow-800",
  LOW: "bg-gray-100 text-gray-600",
};

// F-04: a case's stepsJson array mixes inline steps with references to a
// SharedStepGroup. Old data contains only inline items, so the union is
// backward-compatible. Expansion lives in src/lib/steps.ts.
export type InlineStep = { action: string; expected: string };
export type SharedStepRef = { shared: string }; // SharedStepGroup id
export type TestStep = InlineStep | SharedStepRef;

export function isSharedRef(s: TestStep): s is SharedStepRef {
  return typeof s === "object" && s !== null && "shared" in s;
}

/** Format ID display: TC-[SLUG]-[NUMBER], contoh TC-WEB-001 (PRD §4.2.1). */
export function caseDisplayId(projectSlug: string, seq: number) {
  return `TC-${projectSlug.toUpperCase()}-${String(seq).padStart(3, "0")}`;
}

export function parseTags(tags: string): string[] {
  return tags
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
}
