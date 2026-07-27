"use client";

import { useState, useTransition } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { saveAiSettings, testAiConnection } from "@/app/actions/ai";

// F-29: org-admin AI config form. The API key is write-only — the input is
// blank on load; leaving it blank keeps the existing key.

function SaveButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      data-testid="ai-save"
      className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-50"
    >
      {pending ? "Saving…" : "Save"}
    </button>
  );
}

export function AiSettingsForm({
  configured,
  endpoint,
  model,
  defaultModel,
}: {
  configured: boolean;
  endpoint: string;
  model: string;
  defaultModel: string;
}) {
  const [state, formAction] = useFormState(saveAiSettings, undefined);
  const [test, setTest] = useState<{ ok: boolean; message: string } | null>(null);
  const [testing, startTest] = useTransition();

  return (
    <section className="space-y-4 rounded-xl border border-hairline bg-surface p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Provider</h2>
        <span
          data-testid="ai-status"
          className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
            configured ? "bg-success-soft text-success-soft-fg" : "bg-surface-muted text-content-muted"
          }`}
        >
          {configured ? "Configured" : "Not configured"}
        </span>
      </div>

      <form action={formAction} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-content">
            Endpoint
          </label>
          <input
            name="endpoint"
            defaultValue={endpoint}
            placeholder="https://api.anthropic.com"
            data-testid="ai-endpoint"
            className="bg-surface text-content-strong w-full rounded-lg border border-hairline-strong px-3 py-2 text-sm focus:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-ring"
          />
          <p className="mt-1 text-xs text-content-subtle">
            Any Anthropic-compatible Messages API base URL. Leave as the default
            for Anthropic.
          </p>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-content">
            Model
          </label>
          <input
            name="model"
            defaultValue={model}
            placeholder={defaultModel}
            data-testid="ai-model"
            className="bg-surface text-content-strong w-full rounded-lg border border-hairline-strong px-3 py-2 text-sm focus:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-ring"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-content">
            API key
          </label>
          <input
            name="apiKey"
            type="password"
            autoComplete="off"
            placeholder={configured ? "•••••••• (leave blank to keep)" : "sk-ant-..."}
            data-testid="ai-key"
            className="bg-surface text-content-strong w-full rounded-lg border border-hairline-strong px-3 py-2 text-sm focus:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-ring"
          />
          <p className="mt-1 text-xs text-content-subtle">
            Stored encrypted; never displayed again.
          </p>
        </div>

        {state?.error && (
          <p className="text-sm text-danger" data-testid="ai-error">
            {state.error}
          </p>
        )}
        {state?.ok && (
          <p className="text-sm text-success" data-testid="ai-saved">
            Settings saved.
          </p>
        )}

        <div className="flex flex-wrap items-center gap-2">
          <SaveButton />
          <button
            type="button"
            disabled={testing || !configured}
            data-testid="ai-test"
            onClick={() => startTest(async () => setTest(await testAiConnection()))}
            className="rounded-lg border border-hairline-strong px-4 py-2 text-sm hover:bg-surface-muted disabled:opacity-50"
          >
            {testing ? "Testing…" : "Test connection"}
          </button>
          {configured && (
            <button
              type="submit"
              name="clearKey"
              value="1"
              data-testid="ai-clear"
              className="rounded-lg border border-danger-border px-4 py-2 text-sm text-danger-soft-fg hover:bg-danger-soft"
            >
              Disable AI
            </button>
          )}
        </div>
        {test && (
          <p
            className={`text-sm ${test.ok ? "text-success" : "text-danger"}`}
            data-testid="ai-test-result"
          >
            {test.message}
          </p>
        )}
      </form>
    </section>
  );
}
