import type { Lesson } from "../../types";

export const aiInQa: Lesson = {
  slug: "ai-in-qa",
  title: "AI in QA: what it does well, where it lies",
  summary:
    "Generating cases, reviewing requirements, and why a plausible test is dangerous.",
  minutes: 13,
  status: "published",
  body: `
## The property that should worry a tester

A language model produces text that **looks like** the text it learned from. That
is the whole trick, and it is genuinely useful. It is also exactly the property a
tester should be suspicious of, because the output of a bad answer and the output
of a good one look the same.

An obviously wrong test gets deleted in ten seconds. A **plausible** test — right
shape, sensible name, confident assertion, wrong expectation — gets reviewed,
approved, merged, and then defended for two years because "it's been passing".

That is the frame for everything below: not "is AI good or bad at testing" but
**"when this is wrong, how does it fail?"**

## The rule that ranks every use

> **Failing loudly is cheap. Passing wrongly is expensive.**

Sort any proposed AI use by which of those it produces when the model is wrong.
A generated locator that does not exist fails on the first run and costs you a
minute. A generated assertion that encodes the wrong rule goes green forever and
costs you the defect it was supposed to catch.

Everything in the first list below is cheap-when-wrong. Everything in the second
is expensive-when-wrong.

## Where it genuinely helps

**Expanding a first draft of coverage.** You have written six cases for a form.
Ask for boundary values, negative cases and the ones people skip at 4pm on a
Friday. Half will be irrelevant, and that is fine — you are the filter. Wrong
suggestions cost nothing because you simply do not take them.

**Hunting ambiguity in requirements.** The strongest use on this list, and the
most under-used. *"List every ambiguity, unstated assumption and missing error
case in this acceptance criterion."* This is a pure language task, which is what
the tool is actually for, and it produces questions rather than answers —
questions you take to the person who wrote the requirement. T2's test-planning
lesson said the best defect is found before the code is written; this is the
cheapest way to spend twenty minutes doing that.

**Test data.** Realistic names, addresses, unicode strings, absurd-but-legal
inputs, a list of email addresses that are valid and look invalid. Zero risk:
the data is *checked* by your test, not trusted by it.

**Explaining something unfamiliar.** A legacy function, a stack trace, a regex
somebody left behind. You verify the explanation against the code in front of
you, so a wrong answer is caught by the same act that uses it.

**Mechanical transformation.** Turning a table of cases into a fixture file,
scaffolding a page object from a DOM dump, renaming across a suite. Boring,
structural, and immediately visible when it goes wrong.

## Where it lies

**It invents assertions from names.** Shown \`applyDiscount()\`, it will
confidently assert 10%. Your specification says tiered by order value. The test
now either fails against correct code or — worse — passes against a bug, because
the implementation made the same guess.

**It invents APIs and locators.** \`page.waitForSelectorVisible()\` does not
exist; \`getByRole("button", { name: "Submit" })\` when the button says "Save"
does not match. These are the *cheap* lies: they fail immediately and loudly. The
expensive variant is a locator that matches **something else on the page**, which
is a test quietly checking the wrong element.

**It writes tests that restate the implementation.** Ask for tests "for this
function" and you often get the function's own logic mirrored back as
expectations — including its bugs. That test can never fail, which is the same as
not existing.

**Oracle collapse — the deep one.** T2's test-oracles lesson: an oracle has to
come from **outside** the implementation. A model that was shown the
implementation is not outside it. If the same tool writes the code and the test,
you have one opinion written twice, and a misunderstanding of the requirement
gets encoded on both sides where nothing can contradict it.

That is not an argument against using it for both. It is an argument for the
oracle staying human: **you supply what "correct" means, from the requirement,
before the test is written.**

## Reviewing generated tests

Five questions. A generated test that cannot answer them goes back:

1. **Does every assertion trace to a stated requirement**, or did the model infer
   it from a name?
2. **Does it test behaviour or restate implementation?**
3. **Would it fail if the defect were reintroduced?** This one is checkable —
   break the code on purpose and run it. If it stays green, it is decoration.
4. **Does it duplicate a case you already have?** Generated suites bloat fast,
   and a suite nobody can read is one nobody maintains.
5. **Is it deterministic?** Generated tests love \`sleep\`, hardcoded ids and
   today's date. Every habit T3 spent a track dismantling.

Question 3 is the highest-value one and almost nobody runs it. Mutating the code
to check that a test can fail is worth more than any amount of reading.

## Two boundaries that are not negotiable

**Confidentiality.** Unreleased specifications, customer data, credentials,
internal URLs and proprietary code are not yours to paste into a service the
organisation has not approved. Know where the prompt goes and what the provider
retains. "It was just a snippet" is how source code and PII leave a company.

**Accountability.** *"The AI wrote it"* is not a defence for a test that let a
defect through, any more than "the template did" would be. Whoever merges it
owns it.

## What appreciates, what depreciates

Be honest about which of your skills this changes.

**Depreciating:** writing the fortieth structurally similar case by hand,
boilerplate page objects, converting formats, first-draft prose.

**Appreciating:** deciding what is worth testing, knowing what "correct" means
and where that answer comes from, judging risk, recognising a plausible-looking
test that is wrong, and asking the question in the requirements review that saves
the sprint.

Every one of those is judgement, and it is what the previous four tracks have
been about. A tester whose value was typing is in trouble. A tester whose value
was **deciding** just got a faster typist.

## Where TestForge fits

TestForge's AI assist is deliberately shaped by the argument above. It is opt-in
per click and never automatic, it runs against your organisation's own key and
endpoint, and — the load-bearing part — **generated cases are inserted as
\`DRAFT\`**. A human promotes them. The tool's own design says the model produced
a suggestion, not a test case.

The measurable version, once you have run this for a while: tag AI-drafted cases,
then after a few months ask the only question that settles the argument —
**which cases have ever failed on a real defect?** Coverage counts prove nothing;
the pass-rate-theatre warning from T2's metrics lesson applies to generated
suites more than to any other kind.

**Next:** building a QA portfolio — publishing real work a hiring manager can
open and judge.
`,
  selfCheck: [
    {
      id: "q1",
      stem: "Why is a plausible-looking AI-generated test more dangerous than an obviously broken one?",
      choices: [
        {
          id: "a",
          text: "It takes longer to execute, slowing the suite down",
        },
        {
          id: "b",
          text: "It survives review and then passes forever, so the defect it was supposed to catch is never caught and nobody looks at the test again",
          correct: true,
        },
        {
          id: "c",
          text: "It is harder to convert into a page object later",
        },
        {
          id: "d",
          text: "It cannot be run in CI without modification",
        },
      ],
      explanation:
        "An obviously broken test is deleted in seconds — the cost is a minute. A test with the right shape, a sensible name and a confident but wrong assertion gets approved and merged, and from then on its green result is treated as evidence that the behaviour is correct. That is the ranking rule for every AI use in testing: failing loudly is cheap, passing wrongly is expensive. Execution time, structure and CI compatibility are all things you notice immediately, which is exactly why they are not the danger.",
    },
    {
      id: "q2",
      stem: "What is 'oracle collapse' when the same AI tool writes both the implementation and its tests?",
      choices: [
        {
          id: "a",
          text: "The test suite grows faster than the team can review it",
        },
        {
          id: "b",
          text: "The test's expected result comes from the same source as the code, so a misunderstanding of the requirement is encoded on both sides with nothing left to contradict it",
          correct: true,
        },
        {
          id: "c",
          text: "The model runs out of context and starts omitting assertions",
        },
        {
          id: "d",
          text: "The generated tests become non-deterministic and flaky",
        },
      ],
      explanation:
        "An oracle is the answer to 'what should this do', and T2's lesson on oracles insisted it has to come from outside the implementation — a requirement, a standard, a comparable system, a person. A model that was shown the implementation is not outside it, so the test agrees with the code by construction and can only confirm what the code already does. The fix is not to avoid the tool but to keep the oracle human: state what correct means, from the requirement, before the test is written. Suite bloat and flakiness are real generated-test problems, but they are visible ones; collapse is invisible and passes.",
    },
    {
      id: "q3",
      stem: "Which of these are low-risk uses of an LLM in testing, in the sense that a wrong answer is cheap?",
      multi: true,
      choices: [
        {
          id: "a",
          text: "Asking it to list ambiguities and unstated assumptions in an acceptance criterion",
          correct: true,
        },
        {
          id: "b",
          text: "Generating realistic and awkward test data — unicode names, valid-but-odd email addresses",
          correct: true,
        },
        {
          id: "c",
          text: "Asking for additional boundary and negative case ideas on top of a draft you wrote",
          correct: true,
        },
        {
          id: "d",
          text: "Letting it write the expected results for a pricing function from the function's name and signature",
        },
      ],
      explanation:
        "The first three fail cheaply because you remain the filter and nothing is trusted on the model's word: an irrelevant ambiguity is ignored, generated data is checked by your test rather than believed by it, and a bad case idea simply does not get written up. The fourth is the expensive failure mode — an assertion inferred from a name is a made-up oracle, and if the implementation guessed the same rule the test goes green on a defect. Expected results come from the requirement, and that is the part a human supplies before generation, not after.",
    },
  ],
};
