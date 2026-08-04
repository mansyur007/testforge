"use client";

import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { createWebhook, deleteWebhook } from "@/app/actions/webhooks";
import { TFIcon } from "@/components/icons";

type Hook = {
  id: string;
  url: string;
  events: string;
  secret: string;
  active: boolean;
};

function AddButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      data-testid="webhook-create-submit"
      className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-50"
    >
      {pending ? "Adding…" : "+ Add Webhook"}
    </button>
  );
}

function SecretCell({ secret }: { secret: string }) {
  const [show, setShow] = useState(false);
  return (
    <button
      type="button"
      onClick={() => setShow((s) => !s)}
      className="font-mono text-xs text-content-muted hover:text-content"
      title={show ? "Hide" : "Reveal"}
    >
      {show ? secret : `${secret.slice(0, 9)}••••••••`}
    </button>
  );
}

export function WebhookManager({
  projectId,
  webhooks,
  availableEvents,
}: {
  projectId: string;
  webhooks: Hook[];
  availableEvents: readonly string[];
}) {
  const [state, formAction] = useFormState(createWebhook, undefined);

  return (
    <div className="space-y-4">
      <form
        action={formAction}
        className="space-y-3 rounded-xl border border-hairline bg-surface p-5"
      >
        <input type="hidden" name="projectId" value={projectId} />
        <div>
          <label className="mb-1 block text-xs font-medium text-content-muted">
            Payload URL
          </label>
          <input
            name="url"
            required
            placeholder="https://example.com/hooks/testforge"
            data-testid="webhook-url-input"
            className="bg-surface text-content-strong w-full rounded-lg border border-hairline-strong px-3 py-2 text-sm focus:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-ring"
          />
        </div>
        <div>
          <span className="mb-1 block text-xs font-medium text-content-muted">
            Events
          </span>
          <div className="flex flex-wrap gap-3">
            {availableEvents.map((e) => (
              <label key={e} className="flex items-center gap-1.5 text-sm">
                <input type="checkbox" name="events" value={e} defaultChecked />
                <code className="text-xs">{e}</code>
              </label>
            ))}
          </div>
        </div>
        <AddButton />
        {state?.error && <p className="text-sm text-danger">{state.error}</p>}
      </form>

      {webhooks.length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-hairline bg-surface">
          <table className="w-full text-sm">
            <thead className="bg-canvas text-left text-xs uppercase text-content-muted">
              <tr>
                <th className="px-4 py-3">URL</th>
                <th className="px-4 py-3">Events</th>
                <th className="px-4 py-3">Secret</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline-subtle">
              {webhooks.map((h) => (
                <tr key={h.id}>
                  <td className="max-w-xs truncate px-4 py-3 font-mono text-xs">
                    {h.url}
                  </td>
                  <td className="px-4 py-3 text-xs text-content">
                    {h.events.split(",").join(", ")}
                  </td>
                  <td className="px-4 py-3">
                    <SecretCell secret={h.secret} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <form action={deleteWebhook}>
                      <input type="hidden" name="webhookId" value={h.id} />
                      <button
                        type="submit"
                        className="inline-flex items-center gap-1 text-xs text-danger hover:text-danger-soft-fg"
                      >
                        <TFIcon name="delete" className="h-3.5 w-3.5" /> Delete
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="text-xs text-content-subtle">
        Deliveries are POSTed as JSON and signed with HMAC-SHA256 in the{" "}
        <code>X-TestForge-Signature</code> header (<code>sha256=…</code>). Verify
        it against the secret above.
      </p>
    </div>
  );
}
