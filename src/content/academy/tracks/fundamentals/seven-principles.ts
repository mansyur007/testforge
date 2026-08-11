import type { Lesson } from "../../types";

export const sevenPrinciples: Lesson = {
  slug: "seven-principles",
  title: "The seven testing principles",
  summary:
    "Seven statements that sound like trivia until you need them to defend a decision in a release meeting.",
  minutes: 7,
  status: "published",
  body: `
These get taught as a list to memorise. They're more useful as **arguments you
will actually need**, so each one below comes with the situation where you'll
reach for it.

## 1. Testing shows the presence of defects, not their absence

You can prove a bug exists. You can never prove none remain. Passing tests
reduce the probability of failure; they don't establish correctness.

*You'll need it when:* someone says "QA signed off, so it's tested" after a
production incident. The honest formulation is "we executed X, found Y, and
these areas were not covered."

## 2. Exhaustive testing is impossible

One form with 10 fields of 10 possible values each is 10 billion combinations.
Add ordering and timing and it's worse. So you sample — and the whole craft is
sampling *well*, using risk and the design techniques in the next lessons.

*You'll need it when:* asked "did you test everything?" The answer is "no, and
here's what I prioritised and why."

## 3. Early testing saves time and money

A defect found in requirements costs a conversation. The same defect in
production costs a hotfix, a rollback, support load and trust. Reviewing a story
is testing.

*You'll need it when:* you're told testing starts after development finishes.

## 4. Defects cluster together

A small number of modules contain most of the defects — the checkout, the
permissions logic, that one legacy import. Bugs are not evenly distributed, so
neither should your effort be. Past defect data is your best predictor of where
the next one lives.

*You'll need it when:* deciding where to spend two days of regression.

## 5. Tests wear out (the pesticide paradox)

Run the same suite forever and it stops finding anything — it kills only the
bugs it was designed for. Suites need reviewing, extending, and periodically
replacing with new ideas; and some effort must always stay unscripted
(exploratory testing).

*You'll need it when:* "our regression suite is green every run" is offered as
evidence of quality. Green forever may mean the suite has stopped looking.

## 6. Testing is context dependent

You test a pacemaker differently from a marketing site. Same techniques, wildly
different depth, evidence and stopping point.

*You'll need it when:* someone imports a process from their last job wholesale.

## 7. Absence-of-errors is a fallacy

You can build software with almost no defects that nobody wants, or that doesn't
solve the user's problem. Fit for purpose beats defect count.

*You'll need it when:* the bug list is empty and the feature is still wrong.

## The two that get quoted at you most

Principles 1 and 2 are the ones that come up in interviews and, later, in
uncomfortable meetings. Learn to state them without sounding defensive:

> "We can't test every combination, so we tested by risk: payment failures and
> permission boundaries got the most time, browser matrix the least. Here's what
> that leaves uncovered."

That sentence is the whole job.

**Next:** the first design technique — equivalence partitioning, which is how
you turn "10 billion combinations" into "six tests".
`,
  selfCheck: [
    {
      id: "q1",
      stem: "Your regression suite has been green for six months. Which principle should make you uneasy?",
      choices: [
        { id: "a", text: "Testing shows the presence of defects" },
        { id: "b", text: "Tests wear out — the pesticide paradox", correct: true },
        { id: "c", text: "Testing is context dependent" },
        { id: "d", text: "Early testing saves time and money" },
      ],
      explanation:
        "A suite only catches the defects it was designed for. Perpetually green may mean the product is stable, or it may mean the suite stopped looking — which is why suites need reviewing and extending, and why some effort must stay unscripted.",
    },
    {
      id: "q2",
      stem: "You have limited regression time. Which principle tells you where to spend it?",
      choices: [
        { id: "a", text: "Defects cluster together", correct: true },
        { id: "b", text: "Exhaustive testing is impossible" },
        { id: "c", text: "Absence-of-errors is a fallacy" },
        { id: "d", text: "Testing is context dependent" },
      ],
      explanation:
        "Defects are not evenly distributed — a few modules hold most of them. Past defect data is the best available predictor of where the next one lives, so effort should follow the clusters rather than spread evenly.",
    },
    {
      id: "q3",
      stem: "The bug list is empty and the feature still isn't right for users. Which principle names this?",
      choices: [
        { id: "a", text: "Testing shows the presence of defects, not their absence" },
        { id: "b", text: "Early testing saves time and money" },
        { id: "c", text: "Absence-of-errors is a fallacy", correct: true },
        { id: "d", text: "Exhaustive testing is impossible" },
      ],
      explanation:
        "Software can be almost defect-free and still solve the wrong problem. Fitness for purpose beats defect count, which is why acceptance testing and requirement review exist alongside functional testing.",
    },
  ],
};
