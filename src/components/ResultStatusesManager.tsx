"use client";

import { useEffect, useRef } from "react";
import { useFormState, useFormStatus } from "react-dom";
import {
  createResultStatus,
  updateResultStatus,
  toggleResultStatus,
  moveResultStatus,
} from "@/app/actions/result-statuses";
import type { StatusDefLite } from "@/lib/result-statuses";

// F-14: per-project result statuses. System rows: label & color editable, key
// and kind fixed, always active. Custom rows: everything but the key.

const KINDS = ["PASS", "FAIL", "NEUTRAL", "BLOCKED"] as const;

function SubmitSmall({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-sidebar px-3 py-1.5 text-xs font-medium text-white hover:bg-sidebar-hover disabled:opacity-50"
    >
      {pending ? "…" : label}
    </button>
  );
}

function StatusRow({ projectId, def }: { projectId: string; def: StatusDefLite }) {
  const [state, formAction] = useFormState(updateResultStatus, undefined);
  return (
    <li
      data-testid={`status-row-${def.key}`}
      className={`py-2 ${def.active ? "" : "opacity-50"}`}
    >
      <form action={formAction} className="flex flex-wrap items-center gap-2 text-sm">
        <input type="hidden" name="projectId" value={projectId} />
        <input type="hidden" name="key" value={def.key} />

        {/* order */}
        <span className="flex flex-col">
          {(["up", "down"] as const).map((dir) => (
            <button
              key={dir}
              type="submit"
              formAction={moveResultStatus}
              name="dir"
              value={dir}
              title={`Move ${dir}`}
              className="leading-none text-content-subtle hover:text-accent-text"
            >
              {dir === "up" ? "▴" : "▾"}
            </button>
          ))}
        </span>

        <input
          type="color"
          name="color"
          defaultValue={def.color}
          title="Status color"
          className="bg-surface text-content-strong h-7 w-9 cursor-pointer rounded border border-hairline"
        />
        <input
          name="label"
          defaultValue={def.label}
          className="bg-surface text-content-strong w-36 rounded-lg border border-hairline-strong px-2 py-1 text-sm focus:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-ring"
        />
        <code className="rounded bg-surface-muted px-1.5 py-0.5 text-xs text-content-muted">
          {def.key}
        </code>
        {def.system ? (
          <span
            className="rounded-full bg-surface-muted px-2 py-0.5 text-xs text-content-muted"
            title="Built-in status — kind is fixed"
          >
            {def.kind} · system
          </span>
        ) : (
          <select
            name="kind"
            defaultValue={def.kind}
            className="bg-surface text-content-strong rounded-lg border border-hairline-strong px-2 py-1 text-xs"
            title="Drives aggregation: PASS counts toward the pass rate, FAIL/BLOCKED toward failures, NEUTRAL toward neither"
          >
            {KINDS.map((k) => (
              <option key={k}>{k}</option>
            ))}
          </select>
        )}

        <SubmitSmall label="Save" />

        {!def.system && (
          <button
            type="submit"
            formAction={toggleResultStatus}
            className="text-xs text-content-muted hover:text-accent-text"
          >
            {def.active ? "Deactivate" : "Activate"}
          </button>
        )}
        {state?.error && <span className="text-xs text-danger">{state.error}</span>}
      </form>
    </li>
  );
}

export function ResultStatusesManager({
  projectId,
  defs,
  canManage,
}: {
  projectId: string;
  defs: StatusDefLite[];
  canManage: boolean;
}) {
  const [state, formAction] = useFormState(createResultStatus, undefined);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.ok) formRef.current?.reset();
  }, [state]);

  if (!canManage)
    return (
      <p className="rounded-xl border border-dashed border-hairline-strong p-6 text-center text-sm text-content-subtle">
        Only project owners and admins can manage result statuses.
      </p>
    );

  return (
    <div className="rounded-xl border border-hairline bg-surface p-5">
      <ul className="mb-4 divide-y divide-hairline-subtle">
        {defs.map((d) => (
          <StatusRow key={d.key} projectId={projectId} def={d} />
        ))}
      </ul>

      <form ref={formRef} action={formAction} className="space-y-1">
        <input type="hidden" name="projectId" value={projectId} />
        <div className="flex flex-wrap gap-2">
          <input
            type="color"
            name="color"
            defaultValue="#a855f7"
            title="Status color"
            className="bg-surface text-content-strong h-8 w-10 cursor-pointer rounded border border-hairline"
            data-testid="status-color-input"
          />
          <input
            name="label"
            required
            placeholder='e.g. "Known Issue"'
            data-testid="status-label-input"
            className="bg-surface text-content-strong w-44 rounded-lg border border-hairline-strong px-3 py-1.5 text-sm focus:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-ring"
          />
          <select
            name="kind"
            defaultValue="NEUTRAL"
            data-testid="status-kind-select"
            className="bg-surface text-content-strong rounded-lg border border-hairline-strong px-2 py-1.5 text-sm"
          >
            {KINDS.map((k) => (
              <option key={k}>{k}</option>
            ))}
          </select>
          <SubmitSmall label="+ Status" />
        </div>
        <p className="text-xs text-content-subtle">
          Kind drives the math: PASS counts toward the pass rate, FAIL/BLOCKED
          toward failures, NEUTRAL toward neither. Executor shortcut = first
          letter of the label (earlier statuses win conflicts).
        </p>
        {state?.error && (
          <p className="text-xs text-danger" data-testid="status-form-error">
            {state.error}
          </p>
        )}
      </form>
    </div>
  );
}
