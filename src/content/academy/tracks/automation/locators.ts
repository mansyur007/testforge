import type { Lesson } from "../../types";

export const locators: Lesson = {
  slug: "locators",
  title: "Locators that survive a refactor",
  summary:
    "Roles, labels and test ids — and why CSS chains break every sprint.",
  minutes: 14,
  status: "draft",
  body: `
## The thing that breaks your suite is not the application

Ask anyone maintaining a UI suite what actually goes red, and it is almost never
a real defect. It is 40 tests failing because a designer wrapped a section in one
more \`<div>\`.

That is a locator problem, and it is the single largest maintenance cost in
browser automation. Nothing else on this track will save you as much time as
getting this right in the first week.

## Why the selector devtools hands you is a trap

Right-click, Copy selector, and Chrome gives you something like:

~~~
#root > div:nth-child(2) > div.sc-bdVaJa.kGJgTf > form > div:nth-child(3) > button
~~~

Every single thing in that string is an implementation detail with no promise
attached to it. \`sc-bdVaJa\` is a generated class that changes when the
stylesheet is rebuilt. \`nth-child(3)\` breaks when someone adds a field above.
The nesting breaks on any layout change at all.

A locator is a **contract between your test and the application**, and the
question to ask of every one you write is: *what promise am I relying on, and
would the team consider breaking it a bug?* "The sign-in button is reachable and
labelled Sign in" is a promise a team will honour. "The button is the third child
of a div" is not a promise anyone made.

## The order to reach for

Playwright's built-in locators, best first:

~~~ts
page.getByRole("button", { name: "Sign in" });   // 1. role + accessible name
page.getByLabel("Email");                        // 2. form fields, via label
page.getByPlaceholder("Search cases");           // 3. when there is no label
page.getByText("No results found");              // 4. static content
page.getByTestId("case-row");                    // 5. explicit escape hatch
page.locator("css=.btn-primary");                // 6. last resort
~~~

**\`getByRole\` first, and not only because it is stable.** It finds the element
the way an assistive technology finds it, so a button that stops being reachable
by role has an accessibility defect — and your test fails on it. That is a
locator strategy that quietly buys you a second class of bug for free. It is also
why the manual track's accessibility lesson is upstream of this one: roles and
accessible names are the same concept there and here.

The common roles you will use: \`button\`, \`link\`, \`textbox\`, \`checkbox\`,
\`combobox\`, \`heading\`, \`dialog\`, \`row\`, \`cell\`, \`alert\`.

~~~ts
page.getByRole("heading", { name: "Dashboard", level: 1 });
page.getByRole("link", { name: "Create project" });
page.getByRole("textbox", { name: "Search" });
page.getByRole("row", { name: /TC-12/ });
~~~

Names match case-insensitively and by substring only when you ask —
\`{ name: "Save", exact: true }\` when "Save" and "Save and close" both exist on
the page.

## Test ids: the honest escape hatch

Some things have no accessible name worth using: a table row, a chart, a status
pill, a list item identified only by data. Reaching for a CSS chain there is the
wrong instinct; adding an explicit hook is the right one.

~~~tsx
<tr data-testid="case-row" data-case-id="TC-12">
~~~

~~~ts
page.getByTestId("case-row").filter({ hasText: "TC-12" });
~~~

A test id is a **deliberate, visible contract**: it exists only for testing, it
is in the source where a developer can see it, and deleting it is obviously a
breaking change. A class name promises nothing and a developer renaming it has no
way to know your suite depended on it.

Two rules that keep this from degrading:

- **Ask for them rather than working around their absence.** "Can we add
  \`data-testid\` to the row component?" is a two-line pull request and a normal
  thing for a tester to open.
- **Do not test-id everything.** A test id on a button that already has a perfect
  accessible name buys nothing and loses the accessibility check you were getting
  for free.

## Strictness is a feature, not an obstacle

~~~
Error: strict mode violation: getByRole('button') resolved to 3 elements
~~~

Playwright refuses to act when a locator is ambiguous. The instinct is to add
\`.first()\` and move on. Resist it: the error is telling you your locator does not
identify the thing you meant, and \`.first()\` freezes today's DOM order into the
test. When a fourth button is added at the top, you now click the wrong one and
the test still passes — which is worse than failing.

Narrow it properly instead:

~~~ts
// scope to the region
page.getByRole("dialog", { name: "Delete suite" })
    .getByRole("button", { name: "Delete" });

// filter by content
page.getByRole("row").filter({ hasText: "TC-12" })
    .getByRole("button", { name: "Run" });

// filter by a child element
page.getByRole("listitem").filter({ has: page.getByRole("img") });
~~~

\`.nth(2)\` and \`.first()\` are legitimate when position **is** the thing you are
testing — "the first row is the most recent run" — and a smell everywhere else.

## Locators are lazy, and that is what makes them work

~~~ts
const runButton = page.getByRole("button", { name: "Run" });
await page.getByRole("button", { name: "Refresh" }).click();
await runButton.click();     // re-finds the element, after the refresh
~~~

A locator is **a description of how to find something, not a reference to a found
thing**. Nothing is searched until you act or assert, and it is searched again on
every retry. This is why a Playwright test survives a React re-render that
replaces the DOM node, where an older tool holding an element handle would throw
a stale-element error.

Two consequences worth internalising: you can safely define locators at the top
of a test before the page even exists, and a locator stored in a page object
never goes stale.

## The table to keep

| Instead of | Write | Because |
|---|---|---|
| \`.locator("div.sc-bdVaJa > button")\` | \`getByRole("button", { name: "Save" })\` | Generated classes change on every rebuild |
| \`.locator("#submit-btn-2")\` | \`getByRole("button", { name: "Submit" })\` | Ids are often generated, and numbered ones are ordering in disguise |
| \`.locator("button").first()\` | \`getByRole("dialog").getByRole("button", { name: "Delete" })\` | \`.first()\` silently follows DOM order |
| \`.locator("//div[3]/span")\` | \`getByTestId("status-pill")\` | XPath by position is the most fragile form there is |
| \`getByText("Welcome back, Ada")\` | \`getByText("Welcome back")\` or a test id | Locators containing test data break when the data changes |

One extra: **do not put copy that marketing owns in a locator** unless the test
is about that copy. \`getByRole("button", { name: "Sign in" })\` is fine and
meaningful; matching a paragraph of landing-page prose is a test that fails on a
wording tweak and calls it a regression.

## Internationalisation, briefly

If the application ships in more than one language, an accessible-name locator is
language-bound. The standard answer is to pin the test run to one locale in the
config and write locators in it, and to reach for test ids on the few elements
whose text genuinely varies per run. Asserting *translated* text is a different
job — that is a content check, and it belongs with the translation files rather
than in the E2E suite.

## Where TestForge fits

When a locator breaks, the run history tells you which kind of break it was.
A case that has passed 60 times and fails on the build that renamed a stylesheet
is a locator failure; the fix is the locator, and the case is not a defect. A case
that flips between pass and fail on the *same* build is something else, and the
flaky-tests lesson deals with it.

Recording that distinction honestly — a locator fix as maintenance, not a bug
found — is what keeps your defect metrics meaning what they say. The metrics
lesson in the manual track made the same point from the other side.

**Next:** assertions and waiting — web-first assertions, auto-waiting, and why
\`sleep()\` is a bug rather than a workaround.
`,
  selfCheck: [
    {
      id: "q1",
      stem: "A test fails with \"strict mode violation: resolved to 3 elements\". A colleague fixes it by appending .first(). What is wrong with that fix?",
      choices: [
        {
          id: "a",
          text: "It is slower, because Playwright still has to find all three elements",
        },
        {
          id: "b",
          text: "It freezes today's DOM order into the test, so a new element added above makes it act on the wrong one — and still pass",
          correct: true,
        },
        {
          id: "c",
          text: "Strict mode is disabled for the rest of the file once .first() is used",
        },
        {
          id: "d",
          text: "Nothing — .first() is the intended way to resolve ambiguity",
        },
      ],
      explanation:
        "The violation is a diagnosis, not an obstacle: the locator does not identify the element you meant, and .first() answers it by committing to the order the DOM happens to have today. The dangerous part is that the resulting test stays green while acting on the wrong element, which is worse than a red one. Narrowing by region or content — scoping to the dialog, filtering the row by its text — fixes the description itself. Position-based selection is legitimate only when position is the thing under test, such as asserting the first row is the most recent run.",
    },
    {
      id: "q2",
      stem: "Why does getByRole(\"button\", { name: \"Sign in\" }) tend to catch a class of bug that a CSS selector never would?",
      choices: [
        {
          id: "a",
          text: "It waits longer before failing, so slow-rendering bugs surface",
        },
        {
          id: "b",
          text: "It queries the accessibility tree, so an element that stops being reachable as a labelled button fails the test",
          correct: true,
        },
        {
          id: "c",
          text: "It re-runs the whole test when the element is not found",
        },
        {
          id: "d",
          text: "It matches on the element's id, which developers change less often",
        },
      ],
      explanation:
        "Role locators resolve through the accessibility tree, which is the same surface a screen reader uses — so a div that lost its role, or a control whose label disappeared, breaks the locator and reports a genuine accessibility defect rather than a maintenance chore. That is the free second class of bug the strategy buys. The timeout is the same for any locator, no locator re-runs a test, and role locators do not look at ids at all.",
    },
    {
      id: "q3",
      stem: "Which of these locators are likely to need maintenance for reasons that are not defects?",
      multi: true,
      choices: [
        {
          id: "a",
          text: "page.locator(\"div.sc-bdVaJa > form > button\")",
          correct: true,
        },
        {
          id: "b",
          text: "page.getByText(\"Welcome back, Ada Lovelace\")",
          correct: true,
        },
        {
          id: "c",
          text: "page.getByTestId(\"case-row\").filter({ hasText: \"TC-12\" })",
        },
        {
          id: "d",
          text: "page.locator(\"//table/tr[3]/td[2]/span\")",
          correct: true,
        },
      ],
      explanation:
        "The CSS chain depends on a generated class and the exact nesting, both of which change on a rebuild or a layout tweak; the positional XPath is the same fragility in its sharpest form; and the greeting embeds test data, so it breaks the day the seeded account is renamed — none of those failures are defects. The test id with a content filter is the durable one: the hook exists only for testing and is visible to whoever might remove it, and the filter matches an identifier the row is genuinely about rather than its position.",
    },
  ],
};
