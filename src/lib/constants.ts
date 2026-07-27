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
  DRAFT: "bg-surface-muted text-content-muted",
  IN_REVIEW: "bg-warning-soft text-warning-soft-fg",
  APPROVED: "bg-success-soft text-success-soft-fg",
  ACTIVE: "bg-info-soft text-info-soft-fg",
  DEPRECATED: "bg-surface-muted text-content-subtle line-through",
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
  PASSED: "bg-success-soft text-success-soft-fg",
  FAILED: "bg-danger-soft text-danger-soft-fg",
  BLOCKED: "bg-warning-soft text-warning-soft-fg",
  SKIPPED: "bg-surface-muted text-content-muted",
  IN_PROGRESS: "bg-info-soft text-info-soft-fg",
  UNTESTED: "bg-surface-muted text-content-muted border border-hairline",
  RETEST: "bg-accent-soft text-accent-soft-fg",
  MUTED: "bg-surface-muted text-content-muted",
};

export const PRIORITY_BADGES: Record<string, string> = {
  CRITICAL: "bg-danger-soft text-danger-soft-fg",
  HIGH: "bg-warning-soft text-warning-soft-fg",
  MEDIUM: "bg-warning-soft text-warning-soft-fg",
  LOW: "bg-surface-muted text-content-muted",
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

// F-25: exploratory session note kinds, with their quick-add hotkey letter.
export const SESSION_NOTE_KINDS = ["NOTE", "BUG", "QUESTION", "IDEA"] as const;
export type SessionNoteKind = (typeof SESSION_NOTE_KINDS)[number];
export const SESSION_NOTE_HOTKEYS: Record<string, SessionNoteKind> = {
  n: "NOTE",
  b: "BUG",
  q: "QUESTION",
  i: "IDEA",
};
export const SESSION_NOTE_BADGES: Record<SessionNoteKind, string> = {
  NOTE: "bg-surface-muted text-content-muted",
  BUG: "bg-danger-soft text-danger-soft-fg",
  QUESTION: "bg-warning-soft text-warning-soft-fg",
  IDEA: "bg-accent-soft text-accent-soft-fg",
};

export function parseTags(tags: string): string[] {
  return tags
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
}
