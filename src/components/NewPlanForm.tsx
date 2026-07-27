"use client";

import { useMemo, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { createPlan } from "@/app/actions/plans";
import { CaseSelector, type SelectableCase } from "@/components/CaseSelector";

// F-06: plan creation — same case picker as runs, plus a configuration matrix
// whose cartesian product is previewed live so nobody is surprised by 48 runs.

export type ConfigGroupInput = {
  id: string;
  name: string;
  options: { id: string; name: string }[];
};

const MAX_COMBINATIONS = 50; // mirrors MAX_COMBINATIONS in lib/plans (server-only module)

function SubmitButton({ combos, cases }: { combos: number; cases: number }) {
  const { pending } = useFormStatus();
  const blocked = cases === 0 || combos > MAX_COMBINATIONS;
  return (
    <button
      type="submit"
      disabled={pending || blocked}
      data-testid="plan-form-submit"
      className="rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-50"
    >
      {pending
        ? "Creating..."
        : `Create Plan (${combos} run${combos === 1 ? "" : "s"} × ${cases} cases)`}
    </button>
  );
}

export function NewPlanForm({
  projectId,
  milestones,
  cases,
  configGroups,
}: {
  projectId: string;
  milestones: { id: string; name: string }[];
  cases: SelectableCase[];
  configGroups: ConfigGroupInput[];
}) {
  const [state, formAction] = useFormState(createPlan, undefined);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [picked, setPicked] = useState<Set<string>>(new Set()); // option ids

  const toggleOption = (id: string) =>
    setPicked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  // Live cartesian preview — must agree with buildCombinations() on the server.
  const combos = useMemo(() => {
    const axes = configGroups
      .map((g) => g.options.filter((o) => picked.has(o.id)).map((o) => o.name))
      .filter((names) => names.length > 0);
    if (axes.length === 0) return [[]] as string[][];
    let acc: string[][] = [[]];
    for (const axis of axes) {
      const next: string[][] = [];
      for (const combo of acc) for (const name of axis) next.push([...combo, name]);
      acc = next;
    }
    return acc;
  }, [configGroups, picked]);

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="projectId" value={projectId} />
      {Array.from(selected).map((id) => (
        <input key={id} type="hidden" name="caseIds" value={id} />
      ))}
      {Array.from(picked).map((id) => (
        <input key={id} type="hidden" name="options" value={id} />
      ))}

      {state?.error && (
        <p
          data-testid="plan-form-error"
          className="rounded-lg bg-danger-soft px-4 py-2.5 text-sm text-danger-soft-fg"
        >
          {state.error}
        </p>
      )}

      <div className="rounded-xl border border-hairline bg-surface p-6">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-medium text-content">
              Plan Name <span className="text-danger">*</span>
            </label>
            <input
              name="name"
              required
              placeholder="e.g. Release 2.0 cross-browser"
              data-testid="plan-name-input"
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
        <h3 className="mb-1 font-semibold">Configurations</h3>
        {configGroups.length === 0 ? (
          <p className="text-sm text-content-subtle">
            No configuration groups defined — the plan will create a single
            run. Define groups (e.g. Browser, OS) under Fields →
            Configurations.
          </p>
        ) : (
          <>
            <p className="mb-3 text-sm text-content-subtle">
              Pick options per axis; one run is created per combination.
              Leaving a group empty removes it as an axis.
            </p>
            <div className="grid gap-4 md:grid-cols-2">
              {configGroups.map((g) => (
                <div key={g.id}>
                  <p className="mb-1.5 text-xs font-semibold uppercase text-content-subtle">
                    {g.name}
                  </p>
                  <div className="flex flex-wrap gap-3">
                    {g.options.map((o) => (
                      <label key={o.id} className="flex items-center gap-1.5 text-sm">
                        <input
                          type="checkbox"
                          checked={picked.has(o.id)}
                          onChange={() => toggleOption(o.id)}
                          data-testid={`plan-option-${g.name}-${o.name}`}
                        />
                        {o.name}
                      </label>
                    ))}
                    {g.options.length === 0 && (
                      <span className="text-xs text-content-subtle">no options</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        <p
          className={`mt-4 rounded-lg px-3 py-2 text-sm ${
            combos.length > MAX_COMBINATIONS
              ? "bg-danger-soft text-danger-soft-fg"
              : "bg-accent-soft text-accent-soft-fg"
          }`}
          data-testid="plan-combo-preview"
        >
          {combos.length > MAX_COMBINATIONS ? (
            <>
              {combos.length} combinations exceed the limit of {MAX_COMBINATIONS} —
              deselect some options.
            </>
          ) : combos.length === 1 && combos[0].length === 0 ? (
            <>Will create 1 run (no configuration).</>
          ) : (
            <>
              Will create {combos.length} runs:{" "}
              {combos
                .slice(0, 6)
                .map((c) => c.join("/"))
                .join(", ")}
              {combos.length > 6 ? ", …" : ""}
            </>
          )}
        </p>
      </div>

      <div className="rounded-xl border border-hairline bg-surface p-6">
        <h3 className="mb-3 font-semibold">
          Select Test Cases{" "}
          <span className="font-normal text-content-subtle">
            ({selected.size} selected — seeded into every run)
          </span>
        </h3>
        <CaseSelector cases={cases} selected={selected} onChange={setSelected} />
      </div>

      <SubmitButton combos={combos.length} cases={selected.size} />
    </form>
  );
}
