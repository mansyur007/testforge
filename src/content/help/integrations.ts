import type { HelpTopic } from "./types";

export const integrations: HelpTopic = {
  slug: "integrations",
  title: "Issue tracker integrations",
  summary: "Connect Jira, GitHub, or GitLab, and file issues straight from a failed result.",
  body: `
## Connecting a tracker

A project OWNER/ADMIN can connect **Jira, GitHub, or GitLab** under the
project's **Integrations** tab. TestForge verifies the connection against the
provider before saving it, so a bad token is never stored as if it were
active. Credentials are encrypted at rest and never sent back to the browser.

## Filing an issue from a failure

On a **Failed** result, use **File issue** — the case's steps (expanded),
expected vs. actual outcome, and a backlink to the run are pre-filled into
the new issue. The created issue is linked back to the result with a status
badge (green/amber) that refreshes automatically as the issue's state changes
upstream.

## Linking an existing issue

Already have an issue for this failure? Paste its key or URL instead of
filing a new one — TestForge looks it up and links it the same way.
`,
};
