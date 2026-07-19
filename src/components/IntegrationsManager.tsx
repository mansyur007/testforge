"use client";

import { useEffect, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import {
  saveIntegration,
  testIntegration,
  toggleIntegration,
  deleteIntegration,
} from "@/app/actions/integrations";
import { TFIcon } from "@/components/icons";

// F-07: configure the project's issue tracker. Stored credentials are never
// sent to the client — the form shows blank credential fields on edit, and
// leaving them blank keeps whatever is stored.

export type IntegrationView = {
  id: string;
  provider: string;
  baseUrl: string;
  targetKey: string;
  active: boolean;
};

const PROVIDER_LABELS: Record<string, string> = {
  JIRA: "Jira Cloud",
  GITHUB: "GitHub",
  GITLAB: "GitLab",
};

const TARGET_HINTS: Record<string, { label: string; placeholder: string }> = {
  JIRA: { label: "Project key", placeholder: "QA" },
  GITHUB: { label: "Repository", placeholder: "owner/repo" },
  GITLAB: { label: "Project path", placeholder: "group/project" },
};

const BASE_HINTS: Record<string, { label: string; placeholder: string }> = {
  JIRA: { label: "Site URL", placeholder: "https://yourorg.atlassian.net" },
  GITHUB: { label: "API base URL", placeholder: "https://api.github.com" },
  GITLAB: { label: "Host", placeholder: "https://gitlab.com" },
};

function SaveButton({ editing }: { editing: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      data-testid="integration-save"
      className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
    >
      {pending
        ? "Verifying connection…"
        : editing
          ? "Save & test connection"
          : "+ Connect tracker"}
    </button>
  );
}

function CredentialFields({ provider }: { provider: string }) {
  if (provider === "JIRA")
    return (
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">
            Account email
          </label>
          <input
            name="email"
            autoComplete="off"
            placeholder="you@company.com"
            data-testid="integration-email-input"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">
            API token
          </label>
          <input
            name="apiToken"
            type="password"
            autoComplete="new-password"
            placeholder="••••••••"
            data-testid="integration-token-input"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
          />
        </div>
      </div>
    );
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-slate-500">
        Access token
      </label>
      <input
        name="token"
        type="password"
        autoComplete="new-password"
        placeholder={provider === "GITHUB" ? "ghp_… (repo scope)" : "glpat-… (api scope)"}
        data-testid="integration-token-input"
        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
      />
    </div>
  );
}

function IntegrationForm({
  projectId,
  editing,
  onDone,
}: {
  projectId: string;
  editing: IntegrationView | null;
  onDone: () => void;
}) {
  const [state, formAction] = useFormState(saveIntegration, undefined);
  const [provider, setProvider] = useState(editing?.provider ?? "GITHUB");

  // Close the edit form once the save succeeds (never during render).
  useEffect(() => {
    if (state?.ok && editing) onDone();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <form
      action={formAction}
      className="space-y-3 rounded-xl border border-slate-200 bg-white p-5"
    >
      <input type="hidden" name="projectId" value={projectId} />
      {editing && <input type="hidden" name="provider" value={editing.provider} />}

      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">
            Provider
          </label>
          {editing ? (
            <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500">
              {PROVIDER_LABELS[editing.provider]}
            </p>
          ) : (
            <select
              name="provider"
              value={provider}
              onChange={(e) => setProvider(e.target.value)}
              data-testid="integration-provider-select"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            >
              {Object.entries(PROVIDER_LABELS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          )}
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">
            {BASE_HINTS[editing?.provider ?? provider].label}
          </label>
          <input
            name="baseUrl"
            defaultValue={editing?.baseUrl ?? ""}
            placeholder={BASE_HINTS[editing?.provider ?? provider].placeholder}
            data-testid="integration-baseurl-input"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">
            {TARGET_HINTS[editing?.provider ?? provider].label}
          </label>
          <input
            name="targetKey"
            required
            defaultValue={editing?.targetKey ?? ""}
            placeholder={TARGET_HINTS[editing?.provider ?? provider].placeholder}
            data-testid="integration-target-input"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
          />
        </div>
      </div>

      <CredentialFields provider={editing?.provider ?? provider} />
      {editing && (
        <p className="text-xs text-slate-400">
          Leave the credential fields blank to keep the stored ones. Saved
          tokens are encrypted and never shown again.
        </p>
      )}

      <div className="flex items-center gap-3">
        <SaveButton editing={!!editing} />
        {editing && (
          <button
            type="button"
            onClick={onDone}
            className="text-sm text-slate-500 hover:text-slate-700"
          >
            Cancel
          </button>
        )}
      </div>
      {state?.error && (
        <p data-testid="integration-form-error" className="text-sm text-red-600">
          {state.error}
        </p>
      )}
      {state?.ok && !editing && (
        <p data-testid="integration-form-ok" className="text-sm text-green-600">
          Connected ✓
        </p>
      )}
    </form>
  );
}

function TestSubmit() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      data-testid="integration-test"
      className="text-xs text-indigo-600 hover:text-indigo-800 disabled:opacity-50"
    >
      {pending ? "Testing…" : "Test connection"}
    </button>
  );
}

function TestButton({ integrationId }: { integrationId: string }) {
  const [state, formAction] = useFormState(testIntegration, undefined);
  return (
    <form action={formAction} className="inline-flex items-center gap-2">
      <input type="hidden" name="integrationId" value={integrationId} />
      <TestSubmit />
      {state?.ok && (
        <span data-testid="integration-test-ok" className="text-xs text-green-600">
          OK ✓
        </span>
      )}
      {state?.error && (
        <span
          data-testid="integration-test-error"
          className="max-w-xs truncate text-xs text-red-600"
          title={state.error}
        >
          {state.error}
        </span>
      )}
    </form>
  );
}

export function IntegrationsManager({
  projectId,
  integrations,
}: {
  projectId: string;
  integrations: IntegrationView[];
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formKey, setFormKey] = useState(0);
  const editing = integrations.find((i) => i.id === editingId) ?? null;

  return (
    <div className="space-y-4">
      <IntegrationForm
        key={`${editingId ?? "new"}-${formKey}`}
        projectId={projectId}
        editing={editing}
        onDone={() => {
          setEditingId(null);
          setFormKey((k) => k + 1);
        }}
      />

      {integrations.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Provider</th>
                <th className="px-4 py-3">Target</th>
                <th className="px-4 py-3">Credentials</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {integrations.map((i) => (
                <tr key={i.id} data-testid={`integration-row-${i.provider}`}>
                  <td className="px-4 py-3 font-medium">
                    {PROVIDER_LABELS[i.provider] ?? i.provider}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-600">
                    {i.targetKey}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-400">
                    encrypted, never displayed
                  </td>
                  <td className="px-4 py-3">
                    <form action={toggleIntegration}>
                      <input type="hidden" name="integrationId" value={i.id} />
                      <button
                        type="submit"
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          i.active
                            ? "bg-green-100 text-green-800"
                            : "bg-slate-100 text-slate-500"
                        }`}
                        title="Click to toggle"
                      >
                        {i.active ? "Active" : "Paused"}
                      </button>
                    </form>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-3">
                      <TestButton integrationId={i.id} />
                      <button
                        type="button"
                        onClick={() => setEditingId(i.id)}
                        className="text-xs text-slate-500 hover:text-slate-700"
                      >
                        Edit
                      </button>
                      <form
                        action={deleteIntegration}
                        onSubmit={(e) => {
                          if (
                            !confirm(
                              `Disconnect ${PROVIDER_LABELS[i.provider]}? Existing issue links stay readable.`
                            )
                          )
                            e.preventDefault();
                        }}
                      >
                        <input type="hidden" name="integrationId" value={i.id} />
                        <button
                          type="submit"
                          className="inline-flex items-center gap-1 text-xs text-red-600 hover:text-red-800"
                        >
                          <TFIcon name="delete" className="h-3.5 w-3.5" /> Disconnect
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="text-xs text-slate-400">
        A connection is verified against the provider before it is saved, so a
        bad token never becomes active. Tokens are encrypted at rest and are
        never returned to the browser.
      </p>
    </div>
  );
}
