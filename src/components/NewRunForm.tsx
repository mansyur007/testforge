"use client";

import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { createRun } from "@/app/actions/runs";
import { CaseSelector, type SelectableCase } from "@/components/CaseSelector";
import { RUNNABLE_CASE_STATUSES } from "@/lib/constants";

function SubmitButton({ count }: { count: number }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending || count === 0}
      className="rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-50"
    >
      {pending ? "Creating..." : `Create Run (${count} test cases)`}
    </button>
  );
}

// Pembuatan run dengan seleksi case manual atau via filter (PRD §4.3.1).
// F-06: the picker itself lives in CaseSelector, shared with plan creation.
export function NewRunForm({
  projectId,
  milestones,
  environments = [],
  baselines = [],
  cases,
}: {
  projectId: string;
  milestones: { id: string; name: string }[];
  environments?: { id: string; name: string }[];
  baselines?: { id: string; name: string; caseIds: string[] }[];
  cases: SelectableCase[];
}) {
  const [state, formAction] = useFormState(createRun, undefined);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  // F-28: picking a baseline selects exactly its cases and pins caseRev to
  // what it captured (see createRun) instead of each case's current rev.
  const [baselineId, setBaselineId] = useState("");

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="projectId" value={projectId} />
      <input type="hidden" name="baselineId" value={baselineId} />
      {Array.from(selected).map((id) => (
        <input key={id} type="hidden" name="caseIds" value={id} />
      ))}

      {state?.error && (
        <p className="rounded-lg bg-danger-soft px-4 py-2.5 text-sm text-danger-soft-fg">
          {state.error}
        </p>
      )}

      <div className="rounded-xl border border-hairline bg-surface p-6">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-medium text-content">
              Run Name <span className="text-danger">*</span>
            </label>
            <input
              name="name"
              required
              placeholder="e.g. Regression Sprint 24"
              className="bg-surface text-content-strong w-full rounded-lg border border-hairline-strong px-3 py-2 text-sm focus:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-ring"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-content">
              Milestone
            </label>
            <select
              name="milestoneId"
              className="bg-surface text-content-strong w-full rounded-lg border border-hairline-strong px-3 py-2 text-sm"
            >
              <option value="">(no milestone)</option>
              {milestones.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>
          {environments.length > 0 && (
            <div>
              <label className="mb-1 block text-sm font-medium text-content">
                Environment
              </label>
              <select
                name="environmentId"
                data-testid="run-environment-select"
                className="bg-surface text-content-strong w-full rounded-lg border border-hairline-strong px-3 py-2 text-sm"
              >
                <option value="">(none)</option>
                {environments.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          {baselines.length > 0 && (
            <div>
              <label className="mb-1 block text-sm font-medium text-content">
                From baseline
              </label>
              <select
                value={baselineId}
                data-testid="run-baseline-select"
                onChange={(e) => {
                  const id = e.target.value;
                  setBaselineId(id);
                  const baseline = baselines.find((b) => b.id === id);
                  setSelected(baseline ? new Set(baseline.caseIds) : new Set());
                }}
                className="w-full rounded-lg border border-hairline-strong px-3 py-2 text-sm"
              >
                <option value="">(none — current content)</option>
                {baselines.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({b.caseIds.length})
                  </option>
                ))}
              </select>
            </div>
          )}
          <div className="md:col-span-3">
            <label className="mb-1 block text-sm font-medium text-content">
              Description
            </label>
            <input
              name="description"
              className="bg-surface text-content-strong w-full rounded-lg border border-hairline-strong px-3 py-2 text-sm focus:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-ring"
            />
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-hairline bg-surface p-6">
        <h3 className="mb-3 font-semibold">
          Select Test Cases{" "}
          <span className="font-normal text-content-subtle">
            ({selected.size} selected)
          </span>
        </h3>
        <CaseSelector cases={cases} selected={selected} onChange={setSelected} />
      </div>

      {(() => {
        // F-15: warn (don't block) when the run includes not-yet-approved cases.
        const notApproved = cases.filter(
          (c) =>
            selected.has(c.id) &&
            c.status != null &&
            !(RUNNABLE_CASE_STATUSES as readonly string[]).includes(c.status)
        ).length;
        return notApproved > 0 ? (
          <p
            data-testid="run-unapproved-warning"
            className="rounded-lg bg-warning-soft px-4 py-2.5 text-sm text-warning-soft-fg"
          >
            ⚠️ {notApproved} selected case{notApproved === 1 ? " is" : "s are"} not
            approved yet. You can still create the run.
          </p>
        ) : null;
      })()}

      <SubmitButton count={selected.size} />
    </form>
  );
}
