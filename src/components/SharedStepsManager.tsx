"use client";

import { useEffect, useState } from "react";
import { useFormState } from "react-dom";
import {
  createSharedGroup,
  updateSharedGroup,
  deleteSharedGroup,
} from "@/app/actions/shared-steps";
import type { InlineStep } from "@/lib/constants";

export type SharedGroupItem = {
  id: string;
  title: string;
  steps: InlineStep[];
  usageCount: number;
  updatedAt: string;
};

const inputCls =
  "w-full rounded-lg border border-hairline-strong px-3 py-2 text-sm focus:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-ring";

// Compact inline step editor shared by the create & edit forms. Steps are
// serialized into a hidden stepsJson input, same convention as CaseForm.
function StepsEditor({
  steps,
  setSteps,
}: {
  steps: InlineStep[];
  setSteps: (s: InlineStep[]) => void;
}) {
  const set = (i: number, key: keyof InlineStep, value: string) =>
    setSteps(steps.map((s, idx) => (idx === i ? { ...s, [key]: value } : s)));
  return (
    <div className="space-y-2">
      {steps.map((step, i) => (
        <div key={i} className="flex items-start gap-2">
          <span className="mt-2 w-5 text-right text-sm text-content-subtle">{i + 1}.</span>
          <textarea
            rows={1}
            value={step.action}
            onChange={(e) => set(i, "action", e.target.value)}
            placeholder="Action"
            className={inputCls}
            data-testid="shared-step-action"
          />
          <textarea
            rows={1}
            value={step.expected}
            onChange={(e) => set(i, "expected", e.target.value)}
            placeholder="Expected (optional)"
            className={inputCls}
          />
          <button
            type="button"
            title="Delete step"
            onClick={() => setSteps(steps.filter((_, idx) => idx !== i))}
            className="mt-1.5 rounded border border-danger-border px-1.5 py-0.5 text-xs text-danger hover:bg-danger-soft"
          >
            ✕
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() => setSteps([...steps, { action: "", expected: "" }])}
        className="rounded-lg border border-dashed border-hairline-strong px-3 py-1.5 text-sm text-content-muted hover:border-accent hover:text-accent-text"
      >
        + Add Step
      </button>
    </div>
  );
}

function GroupForm({
  projectId,
  group,
  onDone,
}: {
  projectId: string;
  group?: SharedGroupItem;
  onDone: () => void;
}) {
  const [state, action] = useFormState(
    group ? updateSharedGroup : createSharedGroup,
    undefined
  );
  const [steps, setSteps] = useState<InlineStep[]>(
    group?.steps.length ? group.steps : [{ action: "", expected: "" }]
  );
  useEffect(() => {
    if (state && "ok" in state && state.ok) onDone();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <form action={action} className="space-y-3 rounded-lg bg-canvas p-4">
      <input type="hidden" name="projectId" value={projectId} />
      {group && <input type="hidden" name="groupId" value={group.id} />}
      <input
        type="hidden"
        name="stepsJson"
        value={JSON.stringify(steps.filter((s) => s.action.trim()))}
      />
      <input
        name="title"
        defaultValue={group?.title}
        placeholder='Title, e.g. "Log in as admin"'
        className={inputCls}
        data-testid="shared-group-title"
      />
      <StepsEditor steps={steps} setSteps={setSteps} />
      {state && "error" in state && state.error && (
        <p className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger-soft-fg">{state.error}</p>
      )}
      <div className="flex gap-2">
        <button
          data-testid="shared-group-save"
          className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover"
        >
          {group ? "Save changes" : "Create shared steps"}
        </button>
        <button type="button" onClick={onDone} className="px-3 py-2 text-sm text-content-muted">
          Cancel
        </button>
      </div>
    </form>
  );
}

function DeleteButton({ group }: { group: SharedGroupItem }) {
  const [state, action] = useFormState(deleteSharedGroup, undefined);
  return (
    <form action={action} className="inline">
      <input type="hidden" name="groupId" value={group.id} />
      <button
        data-testid={`shared-group-delete-${group.title.toLowerCase().replace(/\s+/g, "-")}`}
        onClick={(e) => {
          if (!window.confirm(`Delete shared steps "${group.title}"?`)) e.preventDefault();
        }}
        className="rounded border border-danger-border px-2 py-0.5 text-xs text-danger hover:bg-danger-soft"
      >
        Delete
      </button>
      {state && "error" in state && state.error && (
        <span className="ml-2 text-xs text-danger" data-testid="shared-delete-error">
          {state.error}
        </span>
      )}
    </form>
  );
}

export function SharedStepsManager({
  projectId,
  groups,
  canWrite,
}: {
  projectId: string;
  groups: SharedGroupItem[];
  canWrite: boolean;
}) {
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      {groups.length === 0 && (
        <p className="rounded-xl border border-dashed border-hairline-strong p-8 text-center text-sm text-content-subtle">
          No shared steps yet. Create a reusable block like “Log in as admin”
          and insert it into any test case.
        </p>
      )}

      {groups.map((g) => (
        <div key={g.id} className="rounded-xl border border-hairline bg-surface p-5">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-semibold">{g.title}</h3>
            <span className="rounded-full bg-surface-muted px-2 py-0.5 text-xs text-content">
              {g.steps.length} steps
            </span>
            <span
              className={`rounded-full px-2 py-0.5 text-xs ${
                g.usageCount > 0 ? "bg-accent-soft text-accent-soft-fg" : "bg-surface-muted text-content-muted"
              }`}
            >
              used by {g.usageCount} case{g.usageCount === 1 ? "" : "s"}
            </span>
            {canWrite && (
              <span className="ml-auto flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setEditingId(editingId === g.id ? null : g.id)}
                  className="rounded border border-hairline px-2 py-0.5 text-xs text-content-muted hover:bg-surface-muted"
                  data-testid={`shared-group-edit-${g.title.toLowerCase().replace(/\s+/g, "-")}`}
                >
                  Edit
                </button>
                <DeleteButton group={g} />
              </span>
            )}
          </div>
          {editingId === g.id ? (
            <div className="mt-3">
              <GroupForm projectId={projectId} group={g} onDone={() => setEditingId(null)} />
            </div>
          ) : (
            <ol className="mt-3 space-y-1.5">
              {g.steps.map((s, i) => (
                <li key={i} className="flex gap-2 text-sm">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-surface-muted text-xs font-bold text-content">
                    {i + 1}
                  </span>
                  <div className="min-w-0">
                    <p className="whitespace-pre-wrap">{s.action}</p>
                    {s.expected && (
                      <p className="whitespace-pre-wrap text-xs text-content-muted">↳ {s.expected}</p>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          )}
        </div>
      ))}

      {canWrite &&
        (creating ? (
          <GroupForm projectId={projectId} onDone={() => setCreating(false)} />
        ) : (
          <button
            type="button"
            data-testid="shared-group-new"
            onClick={() => setCreating(true)}
            className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover"
          >
            + New shared steps
          </button>
        ))}
    </div>
  );
}
