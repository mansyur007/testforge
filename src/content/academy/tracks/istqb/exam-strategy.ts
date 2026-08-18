import type { Lesson } from "../../types";

// §7.1/§7.3: this lesson describes *our* practice paper and general exam
// technique. It never claims equivalence with the real examination, and the
// per-chapter split is stated as this project's blueprint — §5.1's open item.
export const examStrategy: Lesson = {
  slug: "exam-strategy",
  title: "Exam strategy",
  summary:
    "Timing, K-levels, how the question styles work, and what to do with the last ten minutes.",
  minutes: 15,
  status: "published",
  body: `
## What you are sitting

The Foundation Level exam is **40 questions in 60 minutes**, and the pass mark is
**65% — 26 of 40**. If you are not sitting it in your native language you are
entitled to **15 extra minutes**, which is offered as a checkbox when you start
our practice paper.

**Our practice paper is built to the published exam structure**, and you can
plan around the shape of it. The question count, duration, extra-time allowance,
pass mark and the per-chapter split all match the structure ISTQB publishes for
CTFL v4.0:

| Ch | Topic | Questions | K1 | K2 | K3 |
|---:|---|---:|---:|---:|---:|
| 1 | Fundamentals of Testing | 8 | 2 | 6 | 0 |
| 2 | Testing Throughout the SDLC | 6 | 2 | 4 | 0 |
| 3 | Static Testing | 4 | 2 | 2 | 0 |
| 4 | Test Analysis and Design | 11 | 0 | 6 | 5 |
| 5 | Managing the Test Activities | 9 | 1 | 5 | 3 |
| 6 | Test Tools | 2 | 1 | 1 | 0 |
| | **Total** | **40** | **8** | **24** | **8** |

Read that table once before you revise, because it prices your effort. One
honesty about it: **our draw matches the question counts, not the K-level
columns** — we draw the right number of questions per chapter, and we do not yet
guarantee that exactly five of chapter 4's eleven are K3. Use the K columns to
plan your revision, and the chapter counts to predict our paper.

## The timing arithmetic, and why uniform pacing is wrong

Sixty minutes over forty questions is **90 seconds each**. Nobody should actually
pace that way, because the questions are not the same size:

| Question type | Realistic time | Why |
|---|---|---|
| **K1 recall** | 20–30 seconds | You know it or you do not; staring does not help |
| **K2 explain or compare** | 60–90 seconds | Read the stem carefully, eliminate, decide |
| **K3 apply** | 2–3 minutes | You have to actually work something out |

So the plan is: **bank time on the recall questions and spend it on the K3 ones.**
A first pass answering everything you know quickly should leave you fifteen to
twenty minutes for the handful that need real work.

**Where the slow questions live** is knowable in advance, and the table above
prices it exactly. Every K3 objective in the syllabus sits in **chapter 4** (the
four black-box techniques and ATDD) and **chapter 5** (estimation,
prioritisation, defect reports) — and the published structure agrees: all
**eight** K3 questions are in those two chapters, five and three, and every
other chapter is K3-free. Those two chapters are also 20 of the 40 questions, so
**half the paper is the two chapters that hold all the calculation**, and the
other half is almost entirely recognition.

Put the two facts together and the arithmetic closes: eight K3 questions at two
to three minutes is roughly twenty minutes, which leaves forty for the other
thirty-two. **That is the whole pacing plan** — the remaining thirty-two average
75 seconds, and the twenty-four K2 questions are what actually consume it, since
eight K1 questions cost about four minutes between them.

## The question styles, and how each one breaks

**Single best answer.** Four options, one correct. Eliminate two quickly, then
decide between the survivors. If both survivors look right, the stem contains a
qualifier you skimmed.

**Multiple response** — "select two" or "select all that apply". **In our
practice paper these are graded as an exact set: every correct option and no
incorrect ones, with no partial credit.** Selecting one of two correct answers
scores the same as selecting nothing. So if the stem says *select two*, select
exactly two.

**Scenario questions.** A paragraph of situation, then a question. **Read the
final sentence first**, then the scenario — you will read it looking for
something rather than trying to remember all of it.

**Negative questions** — "which is NOT", "which is least likely". These catch
people who read fast and answer the positive version. When you see a negative
stem, mark it in your head and check your answer against the stem once more
before moving on.

**"Best" or "most" questions.** More than one option is defensible; you are being
asked to rank. These are usually K2 questions about a distinction — the "best"
answer is normally the one that names the actual mechanism rather than a true but
generic statement.

## Words that decide answers

In the options, absolutes are usually wrong:

> **always · never · only · all · must · guarantees · eliminates · proves**

Testing is a discipline built on "it depends" and "reduces the probability of",
so an option promising certainty is usually the distractor. Compare:

- *"100% branch coverage **guarantees** 100% statement coverage"* — true, and one
  of the very few guarantees in the syllabus.
- *"Passing tests **prove** the software has no defects"* — false, and it is
  principle 1 rewritten as a trap.

The reverse is also worth knowing: **hedged options survive more often.**
"Usually", "typically", "can", "may" describe how the syllabus actually talks.

## In the room

**First pass — answer what you know.** Do not flag things because they feel hard;
flag things where you have narrowed to two options and need another minute. A
flagged question you have not answered at all is a question you might run out of
time to return to, so **always leave an answer behind**, even a guess.

**There is no negative marking in our practice paper** — a wrong answer and a
blank answer both score zero. Guessing is strictly better than leaving something
empty. With four options and two eliminated, a guess is a coin flip, and a coin
flip is worth half a mark on average.

**Second pass — the flagged ones**, in the order the navigator shows them.

**The last ten minutes**, and in this order:

1. **Every unanswered question gets an answer.** This is not optional and it
   comes first, because it is the only part of the last ten minutes that can
   still gain you a mark from nothing.
2. **Re-read the negative-stem questions** you remember flagging. This is where
   careless marks are recovered.
3. **Leave everything else alone.** Wholesale second-guessing loses more marks
   than it gains; change an answer only when you can say *why* the first one was
   wrong — a rule you misremembered, a qualifier you missed — not because it
   feels uneasy.

Watch the two warnings the runner gives you at ten minutes and at two minutes.
The paper auto-submits at zero, so anything unanswered at that point stays
unanswered.

## Preparing, in the week before

1. **Drill chapter by chapter.** Take each chapter quiz until you are
   consistently at 6 of 8 or better. Chapters 4 and 5 are the ones to over-invest
   in — together they are half the paper.
2. **Then sit a full timed paper**, under real conditions: one sitting, no
   notes, the clock running.
3. **Read the per-chapter breakdown on the result page**, which exists precisely
   for this. A 60% overall that hides 2 of 11 on chapter 4 is a different problem
   from one spread evenly, and it tells you exactly what to revise.
4. **Re-read the explanations for every question you missed**, including the ones
   you guessed correctly — a lucky guess is an unlearned objective wearing a
   correct answer.
5. **Sit a second paper.** A different seed draws a different set, so the score
   means something.

**[Take the full practice exam →](/academy/istqb/practice-exam)**

## The evening before, and the morning of

Nothing new. Re-read your own notes on the distinctions — the tables at the end
of each chapter lesson are built for exactly this pass — and sleep. A K3 question
answered by a tired brain is the most expensive mistake available, because those
are the questions with a single unambiguous right answer.

Bring photo ID if you are sitting a proctored exam, and check the platform's
requirements the day before rather than the hour before.

## You have finished the track

Five tracks: what QA does, professional manual testing, automation, the senior
material, and this. Whatever the certificate ends up saying, the useful part was
never the certificate — it was learning to say precisely what you tested, what
you did not, and why.

Good luck. Then go and test something real.
`,
  selfCheck: [
    {
      id: "q1",
      stem: "With ten minutes left you have three unanswered questions and four flagged ones you answered but are unsure about. What do you do first?",
      choices: [
        {
          id: "a",
          text: "Answer the three unanswered questions, guessing if necessary, before revisiting anything",
          correct: true,
        },
        {
          id: "b",
          text: "Revisit the four flagged questions, since a considered change is worth more than a guess",
        },
        {
          id: "c",
          text: "Re-read the whole paper from the beginning to check for misread stems",
        },
        {
          id: "d",
          text: "Leave the unanswered ones blank, since a wrong answer looks worse than no answer",
        },
      ],
      explanation:
        "A blank scores zero and so does a wrong answer — there is no negative marking in this practice paper — so an unanswered question is the only place where guessing converts nothing into an expected half-mark once you have eliminated two options. Revisiting flagged answers comes second because those already have marks banked. Re-reading the entire paper in ten minutes is not achievable and invites the wholesale second-guessing that loses more than it gains. Option d states a scoring rule that does not exist here.",
    },
    {
      id: "q2",
      stem: "Why is uniform pacing at 90 seconds per question a poor plan?",
      choices: [
        {
          id: "a",
          text: "Because the questions vary in cost — K1 recall takes half a minute while K3 application takes two to three, so time should be banked on the fast ones and spent on the slow ones",
          correct: true,
        },
        {
          id: "b",
          text: "Because the exam is not actually time-limited in practice",
        },
        {
          id: "c",
          text: "Because questions must be answered in the order presented",
        },
        {
          id: "d",
          text: "Because the hardest questions always appear at the end of the paper",
        },
      ],
      explanation:
        "Ninety seconds is only the average. A recall question is answered in twenty seconds or not at all — extra staring does not produce the fact — while a K3 question requires deriving values, counting rules, or computing an estimate, and rushing one is how a knowable mark is lost. Every K3 objective in the syllabus sits in chapters 4 and 5, so you can predict roughly where the slow questions will be. The paper is genuinely timed and auto-submits, questions can be answered in any order using the navigator, and difficulty is not ordered.",
    },
    {
      id: "q3",
      stem: "An option in a multiple-choice question reads: \"Static analysis eliminates the need for dynamic testing.\" What should this signal?",
      choices: [
        {
          id: "a",
          text: "It is probably a distractor — absolutes like 'eliminates', 'always' and 'proves' rarely survive in a discipline built on reducing probability",
          correct: true,
        },
        {
          id: "b",
          text: "It is probably correct, since static testing finds defects earlier and more cheaply",
        },
        {
          id: "c",
          text: "It cannot be judged without knowing the specific project context",
        },
        {
          id: "d",
          text: "It is correct only for safety-critical systems",
        },
      ],
      explanation:
        "Absolute claims are the most reliable tell in the paper: testing reduces risk, increases confidence and finds a subset of what is there, so options promising elimination, guarantees or proof are almost always wrong. This one is also substantively false — static and dynamic testing find different classes of defect, which is chapter 3's central point, so neither removes the need for the other. The rare exceptions are the syllabus's genuine guarantees, such as 100% branch coverage implying 100% statement coverage, and you know those by name.",
    },
  ],
};
