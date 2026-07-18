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
      className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
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
    <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Provider</h2>
        <span
          data-testid="ai-status"
          className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
            configured ? "bg-green-100 text-green-800" : "bg-slate-100 text-slate-500"
          }`}
        >
          {configured ? "Configured" : "Not configured"}
        </span>
      </div>

      <form action={formAction} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Endpoint
          </label>
          <input
            name="endpoint"
            defaultValue={endpoint}
            placeholder="https://api.anthropic.com"
            data-testid="ai-endpoint"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
          />
          <p className="mt-1 text-xs text-slate-400">
            Any Anthropic-compatible Messages API base URL. Leave as the default
            for Anthropic.
          </p>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Model
          </label>
          <input
            name="model"
            defaultValue={model}
            placeholder={defaultModel}
            data-testid="ai-model"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            API key
          </label>
          <input
            name="apiKey"
            type="password"
            autoComplete="off"
            placeholder={configured ? "•••••••• (leave blank to keep)" : "sk-ant-..."}
            data-testid="ai-key"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
          />
          <p className="mt-1 text-xs text-slate-400">
            Stored encrypted; never displayed again.
          </p>
        </div>

        {state?.error && (
          <p className="text-sm text-red-600" data-testid="ai-error">
            {state.error}
          </p>
        )}
        {state?.ok && (
          <p className="text-sm text-green-600" data-testid="ai-saved">
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
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm hover:bg-slate-100 disabled:opacity-50"
          >
            {testing ? "Testing…" : "Test connection"}
          </button>
          {configured && (
            <button
              type="submit"
              name="clearKey"
              value="1"
              data-testid="ai-clear"
              className="rounded-lg border border-red-300 px-4 py-2 text-sm text-red-700 hover:bg-red-50"
            >
              Disable AI
            </button>
          )}
        </div>
        {test && (
          <p
            className={`text-sm ${test.ok ? "text-green-600" : "text-red-600"}`}
            data-testid="ai-test-result"
          >
            {test.message}
          </p>
        )}
      </form>
    </section>
  );
}
