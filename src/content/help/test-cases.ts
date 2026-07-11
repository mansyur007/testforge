import type { HelpTopic } from "./types";

export const testCases: HelpTopic = {
  slug: "test-cases",
  title: "Test cases & suites",
  summary: "Organize, write, and maintain your test cases.",
  body: `
## Suites

**Test Suites** are a two-level hierarchy (suite → section) in the sidebar of
a project. Cases can live directly in a suite, in a section, or unassigned
("All Test Cases"). Drag a suite onto another to nest it; a suite can only be
deleted while it's empty.

## Writing a case

A case has a title, optional description/preconditions, a list of
**action → expected result** steps, priority, type, tags, and an assignee.
Steps and most text fields support **Markdown** (headings, lists, code,
tables, and pasted-in screenshots — paste an image directly into the editor
and it uploads and embeds automatically).

## Shared steps

If several cases repeat the same steps (e.g. "Log in as admin"), create a
**shared step group** once (under **Shared Steps**, in the sidebar) and insert
it into any case. Editing the group updates every case that uses it. A group
can't be deleted while it's still referenced anywhere.

## Custom fields

Project ADMIN/OWNER can add custom fields (text, number, dropdown,
multi-select, checkbox, date, user, URL, …) to cases and results under
**Fields**. They show up in the case form, in CSV import/export as
\`cf_<key>\` columns, and in the API.

## Bulk actions

Select multiple cases (checkboxes, or **Ctrl/Cmd+A** to select everything in
the current filtered list) to:

- **Bulk-edit** priority / type / status / automation status
- **Bulk-delete** (soft delete — recoverable for 15 days, then purged)
- **Drag onto a suite** in the sidebar to move them there (or onto "All Test
  Cases" to unassign)
- **Drag onto another row** in the table to reorder them
- **Copy to project…** to duplicate the selection into another project you
  belong to — copies get a fresh ID there, start as Draft, shared steps are
  flattened into plain steps, and attachments are duplicated

## History, import/export, search

Every edit is recorded as a numbered revision with a diff — see the
**History** tab on a case detail page, with one-click restore. Import cases
from CSV (with a preview before committing) or export the current filtered
list. **⌘K / Ctrl+K** searches cases, runs, suites and milestones across all
your projects. Save a filter combination as a named **view** (optionally
shared with the project, or starred as your default).
`,
};
