import type { Lesson } from "../../types";

export const assertionsAndWaiting: Lesson = {
  slug: "assertions-and-waiting",
  title: "Assertions and waiting",
  summary:
    "Web-first assertions, auto-waiting, and why sleep() is a bug.",
  minutes: 13,
  status: "published",
  body: `
## A test that never fails is not a passing test

Two tests, same feature, both green:

~~~ts
// A
await page.getByRole("button", { name: "Create project" }).click();
await page.waitForTimeout(3000);

// B
await page.getByRole("button", { name: "Create project" }).click();
await expect(page.getByRole("heading", { name: "New project" })).toBeVisible();
~~~

Test A cannot fail. It clicks, waits three seconds, and reports success no matter
what the application did — including nothing. It is a test in the sense that it
runs, and in no other sense.

Everything in this lesson comes back to that: **an assertion is the only part of
a test that can find a bug**, and waiting is the mechanism that decides whether
your assertions get to run against the right moment.

## Auto-waiting is already doing most of it

The previous lesson said locators are lazy — nothing is searched until you act.
The half that matters here is what Playwright does before it acts. Every action
runs a set of **actionability checks** first and retries them until they pass or
the timeout expires:

| Action | Waits for the element to be |
|---|---|
| \`click()\` | attached, visible, stable (not animating), enabled, not covered by another element |
| \`fill()\` | attached, visible, enabled, editable |
| \`check()\` | the same as click, plus an actual checkbox or radio |
| \`selectOption()\` | attached, visible, enabled |
| \`hover()\` | attached, visible, stable, receiving events |

This is why a well-written Playwright test needs almost no explicit waiting. The
click on a button that appears half a second after the page loads just works —
not because of a lucky timing margin, but because the click is retried until the
button is there, visible, still, and clickable.

**"Not covered by another element" is the one that earns its keep.** A cookie
banner, a toast, or a modal backdrop over your button is the classic source of a
click that fires into nothing and a test that fails two steps later with a
confusing message. Playwright refuses to click through it and tells you what is
in the way.

## Web-first assertions retry too

\`expect()\` in Playwright is not the \`expect()\` from unit testing. Given a
locator, it **polls until the condition is true or the timeout expires**:

~~~ts
await expect(page.getByRole("alert")).toHaveText("Project created");
await expect(page.getByRole("row")).toHaveCount(4);
await expect(page.getByRole("button", { name: "Save" })).toBeEnabled();
await expect(page).toHaveURL(/\\/projects\\/[a-z0-9]+$/);
await expect(page.getByTestId("status-pill")).toHaveAttribute("data-state", "passed");
~~~

Contrast with the non-retrying form, which is where flakiness gets written:

~~~ts
// reads once, at whatever moment the line happens to run
expect(await page.getByRole("row").count()).toBe(4);
~~~

That version samples the page at one instant. If the fourth row arrives 50ms
later, it fails — locally never, on a loaded CI runner sometimes. **The rule:
pass the locator into \`expect\`, do not \`await\` the value out first.** Anywhere
you see \`expect(await …)\` in a UI test, you are looking at a race.

Two more that follow the same shape:

~~~ts
await expect(locator).toBeVisible();      // retries
expect(await locator.isVisible()).toBe(true);   // snapshot — race
~~~

\`isVisible()\` and friends are for branching on state you genuinely do not know
("is the banner there? if so dismiss it"), not for asserting.

## The assertions worth knowing

~~~ts
// presence and state
await expect(l).toBeVisible();
await expect(l).toBeHidden();
await expect(l).toBeEnabled();
await expect(l).toBeChecked();
await expect(l).toBeFocused();

// content
await expect(l).toHaveText("Exactly this");
await expect(l).toContainText("part of this");
await expect(l).toHaveValue("typed@example.com");
await expect(l).toHaveCount(3);

// attributes and classes
await expect(l).toHaveAttribute("aria-expanded", "true");
await expect(l).toHaveClass(/active/);

// page level
await expect(page).toHaveTitle(/TestForge/);
await expect(page).toHaveURL("/projects");
~~~

\`toHaveText\` on a locator matching several elements compares against **the whole
list**, which is the neat way to assert an order:

~~~ts
await expect(page.getByRole("row")).toHaveText([/TC-10/, /TC-11/, /TC-12/]);
~~~

And \`.not\` inverts any of them — \`await expect(l).not.toBeVisible()\` — with the
retry behaviour you would want: it waits for the thing to *go away*, rather than
asserting that it is absent at one instant.

## Why sleep() is a bug and not a workaround

\`waitForTimeout()\` is wrong in both directions at once, which is what makes it so
durable a mistake:

- **Too short on a bad day.** CI is slower than your laptop under load. The
  three seconds that worked all week fail on the morning everyone pushes.
- **Too long on every good day.** Thirty sleeps of three seconds is ninety
  seconds added to every run, forever, for nothing.

The fix is never a bigger number. It is to say **what you are waiting for**:

| Instead of | Write |
|---|---|
| \`waitForTimeout(2000)\` after a click | \`await expect(page.getByRole("alert")).toBeVisible()\` |
| \`waitForTimeout(1000)\` for a list to load | \`await expect(page.getByRole("row")).toHaveCount(4)\` |
| \`waitForTimeout(500)\` for a spinner | \`await expect(page.getByTestId("spinner")).toBeHidden()\` |
| \`waitForTimeout(3000)\` for a save | \`await page.waitForResponse(r => r.url().includes("/api/cases") && r.ok())\` |

Playwright's own documentation says \`waitForTimeout\` should never be used in
production tests, and the API is there for debugging. Treat a \`waitForTimeout\` in
a pull request the way you would treat a commented-out assertion.

**The one honest exception is a fixed, externally-imposed delay** — a debounce
you cannot observe, a third-party widget with no signal at all. Even then, write
the reason on the line, because the next person will otherwise assume it is
cargo cult and either delete it or copy it.

## Waiting for things that are not elements

~~~ts
// a network response
const created = page.waitForResponse(r => r.url().endsWith("/api/cases") && r.status() === 201);
await page.getByRole("button", { name: "Save" }).click();
await created;

// navigation triggered by an action
await page.getByRole("link", { name: "Projects" }).click();
await expect(page).toHaveURL(/\\/projects/);

// a condition in the page
await page.waitForFunction(() => document.querySelectorAll("[data-row]").length > 0);
~~~

Note the shape of the first one: **start waiting before the action, await after**.
Registering the wait after the click is a race — the response may already have
arrived.

Most of the time you do not need any of these. Prefer asserting the *user-visible
consequence*: if the save worked, something on screen says so, and that is both a
better wait and a better assertion. Reach for \`waitForResponse\` when the
consequence genuinely is invisible — a background analytics call, a fire-and-forget
write — or when you need the response body.

\`networkidle\` deserves a specific warning: it waits for network silence, which an
application with polling or a live connection never reaches, and which says
nothing about whether the thing you care about rendered. It is discouraged for
exactly that reason.

## Timeouts, and where to set them

~~~ts
// playwright.config.ts
export default defineConfig({
  timeout: 30_000,                    // per test
  expect: { timeout: 5_000 },         // per web-first assertion
  use: { actionTimeout: 10_000 },     // per action
});
~~~

Override per assertion when one thing is genuinely slow, rather than raising the
global number:

~~~ts
await expect(page.getByText("Import complete")).toBeVisible({ timeout: 60_000 });
~~~

**Raising the global timeout to fix a failing test is almost always the wrong
move.** It converts a fast red into a slow red, and on the day the test is
actually broken you wait a minute to find out. A local override next to a slow
import is a documented fact about the application; a global 120-second timeout is
a note saying "we stopped understanding this suite".

## Soft assertions, sparingly

~~~ts
await expect.soft(page.getByTestId("total")).toHaveText("4 cases");
await expect.soft(page.getByTestId("passed")).toHaveText("3 passed");
await expect(page.getByRole("heading", { name: "Run summary" })).toBeVisible();
~~~

A soft assertion records the failure and lets the test continue, so one run tells
you all three numbers are wrong rather than only the first. Useful when checking
several independent facts about the same screen. Not useful as a general habit:
a hard failure early stops the test from producing a cascade of misleading
follow-on errors, and that is usually what you want.

## Assert the thing the user gets

The most common weak assertion is not a race — it is asserting the wrong thing.
After clicking Save, checking that the button is still visible proves nothing.
Checking that the row now appears in the table, or that the confirmation names
the record, proves the feature worked.

The manual track's lesson on test oracles is the same idea in the other medium:
you need to be able to say *how you would know it worked*, before you write the
line. If you cannot finish that sentence, the assertion you are about to write is
decoration.

## Where TestForge fits

A test with a real assertion produces a result you can trust; a test padded with
sleeps produces a green history that means nothing, and the day it finally goes
red nobody believes it. When your runs land in TestForge, the case history is
only as honest as its assertions were.

There is a measurable version of this too. Sleep-driven suites show up as runs
whose *duration* grows steadily while the case count barely moves — the metrics
lesson in the manual track called that kind of number worth watching. Ninety
seconds of \`waitForTimeout\` per run, forty runs a day, is an hour of CI a day
buying nothing.

**Next:** page objects — the structure that stops fifty tests repeating the same
six lines, and the point at which that structure becomes a second application to
maintain.
`,
  selfCheck: [
    {
      id: "q1",
      stem: "Which of these lines is a race waiting to happen on a loaded CI runner?",
      choices: [
        {
          id: "a",
          text: "await expect(page.getByRole(\"row\")).toHaveCount(4)",
        },
        {
          id: "b",
          text: "expect(await page.getByRole(\"row\").count()).toBe(4)",
          correct: true,
        },
        {
          id: "c",
          text: "await expect(page.getByRole(\"alert\")).toHaveText(\"Saved\")",
        },
        {
          id: "d",
          text: "await expect(page).toHaveURL(/\\/projects/)",
        },
      ],
      explanation:
        "The second line awaits the value out of the locator first, so expect receives a plain number and compares it once, at whatever instant that line happened to run. If the fourth row arrives 50ms later the test fails — never on your laptop, sometimes on CI, which is the worst failure profile there is. The other three pass the locator into expect, which makes them web-first assertions: they poll until the condition holds or the timeout expires. The rule generalises — anywhere you see expect(await …) in a UI test, you are looking at a snapshot where you wanted a retry.",
    },
    {
      id: "q2",
      stem: "A colleague fixes a test that fails intermittently on CI by changing waitForTimeout(2000) to waitForTimeout(5000). Why is this the wrong fix even though the test now passes?",
      choices: [
        {
          id: "a",
          text: "Playwright ignores timeouts longer than 3 seconds",
        },
        {
          id: "b",
          text: "It is still a fixed guess — too short on a slower day and wasted time on every fast one — while an assertion on the actual consequence is both correct and faster",
          correct: true,
        },
        {
          id: "c",
          text: "waitForTimeout only works in headed mode, so CI ignores it entirely",
        },
        {
          id: "d",
          text: "The test will now be reported as skipped rather than passed",
        },
      ],
      explanation:
        "A sleep is wrong in both directions at once, which is what makes it such a durable mistake: no fixed number is large enough for the worst CI day, and every number is wasted on the ordinary ones — thirty three-second sleeps is ninety seconds added to every run forever. Raising it buys a few weeks before the same intermittent failure returns, with the suite now slower. Naming what you are waiting for fixes both halves: expect(alert).toBeVisible() returns as soon as the alert is there and fails properly when it never arrives. The one honest exception is a delay you genuinely cannot observe, and it deserves a comment saying so.",
    },
    {
      id: "q3",
      stem: "Which statements about Playwright's auto-waiting are true?",
      multi: true,
      choices: [
        {
          id: "a",
          text: "click() retries actionability checks — visible, stable, enabled, not covered — until they pass or the timeout expires",
          correct: true,
        },
        {
          id: "b",
          text: "Auto-waiting removes the need to assert anything, since the action would have failed if the page were wrong",
        },
        {
          id: "c",
          text: "expect(locator).toBeVisible() polls, so it waits for a slow element rather than failing on the first check",
          correct: true,
        },
        {
          id: "d",
          text: "waitForLoadState(\"networkidle\") is the reliable way to know a page is ready",
        },
      ],
      explanation:
        "Actions retry their actionability checks, and web-first assertions poll — together those two cover almost all the waiting a UI test needs, which is why a well-written Playwright test contains no explicit waits. But auto-waiting only gets you to the right moment; it makes no claim about whether the application did the right thing, so it is no substitute for an assertion — a test that clicks and asserts nothing cannot fail. And networkidle is discouraged: an app with polling or a live connection never reaches network silence, and silence would not tell you the element you care about rendered anyway.",
    },
  ],
};
