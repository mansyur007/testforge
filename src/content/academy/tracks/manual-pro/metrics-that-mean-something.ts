import type { Lesson } from "../../types";

export const metricsThatMeanSomething: Lesson = {
  slug: "metrics-that-mean-something",
  title: "Metrics that mean something",
  summary:
    "Pass-rate theatre, escape rate, and what to put on a dashboard.",
  minutes: 11,
  status: "published",
  sandbox: true,
  body: `
## The most reported number in testing is the least informative one

**Pass rate.** 847 of 862 passed — 98.3%, green, on the slide.

Here is what that number cannot tell you: whether the software is good. It
measures **the tests you happened to write**, so a suite that only walks the
happy path reports 98% on a product that falls over the moment anyone does
something unusual. Same number, opposite realities.

It is also gameable without touching the product, in three moves anyone can do by
Friday:

- **Add passing tests.** Thirty new checks on things that already work lifts the
  percentage and changes nothing.
- **Delete the flaky ones.** They were the tests touching the hardest code.
- **Split a failing test in two.** One failure becomes one failure and one pass.

Everybody involved knows this, which is why the number is reported and never
acted on. That is the definition of theatre: a ritual that produces a feeling of
control and no decisions.

> **Goodhart's law, which you will watch happen in person.** *When a measure
> becomes a target, it stops being a good measure.* Count bugs per tester and you
> get a flood of trivial bugs and an argument about every severity. Target code
> coverage and you get tests with no assertions. Target cases executed and the
> cases get smaller. The metric always improves. Nothing else does.

## Three questions a metric has to survive

Before a number goes anywhere near a dashboard:

1. **Whose question does it answer?** If you cannot name the person and the
   question, it is decoration.
2. **Can it be moved without doing the real work?** If yes, it will be —
   eventually, by someone under pressure, without meaning any harm.
3. **What decision changes when it moves?** *"If this doubles, we will ___."* No
   ending to that sentence means the number gets looked at and nothing follows.

Most of what appears on QA dashboards fails all three.

## The metrics worth having

Each of these starts from a question somebody actually asks:

| The question | The metric | Why it survives |
|---|---|---|
| Are we shipping defects to customers? | **Escape rate** — defects found in production ÷ all defects found for that release | The only one measured against reality rather than against your own suite |
| Are we finding them early enough? | **Where defects are found** — requirements, build, test, production | The cost of a defect rises with every stage it survives |
| Can I trust a red build? | **Flake rate** — tests that pass and fail on the same commit | Above a percent or two, people re-run instead of investigating, and the suite stops being an oracle |
| How fast do we know? | **Feedback time** — commit to test result | Drives more behaviour than any quality number on this list |
| Are we accumulating risk? | **Open vs closed per week**, and the **age** of the oldest open defect | Arrival against closure tells you the direction; a single count tells you nothing |
| Are the fixes real? | **Reopen rate** | Measures the fix *and* your verification |
| Did we cover the risk we named? | **High risks with executed tests ÷ high risks** | The risk register from the planning lesson, used as a denominator |
| Where should I look next? | **Defects per area** | Sends exploratory time where the defects already cluster |

**Escape rate is the one to fight for.** It is the only metric here that compares
your work against what customers actually met, it cannot be improved by writing
more tests, and improving it genuinely requires finding more real defects before
release. It is also *about the process, not the people* — an escape is a question
about how the team works, and the moment it becomes a stick, it becomes theatre
like everything else.

## The theatre list

Numbers that look like measurement and are not:

- **Number of test cases written.** An inventory, not an achievement. A suite of
  4,000 cases is usually worse than one of 400 — slower, more duplicated, less
  maintained. Reporting this as growth rewards exactly the wrong thing.
- **Percentage automated.** Automating the easy, stable, low-value tests moves it
  fastest.
- **Test cases executed this sprint.** Rewards small cases.
- **Bugs found per tester.** The most destructive metric in this field. It makes
  filing noise rational, makes reporting a defect an accusation, and quietly
  ends the relationship with developers that made you effective.

## Counting rules matter more than the metric

Every number here dies on its definition, so write the definitions down once:

- What counts as a **defect**? Is a rejected one still counted? A duplicate?
- What counts as **escaped**? Found by a customer, or found in production by
  anyone, including you?
- What is a **release** — a deploy, a tagged version, a sprint?
- When is a defect **closed** — fixed, verified, or shipped?

Then leave them alone. Any trend that crosses a silent definition change is
fiction, and the temptation to adjust the definition when the number looks bad is
the exact moment the whole thing stops being measurement.

Two more habits: **trends over snapshots** — one number is noise, six points is a
story — and **never a percentage without its denominator.** A team that finds
seven defects a sprint should not be reporting percentages at all; 2 of 7 and 3
of 7 are 29% and 43%, and the difference is one defect.

## The one-screen rule

A dashboard is not an archive. Five or six numbers, each with a target and a
direction, each annotated where something happened — a release, a team change, a
new environment — because a spike with no annotation gets explained by whoever
speaks first.

Then apply the sentence test to every tile: *"if this doubles, we will ___"*.
Delete whatever has no ending.

## Where TestForge fits

Your run history already holds most of this. Pass/fail per run over time is where
flake rate lives — the same case, the same build, two different results — and the
gap between a run starting and finishing is your feedback time.

For escape rate, tag defects found in production so they can be counted against a
release rather than eyeballed. For defect density, group by suite or area; the
suites that produce the most defects per case are where the next exploratory
session should go.

And resist putting the case count on the dashboard. It is the number that grows
by itself and means nothing, which makes it the most tempting one in the product.

That is the exercise below: build the one-screen view for your sandbox project.
Pick at most five numbers, write the question each one answers and the decision it
would drive, and be able to defend deleting everything else.

**Next:** turning all of this into the five sentences a stakeholder actually needs
— and what to say when somebody asks you whether it is ready to ship.
`,
  selfCheck: [
    {
      id: "q1",
      stem: "Your suite reports a 98.3% pass rate for the third release running, and management is satisfied. Why is that number weak evidence of quality?",
      choices: [
        {
          id: "a",
          text: "98.3% is too low — a release-ready suite should be at 100%",
        },
        {
          id: "b",
          text: "It measures the tests that were written, not the software, and it can be raised by adding easy tests or deleting flaky ones",
          correct: true,
        },
        {
          id: "c",
          text: "Pass rate is only meaningful for automated tests, not manual execution",
        },
        {
          id: "d",
          text: "It is a snapshot, so it needs to be reported as a trend instead",
        },
      ],
      explanation:
        "The denominator is your own suite, so the number describes the coverage you chose rather than the state of the product — a suite that only walks the happy path reports a high pass rate on fragile software. Worse, three moves that touch no product code all raise it: add passing tests, delete the flaky ones, split a failing test. Demanding 100% makes the incentive worse, not better, since the cheapest way there is to remove the tests that keep failing. It behaves identically for manual execution. And plotting a misleading number over time gives you a misleading trend, which is why the fix is a different metric, not a different chart.",
    },
    {
      id: "q2",
      stem: "Which metric is hardest to improve without genuinely improving how the team finds defects?",
      choices: [
        {
          id: "a",
          text: "Percentage of test cases automated",
        },
        {
          id: "b",
          text: "Escape rate — defects found in production as a share of all defects found for that release",
          correct: true,
        },
        {
          id: "c",
          text: "Number of test cases in the regression suite",
        },
        {
          id: "d",
          text: "Test cases executed per sprint",
        },
      ],
      explanation:
        "Escape rate is measured against what customers actually met, so its denominator is not under your control the way a suite is — you cannot improve it by writing more tests, only by finding real defects earlier. The other three move on effort alone: automating the easiest stable tests raises the automation percentage fastest, the suite count grows by writing anything at all, and executed-cases rewards making cases smaller. Worth pairing with the caution in the lesson, though: escape rate is a question about the process, and it stops being useful the moment it is pointed at a person.",
    },
    {
      id: "q3",
      stem: "You have one screen for a QA dashboard. Which of these earn a place on it?",
      multi: true,
      choices: [
        {
          id: "a",
          text: "Escape rate per release, with the counting rule for \"escaped\" written down",
          correct: true,
        },
        {
          id: "b",
          text: "Flake rate — tests that both passed and failed on the same commit",
          correct: true,
        },
        {
          id: "c",
          text: "Total test cases written, shown as growth over time",
        },
        {
          id: "d",
          text: "Median time from commit to test result",
          correct: true,
        },
      ],
      explanation:
        "Escape rate answers whether customers are meeting your defects, flake rate answers whether a red build can be trusted, and feedback time answers how fast anyone finds out — each one has a person who asks it and a decision that follows when it moves. Case count fails all three tests: it grows on its own, rewards duplication, and nothing changes when it doubles except the slide. The definition attached to escape rate is not a detail either — a metric whose counting rule can drift is a trend that can be produced on demand.",
    },
  ],
};
