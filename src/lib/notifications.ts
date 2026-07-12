import type { NotificationChannel } from "@prisma/client";
import { db } from "@/lib/db";
import { decrypt, isEncrypted } from "@/lib/crypto";
import { sendMail } from "@/lib/mailer";
import type { WebhookEvent } from "@/lib/webhooks";

// F-08: push events to team chat (Slack/Discord/Teams incoming webhooks) and
// email. Same event vocabulary and fire-and-forget contract as lib/webhooks —
// a dead target must never delay or fail the originating user action.

export const CHANNEL_TYPES = ["SLACK", "DISCORD", "TEAMS", "EMAIL"] as const;
export type ChannelType = (typeof CHANNEL_TYPES)[number];

export type NotifyData = {
  title: string; // headline, e.g. `Run completed: Smoke Test Sprint 1`
  url?: string; // absolute link to the entity
  fields?: { label: string; value: string }[];
  tone?: "good" | "bad" | "neutral";
  runId?: string; // set on result.failed — keys the noise-control window
};

export function notifyBaseUrl(): string {
  return (
    process.env.TF_BASE_URL ??
    process.env.NEXT_PUBLIC_BASE_URL ??
    "http://localhost:3000"
  );
}

// ---------------------------------------------------------------------------
// Target validation (channel save + test). Strict allowlist per type to keep
// stored URLs pointing at the real services (an open target would be an SSRF
// primitive). Self-hosters behind proxies can override with
// TF_ALLOW_ANY_WEBHOOK_HOST=1.
// ---------------------------------------------------------------------------
const ALLOWED_HOSTS: Record<Exclude<ChannelType, "EMAIL">, (h: string) => boolean> = {
  SLACK: (h) => h === "hooks.slack.com",
  DISCORD: (h) => h === "discord.com" || h === "discordapp.com",
  TEAMS: (h) => h.endsWith(".webhook.office.com"),
};

/** Returns a user-facing error, or null when the target is acceptable. */
export function validateWebhookTarget(
  type: ChannelType,
  url: string
): string | null {
  if (type === "EMAIL") return null;
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return "Enter a valid URL.";
  }
  if (process.env.TF_ALLOW_ANY_WEBHOOK_HOST === "1") {
    return /^https?:$/.test(parsed.protocol) ? null : "URL must be http(s).";
  }
  if (parsed.protocol !== "https:") return "Webhook URL must use https.";
  if (!ALLOWED_HOSTS[type](parsed.hostname))
    return `Host not allowed for ${type} (expected ${
      type === "SLACK"
        ? "hooks.slack.com"
        : type === "DISCORD"
          ? "discord.com"
          : "*.webhook.office.com"
    }). Self-hosters can set TF_ALLOW_ANY_WEBHOOK_HOST=1.`;
  return null;
}

export type ChannelConfig = { webhookUrl?: string; to?: string[] };

/** Parse configJson, transparently decrypting chat-webhook configs. */
export function readChannelConfig(c: NotificationChannel): ChannelConfig {
  try {
    const raw = isEncrypted(c.configJson) ? decrypt(c.configJson) : c.configJson;
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

// ---------------------------------------------------------------------------
// Formatters — pure functions, one per target. Exported for direct testing.
// ---------------------------------------------------------------------------
const EVENT_EMOJI: Record<string, string> = {
  "case.created": "✅",
  "case.updated": "✏️",
  "case.deleted": "🗑️",
  "case.assigned": "👤",
  "run.created": "▶️",
  "run.completed": "🏁",
  "result.failed": "❌",
  "issue.created": "🐞",
  "plan.created": "🗂️",
  "plan.completed": "🏁",
  "milestone.completed": "🎯",
  "comment.created": "💬",
  "comment.mentioned": "📣",
  "case.review_requested": "🧐",
  "case.approved": "✅",
  "case.changes_requested": "🔁",
};

export function slackMessage(event: string, d: NotifyData) {
  const emoji = EVENT_EMOJI[event] ?? "🔔";
  const headline = d.url ? `<${d.url}|${d.title}>` : d.title;
  const blocks: unknown[] = [
    {
      type: "section",
      text: { type: "mrkdwn", text: `${emoji} *${headline}*` },
    },
  ];
  if (d.fields?.length)
    blocks.push({
      type: "section",
      fields: d.fields.map((f) => ({
        type: "mrkdwn",
        text: `*${f.label}*\n${f.value}`,
      })),
    });
  return { text: `${emoji} ${d.title}`, blocks };
}

export function discordMessage(event: string, d: NotifyData) {
  const color =
    d.tone === "bad" ? 0xef4444 : d.tone === "good" ? 0x22c55e : 0x6366f1;
  return {
    embeds: [
      {
        title: `${EVENT_EMOJI[event] ?? "🔔"} ${d.title}`,
        ...(d.url ? { url: d.url } : {}),
        color,
        fields: (d.fields ?? []).map((f) => ({
          name: f.label,
          value: f.value,
          inline: true,
        })),
      },
    ],
  };
}

export function teamsCard(event: string, d: NotifyData) {
  return {
    type: "message",
    attachments: [
      {
        contentType: "application/vnd.microsoft.card.adaptive",
        content: {
          $schema: "http://adaptivecards.io/schemas/adaptive-card.json",
          type: "AdaptiveCard",
          version: "1.4",
          body: [
            {
              type: "TextBlock",
              text: `${EVENT_EMOJI[event] ?? "🔔"} ${d.title}`,
              weight: "Bolder",
              size: "Medium",
              wrap: true,
            },
            ...(d.fields?.length
              ? [
                  {
                    type: "FactSet",
                    facts: d.fields.map((f) => ({
                      title: f.label,
                      value: f.value,
                    })),
                  },
                ]
              : []),
          ],
          ...(d.url
            ? {
                actions: [
                  { type: "Action.OpenUrl", title: "Open in TestForge", url: d.url },
                ],
              }
            : {}),
        },
      },
    ],
  };
}

export function emailMessage(event: string, d: NotifyData) {
  const rows = (d.fields ?? [])
    .map(
      (f) =>
        `<tr><td style="padding:4px 12px 4px 0;color:#64748b;">${f.label}</td><td style="padding:4px 0;font-weight:600;color:#0f172a;">${f.value}</td></tr>`
    )
    .join("");
  return {
    subject: `[TestForge] ${event}: ${d.title}`,
    html: `<div style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;font-size:14px;color:#0f172a;">
  <p style="font-size:16px;font-weight:700;">${EVENT_EMOJI[event] ?? "🔔"} ${d.title}</p>
  ${rows ? `<table style="border-collapse:collapse;font-size:14px;">${rows}</table>` : ""}
  ${d.url ? `<p style="margin-top:16px;"><a href="${d.url}" style="color:#4f46e5;">Open in TestForge →</a></p>` : ""}
</div>`,
    text: `${d.title}\n${(d.fields ?? []).map((f) => `${f.label}: ${f.value}`).join("\n")}${d.url ? `\n${d.url}` : ""}`,
  };
}

// ---------------------------------------------------------------------------
// result.failed noise control: per channel+run, at most one message a minute;
// failures inside the window are counted and reported by the next message.
// In-memory — a multi-instance deploy may occasionally double-send.
// ---------------------------------------------------------------------------
const FAIL_WINDOW_MS = 60_000;
const failWindow = new Map<string, { last: number; suppressed: number }>();

/** Returns null to skip, or the suppressed-count to fold into this message. */
function checkFailWindow(channelId: string, runId: string): number | null {
  const key = `${channelId}:${runId}`;
  const now = Date.now();
  const entry = failWindow.get(key);
  if (entry && now - entry.last < FAIL_WINDOW_MS) {
    entry.suppressed += 1;
    return null;
  }
  const suppressed = entry?.suppressed ?? 0;
  failWindow.set(key, { last: now, suppressed: 0 });
  return suppressed;
}

// ---------------------------------------------------------------------------
// Delivery
// ---------------------------------------------------------------------------

/** Deliver one message to one channel. Awaitable (the "send test message"
 * button reports the outcome); notify() calls it fire-and-forget. Throws with
 * a readable message on failure. */
export async function sendToChannel(
  channel: Pick<NotificationChannel, "id" | "type" | "configJson">,
  event: string,
  data: NotifyData
): Promise<void> {
  const config = readChannelConfig(channel as NotificationChannel);

  if (channel.type === "EMAIL") {
    const to = (config.to ?? []).join(", ");
    if (!to) throw new Error("Channel has no recipients configured");
    const msg = emailMessage(event, data);
    const res = await sendMail({ to, ...msg });
    // Without SMTP_URL sendMail logs and reports sent:false — surface that
    // honestly on an explicit test, but only when it carried a real error.
    if (!res.sent && res.error) throw new Error(res.error);
    return;
  }

  const url = config.webhookUrl;
  if (!url) throw new Error("Channel has no webhook URL configured");
  const payload =
    channel.type === "SLACK"
      ? slackMessage(event, data)
      : channel.type === "DISCORD"
        ? discordMessage(event, data)
        : teamsCard(event, data);

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(5000),
  });
  if (!res.ok) throw new Error(`Target responded ${res.status}`);
}

/**
 * Push `event` to every active subscribed channel of the project.
 * Fire-and-forget: errors are swallowed (console.warn with the channel id).
 * Call it next to dispatchWebhook — never await the deliveries themselves.
 */
export async function notify(
  projectId: string,
  event: WebhookEvent,
  data: NotifyData
): Promise<void> {
  const channels = await db.notificationChannel.findMany({
    where: { projectId, active: true },
  });

  for (const channel of channels) {
    if (!channel.events.split(",").includes(event)) continue;

    let payload = data;
    if (event === "result.failed" && data.runId) {
      const suppressed = checkFailWindow(channel.id, data.runId);
      if (suppressed === null) continue; // inside the window — aggregate
      if (suppressed > 0)
        payload = {
          ...data,
          fields: [
            ...(data.fields ?? []),
            {
              label: "Also",
              value: `…and ${suppressed} more failure${suppressed === 1 ? "" : "s"} in the last minute`,
            },
          ],
        };
    }

    // Not awaited: delivery must not delay the originating action.
    sendToChannel(channel, event, payload).catch((err) => {
      console.warn(
        `[notify] channel ${channel.id} (${channel.type}) failed:`,
        (err as Error).message
      );
    });
  }
}
