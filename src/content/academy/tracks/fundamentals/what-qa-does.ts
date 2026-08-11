import type { Lesson } from "../../types";

export const whatQaDoes: Lesson = {
  slug: "what-qa-does",
  title: "What a tester actually does",
  summary:
    "The job as it really is: not clicking every button, but deciding which risks are worth the time you have.",
  minutes: 8,
  status: "published",
  body: `
## The job in one sentence

A tester's job is **to give the team information about the quality of what they
built, fast enough for that information to still be useful**.

Read that again, because almost every mistake beginners make comes from
believing something else instead:

- *"My job is to find all the bugs."* You cannot. Nobody can — see
  [the seven principles](/academy/fundamentals/seven-principles).
- *"My job is to prove the software works."* You can't prove that either.
  Testing shows the presence of defects, never their absence.
- *"My job is to be the gatekeeper who says no."* Deciding whether to ship is
  the team's call and usually the product owner's. Your job is to make sure that
  decision is made with the facts in front of it.

## A realistic day

Nobody spends eight hours executing test cases. A typical day for a QA on a
product team looks more like:

| Time | What you're doing |
|---|---|
| Morning stand-up | Say what you're testing, flag anything blocking |
| ~1h | Read the ticket/story for the feature going to test *today*, ask the questions nobody asked yet |
| ~2h | Test it: partly scripted cases, partly exploring |
| ~1h | Write up the defects you found — properly, so they get fixed |
| ~1h | Regression on the areas the change touched |
| ~1h | Review someone else's acceptance criteria, or improve the test suite |

Notice how much of it is **reading and asking** rather than clicking. The
cheapest bug to fix is the one you catch in the requirements, before a line of
code exists. A tester who reads the story and asks *"what should happen if the
user's card is declined halfway through?"* has just saved a week.

## What you're actually being paid for

**Judgement about risk.** There is never time to test everything, so the skill
is choosing. Given a checkout flow and two days, do you spend them on the happy
path in six browsers, or on payment failure modes in one? (Usually the second —
the happy path is what the developer already tried.)

**Precision.** "It's broken" is worth nothing. "On Safari 17, adding a 100th
item to the cart clears the cart and shows a 500; works at 99; here's the
request that failed" is worth an afternoon of someone's time.

**Advocacy for the user.** You are frequently the first person to use the
feature the way a real human will, rather than the way its author imagined.

## Manual vs automation is not a career ladder

You will hear "manual QA" spoken of as the thing you graduate out of. That's
wrong, and believing it will make you a worse automation engineer.

Automation is **execution**, not testing. It repeats checks you already
designed, so that humans don't have to. Designing what's worth checking, and
noticing the thing nobody thought to check — that's testing, and it's the part
that doesn't automate. The best automation engineers are the ones who were good
manual testers first, because they know which checks are worth the maintenance
cost of a script.

What *does* change with automation is scale and speed. That's why this Academy
covers both, in that order.

## Where TestForge fits

Everything above produces artifacts: test cases, runs, results, defects. That's
what a test management tool is for — TestForge included. As you go through this
track you'll write real test cases in a real project, so by the end you have
both the skill and something to show in an interview.

**Next:** how the testing work fits into how software actually gets built.
`,
  selfCheck: [
    {
      id: "q1",
      stem: "A stakeholder asks you to guarantee the release has no bugs. What is the honest answer?",
      choices: [
        { id: "a", text: "Yes, if we run the full regression suite first" },
        { id: "b", text: "No — testing can show defects exist, never that none remain", correct: true },
        { id: "c", text: "Yes, once automation coverage reaches 100%" },
        { id: "d", text: "No, because the developers keep introducing new ones" },
      ],
      explanation:
        "No amount of testing proves the absence of defects; it only lowers the probability of failure. Coverage numbers measure what was executed, not what is correct, and the honest reply names what was tested, what was found, and what was left uncovered.",
    },
    {
      id: "q2",
      stem: "You have two days before a checkout release. Where does the time usually belong?",
      choices: [
        { id: "a", text: "The happy path across six browsers" },
        { id: "b", text: "Payment failure modes and permission boundaries in one browser", correct: true },
        { id: "c", text: "Re-running every case in the suite regardless of the change" },
        { id: "d", text: "Writing more test cases for the areas nobody changed" },
      ],
      explanation:
        "The happy path is what the developer already tried, so it is the least likely place to find something new. Risk-based choice sends the scarce time to failure modes and permissions, where the impact is money and access, and says out loud what the browser matrix did not cover.",
    },
    {
      id: "q3",
      stem: "Which of these are testing activities, even though none of them execute a test case?",
      multi: true,
      choices: [
        { id: "a", text: "Asking in refinement what happens when a card is declined mid-payment", correct: true },
        { id: "b", text: "Reviewing a story's acceptance criteria for ambiguity", correct: true },
        { id: "c", text: "Writing the release announcement" },
        { id: "d", text: "Pairing with a developer on which unit tests to add", correct: true },
      ],
      explanation:
        "Testing is the work of getting information about quality, and the cheapest place to get it is before code exists. Questions in refinement, reviewing criteria and shaping unit tests all prevent defects; the release announcement is communication, not testing.",
    },
  ],
};
