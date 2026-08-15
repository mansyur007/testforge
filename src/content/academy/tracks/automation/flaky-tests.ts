import type { Lesson } from "../../types";

export const flakyTests: Lesson = {
  slug: "flaky-tests",
  title: "Flaky tests: diagnosis and quarantine",
  summary:
    "Finding the cause, and muting honestly instead of retrying forever.",
  minutes: 14,
  status: "published",
  body: `
## The most expensive test is the one nobody believes

A flaky test passes and fails against the same code. It is worse than a missing
test, and the reason is not the wasted reruns:

**A suite with flaky tests trains people to ignore red.** Once "just re-run it"
becomes the reflex, the next genuine regression gets re-run too, and shipped. The
cost is not the minutes — it is that your safety net stops being read as a
signal.

That is why this lesson is about diagnosis rather than suppression. Retries make
the symptom go away and leave the cost in place.

## Retries hide it; the data tells you where

Every lesson that recommended \`retries: 2\` also said it hides flakiness rather
than fixing it. Here is the payoff for keeping it anyway: Playwright reports a
test that failed then passed as **flaky**, distinct from passed and failed.

~~~
  38 passed
   2 flaky
   1 failed
~~~

That number is the work queue. **A run reported as "green with 2 flaky" is not a
green run**, and treating it as one is how a suite rots slowly enough that nobody
notices the year it happened.

If your runs land in TestForge, the same signal is in the case history and it is
better, because it persists: the same case, the same build, passing in one run
and failing in the next. One rerun is an anecdote; thirty runs is a rate.

## Rank by rate, not by annoyance

Fix the test that fails 40% of the time before the one that annoyed you this
morning. A quick way to get the number:

~~~bash
npx playwright test tests/checkout.spec.ts --repeat-each=20
~~~

Twenty runs of one file tells you far more than twenty guesses. Add
\`--workers=4\` to reproduce parallel-only failures, and \`--repeat-each\` plus
\`--headed\` when you suspect timing.

Two rates worth knowing separately: **how often it fails alone**, and **how often
it fails in a full suite run**. A test that is 100% reliable alone and 60% in the
suite has a shared-state problem, not a timing problem, and that single
comparison narrows the search more than any amount of reading the test.

## The five causes, in the order you should suspect them

**1. Timing — a wait that is not a wait.** \`waitForTimeout\`, or an assertion on
something that has not rendered. By far the most common.

~~~ts
await page.getByRole("button", { name: "Save" }).click();
await page.waitForTimeout(1000);
expect(await page.getByRole("row").count()).toBe(4);   // samples once

// →
await page.getByRole("button", { name: "Save" }).click();
await expect(page.getByRole("row")).toHaveCount(4);    // polls
~~~

**2. Shared state.** Passes alone, fails in the suite. The test-data lesson is
the whole fix: unique data per test, cleanup in a fixture, assertions scoped to
your own records.

**3. Order dependence.** Test B only passes if test A ran first. Prove it:

~~~bash
npx playwright test --workers=1 --grep "adds a case"
~~~

If a test passes in a full run and fails alone, it is not independent — it is
borrowing setup from a neighbour.

**4. Ambiguous or ordering-sensitive locators.** \`.first()\` on a list whose
order is not guaranteed acts on a different element depending on what the server
returned. The locators lesson called this out as worse than failing, because it
also *passes* wrongly.

**5. The application is genuinely flaky.** A race condition, a slow query near a
timeout, a double-submit. **This is a defect, and it is the outcome you should be
hoping for** — a real bug reproduced reliably enough to have been noticed.

Do not reach for cause 5 first, and do not refuse to reach it at all. Plenty of
"flaky test" tickets are production race conditions wearing a disguise.

## The trace is the fastest way in

The CI lesson already puts traces in your artifacts. For a flaky test, the trace
answers the one question that matters — *what did the page look like at the
moment it failed?*

- Element not there yet → timing (cause 1)
- Element there but showing another test's data → shared state (cause 2)
- Element there, correct, and the click landed elsewhere → a cookie banner or
  overlay intercepted it
- Network tab shows a 500 on one attempt and 200 on the next → cause 5, and you
  have just found a real defect

\`--trace on\` while reproducing locally gives you the same recording without
waiting for CI.

## Quarantine honestly

Sometimes you cannot fix it today. The choice is not "leave it red" or "delete
it" — both are dishonest in different directions.

~~~ts
test.fixme("TC-SHOP-42 checkout applies the discount", async ({ page }) => {
  // Flaky since 2026-08-10 — fails ~30% on CI, suspect a race in the
  // pricing call. Owner: @ade. Review by 2026-08-24. Ticket: QA-812.
});
~~~

Four things make it a quarantine rather than a burial:

- **An owner.** A name, not a team.
- **A date.** Something that expires gets looked at; something open-ended does
  not.
- **A ticket.** So it exists somewhere other than a code comment.
- **Visibility.** A count of quarantined tests, reported with the run. One is
  housekeeping; fifteen is a suite in trouble, and the number is the only thing
  that makes that obvious.

\`test.fixme\` over \`test.skip\` when the intent is "this is broken and should be
fixed", because the two read differently to whoever finds it next. Use
\`test.fail\` when a test *should* fail until a known defect is closed — it goes
red when the bug is fixed, which is a genuinely useful alarm.

**What is not quarantine:** deleting the test, commenting it out, wrapping it in
\`try/catch\`, or adding a third retry. Those remove the signal and the
accountability at the same time.

## Prevention, which is cheaper than all of this

Most of this lesson is the bill for decisions made earlier, and it is worth
naming which ones:

| Practice | Flakiness it prevents |
|---|---|
| Web-first assertions, never \`waitForTimeout\` | Cause 1, almost entirely |
| Unique data per test, cleanup in fixtures | Causes 2 and 3 |
| Role-based locators, no \`.first()\` on ambiguous lists | Cause 4 |
| \`fullyParallel: true\` from day one | Surfaces 2 and 3 while the suite is small |
| \`forbidOnly\` on CI | Not flakiness, but the same class of silent lie |

The fourth is the one people skip and regret. Running parallel from the start
makes independence violations fail *immediately*, while the suite is ten tests
and the fix is small. Turning parallelism on at 400 tests means finding every one
of them in the same week.

## What to tell people

Flakiness is a number, and reporting it as one changes the conversation:

> Suite: 312 tests. Pass rate 98.1% over the last 30 runs. Four tests account for
> 80% of the failures; two are quarantined with owners, two are being fixed this
> sprint. No quarantined test covers a release-blocking path.

That is T2's reporting lesson applied to your own suite — observation separated
from judgement, and a number with its conditions attached. "The tests are a bit
flaky" gets nothing scheduled. The paragraph above gets time allocated, because
it says what is broken, how much, and what happens next.

## Where TestForge fits

This lesson is the reason the capstone exists. A local suite tells you a test
failed today; accumulated run history tells you it has failed 11 times in 30 runs
and always on the same two cases — which is the difference between a hunch and a
work item.

It also lets you answer the question that decides how a red run gets handled:
**is this a regression or a maintenance event?** Forty cases red at once after a
login change is the suite; one case red on a build that touched its feature is a
defect. The locators lesson asked you to record that distinction honestly, and
this is where honest recording pays you back.

**Next:** the last lesson — designing a framework somebody else can take over
without asking you, which is what turns all of this into something a team owns
rather than something you maintain.
`,
  selfCheck: [
    {
      id: "q1",
      stem: "A test passes reliably when run alone but fails about 40% of the time in a full parallel suite run. Which cause should you suspect first?",
      choices: [
        {
          id: "a",
          text: "A timing problem — the assertion runs before the element renders",
        },
        {
          id: "b",
          text: "Shared state or order dependence — the test is not independent of its neighbours",
          correct: true,
        },
        {
          id: "c",
          text: "An application race condition that only appears under load",
        },
        {
          id: "d",
          text: "An ambiguous locator resolving to the wrong element",
        },
      ],
      explanation:
        "The alone-versus-suite comparison is the single most informative measurement here, and it points straight at independence: if the test is reliable in isolation, the thing that changed is the presence of other tests touching the same data. Timing problems and ambiguous locators generally fail at some rate in both modes, since neither depends on what else is running. A genuine application race is worth reaching eventually — plenty of flaky-test tickets are production defects in disguise — but it is the expensive hypothesis and the cheap one has not been ruled out yet. The fix is the test-data lesson's: unique data, cleanup in a fixture, assertions scoped to your own records.",
    },
    {
      id: "q2",
      stem: "What makes test.fixme with a comment a quarantine rather than a burial?",
      choices: [
        {
          id: "a",
          text: "fixme keeps the test running but ignores its result, so coverage is preserved",
        },
        {
          id: "b",
          text: "An owner, a review date, a ticket, and a visible count reported with the run",
          correct: true,
        },
        {
          id: "c",
          text: "Playwright automatically re-enables a fixme test after seven days",
        },
        {
          id: "d",
          text: "Nothing — any form of disabling a test is equivalent",
        },
      ],
      explanation:
        "The four things are what keep somebody accountable: a named owner rather than a team, a date so it expires instead of drifting, a ticket so it exists outside a code comment, and a count reported with the run so that one quarantined test reads as housekeeping while fifteen read as a suite in trouble. Without them, fixme is deletion with extra steps. The test does not run and nothing is re-enabled automatically — which is exactly why the expiry has to be social rather than technical. And the last option is the belief this lesson argues against: deleting, commenting out, or adding a third retry all remove the signal and the accountability together.",
    },
    {
      id: "q3",
      stem: "Which of these are sound responses to a flaky suite?",
      multi: true,
      choices: [
        {
          id: "a",
          text: "Rank tests by failure rate and fix the worst first, rather than whichever failed this morning",
          correct: true,
        },
        {
          id: "b",
          text: "Run with fullyParallel from day one, so independence violations surface while the suite is small",
          correct: true,
        },
        {
          id: "c",
          text: "Raise retries from 2 to 5 so the pipeline stops going red",
        },
        {
          id: "d",
          text: "Report pass rate over the last 30 runs with the quarantine list and its owners",
          correct: true,
        },
      ],
      explanation:
        "Ranking by rate puts effort where the failures actually are — the test that fails 40% of the time costs far more than the one that irritated you today. Turning on parallelism early is the cheapest prevention there is, because a shared-state violation found at ten tests is a small fix while the same violation found at 400 means a week of them. And reporting flakiness as a number with conditions attached is what gets it scheduled, which is T2's reporting lesson applied to your own suite. More retries is the move this lesson exists to argue against: it hides the symptom, keeps the cost, and trains the team to read red as noise — at which point the next real regression gets re-run and shipped.",
    },
  ],
};
