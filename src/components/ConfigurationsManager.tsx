"use client";

import { useEffect, useRef } from "react";
import { useFormState, useFormStatus } from "react-dom";
import {
  createConfigGroup,
  deleteConfigGroup,
  addConfigOption,
  deleteConfigOption,
} from "@/app/actions/configs";
import { TFIcon } from "@/components/icons";

// F-06: configuration groups & options — the axes a test plan multiplies over.
// Deleting here never breaks existing runs: they carry copied names.

export type ConfigGroupView = {
  id: string;
  name: string;
  options: { id: string; name: string }[];
};

function SubmitSmall({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-700 disabled:opacity-50"
    >
      {pending ? "…" : label}
    </button>
  );
}

/** Form that clears its input after a successful action. */
function InlineForm({
  action,
  hidden,
  placeholder,
  label,
  testId,
}: {
  action: (
    prev: { error?: string; ok?: boolean } | undefined,
    fd: FormData
  ) => Promise<{ error?: string; ok?: boolean }>;
  hidden: Record<string, string>;
  placeholder: string;
  label: string;
  testId: string;
}) {
  const [state, formAction] = useFormState(action, undefined);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.ok) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="space-y-1">
      {Object.entries(hidden).map(([k, v]) => (
        <input key={k} type="hidden" name={k} value={v} />
      ))}
      <div className="flex gap-2">
        <input
          name="name"
          required
          placeholder={placeholder}
          data-testid={testId}
          className="flex-1 rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:border-indigo-500 focus:outline-none"
        />
        <SubmitSmall label={label} />
      </div>
      {state?.error && <p className="text-xs text-red-600">{state.error}</p>}
    </form>
  );
}

export function ConfigurationsManager({
  projectId,
  groups,
  canManage,
}: {
  projectId: string;
  groups: ConfigGroupView[];
  canManage: boolean;
}) {
  if (!canManage)
    return (
      <p className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-400">
        Only project owners and admins can manage configurations.
      </p>
    );

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        {groups.map((g) => (
          <div
            key={g.id}
            className="rounded-xl border border-slate-200 bg-white p-5"
            data-testid={`config-group-${g.name}`}
          >
            <div className="mb-3 flex items-center justify-between">
              <h4 className="font-semibold">{g.name}</h4>
              <form
                action={deleteConfigGroup}
                onSubmit={(e) => {
                  if (
                    !confirm(
                      `Delete the "${g.name}" group and its options? Existing runs keep their copied config names.`
                    )
                  )
                    e.preventDefault();
                }}
              >
                <input type="hidden" name="groupId" value={g.id} />
                <button
                  type="submit"
                  className="inline-flex items-center gap-1 text-xs text-red-600 hover:text-red-800"
                >
                  <TFIcon name="delete" className="h-3.5 w-3.5" /> Delete group
                </button>
              </form>
            </div>
            <div className="mb-3 flex flex-wrap gap-1.5">
              {g.options.map((o) => (
                <span
                  key={o.id}
                  className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs"
                >
                  {o.name}
                  <form action={deleteConfigOption}>
                    <input type="hidden" name="optionId" value={o.id} />
                    <button
                      type="submit"
                      title="Remove option"
                      className="text-slate-400 hover:text-red-600"
                    >
                      ✕
                    </button>
                  </form>
                </span>
              ))}
              {g.options.length === 0 && (
                <span className="text-xs text-slate-400">
                  No options yet — add at least one to use this group in a plan.
                </span>
              )}
            </div>
            <InlineForm
              action={addConfigOption}
              hidden={{ groupId: g.id }}
              placeholder={`Add option, e.g. ${g.name === "OS" ? "Windows" : "Chrome"}`}
              label="+ Option"
              testId={`config-option-input-${g.name}`}
            />
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <h4 className="mb-2 text-sm font-semibold text-slate-700">New group</h4>
        <InlineForm
          action={createConfigGroup}
          hidden={{ projectId }}
          placeholder='Axis name, e.g. "Browser" or "OS"'
          label="+ Group"
          testId="config-group-input"
        />
      </div>
    </div>
  );
}
