"use client";

import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { restoreRevision } from "@/app/actions/cases";

// F-05: revision list + field-by-field diff vs the previous revision.
// Snapshots arrive fully expanded (shared steps resolved at write time), so
// the diff is plain data comparison — no live lookups needed.

type SnapshotStep = { action: string; expected: string };
type Snapshot = {
  title: string;
  description: string | null;
  preconditions: string | null;
  steps: SnapshotStep[];
  expectedResult: string | null;
  priority: string;
  type: string;
  status: string;
  automationStatus: string;
  tags: string;
  suiteId: string | null;
  assigneeId: string | null;
  linkedIssues: string | null;
  custom: Record<string, unknown>;
};

export type RevisionView = {
  id: string;
  rev: number;
  authorName: string | null;
  changeSummary: string;
  createdAt: string; // ISO
  snapshot: Snapshot;
};

// Mirrors SNAPSHOT_FIELDS in src/lib/case-revisions.ts (that module is
// server-only — it imports the db client — so the list is duplicated here).
const FIELDS: { key: keyof Snapshot; label: string }[] = [
  { key: "title", label: "Title" },
  { key: "description", label: "Description" },
  { key: "preconditions", label: "Preconditions" },
  { key: "steps", label: "Steps" },
  { key: "expectedResult", label: "Expected Result" },
  { key: "priority", label: "Priority" },
  { key: "type", label: "Type" },
  { key: "status", label: "Status" },
  { key: "automationStatus", label: "Automation Status" },
  { key: "tags", label: "Tags" },
  { key: "suiteId", label: "Suite" },
  { key: "assigneeId", label: "Assignee" },
  { key: "linkedIssues", label: "Linked Issues" },
  { key: "custom", label: "Custom Fields" },
];

function scalarText(
  key: keyof Snapshot,
  value: unknown,
  lookups: { suites: Record<string, string>; members: Record<string, string> }
): string {
  if (value == null || value === "") return "—";
  if (key === "suiteId") return lookups.suites[String(value)] ?? String(value);
  if (key === "assigneeId")
    return lookups.members[String(value)] ?? String(value);
  if (key === "custom") {
    const entries = Object.entries(value as Record<string, unknown>);
    if (!entries.length) return "—";
    return entries
      .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join("; ") : String(v)}`)
      .join(" · ");
  }
  return String(value);
}

/** Index-wise steps diff: same / changed / added / removed rows. */
function StepsDiff({ prev, next }: { prev: SnapshotStep[]; next: SnapshotStep[] }) {
  const len = Math.max(prev.length, next.length);
  const rows = [];
  for (let i = 0; i < len; i++) {
    const a = prev[i];
    const b = next[i];
    const text = (s: SnapshotStep) =>
      s.expected ? `${s.action} ↳ ${s.expected}` : s.action;
    if (a && b && text(a) === text(b)) {
      rows.push(
        <li key={i} className="text-content-muted">
          {i + 1}. {text(b)}
        </li>
      );
    } else {
      rows.push(
        <li key={i} className="space-y-0.5">
          {a && (
            <span className="block rounded bg-danger-soft px-1.5 py-0.5 text-danger-soft-fg line-through">
              {i + 1}. {text(a)}
            </span>
          )}
          {b && (
            <span className="block rounded bg-success-soft px-1.5 py-0.5 text-success-soft-fg">
              {i + 1}. {text(b)}
            </span>
          )}
        </li>
      );
    }
  }
  return <ul className="space-y-1 text-sm">{rows}</ul>;
}

function RestoreButton() {
  const { pending } = useFormStatus();
  return (
    <button
      data-testid="revision-restore"
      disabled={pending}
      className="rounded-lg border border-accent-ring px-3 py-1.5 text-sm text-accent-soft-fg hover:bg-accent-soft disabled:opacity-50"
    >
      {pending ? "Restoring…" : "Restore this revision"}
    </button>
  );
}

export function CaseHistory({
  revisions,
  currentRev,
  canWrite,
  suiteNames,
  memberNames,
}: {
  revisions: RevisionView[]; // newest first
  currentRev: number;
  canWrite: boolean;
  suiteNames: Record<string, string>;
  memberNames: Record<string, string>;
}) {
  const [openRev, setOpenRev] = useState<number | null>(
    revisions[0]?.rev ?? null
  );
  const [state, formAction] = useFormState(restoreRevision, undefined);
  const lookups = { suites: suiteNames, members: memberNames };

  if (!revisions.length)
    return (
      <p className="rounded-xl border border-dashed border-hairline-strong p-10 text-center text-sm text-content-subtle">
        No history yet — revisions are recorded from the first edit onward.
      </p>
    );

  return (
    <div className="space-y-3">
      {state && "error" in state && state.error && (
        <p className="rounded-lg bg-danger-soft p-3 text-sm text-danger-soft-fg">
          {state.error}
        </p>
      )}
      {revisions.map((r) => {
        const prev = revisions.find((x) => x.rev < r.rev); // list is desc-sorted
        const isOpen = openRev === r.rev;
        const changed = new Set(
          prev
            ? FIELDS.filter(
                ({ key }) =>
                  JSON.stringify(r.snapshot[key] ?? null) !==
                  JSON.stringify(prev.snapshot[key] ?? null)
              ).map(({ key }) => key)
            : []
        );
        return (
          <div
            key={r.id}
            className="rounded-xl border border-hairline bg-surface"
            data-testid={`revision-${r.rev}`}
          >
            <button
              onClick={() => setOpenRev(isOpen ? null : r.rev)}
              className="flex w-full items-center gap-3 px-5 py-3 text-left text-sm hover:bg-canvas"
            >
              <span className="rounded-full bg-accent-soft px-2 py-0.5 font-mono text-xs font-bold text-accent-soft-fg">
                rev {r.rev}
              </span>
              <span
                className="flex-1 truncate font-medium"
                data-testid="revision-summary"
              >
                {r.changeSummary}
              </span>
              <span className="shrink-0 text-content-subtle">
                {r.authorName ?? "—"} ·{" "}
                {new Date(r.createdAt).toLocaleString()}
              </span>
              <span className="text-content-subtle">{isOpen ? "▾" : "▸"}</span>
            </button>

            {isOpen && (
              <div className="space-y-3 border-t border-hairline-subtle px-5 py-4">
                {!prev && (
                  <p className="text-sm text-content-subtle">
                    First recorded revision — no previous version to compare.
                  </p>
                )}
                {FIELDS.map(({ key, label }) => {
                  if (prev && !changed.has(key)) return null;
                  const nextVal = r.snapshot[key];
                  if (
                    !prev &&
                    (nextVal == null ||
                      nextVal === "" ||
                      (Array.isArray(nextVal) && nextVal.length === 0) ||
                      (key === "custom" &&
                        !Object.keys(nextVal as object).length))
                  )
                    return null;
                  return (
                    <div key={key} className="text-sm">
                      <p className="mb-1 text-xs font-semibold uppercase text-content-subtle">
                        {label}
                      </p>
                      {key === "steps" ? (
                        <StepsDiff
                          prev={prev ? prev.snapshot.steps : []}
                          next={r.snapshot.steps}
                        />
                      ) : prev ? (
                        <div className="space-y-0.5">
                          <span className="block rounded bg-danger-soft px-1.5 py-0.5 text-danger-soft-fg line-through">
                            {scalarText(key, prev.snapshot[key], lookups)}
                          </span>
                          <span className="block rounded bg-success-soft px-1.5 py-0.5 text-success-soft-fg">
                            {scalarText(key, nextVal, lookups)}
                          </span>
                        </div>
                      ) : (
                        <p className="text-content">
                          {scalarText(key, nextVal, lookups)}
                        </p>
                      )}
                    </div>
                  );
                })}
                {prev && changed.size === 0 && (
                  <p className="text-sm text-content-subtle">
                    Snapshot identical to rev {prev.rev} (restored copy).
                  </p>
                )}

                {canWrite && r.rev !== currentRev && (
                  <form
                    action={formAction}
                    onSubmit={(e) => {
                      if (
                        !confirm(
                          `Restore the case to rev ${r.rev}? Current content stays in history.`
                        )
                      )
                        e.preventDefault();
                    }}
                    className="pt-1"
                  >
                    <input type="hidden" name="revisionId" value={r.id} />
                    <RestoreButton />
                  </form>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
