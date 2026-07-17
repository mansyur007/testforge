"use client";

import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { createCase, updateCase } from "@/app/actions/cases";
import { MarkdownEditor } from "@/components/MarkdownEditor";
import {
  CustomFieldInputs,
  type CustomDefItem,
  type MemberOption,
} from "@/components/CustomFieldInputs";
import {
  PRIORITIES,
  CASE_TYPES,
  CASE_FORM_STATUSES,
  AUTOMATION_STATUSES,
  isSharedRef,
  type InlineStep,
  type TestStep,
} from "@/lib/constants";
import { isGherkinCaseSteps } from "@/lib/steps";
import { extractVars, type Dataset } from "@/lib/datasets";
import { formatDuration } from "@/lib/duration";
import { GherkinBlock } from "@/components/GherkinBlock";

// F-04: shared step groups offered by the "Insert shared steps" picker.
export type SharedGroupOption = {
  id: string;
  title: string;
  stepCount: number;
  steps: InlineStep[];
};

const inputCls =
  "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none";
const labelCls = "mb-1 block text-sm font-medium text-slate-700";

function SubmitButton({ isEdit }: { isEdit: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      data-testid="case-form-submit"
      className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
    >
      {pending ? "Saving..." : isEdit ? "Save Changes" : "Create Test Case"}
    </button>
  );
}

export function CaseForm({
  projectId,
  projectSlug,
  suites,
  initial,
  defaultSuiteId,
  customDefs = [],
  members = [],
  sharedGroups = [],
}: {
  projectId: string;
  // Enables paste-a-screenshot in the Markdown editors (edit mode only — a
  // new case has no id to attach to yet).
  projectSlug?: string;
  suites: { id: string; name: string; parentId: string | null }[];
  defaultSuiteId?: string;
  customDefs?: CustomDefItem[];
  members?: MemberOption[];
  sharedGroups?: SharedGroupOption[];
  initial?: {
    caseId: string;
    title: string;
    description: string;
    preconditions: string;
    expectedResult: string;
    priority: string;
    type: string;
    status: string;
    automationStatus: string;
    tags: string;
    linkedIssues: string;
    suiteId: string;
    steps: TestStep[];
    custom?: Record<string, unknown>;
    datasets?: Dataset[];
    estimateSeconds?: number | null;
  };
}) {
  const isEdit = Boolean(initial);
  const [state, formAction] = useFormState(
    isEdit ? updateCase : createCase,
    undefined
  );
  const [steps, setSteps] = useState<TestStep[]>(
    initial?.steps?.length && !isGherkinCaseSteps(initial.steps)
      ? initial.steps
      : [{ action: "", expected: "" }]
  );
  // F-27: a Gherkin case's whole scenario is one textarea, not the dynamic
  // step-row editor — format is derived from the case's stored steps once.
  const [format, setFormat] = useState<"STEPS" | "GHERKIN">(
    isGherkinCaseSteps(initial?.steps) ? "GHERKIN" : "STEPS"
  );
  const [gherkinText, setGherkinText] = useState(
    isGherkinCaseSteps(initial?.steps) ? initial.steps[0].gherkin : ""
  );
  // F-13: parameters/datasets — {{var}} tokens in step text become columns;
  // "extraVars" lets a user add a column for a var used elsewhere (e.g. title).
  const [datasets, setDatasets] = useState<Dataset[]>(initial?.datasets ?? []);
  const [extraVars, setExtraVars] = useState<string[]>([]);
  const discoveredVars =
    format === "GHERKIN"
      ? extractVars(gherkinText, "")
      : steps
          .filter((s): s is InlineStep => !isSharedRef(s))
          .flatMap((s) => extractVars(s.action, s.expected));
  const vars = Array.from(new Set([...discoveredVars, ...extraVars]));

  const setStep = (i: number, key: keyof InlineStep, value: string) => {
    setSteps((prev) =>
      prev.map((s, idx) => (idx === i ? { ...s, [key]: value } : s))
    );
  };

  // F-04: replace a shared reference with an editable copy of its steps.
  const unlinkShared = (i: number) => {
    setSteps((prev) => {
      const ref = prev[i];
      if (!isSharedRef(ref)) return prev;
      const group = sharedGroups.find((g) => g.id === ref.shared);
      const copy = group?.steps.length ? group.steps.map((s) => ({ ...s })) : [];
      return [...prev.slice(0, i), ...copy, ...prev.slice(i + 1)];
    });
  };

  const moveStep = (i: number, dir: -1 | 1) => {
    setSteps((prev) => {
      const next = [...prev];
      const j = i + dir;
      if (j < 0 || j >= next.length) return prev;
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  };

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="projectId" value={projectId} />
      {initial && <input type="hidden" name="caseId" value={initial.caseId} />}
      <input
        type="hidden"
        name="stepsJson"
        value={
          format === "GHERKIN"
            ? JSON.stringify([{ gherkin: gherkinText }])
            : JSON.stringify(steps.filter((s) => isSharedRef(s) || s.action.trim()))
        }
      />
      <input
        type="hidden"
        name="datasetJson"
        value={JSON.stringify(datasets.filter((d) => d.name.trim()))}
      />

      {state?.error && (
        <p className="rounded-lg bg-red-50 px-4 py-2.5 text-sm text-red-700">
          {state.error}
        </p>
      )}

      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <label className={labelCls}>
              Title <span className="text-red-500">*</span>
            </label>
            <input
              name="title"
              required
              defaultValue={initial?.title}
              data-testid="case-title-input"
              placeholder="e.g. Valid login with a registered email"
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Test Suite</label>
            <select name="suiteId" defaultValue={initial?.suiteId ?? defaultSuiteId ?? ""} className={inputCls}>
              <option value="">(no suite)</option>
              {suites
                .filter((s) => !s.parentId)
                .map((s) => (
                  <optgroup key={s.id} label={s.name}>
                    <option value={s.id}>{s.name}</option>
                    {suites
                      .filter((c) => c.parentId === s.id)
                      .map((c) => (
                        <option key={c.id} value={c.id}>
                          — {c.name}
                        </option>
                      ))}
                  </optgroup>
                ))}
            </select>
          </div>
          <div>
            <label className={labelCls}>Priority</label>
            <select name="priority" defaultValue={initial?.priority ?? "MEDIUM"} className={inputCls}>
              {PRIORITIES.map((p) => (
                <option key={p}>{p}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls}>Type</label>
            <select name="type" defaultValue={initial?.type ?? "FUNCTIONAL"} className={inputCls}>
              {CASE_TYPES.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls}>Status</label>
            {/* F-15: IN_REVIEW/APPROVED are driven by the review panel, not this
                form. Keep the current value selectable so editing a case that is
                under review round-trips its real status. */}
            <select name="status" defaultValue={initial?.status ?? "ACTIVE"} className={inputCls}>
              {(initial?.status &&
              !CASE_FORM_STATUSES.includes(
                initial.status as (typeof CASE_FORM_STATUSES)[number]
              )
                ? [initial.status, ...CASE_FORM_STATUSES]
                : CASE_FORM_STATUSES
              ).map((s) => (
                <option key={s} value={s}>
                  {s.replace(/_/g, " ")}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls}>Automation Status</label>
            <select
              name="automationStatus"
              defaultValue={initial?.automationStatus ?? "NOT_AUTOMATED"}
              className={inputCls}
            >
              {AUTOMATION_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s.replace(/_/g, " ")}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls}>Tags (comma-separated)</label>
            <input
              name="tags"
              defaultValue={initial?.tags}
              placeholder="smoke, login, regression"
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Estimate</label>
            <input
              name="estimate"
              defaultValue={formatDuration(initial?.estimateSeconds)}
              placeholder={`e.g. "90", "1m 30s", "1:30"`}
              data-testid="case-estimate-input"
              className={inputCls}
            />
          </div>
          <div className="md:col-span-2">
            <label className={labelCls}>Description (Markdown supported)</label>
            <MarkdownEditor
              name="description"
              rows={3}
              defaultValue={initial?.description}
              placeholder="Context and purpose of the test..."
              testId="case-description-editor"
              projectSlug={projectSlug}
              entityType="CASE"
              entityId={initial?.caseId}
            />
          </div>
          <div className="md:col-span-2">
            <label className={labelCls}>Preconditions (Markdown supported)</label>
            <MarkdownEditor
              name="preconditions"
              rows={2}
              defaultValue={initial?.preconditions}
              placeholder="Conditions that must be met before the test..."
              projectSlug={projectSlug}
              entityType="CASE"
              entityId={initial?.caseId}
            />
          </div>
          <div className="md:col-span-2">
            <label className={labelCls}>Linked Issues (URLs, comma-separated)</label>
            <input
              name="linkedIssues"
              defaultValue={initial?.linkedIssues}
              placeholder="https://jira.../PROJ-123"
              className={inputCls}
            />
          </div>
          <CustomFieldInputs
            defs={customDefs}
            values={initial?.custom}
            members={members}
          />
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-semibold">
            Steps to Reproduce <span className="text-red-500">*</span>
          </h3>
          {/* F-27: Gherkin cases store one raw scenario body instead of rows. */}
          <div className="flex rounded-lg border border-slate-300 p-0.5 text-xs">
            <button
              type="button"
              data-testid="case-format-steps"
              onClick={() => setFormat("STEPS")}
              className={`rounded px-2.5 py-1 font-medium ${format === "STEPS" ? "bg-indigo-600 text-white" : "text-slate-500 hover:bg-slate-100"}`}
            >
              Steps
            </button>
            <button
              type="button"
              data-testid="case-format-gherkin"
              onClick={() => setFormat("GHERKIN")}
              className={`rounded px-2.5 py-1 font-medium ${format === "GHERKIN" ? "bg-indigo-600 text-white" : "text-slate-500 hover:bg-slate-100"}`}
            >
              Gherkin (BDD)
            </button>
          </div>
        </div>
        {format === "GHERKIN" ? (
          <div className="grid gap-3 md:grid-cols-2">
            <textarea
              rows={12}
              value={gherkinText}
              onChange={(e) => setGherkinText(e.target.value)}
              placeholder={"Feature: ...\n\n  Scenario: ...\n    Given ...\n    When ...\n    Then ..."}
              data-testid="case-gherkin-input"
              className={`${inputCls} font-mono text-xs`}
            />
            <div>
              <p className="mb-1 text-xs font-medium text-slate-500">Preview</p>
              {gherkinText.trim() ? (
                <GherkinBlock text={gherkinText} />
              ) : (
                <p className="text-xs text-slate-400">Nothing to preview yet.</p>
              )}
            </div>
          </div>
        ) : (
        <>
        <div className="space-y-3">
          {steps.map((step, i) =>
            isSharedRef(step) ? (
              // F-04: a shared-steps reference — read-only block; edit the
              // group in the library, or unlink to copy the steps inline.
              (() => {
                const group = sharedGroups.find((g) => g.id === step.shared);
                return (
                  <div key={i} className="flex items-start gap-2" data-testid="shared-ref-row">
                    <span className="mt-2 w-6 text-right text-sm font-medium text-slate-400">
                      {i + 1}.
                    </span>
                    <div className="flex-1 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2">
                      <p className="text-sm font-medium text-indigo-800">
                        ⛓ {group?.title ?? "Missing shared steps"}
                        <span className="ml-2 font-normal text-indigo-500">
                          {group ? `${group.stepCount} shared steps` : "group was deleted"}
                        </span>
                      </p>
                      {group && (
                        <p className="mt-0.5 truncate text-xs text-indigo-500/80">
                          {group.steps.map((s) => s.action).join(" → ")}
                        </p>
                      )}
                    </div>
                    <div className="flex shrink-0 gap-1 pt-1.5">
                      <button type="button" onClick={() => moveStep(i, -1)} title="Move up"
                        className="rounded border border-slate-200 px-1.5 py-0.5 text-xs text-slate-500 hover:bg-slate-100">↑</button>
                      <button type="button" onClick={() => moveStep(i, 1)} title="Move down"
                        className="rounded border border-slate-200 px-1.5 py-0.5 text-xs text-slate-500 hover:bg-slate-100">↓</button>
                      <button type="button" title="Unlink — copy the steps inline"
                        onClick={() => unlinkShared(i)}
                        className="rounded border border-indigo-200 px-1.5 py-0.5 text-xs text-indigo-600 hover:bg-indigo-100">⛓✕</button>
                      <button type="button" title="Remove"
                        onClick={() => setSteps((p) => p.filter((_, idx) => idx !== i))}
                        className="rounded border border-red-200 px-1.5 py-0.5 text-xs text-red-500 hover:bg-red-50">✕</button>
                    </div>
                  </div>
                );
              })()
            ) : (
              <div key={i} className="flex items-start gap-2">
                <span className="mt-2 w-6 text-right text-sm font-medium text-slate-400">
                  {i + 1}.
                </span>
                <textarea
                  rows={1}
                  value={step.action}
                  onChange={(e) => setStep(i, "action", e.target.value)}
                  placeholder="Action step, e.g. Open the /login page"
                  className={inputCls}
                />
                <textarea
                  rows={1}
                  value={step.expected}
                  onChange={(e) => setStep(i, "expected", e.target.value)}
                  placeholder="Expected result for this step"
                  className={inputCls}
                />
                <div className="flex shrink-0 gap-1 pt-1.5">
                  <button type="button" onClick={() => moveStep(i, -1)} title="Move up"
                    className="rounded border border-slate-200 px-1.5 py-0.5 text-xs text-slate-500 hover:bg-slate-100">↑</button>
                  <button type="button" onClick={() => moveStep(i, 1)} title="Move down"
                    className="rounded border border-slate-200 px-1.5 py-0.5 text-xs text-slate-500 hover:bg-slate-100">↓</button>
                  <button type="button" title="Delete"
                    onClick={() => setSteps((p) => p.filter((_, idx) => idx !== i))}
                    className="rounded border border-red-200 px-1.5 py-0.5 text-xs text-red-500 hover:bg-red-50">✕</button>
                </div>
              </div>
            )
          )}
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setSteps((p) => [...p, { action: "", expected: "" }])}
            className="rounded-lg border border-dashed border-slate-300 px-4 py-2 text-sm text-slate-500 hover:border-indigo-400 hover:text-indigo-600"
          >
            + Add Step
          </button>
          {sharedGroups.length > 0 && (
            <select
              value=""
              data-testid="insert-shared-steps"
              onChange={(e) => {
                if (e.target.value)
                  setSteps((p) => [...p, { shared: e.target.value }]);
              }}
              className="rounded-lg border border-dashed border-indigo-300 px-3 py-2 text-sm text-indigo-600 hover:border-indigo-400"
            >
              <option value="">⛓ Insert shared steps…</option>
              {sharedGroups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.title} ({g.stepCount})
                </option>
              ))}
            </select>
          )}
        </div>
        </>
        )}
        <div className="mt-4">
          <label className={labelCls}>Overall Expected Result (Markdown supported)</label>
          <MarkdownEditor
            name="expectedResult"
            rows={2}
            defaultValue={initial?.expectedResult}
            placeholder="The expected final result of this test case..."
            projectSlug={projectSlug}
            entityType="CASE"
            entityId={initial?.caseId}
          />
        </div>
      </div>

      {/* F-13: parameters/datasets — data-driven runs, one result per row. */}
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-semibold">Parameters</h3>
          <button
            type="button"
            onClick={() => setExtraVars((p) => [...p, `var${p.length + 1}`])}
            className="rounded-lg border border-dashed border-slate-300 px-3 py-1.5 text-xs text-slate-500 hover:border-indigo-400 hover:text-indigo-600"
          >
            + Add variable column
          </button>
        </div>
        <p className="mb-3 text-xs text-slate-400">
          Use <code className="rounded bg-slate-100 px-1">{"{{var}}"}</code> in
          steps; each dataset row below runs the case once with those values
          substituted. Leave empty for a single, non-parameterized case.
        </p>
        {vars.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm" data-testid="dataset-table">
              <thead>
                <tr className="text-left text-xs font-medium uppercase text-slate-400">
                  <th className="pb-2 pr-2">Dataset name</th>
                  {vars.map((v) => (
                    <th key={v} className="pb-2 pr-2">
                      {"{{" + v + "}}"}
                    </th>
                  ))}
                  <th />
                </tr>
              </thead>
              <tbody>
                {datasets.map((d, i) => (
                  <tr key={i}>
                    <td className="pb-2 pr-2">
                      <input
                        value={d.name}
                        data-testid="dataset-name-input"
                        placeholder="e.g. Admin user"
                        onChange={(e) =>
                          setDatasets((prev) =>
                            prev.map((row, idx) =>
                              idx === i ? { ...row, name: e.target.value } : row
                            )
                          )
                        }
                        className={inputCls}
                      />
                    </td>
                    {vars.map((v) => (
                      <td key={v} className="pb-2 pr-2">
                        <input
                          value={d.values[v] ?? ""}
                          onChange={(e) =>
                            setDatasets((prev) =>
                              prev.map((row, idx) =>
                                idx === i
                                  ? {
                                      ...row,
                                      values: { ...row.values, [v]: e.target.value },
                                    }
                                  : row
                              )
                            )
                          }
                          className={inputCls}
                        />
                      </td>
                    ))}
                    <td className="pb-2">
                      <button
                        type="button"
                        onClick={() =>
                          setDatasets((prev) => prev.filter((_, idx) => idx !== i))
                        }
                        className="rounded border border-red-200 px-1.5 py-0.5 text-xs text-red-500 hover:bg-red-50"
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <button
          type="button"
          data-testid="add-dataset-row"
          onClick={() => setDatasets((p) => [...p, { name: "", values: {} }])}
          className="mt-2 rounded-lg border border-dashed border-slate-300 px-4 py-2 text-sm text-slate-500 hover:border-indigo-400 hover:text-indigo-600"
        >
          + Add Dataset Row
        </button>
      </div>

      <SubmitButton isEdit={isEdit} />
    </form>
  );
}
