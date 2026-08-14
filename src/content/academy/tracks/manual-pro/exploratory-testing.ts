import type { Lesson } from "../../types";

export const exploratoryTesting: Lesson = {
  slug: "exploratory-testing",
  title: "Exploratory and session-based testing",
  summary:
    "Charters, timeboxes, note-taking, and why unscripted testing finds what scripts can't.",
  minutes: 14,
  status: "draft",
  sandbox: true,
  body: `
## Scripted testing can only find what you already thought of

A test case is a question you wrote down *before* you had seen the software. It
is written from a requirement, and it can therefore only ever check whether the
requirement was implemented. That is worth doing — it is most of what the
previous track was about — but notice the ceiling: **a suite of 300 cases
contains exactly 300 questions, all of them asked by a version of you who had
less information than you have now.**

Everything you learn while testing — that the error message flashes and
disappears, that the page is fine until you use the browser Back button, that
two tabs open at once corrupt the cart — arrives *during* the session and has
nowhere to go in a scripted run except a note in the margin.

Exploratory testing is the practice of letting what you just learned decide what
you do next. Design, execution and learning happen at the same time, on purpose.

## What it is not

It is not "clicking around". That confusion costs the technique its reputation
in half the teams that try it, so be precise about the difference:

| Ad-hoc clicking | Exploratory testing |
|---|---|
| No stated goal | A **charter**: one sentence naming the target |
| Runs until you get bored | A **timebox**, usually 45–90 minutes |
| Leaves no trace | **Notes** taken as you go, and a debrief |
| Cannot be repeated or reviewed | Produces cases, defects and coverage evidence |
| "I tested it" | "I spent 60 minutes on discount codes; here is what I found and what I did not reach" |

The structure is what makes it accountable. Without it you cannot tell a manager
what you did with your afternoon, which is why unstructured exploration keeps
losing the argument to scripted suites even when it finds more.

## The charter

A charter is the entire plan for a session, and it fits in one sentence. The
shape that works:

> **Explore** *(target)* **with** *(resources)* **to discover** *(information)*.

Real examples:

- Explore **the discount code field** with **expired, malformed and boundary-length codes** to discover **whether any invalid code is ever accepted**.
- Explore **checkout** with **two browser tabs on the same cart** to discover **state-corruption bugs**.
- Explore **the cart** with **the browser Back button and page refreshes** to discover **whether the total can disagree with the line items**.

What makes these good is that each names a **specific enemy**. "Explore
checkout" is not a charter; it is a shrug. The second half — *with* what, *to
discover* what — is where the thinking is. If you cannot fill in "to discover",
you do not yet know why you are opening the feature, and the session will drift.

One charter per session. Two charters is two sessions.

## Timeboxes, and why the clock is the discipline

Sessions run 45–90 minutes. Short (about 45) when the charter is narrow or the
area is unfamiliar; long (about 90) when you need to build up state before
anything interesting happens.

The timebox does three jobs:

1. **It ends the session.** Exploration has no natural stopping point — there is
   always one more idea — so without a clock a session eats the day.
2. **It makes the work countable.** "Four sessions on checkout this week" is a
   unit a manager can plan with. Hours-of-vague-testing is not.
3. **It licenses depth.** Knowing there is a hard stop is what lets you follow a
   weird hunch for fifteen minutes without feeling you are wasting the afternoon.

Keep the phone away and do not answer the standup thread. A session interrupted
at minute 20 is not a 60-minute session with a gap; the state you had built up
in your head is gone, and that state is the technique's main asset.

## Note-taking, without stopping to write essays

Take notes *while* testing, in a form fast enough that it does not break the
flow. Four tags cover almost everything:

~~~
CHARTER: Explore discount codes with expired/malformed/boundary codes
         to discover whether any invalid code is ever accepted
START:   14:05

TEST  tried SAVE10 (valid, 6 chars) -> accepted, -10% applied
TEST  tried save10 lowercase -> accepted (case-insensitive, as specified)
BUG   tried SAVE10 with trailing space -> accepted! spec says letters+digits only
NOTE  the field trims input before validating but after length check?
Q     is 10 chars inclusive? spec says "6-10", tried 10 -> accepted
BUG   expired code EXPIRE99 -> generic "invalid code", spec wants a specific
      message. Support will get tickets about this.
NOTE  no rate limit visible on code attempts - not my charter, worth a session
TEST  tried 5 chars, 11 chars, empty, unicode -> all correctly rejected

STOP:    15:02
SETUP:   ~10 min (needed an expired code seeded)
CHARTER: ~40 min
OPPORTUNITY: ~10 min (the rate-limit poke)
NOT REACHED: stacking two codes; codes on an already-discounted item
~~~

**BUG**, **NOTE**, **Q** and **TEST** are the whole vocabulary. The one people
skip is **Q** — the questions you could not answer yourself. Those are the
highest-value output of a session, because a question you take to the product
owner ("is 10 characters inclusive?") often turns out to be a requirement nobody
had decided, and finding an undecided requirement before it ships beats finding
the bug afterwards.

**NOT REACHED** is the second thing people skip and the one that makes the
session honest. It is the same move as the test plan's *Not covered* line: it
says where the coverage ends instead of letting silence imply completeness.

## The debrief

Session-based test management adds one more step: someone reads the notes with
you, for five minutes, at the end. Ask three questions.

- **What did you find?** — the bugs, and the questions.
- **What did you not get to?** — feeds the next charter.
- **Was the charter the right one?** — sometimes the answer is "the interesting
  area turned out to be next door", which is exactly the information exploration
  exists to produce.

If nobody is available to debrief you, debrief yourself in writing. The value is
mostly in being forced to summarise while it is fresh.

## When to reach for it

Exploratory testing is not a replacement for scripted cases; the two answer
different questions. Reach for exploration when:

- the requirements are thin, absent, or you suspect they are wrong
- the feature is new and nobody has used it in anger yet
- a scripted pass came back all-green and you do not believe it
- you have inherited a system you do not know
- a defect was just fixed and you want to know what *else* that area does
  (a fix is a change, and changes cluster defects)

And be aware of what it is bad at: **it is not repeatable**. Two testers with
the same charter run different sessions. That is a feature for finding things
and a problem for regression, compliance evidence, or anything that has to
produce the identical result next quarter. Use scripted cases there.

The practical arrangement most teams land on: scripted cases for the paths that
must not break, exploratory sessions for everything you have not thought of yet
— and every good thing a session finds gets written up as a case, so the suite
grows out of what exploration discovered rather than out of the requirements
document alone.

## Where TestForge fits

A session's output is not a feeling; it is rows. The bugs become defects, the
notes become the defect descriptions (already written, in the moment, with the
exact input you used), and the repeatable findings become cases in a suite so
the next release gets them for free.

That is the exercise below: run one real 45-minute session against ShopMini,
with a written charter and notes, and turn what you find into a defect and at
least one case.

**Next:** the question underneath all of this — when there is no requirement to
compare against, how do you know the thing you are looking at is wrong?
`,
  selfCheck: [
    {
      id: "q1",
      stem: "Which of these is a usable session charter?",
      choices: [
        { id: "a", text: "Test the checkout page" },
        {
          id: "b",
          text: "Explore the cart with the browser Back button and refreshes, to discover whether the total can disagree with the line items",
          correct: true,
        },
        {
          id: "c",
          text: "Verify that a cart quantity of 100 is rejected with the message \"Maximum 99 per order\"",
        },
        {
          id: "d",
          text: "Spend Thursday afternoon finding as many bugs as possible anywhere in the product",
        },
      ],
      explanation:
        "A charter names a target, the resources or attack you will use, and the information you are hunting for — the third part is what stops a session drifting. \"Test the checkout page\" and an open-ended afternoon both fail on that: nothing in them can tell you whether the session went well. The quantity item fails the other way; it has a single predetermined answer, which makes it a test case, and a case is better run as a case than as an hour of exploration.",
    },
    {
      id: "q2",
      stem: "Your team wants exploratory testing to count as real work in the release report. Which practice does most to make that possible?",
      choices: [
        {
          id: "a",
          text: "Requiring that every session find at least one defect",
        },
        {
          id: "b",
          text: "Timeboxed sessions with a written charter, notes, and a stated list of what was not reached",
          correct: true,
        },
        {
          id: "c",
          text: "Converting each session into a scripted test case before it runs",
        },
        {
          id: "d",
          text: "Having two testers run the same charter so the results can be compared",
        },
      ],
      explanation:
        "The reason unstructured exploration loses arguments to scripted suites is that it leaves no trace, not that it finds less. A charter, a clock and notes turn an afternoon into a countable unit with stated coverage and stated gaps, which is what a release report needs. A defect quota rewards reporting noise and punishes the sessions that correctly find nothing. Scripting it in advance removes the technique entirely, and duplicating charters spends two testers to get one session's coverage.",
    },
    {
      id: "q3",
      stem: "During a session on discount codes you notice the login page has no rate limiting. It is not your charter. What is the best move?",
      choices: [
        {
          id: "a",
          text: "Abandon the charter and pursue it — a security finding outranks a planned session",
        },
        {
          id: "b",
          text: "Note it, spend a few minutes at most, and raise it in the debrief as a candidate charter",
          correct: true,
        },
        {
          id: "c",
          text: "Ignore it completely; anything outside the charter is out of scope for the session",
        },
        {
          id: "d",
          text: "Add it to the charter so the session covers both areas",
        },
      ],
      explanation:
        "Sessions account for opportunity time precisely because interesting things turn up next door — a small excursion is expected, and the note is what carries the finding out of the session intact. Dropping the charter mid-session loses the coverage you were part-way through and leaves nothing you can report. Ignoring it throws away real information for the sake of tidiness. Widening the charter is the worst option: one sentence per session is what keeps the timebox meaningful, and a session covering two targets can honestly claim neither.",
    },
  ],
};
