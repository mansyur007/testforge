import type { Lesson } from "../../types";

export const interviewPrep: Lesson = {
  slug: "interview-prep",
  title: "Interview preparation",
  summary: "The questions that always come, and how to answer with evidence.",
  minutes: 14,
  status: "published",
  body: `
## What is actually being assessed

A QA interview is not a quiz on definitions. Whatever the questions look like,
an interviewer is trying to settle three things:

1. **Can you find problems** — systematically, not by luck.
2. **Can you explain your reasoning** — because a tester who cannot explain a
   risk cannot get it acted on.
3. **Can you disagree well** — with a developer, with a product owner, under
   deadline pressure.

Almost every standard question is one of those three wearing a costume. Knowing
which one you are being asked is most of the preparation.

## The questions that always come

| Question | What is really being asked |
|---|---|
| "How would you test a login page?" | Are you systematic, and do you state assumptions |
| "Tell me about a bug you're proud of" | Can you tell a story with evidence and impact |
| "The developer says it's not a bug — what do you do?" | Do you argue with evidence or with authority |
| "How do you decide what to automate?" | Cost-and-value judgement, not tool knowledge |
| "We ship tomorrow and testing isn't done. What do you say?" | Can you give a risk statement instead of a yes or no |
| "How do you test something with no requirements?" | Do you know where an oracle comes from |
| "How do you handle a flaky test?" | Do you quarantine and fix, or re-run and hope |

Every one of those has a lesson behind it in this Academy. The interview is
mostly a compression exercise.

## The "how would you test X" answer, in four moves

This is the single most reusable structure in the whole lesson, because some
version of the question appears in nearly every QA interview.

**1. Ask before you answer.** Who uses this? Web only, or mobile too? Is there a
password manager flow, SSO, 2FA? What happens downstream if it fails? Candidates
who begin listing cases immediately have already told the interviewer that they
do not ask questions of product owners either.

**2. State your assumptions** out loud: *"I'll assume a web app with
email-and-password login and no SSO — tell me if that's wrong."* Now your answer
is scoped rather than incomplete.

**3. Go by category, not by list.** Categories show a method; a list shows a
memory:

- Functional happy path, and the primary error paths
- Boundaries and negatives — empty, maximum length, unicode, whitespace, SQL-ish
  and script-ish input
- Data and state — locked account, unverified email, already logged in elsewhere
- Security — rate limiting, whether the error distinguishes "no such user" from
  "wrong password", what happens to the session after a password change
- Compatibility — the browsers and devices **your analytics show**, not a
  market-share chart
- Accessibility — keyboard-only, visible focus, the error announced to a screen
  reader
- Non-functional — response time under load, and behaviour when the auth service
  is slow
- In production — what you would watch after release

**4. Say where you would stop, and why.** *"With two days I would cover the first
three groups fully and sample the rest, because credential handling is where the
damage is."* That sentence is the answer to the question they were really asking.

That is T2's entire track in ninety seconds, and it is why the track exists.

## The story questions

Use STAR — situation, task, action, result — with one addition testers need:
**end on what changed afterwards.** A regression case added, a process fixed, a
check moved earlier. It turns "I found a bug" into "I improved the system that
lets bugs through", which is the difference between a mid and a senior answer.

Have three stories ready, and rehearse them until they are two minutes rather
than six:

- **A bug you found that mattered**, with the impact stated in the business's
  currency — revenue, users affected, data at risk. Not "a critical bug".
- **A disagreement you handled** — ideally one where you turned out to be
  partly wrong. Interviewers trust that story more than the one where you were
  vindicated.
- **Something you improved** — flaky suite stabilised, a release check that
  moved left, a report people started reading.

For *"the developer says it's not a bug"*: the answer is **evidence, then the
requirement, then escalation with the decision documented**. Reproduce it
cleanly, show what the specification or the user expectation says, and if it is
still disputed, hand the decision to whoever owns the release **and record that
it was made**. That is T2's observation-versus-judgement split, and it is the
answer that reads as senior.

## Take-homes and live exercises

The usual formats: test a described feature, find bugs in a demo application,
write a small automated test, or review someone else's test cases.

What is actually scored, in rough order of weight:

- **Structure** — did you organise the work, or produce an undifferentiated list.
- **Stated assumptions** — every take-home is under-specified on purpose. Naming
  the ambiguity scores; guessing silently does not.
- **Reproducibility** — a bug report the reviewer cannot reproduce is worth zero,
  regardless of whether the bug is real.
- **Does the code run**, from a clean clone, with the command you documented.
- **Priorities** — telling them what you would do next with more time is
  evidence of judgement, not an excuse for what is missing.

Timebox it and say what your timebox was. A candidate who spends fourteen hours
on a four-hour exercise has demonstrated something worrying rather than
impressive.

## Your questions for them

You will be asked if you have any. Ask the ones whose answers you would actually
want to know, because this is also the part where you screen the job:

- What does the release process look like, end to end?
- Who decides that something is ready to ship?
- How long does the pipeline take, and how often is it red?
- What happens when a defect reaches production?
- Is QA in refinement, or does work arrive already estimated?
- What would you want me to have achieved after three months?

The answers tell you whether the role is testing or is a rubber stamp with a
testing job title, and that is worth more to you than one more chance to impress.

## Two honest notes

**Claim the level you can defend.** Interviewing as a senior means being asked
how you would stabilise a flaky suite, structure a framework for a team of
five, or negotiate a release. Being an excellent mid-level candidate beats
being an unconvincing senior one, and the offer that comes from an accurate
picture is the one that survives the first three months.

**Rejection is high-variance.** Team fit, an internal candidate, a budget freeze,
someone with the exact domain — most of these have nothing to do with you. The
process is a match rather than a verdict. Run it enough times and gather the
feedback you can.

## Bring the portfolio

Everything above is easier when you can end an answer with *"I can show you."*
The public project from the previous lesson does more work in an interview than
any adjective: real cases, real runs, a real failure you found, and a written
explanation of what you chose not to cover.

When the question is *"how do you know your tests are any good?"*, opening a run
history and pointing at the defects that were caught before release is an answer
nobody can argue with.

## You have finished Beyond Functional

Performance and security as a tester's questions rather than a specialist's
tools. Contracts before deploy and observability after. AI ranked by how it fails
rather than by what it promises. And the two lessons that turn all of it into
something a stranger can evaluate.

Four tracks, from what QA does to how you get paid for it. If certification is
your next step, the roadmap has a track for it — chapter quizzes and a full
practice paper — and it names the scheme there, with the notice that belongs
next to it.

Go and test something real. That is the only part of this that was ever going to
teach you.
`,
  selfCheck: [
    {
      id: "q1",
      stem: "You are asked \"how would you test a login page?\" What should the first thing out of your mouth be?",
      choices: [
        {
          id: "a",
          text: "The list of test cases, starting with valid credentials",
        },
        {
          id: "b",
          text: "Clarifying questions about users, platforms and what fails downstream — then the assumptions you will proceed under",
          correct: true,
        },
        {
          id: "c",
          text: "The test types you would use, named in formal syllabus terminology",
        },
        {
          id: "d",
          text: "A statement that the page cannot be tested without a written specification",
        },
      ],
      explanation:
        "The question is a test of method, and the method starts before the cases: who uses it, which platforms, is there SSO or 2FA, what breaks downstream. A candidate who starts listing cases has demonstrated that they would not ask a product owner either. Stating assumptions after the questions makes the rest of the answer scoped rather than incomplete, and it lets the interviewer correct you cheaply. Terminology impresses nobody on its own, and refusing to proceed without a specification fails the oracle question — you can always test against user expectation, comparable systems and a stated assumption.",
    },
    {
      id: "q2",
      stem: "A developer rejects your defect as 'not a bug'. What is the answer that reads as senior?",
      choices: [
        {
          id: "a",
          text: "Reproduce it cleanly, show what the requirement or user expectation says, and if it is still disputed escalate to whoever owns the release and record the decision",
          correct: true,
        },
        {
          id: "b",
          text: "Reopen the ticket with a stronger severity so it cannot be ignored",
        },
        {
          id: "c",
          text: "Accept the developer's assessment, since they know the implementation best",
        },
        {
          id: "d",
          text: "Raise it directly with the product owner without telling the developer",
        },
      ],
      explanation:
        "Evidence first, then the standard you are measuring against, then a decision made by the person who owns the consequence — and documented, so an accepted risk is a choice on the record rather than an argument you lost. This is the observation-versus-judgement split from T2's reporting lesson: the reproduction is not disputable, the verdict is somebody's call. Escalating by severity inflation trains people to discount your severities; deferring entirely abandons the reason you exist; and going around the developer wins one ticket at the cost of the working relationship you need for the next fifty.",
    },
    {
      id: "q3",
      stem: "Which of these actually score well on a QA take-home exercise?",
      multi: true,
      choices: [
        {
          id: "a",
          text: "Naming the ambiguities in the brief and stating the assumptions you tested under",
          correct: true,
        },
        {
          id: "b",
          text: "Bug reports the reviewer can reproduce from your steps alone",
          correct: true,
        },
        {
          id: "c",
          text: "Saying what your timebox was and what you would do next with more time",
          correct: true,
        },
        {
          id: "d",
          text: "Spending three times the suggested time to cover as much as possible",
        },
      ],
      explanation:
        "Take-homes are under-specified deliberately, so naming the ambiguity is the exercise rather than an obstacle to it, and a reproducible report is the only kind worth anything regardless of whether the defect is real. Stating the timebox and the next priorities is evidence of judgement — it tells the reviewer that what is missing was a decision rather than an oversight. Massively overspending the time is the one that backfires: it makes the work impossible to compare against other candidates and signals someone who cannot scope, which is precisely the skill the exercise is testing.",
    },
  ],
};
