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
      className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-50"
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
      className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-success-border bg-surface px-3 py-2 text-sm font-medium text-success-soft-fg hover:bg-success-soft"
    >
      <TFIcon name={copied ? "valid" : "clone"} className="h-4 w-4" />
      {copied ? "Copied!" : "Copy"}
    </button>
  );
}

export function ApiKeyCreator({
  projects = [],
}: {
  /** Projects the current user belongs to — the scoping choices. */
  projects?: { id: string; name: string }[];
}) {
  const [state, formAction] = useFormState(createApiKey, undefined);

  return (
    <div className="space-y-3">
      <form
        action={formAction}
        className="space-y-4 rounded-xl border border-hairline bg-surface p-5"
      >
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-0 flex-1">
            <label className="mb-1 block text-xs font-medium text-content-muted">
              Key name (e.g. github-actions)
            </label>
            <input
              name="name"
              required
              data-testid="apikey-name-input"
              className="bg-surface text-content-strong w-full rounded-lg border border-hairline-strong px-3 py-2 text-sm focus:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-ring"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-content-muted">
              Access
            </label>
            <select
              name="scope"
              defaultValue="WRITE"
              data-testid="apikey-scope-select"
              className="bg-surface text-content-strong rounded-lg border border-hairline-strong px-3 py-2 text-sm focus:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-ring"
            >
              <option value="WRITE">Read &amp; write</option>
              <option value="READ">Read-only</option>
            </select>
          </div>
          <SubmitButton />
        </div>

        {/* F-33: both fields are optional; blank keeps the pre-v2 behaviour. */}
        <div className="flex flex-wrap items-end gap-3 border-t border-hairline-subtle pt-4">
          <div className="min-w-0 flex-1">
            <label className="mb-1 block text-xs font-medium text-content-muted">
              Project scope
            </label>
            <select
              name="projectId"
              defaultValue=""
              data-testid="apikey-project-select"
              className="bg-surface text-content-strong w-full rounded-lg border border-hairline-strong px-3 py-2 text-sm focus:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-ring"
            >
              <option value="">All my projects (org-wide)</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-content-subtle">
              A scoped key is rejected on every other project — useful for CI.
            </p>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-content-muted">
              Rate limit (req/min)
            </label>
            <input
              name="rateLimitPerMin"
              type="number"
              min={1}
              placeholder="Default"
              data-testid="apikey-ratelimit-input"
              className="bg-surface text-content-strong w-32 rounded-lg border border-hairline-strong px-3 py-2 text-sm focus:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-ring"
            />
            <p className="mt-1 text-xs text-content-subtle">Blank = server default.</p>
          </div>
        </div>
      </form>
      {state?.error && <p className="text-sm text-danger">{state.error}</p>}
      {state?.createdKey && (
        <div className="rounded-xl border border-success-border bg-success-soft p-5">
          <p className="flex items-center gap-1.5 text-sm font-medium text-success-soft-fg">
            <TFIcon name="valid" className="h-5 w-5 shrink-0" />
            API key created — copy it now, it won&apos;t be shown again:
          </p>
          <div className="mt-2 flex items-center gap-2">
            <code className="block flex-1 select-all break-all rounded-lg bg-surface p-3 font-mono text-sm">
              {state.createdKey}
            </code>
            <CopyButton value={state.createdKey} />
          </div>
        </div>
      )}
    </div>
  );
}
