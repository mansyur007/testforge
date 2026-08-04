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
      className="rounded-lg bg-sidebar px-3 py-1.5 text-xs font-medium text-white hover:bg-sidebar-hover disabled:opacity-50"
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
      <p className="rounded-xl border border-dashed border-hairline-strong p-6 text-center text-sm text-content-subtle">
        Only project owners and admins can manage environments.
      </p>
    );

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-hairline bg-surface p-5">
        {environments.length === 0 && (
          <p className="mb-3 text-sm text-content-subtle">
            No environments yet — add one below, or upload automation results
            with <code className="rounded bg-surface-muted px-1">&env=Staging</code> to
            auto-create it.
          </p>
        )}
        <ul className="mb-4 divide-y divide-hairline-subtle">
          {environments.map((e) => (
            <li
              key={e.id}
              data-testid={`environment-row-${e.name}`}
              className="flex items-center justify-between py-2 text-sm"
            >
              <div className="flex items-center gap-2">
                <span className={e.active ? "" : "text-content-subtle line-through"}>
                  {e.name}
                </span>
                {e.url && (
                  <a
                    href={e.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-accent-text hover:underline"
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
                    className="text-xs text-content-muted hover:text-accent-text"
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
                    className="text-content-subtle hover:text-danger"
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
          {/* flex-wrap + min-w-0: two flex-1 inputs plus the button need ~466px
              of intrinsic width, which pushed a phone viewport 128px wide. */}
          <div className="flex flex-wrap gap-2">
            <input
              name="name"
              required
              placeholder="e.g. Staging"
              data-testid="environment-name-input"
              className="bg-surface text-content-strong min-w-0 flex-1 rounded-lg border border-hairline-strong px-3 py-1.5 text-sm focus:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-ring"
            />
            <input
              name="url"
              placeholder="URL (optional)"
              className="bg-surface text-content-strong min-w-0 flex-1 rounded-lg border border-hairline-strong px-3 py-1.5 text-sm focus:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-ring"
            />
            <SubmitSmall label="+ Environment" />
          </div>
          {state?.error && <p className="text-xs text-danger">{state.error}</p>}
        </form>
      </div>

      <form
        action={setAutoCreateEnvs}
        className="flex items-center gap-2 text-sm text-content"
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
          <code className="rounded bg-surface-muted px-1">&env=&lt;name&gt;</code> on
          automation result uploads
        </label>
      </form>
    </div>
  );
}
