"use client";

import { useEffect, useRef } from "react";
import { useFormState, useFormStatus } from "react-dom";
import {
  createEnvironment,
  deleteEnvironment,
  toggleEnvironmentActive,
  setAutoCreateEnvs,
} from "@/app/actions/environments";
import { TFIcon } from "@/components/icons";

// F-19: environments (Staging, Prod, …) a run can be tagged against.

export type EnvironmentView = {
  id: string;
  name: string;
  url: string | null;
  active: boolean;
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

export function EnvironmentsManager({
  projectId,
  environments,
  autoCreateEnvs,
  canManage,
}: {
  projectId: string;
  environments: EnvironmentView[];
  autoCreateEnvs: boolean;
  canManage: boolean;
}) {
  const [state, formAction] = useFormState(createEnvironment, undefined);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.ok) formRef.current?.reset();
  }, [state]);

  if (!canManage)
    return (
      <p className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-400">
        Only project owners and admins can manage environments.
      </p>
    );

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-slate-200 bg-white p-5">
        {environments.length === 0 && (
          <p className="mb-3 text-sm text-slate-400">
            No environments yet — add one below, or upload automation results
            with <code className="rounded bg-slate-100 px-1">&env=Staging</code> to
            auto-create it.
          </p>
        )}
        <ul className="mb-4 divide-y divide-slate-100">
          {environments.map((e) => (
            <li
              key={e.id}
              data-testid={`environment-row-${e.name}`}
              className="flex items-center justify-between py-2 text-sm"
            >
              <div className="flex items-center gap-2">
                <span className={e.active ? "" : "text-slate-400 line-through"}>
                  {e.name}
                </span>
                {e.url && (
                  <a
                    href={e.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-indigo-500 hover:underline"
                  >
                    {e.url}
                  </a>
                )}
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <form action={toggleEnvironmentActive}>
                  <input type="hidden" name="environmentId" value={e.id} />
                  <button
                    type="submit"
                    className="text-xs text-slate-500 hover:text-indigo-600"
                  >
                    {e.active ? "Deactivate" : "Activate"}
                  </button>
                </form>
                <form
                  action={deleteEnvironment}
                  onSubmit={(ev) => {
                    if (
                      !confirm(
                        `Delete "${e.name}"? Runs already tagged with it just lose the tag.`
                      )
                    )
                      ev.preventDefault();
                  }}
                >
                  <input type="hidden" name="environmentId" value={e.id} />
                  <button
                    type="submit"
                    title="Delete"
                    className="text-slate-400 hover:text-red-600"
                  >
                    <TFIcon name="delete" className="h-3.5 w-3.5" />
                  </button>
                </form>
              </div>
            </li>
          ))}
        </ul>

        <form ref={formRef} action={formAction} className="space-y-1">
          <input type="hidden" name="projectId" value={projectId} />
          <div className="flex gap-2">
            <input
              name="name"
              required
              placeholder="e.g. Staging"
              data-testid="environment-name-input"
              className="flex-1 rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:border-indigo-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            />
            <input
              name="url"
              placeholder="URL (optional)"
              className="flex-1 rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:border-indigo-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            />
            <SubmitSmall label="+ Environment" />
          </div>
          {state?.error && <p className="text-xs text-red-600">{state.error}</p>}
        </form>
      </div>

      <form
        action={setAutoCreateEnvs}
        className="flex items-center gap-2 text-sm text-slate-600"
      >
        <input type="hidden" name="projectId" value={projectId} />
        <input
          type="checkbox"
          id="autoCreateEnvs"
          name="autoCreateEnvs"
          defaultChecked={autoCreateEnvs}
          onChange={(e) => e.currentTarget.form?.requestSubmit()}
        />
        <label htmlFor="autoCreateEnvs">
          Auto-create an environment from{" "}
          <code className="rounded bg-slate-100 px-1">&env=&lt;name&gt;</code> on
          automation result uploads
        </label>
      </form>
    </div>
  );
}
