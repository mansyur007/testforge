import type { Lesson } from "../../types";

export const whatToAutomate: Lesson = {
  slug: "what-to-automate",
  title: "What is worth automating",
  summary:
    "The pyramid, its critics, and the maintenance cost nobody budgets for.",
  minutes: 12,
  status: "published",
  body: `
## "Automate everything" is a plan to maintain two products

Every automated test is code. It has to be written, reviewed, run, debugged when
it breaks, and updated every time the thing it tests changes. A test suite is a
**second application** — one with no users, no revenue, and the same maintenance
bill as the first.

That is the cost nobody puts in the estimate, and it is why the interesting
question is not *"can this be automated?"* — almost anything can — but **"will
this test pay for itself?"**

## The payback sum

Not a formula to compute; a set of terms to have in your head.

**What it costs:** writing it, plus maintenance every time the feature changes,
plus run time on every run, plus the triage time for every failure — *including
the false ones*.

**What it returns:** the number of times it runs, times the cost of the bug it
would catch, times the chance it actually catches something.

A login check on a stable page that runs on every pull request — 300 times a
year, guarding the path every customer walks — pays for itself in a month. The
same effort spent on a screen that is being redesigned every sprint never
returns anything: you will rewrite it four times and it will find nothing,
because the feature is being actively looked at by humans anyway.

Three questions get you most of the way:

1. **Will it run often?** Value is per-run. A test that runs twice is a script.
2. **Will it break for the right reasons?** A test that goes red on a CSS change
   is a maintenance contract, not a safety net.
3. **Will anyone act when it goes red?** A test nobody investigates is a cost
   with a green tick on it.

## The pyramid, and its critics

The classic shape: many fast unit tests at the bottom, fewer integration tests
above, a thin layer of end-to-end tests at the top.

The reasoning is sound and it is not really about counts:

- **Speed.** Unit tests run in milliseconds, E2E in seconds or minutes, and a
  suite people wait for is a suite people stop running.
- **Locality.** A failing unit test names the function. A failing E2E test says
  "checkout is broken" and hands you an afternoon.
- **Determinism.** Every layer you add — network, browser, database, third-party
  service — is another source of failures that are not defects.

The critics are worth taking seriously rather than dismissing:

- **The layers are not well defined.** Ask three teams what a "unit" is and you
  get three answers, so arguing about the ratio is often arguing about
  vocabulary.
- **The testing trophy** (front-end): most bugs live in the wiring between
  components, so integration deserves the widest band, and unit tests bound to
  implementation details are a liability — they fail on refactors that broke
  nothing.
- **The honeycomb** (services): for a system that is mostly network calls,
  integration is the honest middle and the pyramid's bottom band is thin by
  nature.

What survives all three arguments is one principle, and it is the one to
remember: **push every test as low as it can go while still telling you
something true about what the user gets.** The shape that produces follows your
architecture; it is a consequence, not a target.

The one thing everybody agrees on is the failure mode — the **ice cream cone**,
where nearly everything is tested through the UI. Slow, flaky, expensive, and it
still misses the logic underneath.

## What to automate, concretely

| Good candidates | Poor candidates |
|---|---|
| Regression checks on stable, high-value paths — login, checkout, permissions | Screens still being designed |
| The same check across many inputs — 20 tax rules, 3 countries | One-off reproductions of an exploratory finding |
| The smoke suite that runs on every deploy | "Does this look appealing?" and everything else needing judgement |
| API and contract checks below the UI | Flows that change shape every sprint |
| Anything you would otherwise run more than about five times | Anything whose expected result nobody can state precisely |

One entry deserves promoting out of that table: **automating your test data.** A
script that creates the account with three past orders and an expired discount
code, in two seconds instead of twenty minutes of clicking, is often the highest
return available to a mostly-manual team — and it is a much easier first
automation project than a UI suite.

## Automating at the wrong layer is the common mistake

The shape of it, which you will meet in a real repository:

~~~
12 UI tests for password validation
  - too short          -> browser, form fill, wait, assert
  - no digit           -> browser, form fill, wait, assert
  - no uppercase       -> browser, form fill, wait, assert
  ...
4 minutes of runtime, 12 things to update when the form's markup changes
~~~

All twelve are testing one function that decides whether a string is an
acceptable password. The version that costs a tenth as much and finds strictly
more:

~~~
1 UI test    -> an invalid password shows its error, inline, on the form
N unit tests -> every rule, every boundary, in milliseconds
~~~

Same coverage of the rules, one browser test instead of twelve, and the failure
now names the rule that broke rather than the page it broke on. That single move
— *"can this live lower down?"* — is the biggest speed-up available to most
suites.

## The maintenance cost nobody budgets

- **Writing it is roughly a third of the lifetime cost.** The rest is
  maintenance, triage and the reruns.
- **Flakiness compounds.** Every false failure costs someone twenty minutes and
  a little bit of trust, and once a suite goes past a percent or two of flaky
  results, people stop believing red at all — at which point you are paying for
  a suite that no longer functions as an oracle. That is the metrics lesson's
  flake rate, and it is the reason it belongs on a dashboard.
- **Slow suites get run less**, and a suite that runs less finds things later,
  which is the entire value proposition running backwards.
- **Tests get retired.** A check that has not failed in a year on a feature
  nobody has touched is a candidate for deletion, and deleting it is a normal,
  professional act rather than an admission of waste.

Budget the maintenance out loud when the work is planned. Automation is never
"free after the sprint that wrote it", and pretending otherwise is how a team
ends up with 4,000 tests, twelve of which anybody trusts.

## What automation is not

It is not a replacement for testing, and being precise about this protects both
your job and your team's quality.

An automated test **re-runs a check somebody already thought of**. It asks no
questions, notices nothing it was not told to look at, and has never in its life
found a bug class nobody anticipated. Everything in the manual track — risk,
exploration, oracles, the questions you ask in refinement — is upstream of it and
stays human.

What automation actually buys is **your attention**: it takes the repetitive
confirmation off your desk so you can spend the week on the work that only a
person can do. That is the honest pitch, and it is a better one than the pitch it
is usually given.

## Where TestForge fits

Record the decision, not just the outcome. A case tagged \`automate\`,
\`manual\` or \`retire\` — with a one-line reason — turns "we don't have coverage
there" into "we chose not to, for this reason", which is the same move the risk
lesson made for features.

Then let the run history tell you when a decision has expired: cases that have
passed every time for a year are retirement candidates, and cases that pass and
fail on the same build are flake to fix or quarantine honestly. Both of those are
maintenance you can only do if somebody is looking.

**Next:** the programming foundations to write them — variables, functions,
async, and the far more useful skill of reading somebody else's code.
`,
  selfCheck: [
    {
      id: "q1",
      stem: "A repository has twelve UI tests, one per password validation rule, taking four minutes to run. What is the best change?",
      choices: [
        {
          id: "a",
          text: "Run them in parallel so the wall-clock time drops",
        },
        {
          id: "b",
          text: "Keep one UI test that an invalid password shows its error, and move every rule down to unit tests",
          correct: true,
        },
        {
          id: "c",
          text: "Merge them into a single UI test that tries all twelve passwords in sequence",
        },
        {
          id: "d",
          text: "Delete them — validation rules are the developer's responsibility",
        },
      ],
      explanation:
        "All twelve exercise one function through the slowest, most fragile path available, so the fix is to push them down: the rules get tested in milliseconds and the browser test only proves the rule is wired to the form. Parallelism buys wall-clock time while keeping twelve things to update when the markup changes. Merging them into one test keeps the same cost and makes the failure message worse — you now know something about passwords is broken, not which rule. And deleting outright loses the wiring check, which is the one thing a unit test cannot give you.",
    },
    {
      id: "q2",
      stem: "Which property does most to decide whether automating a given check pays off?",
      choices: [
        {
          id: "a",
          text: "How difficult the check is to perform by hand",
        },
        {
          id: "b",
          text: "How often it will run, against how often it will need rewriting",
          correct: true,
        },
        {
          id: "c",
          text: "Whether the tooling can drive that part of the application",
        },
        {
          id: "d",
          text: "How long the automated version takes to write",
        },
      ],
      explanation:
        "The return is per-run and the cost is mostly maintenance, so the ratio between the two is what decides it: 300 runs a year on a stable path pays, while the same test on a screen redesigned every sprint is rewritten four times and returns nothing. Manual difficulty is a reason to want the automation, not evidence it will pay. Feasibility answers a different question — almost everything can be automated, which is why \"can we\" stopped being the useful question. And writing time is roughly a third of the lifetime cost, so optimising for it is optimising the smaller number.",
    },
    {
      id: "q3",
      stem: "Which of these are poor candidates for automation?",
      multi: true,
      choices: [
        {
          id: "a",
          text: "A checkout screen whose layout and flow are being redesigned every sprint",
          correct: true,
        },
        {
          id: "b",
          text: "\"Does the new dashboard feel clear and appealing to a first-time user?\"",
          correct: true,
        },
        {
          id: "c",
          text: "The login and checkout smoke check that runs on every deploy",
        },
        {
          id: "d",
          text: "A one-off reproduction of something found in yesterday's exploratory session",
          correct: true,
        },
      ],
      explanation:
        "A feature in active redesign guarantees rewrites and is already being looked at by people; a question about how something feels has no expected result to assert; and a one-off reproduction runs once, which is a script rather than a test. The smoke check is the opposite case and the clearest thing on the list to automate — stable, high value, and it runs on every deploy, so the per-run return accumulates. Worth noting about the one-off: if the same reproduction turns out to be a regression risk you will want checked every release, it graduates into a good candidate, which is the difference between running once and running often.",
    },
  ],
};
