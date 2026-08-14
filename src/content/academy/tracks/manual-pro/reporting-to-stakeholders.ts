import type { Lesson } from "../../types";

export const reportingToStakeholders: Lesson = {
  slug: "reporting-to-stakeholders",
  title: "Reporting to stakeholders",
  summary:
    "Turning results into a decision, in five sentences.",
  minutes: 10,
  status: "published",
  body: `
## A test report exists to let somebody decide

Not to describe what you did. Nobody outside the team wants a narrative of your
week; they want to know whether to ship on Thursday, what to fix first, and where
the next two people should be pointed.

So the test that matters for any report you write is simple: **after reading
this, can the reader make the decision they were going to make anyway — faster
and better?** If your report needs a follow-up meeting to be useful, it was
notes, not a report.

## Same facts, three lengths

| Reader | Wants | Length |
|---|---|---|
| **Product owner / manager** | Can we ship? What is the risk if we do? | Five sentences |
| **Dev lead** | Where are the defects clustering, what is blocked, what needs a decision | A short list, with links |
| **Executive / customer** | One line and a direction of travel | One line |

The facts underneath are identical. What changes is how much of the machinery you
show — and the most common mistake by far is sending the dev lead's version to
everyone.

## The five sentences

This is the release recommendation, and it works for a two-week release and for a
hotfix at 6pm:

1. **What was tested, and what was not.** Scope and exclusions in the same breath;
   the exclusions are the half people skip and the half that protects everyone.
2. **The state it is in.** The headline: blockers open, critical flows verified,
   what is still moving.
3. **The risk of shipping now**, in the reader's currency — users, orders, money,
   reputation. Not defect counts.
4. **The recommendation, with its condition.** *"Ship if the checkout defect is
   fixed; the other four can go in 2.4.1."*
5. **What would change the answer.** Two more days, a working staging
   environment, a decision from someone.

That fifth sentence is what turns a report into a lever. Without it you have
delivered a problem; with it you have delivered a set of options.

~~~
Release 2.4 — recommendation

Tested: checkout, payments, account settings, order history, on Chrome,
Firefox and Safari/iOS. Not tested: the new reporting module (no test data
in staging), Android tablet layouts.

Two blockers open: card payment fails on Safari/iOS (TF-1841), and discount
codes with trailing spaces return a 500 (TF-1848). Everything else in the
critical path passed.

Shipping today means roughly a third of orders cannot pay, because
Safari/iOS is 31% of completed checkouts.

Recommend holding for TF-1841. TF-1848 is a one-line trim and can follow in
2.4.1 with a note to support.

If reporting test data lands in staging by Wednesday, I can cover the
reporting module before the weekend and remove that unknown.
~~~

Five sentences, one decision, no meeting.

## Never say "it is ready"

You cannot know that, and it is the one sentence that will eventually be quoted
back to you.

What you can say — precisely, and with a straight face in any room — is: **what
you covered, what you found, and what remains unknown.** Testing shows the
presence of defects, not their absence, which is not a philosophical point here
but the reason your report is a statement about *evidence and residual risk*
rather than a guarantee.

When somebody presses — *"but is it fine?"* — the honest answer is a good one, not
a hedge:

> *"I can't tell you it works. I can tell you that checkout, payments and
> settings pass on our three main configurations, that two blockers are open, and
> that the reporting module is untested because staging has no data. If we ship
> tonight, the risk is X. If you give me until Thursday, I can close that
> unknown."*

That answer gives them a decision. *"Yes it's fine"* gives them a person to blame,
which is a much worse deal for both of you.

## Separate the observation from the judgement

Two different kinds of sentence, and mixing them is what gets reports argued with:

- **Observation:** *"Payment fails on Safari/iOS, reproduced on three devices,
  with the network trace attached."* Nobody can disagree with this.
- **Judgement:** *"I would not ship this."* Anyone senior to you is entitled to
  disagree, and sometimes they will be right — they can see commercial context you
  cannot.

Write both, clearly labelled, in that order. Then if the judgement is overruled,
the observation still stands, and the decision to accept the risk belongs to the
person who made it. That is not defensiveness — it is how a professional
disagreement is supposed to work, and it is why your next warning still gets
taken seriously.

## The weekly, in five headings and nothing else

1. **Decisions needed** — first, because it is the only part that requires the
   reader to do something
2. **What changed** since the last one
3. **Risks and blockers**, each with an owner
4. **Numbers** — three at most, from the previous lesson
5. **Next**

Anything that does not fit one of those five is not status, it is detail, and
detail goes in a link.

## Escalating without burning anything down

Escalate the **decision**, not the person. A blocker nobody owns after two days, a
risk being accepted silently, a dependency that has stopped answering: those are
escalations, and they read best with a deadline and a default.

> *"TF-1841 has had no owner since Monday. If nobody picks it up by Thursday
> midday, we ship 2.4 without Safari payments and tell support to expect calls —
> flagging it now so that is a choice rather than an accident."*

The default is what makes people answer. And note the framing: you are not asking
to be rescued, you are telling them what will happen if the silence continues.

**Bad news travels early and small.** A heads-up on Tuesday is a plan; the same
information on release day is a crisis with your name attached. Nobody has ever
regretted flagging a risk too early.

## Put it in writing afterwards

Whatever you said in the room, send one paragraph after it: the decision, who
made it, what it was based on. Partly because shared memory is worse than anyone
believes and this saves the same argument being had twice in a month — and partly
because when a risk is accepted, the record that it was accepted knowingly is what
keeps the conversation about the software rather than about who said what.

## Where TestForge fits

The run is the evidence; the report is the sentence you write on top of it. Link
the run and the defects rather than pasting numbers, so anyone who wants the
detail can have all of it and nobody has to read it to get the decision.

And a dashboard link is not a report. Sending one is asking the reader to do your
job — to look at numbers and work out what they mean. Your value is in the
sentence.

## Where this track ends

You can now plan work under a deadline and say what you are cutting, run a
chartered exploratory session and produce evidence from it, read a network trace,
drive an API directly, verify what was actually stored, cover the browsers your
users really have, find the accessibility and non-functional failures nobody wrote
a requirement for, and turn all of it into a recommendation somebody can act on.

That is the working range of a solid mid-level manual QA — and the ceiling of
what one person can do by hand. Next comes making the machine do the repetitive
half so you can spend your time on the parts that need a person: the
**QA Automation** track, on the [roadmap](/academy).
`,
  selfCheck: [
    {
      id: "q1",
      stem: "The product owner asks, an hour before the release call: \"Is it ready to ship?\" What is the strongest answer?",
      choices: [
        {
          id: "a",
          text: "\"Yes — everything we tested passed.\"",
        },
        {
          id: "b",
          text: "What you covered, what you found, what remains unknown, and what the risk is if it ships tonight — leaving the decision with them",
          correct: true,
        },
        {
          id: "c",
          text: "\"I can't say — testing shows the presence of defects, not their absence.\"",
        },
        {
          id: "d",
          text: "\"No, there are still two open defects.\"",
        },
      ],
      explanation:
        "A report exists to let somebody decide, so the strongest answer hands over coverage, findings, unknowns and consequence, and leaves the call where it belongs. Declaring it ready claims knowledge you do not have and will be quoted back at you. The principle in the third option is correct and the delivery is useless — it refuses to help with the decision, which reads as evasion no matter how true it is. And a flat no substitutes your judgement for theirs without giving them the facts to weigh: two open defects might be trivial, and the person with the commercial context is entitled to that trade-off.",
    },
    {
      id: "q2",
      stem: "Which version of the risk sentence belongs in a report to a product owner?",
      choices: [
        {
          id: "a",
          text: "\"17 defects are open, 2 of them critical, and regression is at 94%.\"",
        },
        {
          id: "b",
          text: "\"Card payment fails on Safari/iOS, which is 31% of completed checkouts — shipping today means roughly a third of orders cannot pay.\"",
          correct: true,
        },
        {
          id: "c",
          text: "\"There is a significant risk in the payment area that should be considered before release.\"",
        },
        {
          id: "d",
          text: "\"The Safari/iOS payment defect (TF-1841) is a null reference in the card tokenisation handler.\"",
        },
      ],
      explanation:
        "Risk has to arrive in the reader's currency — orders, users, money — because that is the unit the decision is made in. Defect counts are your internal bookkeeping and mean nothing without knowing which defects, and \"significant risk\" transfers no information at all while sounding like it does. The root cause is real and useful, but it is the dev lead's version of the same fact: a product owner cannot do anything with a null reference, and the consequence is missing from it entirely.",
    },
    {
      id: "q3",
      stem: "Which of these make a status report more likely to produce action?",
      multi: true,
      choices: [
        {
          id: "a",
          text: "Leading with the decisions you need, rather than what you did",
          correct: true,
        },
        {
          id: "b",
          text: "Stating what was not tested, alongside what was",
          correct: true,
        },
        {
          id: "c",
          text: "Attaching the full list of executed test cases so the reader can see the coverage",
        },
        {
          id: "d",
          text: "Giving an unowned blocker a deadline and a stated default if nobody responds",
          correct: true,
        },
      ],
      explanation:
        "Decisions first is what makes the reader's own task visible in the first line; naming the exclusions is what stops an unknown being read as a pass; and a default with a deadline converts silence into a choice somebody has to make, which is the mechanism that actually moves an unowned blocker. The full case list is the one to leave out — it is detail, it belongs behind a link, and burying four sentences of consequence inside 300 rows is the most reliable way to have none of it read.",
    },
  ],
};
