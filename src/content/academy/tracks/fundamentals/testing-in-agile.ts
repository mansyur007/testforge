import type { Lesson } from "../../types";

export const testingInAgile: Lesson = {
  slug: "testing-in-agile",
  title: "The tester in a sprint",
  summary:
    "What you do in each ceremony, how to write acceptance criteria that are testable, and how to avoid the mini-waterfall trap.",
  minutes: 11,
  status: "published",
  body: `
## The trap first

Most teams that say "we're Agile" run a **mini-waterfall**: developers build for
eight days, throw it over the wall on day nine, and QA has a day and a half to
test everything. Sprint after sprint, testing is the thing that gets squeezed,
and quality becomes a negotiation with the calendar.

The fix isn't heroics on day nine. It's being involved from day zero.

## Your job, ceremony by ceremony

**Backlog refinement** — the highest-leverage hour of your sprint. You read the
stories before anyone estimates them and ask the questions that turn assumptions
into decisions:

- What should happen when it fails? (network, payment, permission)
- What are the boundaries of that number?
- What happens to existing data — is there a migration?
- Who *can't* do this? Which roles are excluded?
- How will we know it worked in production?

Every one of these is cheaper here than anywhere later.

**Sprint planning** — make testing visible. Testing effort is part of the
estimate, not a tax paid afterwards. If a story can't be tested in the sprint,
that's a planning fact, not a QA problem.

**Daily stand-up** — what you're testing, what's blocking, what's at risk of not
being testable before the end.

**During the sprint** — test each story as it becomes ready, not all of them at
the end. Pair with the developer before they call it done; five minutes of
"what happens if I do this?" at their desk beats a defect report tomorrow.

**Sprint review / demo** — you often know the feature best. Demo the edge cases
too, not just the happy path.

**Retrospective** — bring evidence, not vibes: escaped defects, where the time
actually went, which stories arrived untestable.

## Testable acceptance criteria

The single most useful artifact you can influence. Given/When/Then works because
it forces concrete data:

> **Given** a cart containing 1 × SKU-1042 and stock of 0
> **When** the customer clicks Checkout
> **Then** the cart page shows "Kaos Polos is out of stock — remove it to
> continue" and no order is created

Compare with: *"Checkout should handle out-of-stock items properly."* The second
one cannot fail a test, which means it cannot pass one either.

Push for criteria that name **the data, the trigger, and the observable result**.
If you get that into refinement, half of your test design is already done — and
so is the developer's.

## Definition of Done

The team's shared bar for "finished". A DoD that includes testing looks like:

- Acceptance criteria covered by tests, and those tests pass
- No open critical or high defects on the story
- Regression around the touched area executed
- Automation added or explicitly deferred with a reason
- Docs/release notes updated

The value isn't the list; it's that "done" stops being an opinion.

## The agile testing quadrants, briefly

A map for "what kind of testing are we even talking about":

| | Business-facing | Technology-facing |
|---|---|---|
| **Support the team** | Q2: functional tests, story tests, examples | Q1: unit & component tests |
| **Critique the product** | Q3: exploratory, usability, UAT | Q4: performance, security, reliability |

Most teams do Q1 and Q2 and forget Q3 and Q4 until something burns. Knowing the
map is enough to ask the question in planning.

## Risk-based testing in one paragraph

You never have time for everything, so rank by **impact × likelihood**. Payment
and permissions are high impact; recently-changed, complex, or historically buggy
areas are high likelihood. Test the top-right corner deeply, sample the rest, and
**write down what you didn't cover**. That last part is what makes it a strategy
rather than an excuse — and it's the professional version of principle 2.

## Where this track ends

You now have the vocabulary and the four core design techniques, and you can
write cases and defect reports that hold up in review. That is genuinely the
bar for a junior QA role.

Next comes doing it under real conditions: planning, exploratory testing, APIs,
SQL, and reporting to people who don't read test cases — the
[Manual QA Professional](/academy/manual-pro) track. From there, automation.

## Check your understanding

- Name three questions you'd ask about a story in refinement.
- Rewrite "Login should be secure" as a testable acceptance criterion.
- Your sprint is a mini-waterfall. What is the first thing you'd change, and
  which ceremony does it happen in?
`,
  selfCheck: [
    {
      id: "q1",
      stem: "Your team builds for eight days and hands everything to QA on day nine. Where is the highest-leverage place to intervene?",
      choices: [
        { id: "a", text: "Sprint review — demo the edge cases" },
        { id: "b", text: "Backlog refinement — question the stories before they are estimated", correct: true },
        { id: "c", text: "Daily stand-up — report the blockage every morning" },
        { id: "d", text: "Retrospective — raise it after the sprint" },
      ],
      explanation:
        "The squeeze is set long before day nine, when stories are accepted and estimated without their testing cost or their unanswered questions. Refinement is where ambiguity is cheapest to remove and where testing effort becomes part of the estimate.",
    },
    {
      id: "q2",
      stem: "Which acceptance criterion can actually fail a test?",
      choices: [
        { id: "a", text: "Checkout should handle out-of-stock items properly" },
        { id: "b", text: "Given a cart with an out-of-stock item, when the customer clicks Checkout, then the cart shows \"out of stock\" and no order is created", correct: true },
        { id: "c", text: "The cart must be reliable under load" },
        { id: "d", text: "Out-of-stock handling should be user friendly" },
      ],
      explanation:
        "A criterion that names the data, the trigger and the observable result can be executed and can fail. \"Properly\", \"reliable\" and \"user friendly\" cannot fail a test, which means they cannot pass one either.",
    },
    {
      id: "q3",
      stem: "Which belong in a Definition of Done that includes testing?",
      multi: true,
      choices: [
        { id: "a", text: "Acceptance criteria covered by tests, and those tests pass", correct: true },
        { id: "b", text: "No open critical or high defects on the story", correct: true },
        { id: "c", text: "Regression executed around the area the change touched", correct: true },
        { id: "d", text: "Zero known defects anywhere in the product" },
      ],
      explanation:
        "A DoD has to be checkable per story: covered criteria, open-defect severity and regression around the change all are. \"Zero known defects anywhere\" is neither achievable nor about this story, so it turns the DoD into something teams route around.",
    },
  ],
};
