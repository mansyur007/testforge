"use client";

import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { createApiKey } from "@/app/actions/apikeys";
import { TFIcon } from "@/components/icons";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      data-testid="apikey-create-submit"
      className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
    >
      {pending ? "Creating..." : "+ Create API Key"}
    </button>
  );
}

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      // Fallback for non-secure contexts where the Clipboard API is blocked.
      const ta = document.createElement("textarea");
      ta.value = value;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      type="button"
      onClick={copy}
      data-testid="apikey-copy"
      className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-green-300 bg-white px-3 py-2 text-sm font-medium text-green-800 hover:bg-green-100"
    >
      <TFIcon name={copied ? "valid" : "clone"} className="h-4 w-4" />
      {copied ? "Copied!" : "Copy"}
    </button>
  );
}

export function ApiKeyCreator() {
  const [state, formAction] = useFormState(createApiKey, undefined);

  return (
    <div className="space-y-3">
      <form
        action={formAction}
        className="flex items-end gap-3 rounded-xl border border-slate-200 bg-white p-5"
      >
        <div className="flex-1">
          <label className="mb-1 block text-xs font-medium text-slate-500">
            Key name (e.g. github-actions)
          </label>
          <input
            name="name"
            required
            data-testid="apikey-name-input"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
          />
        </div>
        <SubmitButton />
      </form>
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state?.createdKey && (
        <div className="rounded-xl border border-green-200 bg-green-50 p-5">
          <p className="flex items-center gap-1.5 text-sm font-medium text-green-800">
            <TFIcon name="valid" className="h-5 w-5 shrink-0" />
            API key created — copy it now, it won&apos;t be shown again:
          </p>
          <div className="mt-2 flex items-center gap-2">
            <code className="block flex-1 select-all break-all rounded-lg bg-white p-3 font-mono text-sm">
              {state.createdKey}
            </code>
            <CopyButton value={state.createdKey} />
          </div>
        </div>
      )}
    </div>
  );
}
