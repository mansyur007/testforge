import type { Lesson } from "../../types";

export const firstPlaywrightTest: Lesson = {
  slug: "first-playwright-test",
  title: "Your first Playwright test",
  summary:
    "Install, record, run, and understand every line of what you just wrote.",
  minutes: 16,
  status: "published",
  sandbox: true,
  body: `
## Twenty minutes to a running suite

This lesson ends with a browser test that runs on your machine and a trace you
can step through frame by frame. Nothing here is throwaway — the same four
commands are what a real project uses on day 400.

Playwright is Microsoft's browser automation library: one API driving Chromium,
Firefox and WebKit, with the two features that matter most for a beginner built
in rather than bolted on — **auto-waiting** and **traces**. Between them they
remove the two things that make a first suite miserable: sleeps and blind
debugging.

## Install

In a repository — yours, or a fresh folder — run:

~~~bash
npm init playwright@latest
~~~

It asks four questions. Sensible answers for a first run: **TypeScript**, tests
in \`tests/\`, **yes** to the GitHub Actions workflow (the CI lesson will use it),
**yes** to downloading browsers. Playwright ships its own browser builds — that
is the ~300 MB — so everyone on the team and in CI runs the identical binary.
That alone kills a whole genre of "works on my machine".

What you get:

~~~
tests/example.spec.ts          a sample test
tests-examples/                a longer demo you can delete
playwright.config.ts           the one file worth reading today
.github/workflows/playwright.yml
~~~

## Run it

~~~bash
npx playwright test              # headless, all browsers, what CI runs
npx playwright test --ui         # the UI mode — use this while writing
npx playwright test --headed     # watch a real browser do it
npx playwright test tests/example.spec.ts:5    # one test, by line
~~~

**Live in \`--ui\` while you write.** It gives you a watch mode, a DOM snapshot at
every step, the locator picker, and the network log, all in one window. Headless
runs are for CI and for when you already trust the test.

## Record a first draft

~~~bash
npx playwright codegen https://example.com
~~~

Two windows open: a browser you click around in, and a panel writing the code
for your clicks. It is the fastest way to get moving, and it is genuinely good
at picking accessible locators.

**Treat what it produces as a first draft, never as the test.** Codegen records
the path you happened to take, in the order you happened to take it, with no
assertions worth the name and no idea which of those clicks was the point. A
recorded script is a transcript. A test is a transcript plus **a claim about
what should be true**, and only you know what that claim is.

The workflow that works: record to get the locators and the shape, then delete
half of it and write the assertions by hand.

## Every line of a real test

~~~ts
import { test, expect } from "@playwright/test";

test("a valid login lands on the dashboard", async ({ page }) => {
  await page.goto("/login");

  await page.getByLabel("Email").fill("ada@example.com");
  await page.getByLabel("Password").fill("correct-horse");
  await page.getByRole("button", { name: "Sign in" }).click();

  await expect(page).toHaveURL(/\\/dashboard/);
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
});
~~~

Line by line, because every one of them is a decision:

- **\`test("...", ...)\`** — the name is not decoration. It is what appears in the
  report, in CI, and (this track's capstone) in the JUnit XML TestForge matches
  against your cases. Write it as a sentence about behaviour: *"a valid login
  lands on the dashboard"*, not *"login test 2"*.
- **\`async ({ page })\`** — \`page\` is a **fixture**: Playwright creates a fresh
  browser context for this test and destroys it afterwards. New cookies, new
  storage, no leakage from the test before. That is why Playwright tests can run
  in parallel safely, and it is why you almost never write cleanup code for the
  browser.
- **\`await page.goto("/login")\`** — relative, because \`baseURL\` lives in the
  config. Hard-coding \`https://staging.example.com\` into 200 tests is how a suite
  becomes unable to run anywhere else.
- **\`getByLabel("Email")\`** — found the way a screen reader finds it, through the
  label. It survives a class rename, a styling rewrite, and a component swap. The
  next lesson is entirely about this choice.
- **\`.fill(...)\`** — one call that focuses, clears and types. \`.type()\` exists for
  when you need per-keystroke events; \`fill\` is the default.
- **\`getByRole("button", { name: "Sign in" })\`** — role plus accessible name.
  Matches \`<button>\`, \`<input type=submit>\` and \`<a role="button">\` alike, and it
  fails when the button stops being reachable as a button — which is a real bug
  worth failing on.
- **\`await expect(...)\`** — a **web-first assertion**. It retries until it passes
  or times out, which is what lets the test survive a dashboard that takes 800 ms
  to render without a single sleep.
- **\`await\` on everything.** Every one of these returns a Promise. A missing
  \`await\` is the classic first-week bug: the test passes instantly, having
  asserted nothing, and the error surfaces in some *other* test later.

## The config lines you will actually touch

~~~ts
export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: [["html"], ["junit", { outputFile: "results.xml" }]],
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "firefox", use: { ...devices["Desktop Firefox"] } },
  ],
});
~~~

- **\`baseURL\`** — set it now, use relative paths everywhere.
- **\`trace: "on-first-retry"\`** — the single most valuable line in the file. See
  below.
- **\`forbidOnly\`** — CI fails if someone commits \`test.only\`. Without it, one
  stray \`.only\` silently reduces your suite to a single passing test.
- **\`retries: 2\` on CI only** — a pragmatic default with a real hazard attached:
  retries hide flakiness rather than fix it. Keep them, and keep looking at which
  tests only pass on attempt two. The flaky-tests lesson is about exactly that.
- **\`reporter\`** — the \`junit\` entry is what the capstone uploads to TestForge.
  Add it now; it costs one line.
- **\`projects\`** — the browsers. Start with Chromium alone if runs feel slow,
  and add the others when the suite is worth the minutes.

## When it fails: the trace viewer

~~~bash
npx playwright show-report      # the HTML report
npx playwright show-trace trace.zip
~~~

A trace is a recording of the run: a filmstrip, the DOM at every step, the
network calls, the console, and the source line for each action. You can hover
any step and see the page exactly as it was — including the locator highlight
showing what Playwright *thought* it was clicking.

This changes how you debug. The question stops being "why did it fail on CI when
it passes here?" and becomes "here is the frame where the element was not there
yet." A tester who reads traces fixes automation bugs in minutes; one who adds
\`waitForTimeout\` until it goes green is writing tomorrow's flake.

## First-run problems, and what they mean

| Symptom | Cause |
|---|---|
| \`Timeout 30000ms exceeded waiting for locator\` | The element never matched. Open the trace and look at the frame — usually the wrong locator, sometimes a genuinely broken page |
| \`strict mode violation: resolved to 3 elements\` | Your locator is ambiguous. Not a bug to suppress — narrow it (next lesson) |
| \`net::ERR_CONNECTION_REFUSED\` | The app is not running. Use \`webServer\` in the config so \`npx playwright test\` starts it |
| Test passes suspiciously fast, asserts nothing | A missing \`await\` |
| Passes alone, fails in the suite | Shared state between tests — usually a fixed account or record both tests mutate |

## The exercise

Point a test at **your TestForge sandbox project**. Log in, land on the project,
and assert something true about it:

1. \`npm init playwright@latest\` in a new folder, and set \`baseURL\` to your
   TestForge host.
2. Write **one** test: sign in, navigate to your sandbox project, and assert the
   project name is visible as a heading.
3. Run it in \`--ui\`, then headless.
4. Break it deliberately — change the expected heading to something wrong — run
   it again and **read the trace**. Find the frame that shows what the page
   actually said.

That last step is the point of the exercise. The first passing test is a nice
feeling; being able to explain a red one is the skill.

Keep credentials out of the file — \`process.env.TF_EMAIL\` and a \`.env\` that is
in \`.gitignore\`. Committing a working login to a repository is the most common
mistake in a first automation project, and it is one an employer notices.

## Where TestForge fits

You now have a test producing a result on every run. That result is worth more
attached to the case it exercises than sitting in a terminal, which is what the
\`junit\` reporter line above is for: it writes \`results.xml\`, and the capstone
uploads it to \`/api/v1/junit\` so your sandbox project gains a run with a pass, a
duration and a history.

Name the test after the case now — \`"TC-SHOP-12 a valid login lands on the
dashboard"\`, where \`SHOP\` is your project's slug — and the matching is done for
you when you get there.

**Next:** the choice this lesson kept deferring — locators that survive a
refactor, and why the CSS chain your editor offers you breaks every sprint.
`,
  selfCheck: [
    {
      id: "q1",
      stem: "A newly recorded codegen script runs green every time. What is the most important thing to do to it before committing?",
      choices: [
        {
          id: "a",
          text: "Replace its locators with CSS selectors copied from devtools",
        },
        {
          id: "b",
          text: "Add assertions about what should be true — the recording only reproduces clicks",
          correct: true,
        },
        {
          id: "c",
          text: "Insert waits between the steps so it cannot outrun the page",
        },
        {
          id: "d",
          text: "Split it so each recorded click becomes its own test",
        },
      ],
      explanation:
        "A recording is a transcript of a path, and a test is a transcript plus a claim about what should be true — without assertions it can only fail when the browser cannot complete a step at all, so it passes happily against a dashboard rendering the wrong data. Codegen's locators are usually its best feature and are the last thing to downgrade to CSS. Waits are unnecessary because web-first assertions and actions already retry, and one click per test would discard the sequence that made the flow meaningful.",
    },
    {
      id: "q2",
      stem: "A test passes in about 200 ms, well before the page it targets could have loaded, and a later unrelated test starts failing intermittently. What is the likely cause?",
      choices: [
        {
          id: "a",
          text: "The browser cached the page from a previous run",
        },
        {
          id: "b",
          text: "Parallel workers are sharing one browser context",
        },
        {
          id: "c",
          text: "A missing await — the test finished before its actions ran, and the rejection surfaced elsewhere",
          correct: true,
        },
        {
          id: "d",
          text: "The assertion timeout is set too low in the config",
        },
      ],
      explanation:
        "Every Playwright action returns a Promise, so an un-awaited one lets the test function return immediately: it reports green having asserted nothing, and the work it started resolves — or rejects — after the test is over, which is why the error lands in whatever is running next. The suspiciously fast pass and the unrelated failure are the same bug seen twice. Contexts are not shared: each test gets its own, which is what makes parallelism safe. And a low timeout produces a failure, not a fast pass.",
    },
    {
      id: "q3",
      stem: "Which of these belong in playwright.config.ts rather than in individual test files?",
      multi: true,
      choices: [
        {
          id: "a",
          text: "The base URL the suite runs against",
          correct: true,
        },
        {
          id: "b",
          text: "Trace capture on retry",
          correct: true,
        },
        {
          id: "c",
          text: "The expected heading text on the dashboard",
        },
        {
          id: "d",
          text: "The set of browsers every test runs in",
          correct: true,
        },
      ],
      explanation:
        "The base URL, the trace policy and the browser projects are all environment concerns: they describe how and where the suite runs, so centralising them lets the same tests run locally, on staging and in CI without edits. The expected heading is the opposite kind of fact — it is the behaviour under test, specific to one test, and moving it into config would hide the assertion from the person reading the test. A useful split to keep in mind: config answers where and how, the test answers what should be true.",
    },
  ],
};
