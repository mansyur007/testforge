import type { Lesson } from "../../types";

export const riskBasedTesting: Lesson = {
  slug: "risk-based-testing",
  title: "Risk-based testing",
  summary:
    "Impact × likelihood, and how to defend what you chose not to test.",
  minutes: 12,
  status: "published",
  body: `
## You are always prioritising — the only question is whether you know it

Exhaustive testing is impossible. That is principle two, and everybody nods at
it. Then they open the test suite and run it top to bottom, which is
prioritisation by **alphabetical order of whoever wrote the cases first**.

Risk-based testing is not a ceremony you add on top of testing. It is the
admission that you were ranking all along, plus a rule for ranking on purpose.

The rule is one line:

> **Risk = impact × likelihood.** Spend your hours where the product of those
> two is highest, and be able to say why.

## Impact and likelihood are different questions, asked of different people

The most common mistake is collapsing them into a single feeling called
"important". They are separate, and you usually get them from separate people.

| | Question | Who actually knows |
|---|---|---|
| **Impact** | If this breaks in production, what does it cost? | Product owner, support, sometimes finance |
| **Likelihood** | How likely is this to be broken right now? | Developers, and you |

Impact is a business fact. A payment that silently takes money and produces no
order is catastrophic regardless of how well it is coded. You do not get to
lower it because the code looks tidy.

Likelihood is a *technical* fact, and it is the half testers are best placed to
judge, because it comes from things you can observe:

- **How new is it?** Code written this sprint is more likely to be wrong than
  code that has survived a year of users.
- **How complex is it?** Three interacting conditions beat one flag, every time.
- **Who touched it?** Not a slur on anyone — a component with five authors this
  quarter has had five mental models applied to it.
- **What is its history?** Defects cluster. The area that produced six bugs last
  release is the area that will produce the seventh.
- **How much did it change?** A refactor that "shouldn't change behaviour"
  changes behaviour.

Notice that the last two are free: they are already in your defect tracker and
your git log. Most teams rank risk from memory while sitting on the data.

## Scoring it without turning it into astrology

You do not need a spreadsheet with weighted criteria to three decimal places. A
score you can produce in ten minutes and defend in a meeting beats a model
nobody trusts.

Use **High / Medium / Low** on each axis, and read the pair as a grid:

| | Impact: Low | Impact: Med | Impact: High |
|---|---|---|---|
| **Likelihood: High** | Medium | High | **Test first** |
| **Likelihood: Med** | Low | Medium | High |
| **Likelihood: Low** | Skip and say so | Low | Medium — but check it works at all |

Two properties of this grid matter more than the numbers in it:

1. **High impact + low likelihood is not "skip".** Payments rarely break and are
   ruinous when they do. It earns a smoke check, not a full pass — the box says
   "check it works at all", and that is a real answer.
2. **Low impact + low likelihood is a decision, not an oversight.** Writing
   "skip" in the corner is what makes the plan's *Not covered* line honest.

Three levels is deliberate. With five, people argue about whether something is a
3 or a 4 for twenty minutes and the ranking does not change. Ranking is for
deciding order, and order only needs enough resolution to sort.

## The conversation is the deliverable

Here is the part nobody writes down: **risk analysis is worth more as a
half-hour meeting than as a document.** Get a developer, the product owner and
yourself in a room with the feature list and ask two questions per item.

What happens is that the three of you disagree, out loud, before any testing has
started. The developer says "the import path is fine, it's the retry logic I'd
worry about". The product owner says "nobody uses bulk import, but if the
confirmation email is wrong, support drowns". Both of those change where your
week goes, and neither was in the requirements document.

Do it once and you will notice something: your own likelihood scores were about
70% right and the impact scores were about 40% right. Testers systematically
overrate the impact of things that are annoying to test.

## What to do when time runs out

Time will run out. The plan is what you do about it, and there are only three
honest moves:

1. **Cut from the bottom of the ranked list, not from the middle of everything.**
   Half-testing ten areas is worse than fully testing six and naming the four you
   dropped. Half-coverage produces confidence without evidence.
2. **Downgrade depth, not existence.** For a High-impact area you cannot cover
   properly, run one smoke case rather than nothing. Knowing checkout is not
   *completely* broken is most of the value for 10% of the hours.
3. **Say what you dropped, to a person, before the release.** Not in a document
   they will not open — in the release conversation, in one sentence: "we did not
   test bulk import at all this cycle; last time it broke it took two days to
   notice."

The third one is the whole job. A tester who runs out of time and reports a green
dashboard has produced a false statement. A tester who runs out of time and says
which risks are unexamined has produced *information*, which is what the team is
paying for.

## A worked example

ShopMini's release has four changes. Twenty hours of testing available; the
naive estimate for full coverage is thirty-five.

~~~
Change                          Impact  Likelihood  Why likelihood            Rank
------------------------------------------------------------------------------------
Guest checkout (SM-214)         H       H           new code, shared cart     1
                                                    component, 3 conditions
Discount code validation        H       M           changed regex, 4 bugs     2
                                                    in this area last year
Product search ranking          M       H           rewritten this sprint     3
Footer link updates             L       L           copy change, no logic     skip

Allocation: 10h to guest checkout, 6h to discount codes, 4h to search
            (happy path + the two ranking rules the PO named), 0h to footer.

Not covered, stated in the release channel: footer copy; guest checkout on
iOS Safari < 15; the bulk import path, unchanged this cycle but adjacent to
the cart component that did change.
~~~

That last line is the one worth copying. **"Unchanged, but adjacent to something
that changed"** is the risk category people miss, because the ranking exercise
asks about what is being delivered and the regression lives next door.

## Where TestForge fits

Priority on a case is not decoration — it is where this ranking lands so it
survives past the meeting. When you tag cases by the risk area they cover, the
run report stops saying "82% passed" and starts saying "every High-risk case
passed; the four that failed are Medium in an area we already flagged", which is
a sentence a product owner can act on.

**Next:** the technique for the areas your ranking says are risky but whose
requirements are too thin to script — chartered exploratory testing.
`,
  selfCheck: [
    {
      id: "q1",
      stem: "A payment gateway integration is rock solid — unchanged for a year, no defects against it, written by the team's most careful developer. Product says an incorrect charge is the worst thing that could happen to the company. What does risk-based testing say to do?",
      choices: [
        {
          id: "a",
          text: "Skip it — low likelihood means low risk, and the hours belong to the changed code",
        },
        {
          id: "b",
          text: "Run a smoke check that proves it still works, and spend the depth elsewhere",
          correct: true,
        },
        {
          id: "c",
          text: "Give it a full regression pass — high impact always outranks likelihood",
        },
        {
          id: "d",
          text: "Raise its likelihood score, because impact that high should never be left to a single check",
        },
      ],
      explanation:
        "High impact with low likelihood is the box people get wrong in both directions. Skipping it entirely means a catastrophic area has no evidence at all behind it this release; a full regression pass spends a week re-proving code that nothing touched. The proportionate answer is confirming it works at all — most of the value for a fraction of the hours. Inflating the likelihood score to force a bigger allocation is the same mistake as guessing: it corrupts the ranking everything else is sorted by.",
    },
    {
      id: "q2",
      stem: "You have half the time you estimated. Which response gives the team the most useful result?",
      choices: [
        {
          id: "a",
          text: "Run every planned case but stop at the first step of each, so nothing is completely untested",
        },
        {
          id: "b",
          text: "Test the top of the ranked list properly, and tell the release meeting which areas got no coverage",
          correct: true,
        },
        {
          id: "c",
          text: "Run the cases that execute fastest, to maximise the number reported as passed",
        },
        {
          id: "d",
          text: "Report the shortfall as a blocker and decline to test until the schedule is fixed",
        },
      ],
      explanation:
        "Spreading yourself thinly produces a dashboard full of green with no area actually examined — confidence without evidence, which is worse than an admitted gap. Optimising for pass count is the same failure wearing a metric. Refusing to test hands the decision back to people with less information than you now have. Depth on the ranked top plus a named list of what went uncovered is the only version where every risk is either examined or explicitly accepted.",
    },
    {
      id: "q3",
      stem: "Which of these are genuine inputs to the likelihood half of the score?",
      multi: true,
      choices: [
        {
          id: "a",
          text: "The area produced six defects in the last release",
          correct: true,
        },
        {
          id: "b",
          text: "The component was rewritten this sprint",
          correct: true,
        },
        {
          id: "c",
          text: "Losing this data would breach the customer's contract",
        },
        {
          id: "d",
          text: "The logic branches on three interacting conditions",
          correct: true,
        },
      ],
      explanation:
        "Defect history, recency of change and complexity are all evidence about how likely the code is to be wrong, and the first two are sitting in the defect tracker and the git log already. A contract breach describes what it costs when the thing fails, which is impact — the other axis, and one the business owns rather than you. Keeping the two apart is the point of the grid: collapsing them into one feeling called \"important\" is what the technique exists to prevent.",
    },
  ],
};
