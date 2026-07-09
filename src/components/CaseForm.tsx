"use client";

import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { createCase, updateCase } from "@/app/actions/cases";
import { MarkdownEditor } from "@/components/MarkdownEditor";
import {
  PRIORITIES,
  CASE_TYPES,
  CASE_STATUSES,
  AUTOMATION_STATUSES,
  type TestStep,
} from "@/lib/constants";

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
}: {
  projectId: string;
  // Enables paste-a-screenshot in the Markdown editors (edit mode only — a
  // new case has no id to attach to yet).
  projectSlug?: string;
  suites: { id: string; name: string; parentId: string | null }[];
  defaultSuiteId?: string;
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
  };
}) {
  const isEdit = Boolean(initial);
  const [state, formAction] = useFormState(
    isEdit ? updateCase : createCase,
    undefined
  );
  const [steps, setSteps] = useState<TestStep[]>(
    initial?.steps?.length ? initial.steps : [{ action: "", expected: "" }]
  );

  const setStep = (i: number, key: keyof TestStep, value: string) => {
    setSteps((prev) =>
      prev.map((s, idx) => (idx === i ? { ...s, [key]: value } : s))
    );
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
        value={JSON.stringify(steps.filter((s) => s.action.trim()))}
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
            <select name="status" defaultValue={initial?.status ?? "ACTIVE"} className={inputCls}>
              {CASE_STATUSES.map((s) => (
                <option key={s}>{s}</option>
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
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <h3 className="mb-4 font-semibold">
          Steps to Reproduce <span className="text-red-500">*</span>
        </h3>
        <div className="space-y-3">
          {steps.map((step, i) => (
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
          ))}
        </div>
        <button
          type="button"
          onClick={() => setSteps((p) => [...p, { action: "", expected: "" }])}
          className="mt-3 rounded-lg border border-dashed border-slate-300 px-4 py-2 text-sm text-slate-500 hover:border-indigo-400 hover:text-indigo-600"
        >
          + Add Step
        </button>
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

      <SubmitButton isEdit={isEdit} />
    </form>
  );
}
