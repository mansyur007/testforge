import type { HelpTopic } from "./types";

export const plans: HelpTopic = {
  slug: "plans",
  title: "Test plans & configurations",
  summary: "Run the same cases across a matrix of configurations (Browser × OS, etc).",
  body: `
## Configurations

A **configuration** is a named axis with a few options — e.g. "Browser" with
options Chrome/Firefox/Safari, or "OS" with Windows/macOS/Linux. Define them
per project under **Fields → Configurations**.

## Creating a plan

From a project's **Plans** tab, click **+ Plan**, pick a case selection, then
pick one or more configuration axes. TestForge generates one run per
combination — two axes with 2 and 3 options each produce 6 runs (capped at
50 combinations per plan) — each pre-loaded with the same cases.

## Tracking progress

A plan's detail page shows aggregate progress across all its child runs, plus
a matrix view (case × configuration) so you can see at a glance which
combinations still need work or which ones are failing. **Complete plan**
closes every child run still open in one action.

## When to use a plan vs. a plain run

Use a plain **run** for a single pass through your cases. Reach for a **plan**
when the same cases need to be verified under more than one environment and
you want the results tracked as a matrix rather than as unrelated runs.
`,
};
