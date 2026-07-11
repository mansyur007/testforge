import type { HelpTopic } from "./types";

export const reports: HelpTopic = {
  slug: "reports",
  title: "Reports",
  summary: "Pass-rate trend, flaky tests, and automation coverage for a project.",
  body: `
## What's on the Reports tab

- **Pass rate trend** — how your run results have moved over time
- **Flaky detection** — cases whose result flips between pass and fail across
  recent runs without a code change in between
- **Automation coverage** — the split between manual and automated cases,
  and how that's changing
- **Bug correlation** — how often a failure ends up linked to a filed issue

## Exporting

A run's results can be exported to CSV (**Export CSV** on the run, or the
project-wide case export) for anything you want to analyze outside
TestForge, or to attach to an audit/compliance record.
`,
};
