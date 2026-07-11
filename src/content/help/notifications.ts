import type { HelpTopic } from "./types";

export const notifications: HelpTopic = {
  slug: "notifications",
  title: "Notifications",
  summary: "Push run and case events to Slack, Discord, Teams, or email.",
  body: `
## Setting up a channel

Under a project's **Notifications** tab (OWNER/ADMIN), add a channel — Slack,
Discord, or Microsoft Teams via an incoming webhook URL, or email. Use
**Send test message** to confirm it works before relying on it.

## Choosing what to send

Each channel subscribes to specific events: a run finishing, a case being
assigned, a milestone completing, and so on. Turn off anything you don't want
to hear about — a channel only fires for events it's subscribed to.

## Failure-burst aggregation

If a run has many failures at once, TestForge batches them into a single
digest message roughly once a minute per run, instead of flooding the channel
with one message per failed result.

## Self-hosting note

Webhook URLs are stored encrypted (using \`TF_SECRET\`, or \`AUTH_SECRET\` if
that's not set). By default, webhook hosts must be public — set
\`TF_ALLOW_ANY_WEBHOOK_HOST=1\` if you need to point at an internal receiver.
`,
};
