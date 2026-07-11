import type { HelpTopic } from "./types";

export const runs: HelpTopic = {
  slug: "runs",
  title: "Runs & execution",
  summary: "Create a run, execute it, and record results.",
  body: `
## Creating a run

From a project's **Test Runs** tab, click **+ Run**, give it a name, and pick
which cases to include (filter by suite, priority, type, or tag, or select
individually). A run can also be assigned a milestone.

## Executing

Open a run to start recording results. Each case gets one of seven statuses:
**Passed, Failed, Blocked, Skipped, Retest, In Progress, Untested**. Use the
on-screen buttons or keyboard shortcuts — **P / F / B / S / R** for status,
**J / K** to move between cases — and an automatic timer tracks how long each
one took. Leave a comment, attach a screenshot or log file, and link a defect
on any result.

## Rerun failed only

Once a run has failures, **Rerun failed only** creates a new run scoped to
just those cases — handy for a quick re-check after a fix without re-running
everything.

## Automation results

Instead of executing manually, CI can POST a results file and TestForge
matches each test to a case automatically (by a \`TC-<PROJECT>-<n>\` annotation
in the test name, or an exact title match) and creates a completed run. See
[Automation & CI upload](/docs/help/automation).

## Origin & source

Every run records where it came from — manual execution, or an upload tagged
with a source (Cypress, Playwright, CI, Local, …) — visible as a badge on the
run and in reports, so you can tell manual QA passes apart from automation.
`,
};
