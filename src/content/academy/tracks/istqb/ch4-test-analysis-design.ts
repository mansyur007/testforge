import type { Lesson } from "../../types";

// §7.2/§7.3: written from the published learning objectives for this chapter,
// in our own words. No syllabus text is reproduced and no question here is
// derived from any real or sample paper. The worked examples are original.
export const ch4TestAnalysisDesign: Lesson = {
  slug: "ch4-test-analysis-design",
  title: "Chapter 4 — Test analysis and design",
  summary:
    "Black-box, white-box and experience-based techniques, plus collaboration-based approaches.",
  minutes: 30,
  status: "published",
  body: `
## The chapter that decides your result

Chapter 4 supplies **11 of the 40 questions** in our practice paper — more than
any other chapter, and more than chapters 3 and 6 combined. It is also the first
chapter with **K3 objectives**, and that is a change of kind, not of degree.

K1 and K2 questions ask you to recall or explain. **K3 asks you to apply a
technique to material printed in the question** and produce an answer: a number
of test cases, a set of values, a coverage percentage. You cannot revise for
those by reading. You have to do them until the mechanics are automatic, because
under exam timing you will have roughly ninety seconds each.

| Section | Objectives | K-levels | What it wants |
|---|---|---|---|
| 4.1 Overview | 1 | K2 | The three categories, and what each is based on |
| 4.2 Black-box techniques | 4 | **All K3** | Apply EP, BVA, decision tables, state transition |
| 4.3 White-box techniques | 3 | K2 | Statement, branch, and what white-box is worth |
| 4.4 Experience-based | 3 | K2 | Error guessing, exploratory, checklist-based |
| 4.5 Collaboration-based | 3 | K2, K2, **K3** | User stories, acceptance criteria, ATDD |

**Five of the chapter's 14 objectives are K3, and four of them are in §4.2.**
That is where to spend your practice time.

## 4.1 The three categories

| Category | Derived from | Sees the code? |
|---|---|---|
| **Black-box** | The specified behaviour of the test object | No |
| **White-box** | The internal structure or implementation | Yes |
| **Experience-based** | The knowledge and experience of the tester | Either |

Black-box techniques do not depend on how something is built, so tests survive a
rewrite. White-box techniques measure how much of the structure you exercised.
Experience-based techniques find what the other two miss, precisely because they
are not derived from a document that may itself be incomplete.

## 4.2 Black-box techniques — the K3 section

Track 1 teaches all four in depth:
[equivalence partitioning](/academy/fundamentals/equivalence-partitioning),
[boundary value analysis](/academy/fundamentals/boundary-value-analysis),
[decision tables](/academy/fundamentals/decision-tables) and
[state transition testing](/academy/fundamentals/state-transition-testing).
What follows is the exam-shaped version: how the question is posed, how you
count, and where the marks leak.

### Equivalence partitioning

Divide the input (or output) domain into partitions whose members should all be
handled the same way, then test one value from each. Every partition is either
**valid** or **invalid**, and the domain must be partitioned completely — every
possible value belongs to exactly one partition.

**Worked example.** A field accepts an age from 18 to 65 inclusive.

| Partition | Type | A representative value |
|---|---|---|
| below 18 | invalid | 12 |
| 18–65 | valid | 40 |
| above 65 | invalid | 70 |
| non-numeric | invalid | "abc" |

**Coverage = partitions exercised ÷ total partitions × 100%.** Four partitions,
four tests, 100%.

**The rule that costs marks: exercise only one invalid partition per test.** If
you submit age 12 *and* a non-numeric value in the same test and it is rejected,
you cannot tell which rule rejected it — and the second defect stays hidden.
Valid partitions may be combined freely.

### Boundary value analysis

BVA refines EP: defects cluster at the edges of ordered partitions, so test the
edges. It applies **only where the partition is ordered** — 18 to 65 has
boundaries, "payment method" does not.

Two variants, and the exam expects you to know which one it asked for:

| For the valid range 18–65 | Values tested |
|---|---|
| **2-value BVA** | Each boundary and its nearest neighbour outside: **17, 18, 65, 66** |
| **3-value BVA** | Each boundary plus both neighbours: **17, 18, 19, 64, 65, 66** |

**Coverage = boundary values exercised ÷ total boundary values × 100%.**

Count carefully. A question that says "using 3-value boundary value analysis, how
many test cases are needed for full coverage" is asking you to count values, not
partitions — and it is asking whether you remember that 3-value BVA takes the
neighbour on *both* sides.

### Decision table testing

For rules that combine conditions. Conditions go on top, actions below, and each
**column is a rule** — one combination of conditions with the actions it
triggers.

**Worked example.** Free shipping applies when the order is over 50 **and** the
customer is a member; members always get 10% off.

| | R1 | R2 | R3 | R4 |
|---|---|---|---|---|
| **Order over 50** | T | T | F | F |
| **Member** | T | F | T | F |
| Free shipping | ✓ | – | – | – |
| 10% discount | ✓ | – | ✓ | – |

**Full coverage means one test per rule**, so four tests here. With *n* binary
conditions a full table has **2ⁿ** columns — three conditions give eight, four
give sixteen, and that growth is why tables get collapsed.

**Collapsing** merges columns where a condition cannot affect the outcome,
marking it "–" (don't care). A collapsed table has fewer rules, and therefore
fewer tests, without losing the combinations that matter. If a question shows a
table with dashes, count the columns it shows — not 2ⁿ.

### State transition testing

For behaviour that depends on what happened before. Four ingredients: **states**,
**events** that trigger transitions, **transitions** between states, and
optionally **guards** and **actions**.

**Worked example.** A login that locks after three failures:

| State | Event | Next state |
|---|---|---|
| Logged out | valid credentials | Logged in |
| Logged out | invalid credentials (1st, 2nd) | Logged out |
| Logged out | invalid credentials (3rd) | Locked |
| Logged in | log out | Logged out |
| Locked | reset password | Logged out |

Three coverage criteria, in increasing strength:

- **All states**: every state visited at least once.
- **All valid transitions** (0-switch coverage): every arrow in the diagram
  exercised at least once. This is the usual meaning of "100% coverage" here.
- **All transitions**, valid *and* invalid: every state-event pair in the state
  **table**, including the cells the diagram does not draw — what happens if you
  send "reset password" while logged in?

**A state diagram shows only valid transitions; a state table shows every
state–event pair, including the impossible ones.** That difference is exactly
what a question exploits when it asks how many tests are needed for a state
table versus a diagram.

## 4.3 White-box techniques

Back to K2 — you must explain these, not compute large examples, though the
arithmetic is simple enough that a question may still ask for a percentage.

**Statement testing** exercises executable statements.
**Coverage = statements exercised ÷ total statements × 100%.**

**Branch testing** exercises decision outcomes — every branch taken and not
taken. **Coverage = branches exercised ÷ total branches × 100%.**

**The single most examined fact in this section:**

> **100% branch coverage guarantees 100% statement coverage. The reverse is not
> true.**

Here is why, in four lines:

~~~
1  if (balance > 100) {
2      applyBonus();
3  }
4  print(balance);
~~~

One test with \`balance = 150\` executes every statement — **100% statement
coverage** — while the false branch is never taken, so branch coverage is only
50%. If the defect lives in what should have happened when the condition is
false, statement coverage said "complete" and found nothing.

**What white-box testing is worth.** It measures coverage of the code
*objectively*, rather than by anyone's opinion of thoroughness; it finds
unreachable code, dead code and undocumented behaviour; and it exercises the
implementation as it is rather than as the specification describes it.

**And its limit, which is examined as often as its value:** white-box techniques
**cannot find a requirement that was never implemented.** There is no code to
cover. That is why it complements black-box testing rather than replacing it.

## 4.4 Experience-based techniques

| Technique | What it is | Its weakness |
|---|---|---|
| **Error guessing** | Anticipating errors, defects and failures from experience, then attacking them deliberately — often from a checklist of past defect types | Depends entirely on the tester's experience |
| **Exploratory testing** | Designing, executing and learning **at the same time**, usually time-boxed under a **charter**, with notes recorded | Hard to reproduce and to measure; not a substitute for structured coverage |
| **Checklist-based** | Testing guided by a checklist of items to verify, built from experience | Checklists **lose effectiveness** as they age and get repeated |

Two things to be precise about. **Exploratory testing is not ad hoc testing** —
it is time-boxed, chartered and documented, which is what makes it a technique
rather than clicking around; it is most valuable where specifications are poor,
time is short, or the team needs to learn the product quickly. And the checklist
weakness is chapter 1's *tests wear out* principle wearing a different hat.

## 4.5 Collaboration-based approaches

**Writing user stories collaboratively.** The **three C's**:

- **Card** — the story itself, small enough to fit on one
- **Conversation** — how the feature is explained and understood, which is where
  the real requirement is settled
- **Confirmation** — the acceptance criteria that say when it is done

Written by the three perspectives together — business, development, testing —
which is why defects get prevented rather than found.

**Two ways of writing acceptance criteria:**

| Style | Shape |
|---|---|
| **Scenario-oriented** | **Given** a precondition, **when** an event occurs, **then** an outcome follows |
| **Rule-oriented** | A verification list, or a bulleted set of rules the feature must satisfy |

**ATDD (K3) — deriving test cases from acceptance criteria.** The team writes
the tests *before* development starts, from the criteria themselves. This
objective is K3, so a question can print a criterion and ask what tests come out
of it.

**Worked example.** Criterion: *Given a member with an order over 50, when they
check out, then shipping is free.*

| Test | Derived from | Expected |
|---|---|---|
| Member, order 60 | The criterion as stated | Free shipping |
| Member, order 50 | Boundary — is "over" inclusive? | Per the rule; **ask if unstated** |
| Member, order 40 | Negative — the condition unmet | Shipping charged |
| Non-member, order 60 | Negative — the other condition unmet | Shipping charged |

Note what that example demonstrates, because it is the objective's point:
**derivation produces positive *and* negative tests**, and it surfaces the
ambiguity in "over 50" before a line of code exists — which is chapter 3's
argument for static testing arriving from the other direction.

## The distinctions that decide marks

| Confused pair | The line between them |
|---|---|
| Statement / branch coverage | 100% branch ⇒ 100% statement; never the reverse |
| 2-value / 3-value BVA | Neighbour on one side / on both sides |
| Partitions / boundary values | What EP counts / what BVA counts |
| Valid partitions / invalid partitions | Combine freely / **one invalid per test** |
| Full decision table / collapsed | 2ⁿ rules / fewer, with "don't care" cells — count what is printed |
| State diagram / state table | Valid transitions only / every state–event pair, including invalid |
| All states / all transitions | Visiting each state / exercising every arrow |
| Exploratory / ad hoc | Chartered, time-boxed, documented / unstructured |
| White-box value / white-box limit | Objective coverage of code / blind to what was never written |
| Black-box / experience-based | Derived from the specification / from the tester's knowledge |

## How to spend the last week

For this chapter specifically, and it is different from the others: **do not
re-read it.** Work the four §4.2 techniques against fresh material until you can
produce the partitions, the boundary values, the rule count and the transition
count without hesitating. In the exam these questions are worth more than a
quarter of the paper and they are the only ones where the answer is
unambiguously right or wrong — which cuts both ways.

## Drill it

**[Chapter 4 quiz →](/academy/istqb/practice-exam/chapter/4)**

Eight questions, untimed, every answer explained. Time yourself anyway: if a K3
question takes you more than two minutes here, it will cost you two questions
elsewhere on the real paper.

**Next:** Chapter 5 — managing the test activities, the chapter with the most
objectives of any in the syllabus.
`,
  selfCheck: [
    {
      id: "q1",
      stem: "A field accepts values from 10 to 99 inclusive. Using 3-value boundary value analysis, which values does the valid range's lower boundary contribute?",
      choices: [
        {
          id: "a",
          text: "9, 10 and 11",
          correct: true,
        },
        {
          id: "b",
          text: "9 and 10",
        },
        {
          id: "c",
          text: "10 and 11",
        },
        {
          id: "d",
          text: "10 only, since it is the boundary",
        },
      ],
      explanation:
        "3-value boundary value analysis takes the boundary itself plus its neighbours on both sides, so the lower boundary contributes 9, 10 and 11 (and the upper would contribute 98, 99 and 100). The 2-value variant takes only the boundary and its nearest neighbour outside the partition — 9 and 10 — which is option b, and the exam expects you to know which variant was asked for. Reading 'boundary value analysis' without noticing the 2- or 3-value qualifier is the most common way to lose this mark.",
    },
    {
      id: "q2",
      stem: "A test suite achieves 100% statement coverage of a module. What can you conclude about its branch coverage?",
      choices: [
        {
          id: "a",
          text: "Branch coverage is also 100%, since every statement was executed",
        },
        {
          id: "b",
          text: "Branch coverage may be less than 100% — an `if` without an `else` reaches every statement while never taking the false outcome",
          correct: true,
        },
        {
          id: "c",
          text: "Branch coverage is exactly half of statement coverage",
        },
        {
          id: "d",
          text: "Nothing at all can be inferred between the two measures",
        },
      ],
      explanation:
        "The implication runs one way only: 100% branch coverage guarantees 100% statement coverage, but not the reverse. An `if` with no `else` is the standard counter-example — a single test that satisfies the condition executes every statement in the module while the false outcome is never exercised, leaving branch coverage at 50%. That matters because a defect in what should happen when the condition is false sits in a path statement coverage has already declared complete. The relationship is a fixed implication, not a ratio, and it is the most examined fact in §4.3.",
    },
    {
      id: "q3",
      stem: "You are testing a form with three invalid input partitions. Why should each test exercise only one invalid partition at a time?",
      choices: [
        {
          id: "a",
          text: "Because combining them would exceed the maximum number of test cases allowed by the technique",
        },
        {
          id: "b",
          text: "Because a rejection would not tell you which invalid input caused it, so a second defect can stay hidden behind the first",
          correct: true,
        },
        {
          id: "c",
          text: "Because invalid partitions cannot be combined with each other in equivalence partitioning",
        },
        {
          id: "d",
          text: "Because each invalid partition belongs to a different boundary",
        },
      ],
      explanation:
        "If a test submits two invalid values and the system rejects it, you have learned only that something was rejected — the validation for the second input may be missing entirely and you would never know, because the first rejection masked it. That is why invalid partitions are exercised one per test while valid partitions may be combined freely. Nothing in the technique caps the number of test cases, and there is no rule forbidding the combination in principle; the reason is diagnostic, which is what the question is really testing.",
    },
    {
      id: "q4",
      stem: "Which statements about experience-based and white-box techniques are correct?",
      multi: true,
      choices: [
        {
          id: "a",
          text: "White-box techniques cannot reveal a requirement that was never implemented, because there is no code to cover",
          correct: true,
        },
        {
          id: "b",
          text: "Exploratory testing is time-boxed and guided by a charter, with notes recorded — it is not the same as ad hoc testing",
          correct: true,
        },
        {
          id: "c",
          text: "Checklist-based testing loses effectiveness as the same checklist is used repeatedly",
          correct: true,
        },
        {
          id: "d",
          text: "Error guessing is a black-box technique, since it derives tests from the specification",
        },
      ],
      explanation:
        "The blindness of white-box testing to unimplemented requirements is its defining limit and the reason it complements rather than replaces black-box work. Exploratory testing's charter, timebox and notes are exactly what separate a technique from unstructured clicking, and they are how it gets managed and measured. Checklists ageing is chapter 1's 'tests wear out' principle appearing again. Error guessing is experience-based, not black-box: it is derived from the tester's knowledge of what tends to go wrong, not from any specification.",
    },
  ],
};
