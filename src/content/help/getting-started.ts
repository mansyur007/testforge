import type { HelpTopic } from "./types";

export const gettingStarted: HelpTopic = {
  slug: "getting-started",
  title: "Getting started",
  summary: "Set up your first project and understand the basic layout.",
  body: `
## Create a project

Every project is a separate namespace for test cases, suites, runs and settings.
From **Projects** in the sidebar, click **+ Project** and give it a name — a
short slug is generated automatically (e.g. \`web\` → case IDs like \`TC-WEB-1\`).

## Invite your team

Open **Team** in the sidebar to invite people by email. Each person gets a role:

- **OWNER / ADMIN** — full access, including managing members and integrations
- **MEMBER** — create and edit cases, runs, results
- **VIEWER** — read-only

Roles are per-project, so someone can be an ADMIN on one project and a VIEWER
on another. See [Team & roles](/docs/help/team) for details.

## The basic loop

1. Write **test cases** (with steps) under **Test Suites**.
2. Group related cases into a **test run** and execute them (pass/fail/etc, one
   click or keyboard shortcut per result).
3. Read **Reports** for pass-rate trend, flaky tests, and automation coverage.

Everything else — custom fields, shared steps, plans, integrations,
notifications — builds on that loop. Start simple; add the rest as you need it.
`,
};
