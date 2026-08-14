import type { Lesson } from "../../types";

export const testPlanning: Lesson = {
  slug: "test-planning",
  title: "Test planning that fits on one page",
  summary:
    "Scope, risks, environments, entry and exit criteria — without the 40-page template.",
  minutes: 14,
  status: "draft",
  sandbox: true,
  body: `
## The template is not the plan

Search "test plan template" and you will find a forty-page document with
sections for *Test Item Pass/Fail Criteria*, *Suspension Criteria*, and a
signature page. Somebody will tell you it is the IEEE 829 standard and that
professionals fill it in.

Here is what happens to that document: it is written once, before anything is
known, approved by people who skimmed it, and never opened again. By week two it
describes a project that no longer exists.

A test plan is not a document you produce. It is **a set of decisions you made,
written down where the team can see them and argue with them**. Decisions fit on
one page. Ceremony is what fills forty.

## The six questions a plan has to answer

If your page answers these, it is a plan. If it answers them in one line each,
it is a plan people will actually read.

| Question | Why it earns its line |
|---|---|
| What are we testing? | Names the feature and the change, so "done" has an edge |
| What are we **not** testing? | The most valuable line on the page — see below |
| What could go wrong, and how badly? | Risk is what decides where the hours go |
| Where do we test it? | Environment, data, accounts, feature flags |
| When do we start? | Entry criteria — what must be true before testing begins |
| When are we done? | Exit criteria — measurable, or it is a feeling |

Notice what is missing: a schedule with task-level estimates, an org chart, and
a glossary. If someone needs those, they can ask.

## Scope is what you leave out

Everyone writes the *in scope* list. It is easy and it feels productive.

The line that saves you is the other one. "**Not covered:** Safari on iOS 15 and
below, and the bulk-import path" is a sentence that does three jobs at once. It
tells the team what risk they are accepting. It gives them a chance to disagree
*now*, when disagreeing is cheap. And when a bug turns up in the bulk importer
three weeks later, the conversation is "we agreed to that" rather than "why
didn't QA catch this?".

You are not covering yourself by writing it. You are letting the team make an
informed decision instead of an accidental one.

> If you cannot name anything you are leaving out, you have not planned — you
> have promised. Everything cannot be tested, so a plan with no exclusions is
> just one you have not thought through yet.

## Entry and exit criteria that mean something

**Entry criteria** stop you from burning two days testing a build that was never
going to work. Keep them boring and checkable:

- the feature is deployed to the test environment and the smoke check passes
- acceptance criteria exist and have no open questions
- test data for the three account types is seeded

**Exit criteria** are where most plans go soft. "All tests pass" is not a
criterion — it is a wish, and it hands you no vocabulary for the meeting where
one test does not pass. Write criteria that survive contact with reality:

- every planned case for the checkout flow has been run
- no open defects at Critical or High severity
- two Mediums remain, both listed by ID, both accepted by the product owner
- the excluded areas from *Not covered* are still excluded

That last shape — **a named exception, accepted by a named person** — is the
difference between a QA who blocks releases and a QA who is trusted with them.

## A worked example

This is the whole plan for a checkout change on ShopMini, the shop that lives in
your Academy sandbox. It is short on purpose.

~~~
Feature: guest checkout (SM-214)
Change:   allow orders without an account; email required, no password

In scope:      guest order placement, email validation, order confirmation,
               the existing signed-in path (regression)
Not covered:   payment provider itself (sandbox mode only), iOS Safari < 15,
               bulk import, load/performance

Risks (impact x likelihood):
  H  guest order not linked to email -> customer cannot find the order
  H  signed-in checkout regressed by the shared component
  M  duplicate order on double-submit
  L  confirmation email wording

Environment:  staging, payment provider in sandbox mode
              accounts: guest, existing customer, admin

Entry:  deployed to staging, smoke passes, AC has no open questions
Exit:   all planned cases run; no open Critical/High; Mediums listed and
        accepted by the PO; excluded areas still excluded
~~~

Fifteen lines. A developer can read it in a minute and tell you that the shared
component risk is real, which is exactly the conversation you wanted.

## Keep it alive or throw it away

A plan written on day one and left untouched is worse than no plan, because it
looks authoritative while being wrong. When the risk list changes — and it will,
the first time you actually touch the feature — change the page and say so in
stand-up.

Two minutes of editing keeps the page honest. That is the entire maintenance
cost, and it is why the page is short.

## Where TestForge fits

A plan in TestForge is not a text file: it is a **Test Plan** object you attach
real cases to, so scope stops being prose and starts being a list you can count.
Exit criteria then read off the run — cases executed, defects open by severity —
instead of off somebody's memory.

That is the exercise below: you will write this plan against the ShopMini
sandbox, and link it to cases you have already written.

**Next:** ranking that risk list properly — impact, likelihood, and how to
defend what you chose not to test.
`,
  selfCheck: [
    {
      id: "q1",
      stem: 'A reviewer asks you to delete the "Not covered" section because "it makes us look like we are not testing properly". What is the strongest argument for keeping it?',
      choices: [
        {
          id: "a",
          text: "It protects QA from blame when a defect escapes",
        },
        {
          id: "b",
          text: "It turns an accidental risk into one the team accepted knowingly, while changing it is still cheap",
          correct: true,
        },
        {
          id: "c",
          text: "The IEEE 829 template requires a scope exclusions section",
        },
        {
          id: "d",
          text: "It shortens the plan by removing areas from the test suite",
        },
      ],
      explanation:
        "Exhaustive testing is impossible, so exclusions exist whether or not anyone writes them down — the only choice is whether the team knows. Naming them early gives people a chance to disagree while disagreeing costs nothing. Blame protection is a side effect, not the reason, and no template authority is needed to justify it.",
    },
    {
      id: "q2",
      stem: 'Which exit criterion is actually usable in the release meeting?',
      choices: [
        { id: "a", text: "All tests pass" },
        { id: "b", text: "The team is confident in the build" },
        {
          id: "c",
          text: "All planned cases run; no open Critical/High; SM-231 and SM-238 remain open at Medium, accepted by the product owner",
          correct: true,
        },
        { id: "d", text: "Test coverage is above 80%" },
      ],
      explanation:
        'A criterion has to stay useful on the day something fails, which is exactly when "all tests pass" and "the team is confident" run out of vocabulary. The usable version states what was run, what is open, and who accepted the exceptions by name and ID. Coverage measures what was executed, not whether the result was acceptable.',
    },
    {
      id: "q3",
      stem: "Which of these belong on a one-page plan?",
      multi: true,
      choices: [
        {
          id: "a",
          text: "The environment, test data and accounts the work needs",
          correct: true,
        },
        {
          id: "b",
          text: "A risk list ordered by impact and likelihood",
          correct: true,
        },
        {
          id: "c",
          text: "A task-level schedule estimating each test case in hours",
        },
        {
          id: "d",
          text: "Entry criteria that must hold before testing starts",
          correct: true,
        },
      ],
      explanation:
        "Environments, risks and entry criteria are all decisions that change where the hours go, so they earn their line. A per-case hourly schedule is precision the plan cannot support and nobody reads — estimation belongs to the sprint, and the plan only has to say when testing can start and when it is finished.",
    },
  ],
};
