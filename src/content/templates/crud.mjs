// F-47: the generic CRUD starter pack.
//
// The one pack that would be useless written against a specific noun, so it is
// the one that uses template variables: {{ENTITY}} and {{ENTITIES}} are filled
// in at apply time, turning "Create {{ENTITY}}" into "Create Invoice".
//
// The Permissions & Access suite is the reason this pack is worth shipping. It
// is the suite teams most often skip, and the one whose absence shows up as a
// security finding rather than a bug report.

export const CRUD_TEMPLATE = {
  slug: "crud-entity",
  name: "CRUD (any entity)",
  category: "CRUD",
  order: 30,
  summary:
    "Create, read, update, delete and permissions for any record type — fill in your entity name and the whole suite renames itself.",
  description: `A reusable suite for any record your product manages: customers,
invoices, projects, devices, anything.

Fill in the **entity name** in the panel on the right and every title and step
below renames itself, so applying this three times for three record types gives
you three properly named suites rather than three copies of the word "item".

Beyond the obvious four operations it covers the parts that are usually
discovered late: pagination edges, concurrent edits, whether "delete" really
deletes, and a full permission matrix — the suite teams skip most often, and the
one whose absence surfaces as a security finding rather than a bug report.`,
  content: {
    variables: [
      { key: "ENTITY", label: "Entity name (singular)", default: "Item" },
      { key: "ENTITIES", label: "Entity name (plural)", default: "Items" },
    ],
    suites: [
      {
        key: "create",
        name: "Create {{ENTITY}}",
        description:
          "Adding a record: required fields, boundaries, and what the server does when the client is bypassed.",
        cases: [
          {
            key: "crud-create-valid",
            title: "Create {{ENTITY}} with valid values",
            coverage: "positive",
            priority: "CRITICAL",
            type: "SMOKE",
            preconditions: "Signed in as a user permitted to create {{ENTITY}} records.",
            steps: [
              { action: "Open the new {{ENTITY}} form.", expected: "Every required field is visible and empty." },
              { action: "Fill in all required fields with valid values.", expected: "No validation errors appear." },
              { action: "Save.", expected: "A success confirmation is shown." },
              { action: "Open the {{ENTITIES}} list.", expected: "The new {{ENTITY}} appears with the values entered." },
            ],
            expectedResult:
              "The {{ENTITY}} is persisted with exactly the values submitted and is visible in the list.",
          },
          {
            key: "crud-create-required",
            title: "Creating {{ENTITY}} with required fields empty is refused",
            coverage: "negative",
            priority: "HIGH",
            type: "FUNCTIONAL",
            preconditions: "Signed in with create permission.",
            steps: [
              { action: "Open the new {{ENTITY}} form and save without entering anything.", expected: "The form is not submitted." },
              { action: "Read the messages.", expected: "Each required field is individually named." },
              { action: "Check the {{ENTITIES}} list.", expected: "No empty record was created." },
            ],
            expectedResult:
              "Nothing is persisted and the user is told exactly what is missing.",
          },
          {
            key: "crud-create-max-length",
            title: "Text fields accept their maximum length and refuse one character more",
            coverage: "boundary",
            priority: "MEDIUM",
            type: "FUNCTIONAL",
            preconditions: "The configured maximum length of the main text field is known.",
            steps: [
              { action: "Enter a value of exactly the maximum length and save.", expected: "It is accepted." },
              { action: "Reopen the {{ENTITY}}.", expected: "The stored value is complete, not truncated." },
              { action: "Enter a value one character longer and save.", expected: "It is refused with a stated limit, or the field stops accepting input at the limit." },
            ],
            expectedResult:
              "The limit is inclusive, enforced, and never silently truncates.",
          },
          {
            key: "crud-create-invalid-types",
            title: "Fields reject values of the wrong type or shape",
            coverage: "negative",
            priority: "MEDIUM",
            type: "FUNCTIONAL",
            preconditions: "The {{ENTITY}} has at least one numeric, date or formatted field.",
            steps: [
              { action: "Enter letters in a numeric field and save.", expected: "It is refused with a message about the field." },
              { action: "Enter an impossible date such as 31 February and save.", expected: "It is refused." },
              { action: "Enter a negative value where only positives make sense.", expected: "It is refused." },
            ],
            expectedResult:
              "Each field enforces its own domain rather than accepting anything the browser will send.",
          },
          {
            key: "crud-create-duplicate",
            title: "A duplicate value in a unique field is refused",
            coverage: "negative",
            priority: "HIGH",
            type: "FUNCTIONAL",
            preconditions:
              "The {{ENTITY}} has a field required to be unique, and one record already uses a known value.",
            steps: [
              { action: "Create a second {{ENTITY}} with the same value in the unique field.", expected: "It is refused with a message naming the conflict." },
              { action: "Check the {{ENTITIES}} list.", expected: "Only the original record exists." },
            ],
            expectedResult:
              "Uniqueness is enforced by the server and the message explains the conflict.",
          },
          {
            key: "crud-create-server-validation",
            title: "Validation is enforced server-side when the form is bypassed",
            coverage: "security",
            priority: "HIGH",
            type: "SECURITY",
            preconditions: "Access to devtools or an HTTP client.",
            steps: [
              { action: "Send a create request directly with a required field omitted.", expected: "The server refuses it." },
              { action: "Send one with a value past the maximum length.", expected: "The server refuses it." },
              { action: "Send one including a field the form never renders, such as an id, owner or status the user should not set.", expected: "The field is ignored or refused; it does not overwrite server-controlled state." },
            ],
            expectedResult:
              "Client-side validation is a convenience; the server independently enforces every rule and ignores unexpected fields.",
          },
          {
            key: "crud-create-cancel",
            title: "Cancelling the new {{ENTITY}} form persists nothing",
            coverage: "negative",
            priority: "LOW",
            type: "FUNCTIONAL",
            preconditions: "Signed in with create permission.",
            steps: [
              { action: "Fill in the form and then cancel or navigate away.", expected: "If the product warns about unsaved changes, the warning appears." },
              { action: "Open the {{ENTITIES}} list.", expected: "No new record exists." },
            ],
            expectedResult:
              "Abandoning the form leaves no partial record behind.",
          },
        ],
      },
      {
        key: "read-list",
        name: "Read & List {{ENTITIES}}",
        description:
          "Viewing records: the list, its edges, and whether search and sort tell the truth.",
        cases: [
          {
            key: "crud-list-shows-records",
            title: "The {{ENTITIES}} list shows existing records",
            coverage: "positive",
            priority: "HIGH",
            type: "SMOKE",
            preconditions: "At least three {{ENTITIES}} exist.",
            steps: [
              { action: "Open the {{ENTITIES}} list.", expected: "The existing records are listed." },
              { action: "Compare a row against the record it represents.", expected: "The displayed values match the stored ones." },
            ],
            expectedResult: "The list is an accurate view of what exists.",
          },
          {
            key: "crud-list-empty-state",
            title: "The list shows a meaningful empty state when there are no {{ENTITIES}}",
            coverage: "boundary",
            priority: "MEDIUM",
            type: "FUNCTIONAL",
            preconditions: "An account or scope with no {{ENTITIES}} at all.",
            steps: [
              { action: "Open the {{ENTITIES}} list.", expected: "No blank page, spinner or error is shown." },
              { action: "Read the empty state.", expected: "It explains there is nothing yet and offers the action to create one." },
            ],
            expectedResult:
              "Zero records is a designed state, not an accident.",
          },
          {
            key: "crud-list-pagination-edges",
            title: "Pagination behaves at its first, last and exact-boundary pages",
            coverage: "boundary",
            priority: "HIGH",
            type: "FUNCTIONAL",
            preconditions: "The page size is known; call it N. Enough {{ENTITIES}} exist to fill several pages.",
            steps: [
              { action: "With exactly N records, open the list.", expected: "One page is shown; there is no second, empty page." },
              { action: "With exactly N+1 records, go to the last page.", expected: "It holds one record." },
              { action: "On the last page, confirm the next control is unavailable; on the first, the previous control.", expected: "Both are disabled at their respective ends." },
              { action: "Request a page number beyond the last, by URL.", expected: "It is handled gracefully — an empty page or a redirect to the last, never an error." },
            ],
            expectedResult:
              "No off-by-one at either end, and no record is skipped or shown twice across pages.",
          },
          {
            key: "crud-list-sorting",
            title: "Sorting reorders the whole set, not just the visible page",
            coverage: "negative",
            priority: "MEDIUM",
            type: "FUNCTIONAL",
            preconditions: "More {{ENTITIES}} exist than fit on one page.",
            steps: [
              { action: "Sort by a column ascending and note the first record.", expected: "The list reorders." },
              { action: "Sort descending and note the first record.", expected: "It is the last record of the ascending order — across the whole set, not merely the page." },
              { action: "Sort by a column containing empty values.", expected: "Empty values group consistently at one end rather than scattering." },
            ],
            expectedResult:
              "Sorting is applied to the data set before paging, which is the difference between a correct sort and a plausible-looking one.",
          },
          {
            key: "crud-search-filter",
            title: "Search matches partial values and reports no matches clearly",
            coverage: "negative",
            priority: "MEDIUM",
            type: "FUNCTIONAL",
            preconditions: "Several {{ENTITIES}} exist with known distinct values.",
            steps: [
              { action: "Search a substring of one record's value.", expected: "That record is returned." },
              { action: "Search with different letter case.", expected: "The same record is returned." },
              { action: "Search a string that matches nothing.", expected: "A clear no-results state is shown, not an empty page or an error." },
              { action: "Search a string containing a wildcard or quote character.", expected: "It is treated as literal text; no error and no unexpected extra matches." },
            ],
            expectedResult:
              "Search is forgiving about case and partial matches, and special characters cannot break the query.",
          },
          {
            key: "crud-read-missing",
            title: "Opening {{ENTITY}} that does not exist gives a clean not-found",
            coverage: "negative",
            priority: "MEDIUM",
            type: "FUNCTIONAL",
            preconditions: "An id known not to exist, or the id of a deleted record.",
            steps: [
              { action: "Open the {{ENTITY}} detail URL with that id.", expected: "A not-found state is shown." },
              { action: "Inspect the response.", expected: "No stack trace, query fragment or internal path is disclosed." },
            ],
            expectedResult:
              "A missing record is a handled state, not an unhandled exception.",
          },
        ],
      },
      {
        key: "update",
        name: "Update {{ENTITY}}",
        description:
          "Editing a record — including the two cases that only appear with more than one user: concurrency and stale forms.",
        cases: [
          {
            key: "crud-update-valid",
            title: "Edit {{ENTITY}} and save valid changes",
            coverage: "positive",
            priority: "CRITICAL",
            type: "SMOKE",
            preconditions: "An existing {{ENTITY}} and a user permitted to edit it.",
            steps: [
              { action: "Open the {{ENTITY}} for editing.", expected: "The form is pre-filled with the current values." },
              { action: "Change one field to a new valid value and save.", expected: "A success confirmation is shown." },
              { action: "Reload the {{ENTITY}}.", expected: "The new value persisted and no other field changed." },
            ],
            expectedResult:
              "Only the edited field changes, and the change survives a reload.",
          },
          {
            key: "crud-update-validation",
            title: "Editing applies the same validation rules as creating",
            coverage: "negative",
            priority: "HIGH",
            type: "FUNCTIONAL",
            preconditions: "An existing {{ENTITY}}.",
            steps: [
              { action: "Clear a required field and save.", expected: "It is refused." },
              { action: "Enter a value past the maximum length and save.", expected: "It is refused." },
              { action: "Set a unique field to a value another record already uses.", expected: "It is refused with a conflict message." },
              { action: "Reload the {{ENTITY}}.", expected: "The original values are intact." },
            ],
            expectedResult:
              "The edit path is not a weaker door into the same data than the create path.",
          },
          {
            key: "crud-update-no-change",
            title: "Saving without changing anything is harmless",
            coverage: "boundary",
            priority: "LOW",
            type: "FUNCTIONAL",
            preconditions: "An existing {{ENTITY}}.",
            steps: [
              { action: "Open the {{ENTITY}} for editing and save immediately, changing nothing.", expected: "The save is accepted or is a no-op." },
              { action: "Reload the {{ENTITY}}.", expected: "Every value is unchanged." },
              { action: "Check any audit or history trail.", expected: "Either no entry, or an entry that honestly records no field changes." },
            ],
            expectedResult:
              "A no-op save neither corrupts data nor invents a change that did not happen.",
          },
          {
            key: "crud-update-concurrent",
            title: "Two users editing the same {{ENTITY}} do not silently overwrite each other",
            coverage: "negative",
            priority: "HIGH",
            type: "FUNCTIONAL",
            preconditions: "The same {{ENTITY}} open for editing in two sessions, A and B.",
            steps: [
              { action: "In session A, change one field and save.", expected: "The save succeeds." },
              { action: "In session B — whose form still holds the pre-A values — change a DIFFERENT field and save.", expected: "Either the save is refused as stale, or only B's field changes." },
              { action: "Reload the {{ENTITY}}.", expected: "A's change is still present. It has NOT been reverted by B's stale copy." },
            ],
            expectedResult:
              "A last-write-wins save of a whole stale form does not quietly undo another user's work.",
          },
          {
            key: "crud-update-after-delete",
            title: "Saving a form for {{ENTITY}} deleted meanwhile fails cleanly",
            coverage: "negative",
            priority: "MEDIUM",
            type: "FUNCTIONAL",
            preconditions: "One {{ENTITY}} record open for editing in one session.",
            steps: [
              { action: "In another session, delete that {{ENTITY}}.", expected: "It is deleted." },
              { action: "In the first session, save the still-open form.", expected: "A clear not-found or no-longer-exists message is shown." },
              { action: "Check the {{ENTITIES}} list.", expected: "The record was NOT resurrected by the save." },
            ],
            expectedResult:
              "An edit cannot recreate a deleted record, and the user is told why the save failed.",
          },
          {
            key: "crud-update-forbidden-fields",
            title: "Server-controlled fields cannot be changed through the edit request",
            coverage: "security",
            priority: "HIGH",
            type: "SECURITY",
            preconditions: "An existing {{ENTITY}} and access to devtools or an HTTP client.",
            steps: [
              { action: "Send an update request including the record id changed to another record's id.", expected: "The other record is not modified." },
              { action: "Send one including an owner, creator or tenant field pointing elsewhere.", expected: "It is ignored or refused." },
              { action: "Send one including a created-at or audit timestamp.", expected: "It is ignored." },
            ],
            expectedResult:
              "Only fields the user is meant to edit are writable, whatever the request body contains.",
          },
        ],
      },
      {
        key: "delete",
        name: "Delete {{ENTITY}}",
        description:
          "Removing a record: confirmation, what actually happens to it, and what happens to things pointing at it.",
        cases: [
          {
            key: "crud-delete-valid",
            title: "Delete {{ENTITY}} after confirming",
            coverage: "positive",
            priority: "HIGH",
            type: "FUNCTIONAL",
            preconditions: "An existing {{ENTITY}} and a user permitted to delete it.",
            steps: [
              { action: "Choose Delete on the {{ENTITY}}.", expected: "A confirmation step appears — deletion does not happen on the first click." },
              { action: "Confirm.", expected: "A success message is shown." },
              { action: "Open the {{ENTITIES}} list.", expected: "The record is gone." },
            ],
            expectedResult:
              "Deletion requires an explicit confirmation and then genuinely removes the record from view.",
          },
          {
            key: "crud-delete-cancel",
            title: "Cancelling the delete confirmation keeps the {{ENTITY}}",
            coverage: "negative",
            priority: "MEDIUM",
            type: "FUNCTIONAL",
            preconditions: "An existing {{ENTITY}}.",
            steps: [
              { action: "Choose Delete and then cancel the confirmation.", expected: "The dialog closes." },
              { action: "Open the {{ENTITIES}} list.", expected: "The record is still there, unchanged." },
            ],
            expectedResult:
              "Cancelling is a real cancel, not a delayed delete.",
          },
          {
            key: "crud-delete-twice",
            title: "Deleting an already-deleted {{ENTITY}} fails cleanly",
            coverage: "negative",
            priority: "MEDIUM",
            type: "FUNCTIONAL",
            preconditions: "One {{ENTITY}} record open in two sessions.",
            steps: [
              { action: "Delete the {{ENTITY}} in session A.", expected: "It is deleted." },
              { action: "Delete the same {{ENTITY}} from session B's stale view.", expected: "A clear not-found message is shown, not a server error." },
            ],
            expectedResult:
              "A repeated delete is idempotent from the user's point of view.",
          },
          {
            key: "crud-delete-references",
            title: "Deleting {{ENTITY}} that other records reference behaves as specified",
            coverage: "negative",
            priority: "HIGH",
            type: "FUNCTIONAL",
            preconditions:
              "One {{ENTITY}} record referenced by at least one other record, and a known intended behaviour (block, cascade, or detach).",
            steps: [
              { action: "Attempt to delete the referenced {{ENTITY}}.", expected: "The specified behaviour occurs — refused with an explanation, or accepted." },
              { action: "If accepted, open the referencing records.", expected: "They are in the specified state — removed if cascade, or with the reference cleared if detach." },
              { action: "Look for dangling references.", expected: "No record points at an id that no longer exists." },
            ],
            expectedResult:
              "Referential behaviour matches the specification and leaves no broken links either way.",
          },
          {
            key: "crud-delete-really-gone",
            title: "A deleted {{ENTITY}} is not still reachable by its direct URL or API",
            coverage: "security",
            priority: "HIGH",
            type: "SECURITY",
            preconditions: "The id of one {{ENTITY}} record that has just been deleted.",
            steps: [
              { action: "Open the deleted {{ENTITY}}'s detail URL directly.", expected: "A not-found state is shown; its data is not rendered." },
              { action: "Request the record through the API with that id.", expected: "A not-found response; the payload contains none of its fields." },
              { action: "Search and filter the list for its known values.", expected: "It does not appear." },
            ],
            expectedResult:
              "Deleted means unreachable, not merely hidden from the default list view — a soft delete must still deny access.",
          },
        ],
      },
      {
        key: "permissions",
        name: "Permissions & Access",
        description:
          "Who may do what. The suite most often skipped, and the one whose gaps get filed as security findings rather than bugs.",
        cases: [
          {
            key: "crud-perm-readonly-cannot-write",
            title: "A read-only user can view {{ENTITIES}} but cannot create, edit or delete",
            coverage: "permission",
            priority: "CRITICAL",
            type: "SECURITY",
            preconditions: "An account with read-only access to {{ENTITIES}}.",
            steps: [
              { action: "Open the {{ENTITIES}} list as that user.", expected: "Records are visible." },
              { action: "Look for create, edit and delete controls.", expected: "They are absent or disabled." },
              { action: "Send create, update and delete requests directly, bypassing the UI.", expected: "Each is refused with a permission error." },
            ],
            expectedResult:
              "Read-only is enforced by the server, not merely by hiding buttons.",
          },
          {
            key: "crud-perm-anonymous-denied",
            title: "A signed-out visitor cannot reach {{ENTITIES}} at all",
            coverage: "permission",
            priority: "CRITICAL",
            type: "SECURITY",
            preconditions: "No active session.",
            steps: [
              { action: "Open the {{ENTITIES}} list URL.", expected: "No record data is rendered; the user is sent to sign in." },
              { action: "Open a known {{ENTITY}} detail URL.", expected: "The same." },
              { action: "Send a create request with no credentials.", expected: "It is refused as unauthenticated." },
            ],
            expectedResult:
              "Nothing about {{ENTITIES}} is readable without a session.",
          },
          {
            key: "crud-perm-cross-tenant",
            title: "A user cannot reach another tenant's {{ENTITY}} by its id",
            coverage: "permission",
            priority: "CRITICAL",
            type: "SECURITY",
            preconditions:
              "Two accounts in separate tenants, organisations or workspaces, and the id of one {{ENTITY}} record belonging to the other one.",
            steps: [
              { action: "Signed in as the first user, open the other tenant's {{ENTITY}} detail URL.", expected: "A not-found or forbidden state is shown; none of its data is rendered." },
              { action: "Send an update request for that id.", expected: "It is refused and the record is unchanged." },
              { action: "Send a delete request for that id.", expected: "It is refused and the record still exists." },
            ],
            expectedResult:
              "Knowing an id grants nothing across a tenant boundary — the classic insecure-direct-object-reference case.",
          },
          {
            key: "crud-perm-ownership",
            title: "A user cannot edit another user's {{ENTITY}} within the same tenant",
            coverage: "permission",
            priority: "HIGH",
            type: "SECURITY",
            preconditions:
              "Ownership rules apply. Two users in the same tenant, and one {{ENTITY}} record owned by the second.",
            steps: [
              { action: "As the first user, open the {{ENTITY}}.", expected: "Whatever the rules specify — visible or not." },
              { action: "Attempt to edit it, via the UI and then directly.", expected: "It is refused if ownership is required to edit." },
              { action: "Reload the {{ENTITY}}.", expected: "It is unchanged." },
            ],
            expectedResult:
              "Ownership rules are enforced on the write path, not only reflected in the UI.",
          },
          {
            key: "crud-perm-revoked-mid-session",
            title: "Permission removed mid-session takes effect without waiting for sign-out",
            coverage: "permission",
            priority: "HIGH",
            type: "SECURITY",
            preconditions:
              "A signed-in user with edit permission, and an admin able to revoke it.",
            steps: [
              { action: "As the user, open one {{ENTITY}} record for editing but do not save.", expected: "The form is shown." },
              { action: "As the admin, revoke that user's edit permission.", expected: "The change is applied." },
              { action: "As the user, save the open form.", expected: "The save is refused." },
            ],
            expectedResult:
              "Permissions are evaluated when the action is performed, not cached from when the page was opened.",
          },
          {
            key: "crud-perm-elevated-role",
            title: "An administrator can act on {{ENTITIES}} they do not own",
            coverage: "positive",
            priority: "MEDIUM",
            type: "FUNCTIONAL",
            preconditions: "An admin account and one {{ENTITY}} record owned by someone else.",
            steps: [
              { action: "Signed in as the admin, open the {{ENTITY}}.", expected: "It is visible." },
              { action: "Edit a field and save.", expected: "The change is accepted." },
              { action: "Check any audit trail.", expected: "The change is attributed to the admin, not to the owner." },
            ],
            expectedResult:
              "Elevated access works and is recorded honestly — the permission model has an intended path through it, not only walls.",
          },
        ],
      },
    ],
  },
};
