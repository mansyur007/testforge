"use client";

import { useEffect, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import {
  createChannel,
  updateChannel,
  deleteChannel,
  toggleChannel,
  testChannel,
} from "@/app/actions/notifications";
import { TFIcon } from "@/components/icons";

// F-08: manage the project's notification channels (Slack/Discord/Teams/email).
// Stored webhook URLs are secrets — they are never echoed back into the form;
// leaving the target blank while editing keeps the existing one.

export type ChannelView = {
  id: string;
  type: string;
  name: string;
  events: string;
  active: boolean;
  target: string; // masked summary for display, e.g. "hooks.slack.com/…" or "a@b.com +2"
};

const TYPE_LABELS: Record<string, string> = {
  SLACK: "Slack",
  DISCORD: "Discord",
  TEAMS: "Microsoft Teams",
  EMAIL: "Email",
};

const URL_PLACEHOLDERS: Record<string, string> = {
  SLACK: "https://hooks.slack.com/services/T000/B000/XXXX",
  DISCORD: "https://discord.com/api/webhooks/…",
  TEAMS: "https://yourorg.webhook.office.com/webhookb2/…",
};

function SubmitButton({ label, pendingLabel }: { label: string; pendingLabel: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      data-testid="channel-form-submit"
      className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
    >
      {pending ? pendingLabel : label}
    </button>
  );
}

function TargetInput({ type }: { type: string }) {
  if (type === "EMAIL")
    return (
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-500">
          Recipients (comma-separated)
        </label>
        <input
          name="to"
          placeholder="qa@company.com, lead@company.com"
          data-testid="channel-to-input"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
        />
      </div>
    );
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-slate-500">
        Incoming webhook URL
      </label>
      <input
        name="webhookUrl"
        placeholder={URL_PLACEHOLDERS[type]}
        data-testid="channel-url-input"
        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
      />
    </div>
  );
}

function ChannelForm({
  projectId,
  availableEvents,
  editing,
  onDone,
}: {
  projectId: string;
  availableEvents: readonly string[];
  editing: ChannelView | null;
  onDone: () => void;
}) {
  const action = editing ? updateChannel : createChannel;
  const [state, formAction] = useFormState(action, undefined);
  const [type, setType] = useState(editing?.type ?? "SLACK");
  const checked = new Set(
    editing ? editing.events.split(",") : [...availableEvents]
  );

  // Reset/close the form once the action reports success.
  useEffect(() => {
    if (state?.ok) onDone();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <form
      action={formAction}
      className="space-y-3 rounded-xl border border-slate-200 bg-white p-5"
    >
      {editing ? (
        <input type="hidden" name="channelId" value={editing.id} />
      ) : (
        <input type="hidden" name="projectId" value={projectId} />
      )}
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">
            Type
          </label>
          {editing ? (
            <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500">
              {TYPE_LABELS[editing.type]}
            </p>
          ) : (
            <select
              name="type"
              value={type}
              onChange={(e) => setType(e.target.value)}
              data-testid="channel-type-select"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            >
              {Object.entries(TYPE_LABELS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          )}
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">
            Name
          </label>
          <input
            name="name"
            required
            defaultValue={editing?.name ?? ""}
            placeholder="#qa-alerts"
            data-testid="channel-name-input"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
          />
        </div>
      </div>

      <TargetInput type={editing?.type ?? type} />
      {editing && (
        <p className="text-xs text-slate-400">
          Leave the target blank to keep the current one (
          <span className="font-mono">{editing.target}</span>).
        </p>
      )}

      <div>
        <span className="mb-1 block text-xs font-medium text-slate-500">
          Events
        </span>
        <div className="flex flex-wrap gap-3">
          {availableEvents.map((e) => (
            <label key={e} className="flex items-center gap-1.5 text-sm">
              <input
                type="checkbox"
                name="events"
                value={e}
                defaultChecked={checked.has(e)}
              />
              <code className="text-xs">{e}</code>
            </label>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <SubmitButton
          label={editing ? "Save changes" : "+ Add Channel"}
          pendingLabel={editing ? "Saving…" : "Adding…"}
        />
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
        <p data-testid="channel-form-error" className="text-sm text-red-600">
          {state.error}
        </p>
      )}
    </form>
  );
}

// useFormStatus only reads a parent <form>'s state, so the button is its own
// component rendered inside the form.
function TestSubmit({ channelId }: { channelId: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      data-testid={`channel-test-${channelId}`}
      className="text-xs text-indigo-600 hover:text-indigo-800 disabled:opacity-50"
    >
      {pending ? "Sending…" : "Send test"}
    </button>
  );
}

function TestButton({ channelId }: { channelId: string }) {
  const [state, formAction] = useFormState(testChannel, undefined);
  return (
    <form action={formAction} className="inline-flex items-center gap-2">
      <input type="hidden" name="channelId" value={channelId} />
      <TestSubmit channelId={channelId} />
      {state?.ok && (
        <span data-testid="channel-test-ok" className="text-xs text-green-600">
          Delivered ✓
        </span>
      )}
      {state?.error && (
        <span data-testid="channel-test-error" className="text-xs text-red-600">
          {state.error}
        </span>
      )}
    </form>
  );
}

export function NotificationChannelsManager({
  projectId,
  channels,
  availableEvents,
}: {
  projectId: string;
  channels: ChannelView[];
  availableEvents: readonly string[];
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formKey, setFormKey] = useState(0);
  const editing = channels.find((c) => c.id === editingId) ?? null;

  return (
    <div className="space-y-4">
      <ChannelForm
        key={`${editingId ?? "new"}-${formKey}`}
        projectId={projectId}
        availableEvents={availableEvents}
        editing={editing}
        onDone={() => {
          setEditingId(null);
          setFormKey((k) => k + 1);
        }}
      />

      {channels.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Channel</th>
                <th className="px-4 py-3">Target</th>
                <th className="px-4 py-3">Events</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {channels.map((c) => (
                <tr key={c.id} data-testid={`channel-row-${c.name}`}>
                  <td className="px-4 py-3">
                    <span className="font-medium">{c.name}</span>
                    <span className="ml-2 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600">
                      {TYPE_LABELS[c.type] ?? c.type}
                    </span>
                  </td>
                  <td className="max-w-[16rem] truncate px-4 py-3 font-mono text-xs text-slate-500">
                    {c.target}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-600">
                    {c.events.split(",").length} event
                    {c.events.split(",").length === 1 ? "" : "s"}
                  </td>
                  <td className="px-4 py-3">
                    <form action={toggleChannel}>
                      <input type="hidden" name="channelId" value={c.id} />
                      <button
                        type="submit"
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          c.active
                            ? "bg-green-100 text-green-800"
                            : "bg-slate-100 text-slate-500"
                        }`}
                        title="Click to toggle"
                      >
                        {c.active ? "Active" : "Paused"}
                      </button>
                    </form>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-3">
                      <TestButton channelId={c.id} />
                      <button
                        type="button"
                        onClick={() => setEditingId(c.id)}
                        className="text-xs text-slate-500 hover:text-slate-700"
                      >
                        Edit
                      </button>
                      <form
                        action={deleteChannel}
                        onSubmit={(e) => {
                          if (!confirm(`Delete channel "${c.name}"?`))
                            e.preventDefault();
                        }}
                      >
                        <input type="hidden" name="channelId" value={c.id} />
                        <button
                          type="submit"
                          className="inline-flex items-center gap-1 text-xs text-red-600 hover:text-red-800"
                        >
                          <TFIcon name="delete" className="h-3.5 w-3.5" /> Delete
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
        Deliveries are best-effort with a 5s timeout — a dead target never
        blocks the action that triggered it. Repeated <code>result.failed</code>{" "}
        events in the same run are aggregated to at most one message per minute
        per channel.
      </p>
    </div>
  );
}
