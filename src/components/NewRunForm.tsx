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
      className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
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
  cases,
}: {
  projectId: string;
  milestones: { id: string; name: string }[];
  environments?: { id: string; name: string }[];
  cases: SelectableCase[];
}) {
  const [state, formAction] = useFormState(createRun, undefined);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="projectId" value={projectId} />
      {Array.from(selected).map((id) => (
        <input key={id} type="hidden" name="caseIds" value={id} />
      ))}

      {state?.error && (
        <p className="rounded-lg bg-red-50 px-4 py-2.5 text-sm text-red-700">
          {state.error}
        </p>
      )}

      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Run Name <span className="text-red-500">*</span>
            </label>
            <input
              name="name"
              required
              placeholder="e.g. Regression Sprint 24"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Milestone
            </label>
            <select
              name="milestoneId"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
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
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Environment
              </label>
              <select
                name="environmentId"
                data-testid="run-environment-select"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
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
          <div className="md:col-span-3">
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Description
            </label>
            <input
              name="description"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
            />
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <h3 className="mb-3 font-semibold">
          Select Test Cases{" "}
          <span className="font-normal text-slate-400">
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
            className="rounded-lg bg-amber-50 px-4 py-2.5 text-sm text-amber-800"
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
