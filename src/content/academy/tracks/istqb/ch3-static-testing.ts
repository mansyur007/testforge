import type { Lesson } from "../../types";

// §7.2/§7.3: written from the published learning objectives for this chapter,
// in our own words. No syllabus text is reproduced and no question here is
// derived from any real or sample paper.
export const ch3StaticTesting: Lesson = {
  slug: "ch3-static-testing",
  title: "Chapter 3 — Static testing",
  summary:
    "Reviews, the review process, and what static analysis catches that execution can't.",
  minutes: 18,
  status: "draft",
  body: `
## What this chapter costs

Chapter 3 supplies **4 of the 40 questions** in our practice paper — the second
smallest chapter — across 8 objectives, all K1 or K2.

| Section | Objectives | What it wants |
|---|---|---|
| 3.1 Static testing basics | 3 | What can be examined, its value, static versus dynamic |
| 3.2 Feedback and the review process | 5 | Early feedback, the activities, the roles, the types, success factors |

Small chapter, high density: §3.2's five objectives are mostly **lists you either
know or do not**, which makes this the cheapest chapter per hour of revision in
the whole syllabus. The two things that reliably cost marks are *who leads which
review type* and *what static testing finds that dynamic testing cannot*.

## 3.1 Static testing basics

**Static testing does not execute the software.** It has two forms: **reviews**
of work products by people, and **static analysis** by tools, which examines code
and other artefacts without running them.

**What can be examined statically?** Very nearly anything readable: requirements
and specifications, source code, designs and models, test plans, test cases and
test charters, product backlog items, contracts, and user documentation. The
practical limit is the one to remember — **it must be documented**. Knowledge
that lives only in someone's head cannot be reviewed.

**Why it is worth doing.** Four arguments, and the second is the examinable one:

1. It finds defects **early**, when they are cheapest to fix — chapter 1's third
   principle applied.
2. It finds defects that dynamic testing **cannot find at all**: unreachable or
   dead code, and — far more importantly — defects in the *test basis* itself.
   Ambiguity, inconsistency, omission, duplication and untestable requirements
   are invisible to execution, because there is nothing to execute.
3. It builds shared understanding and consensus between participants.
4. It improves maintainability and consistency of the product.

That second point is the chapter's centre of gravity: **a requirement that
contradicts itself will pass every test you can write against it**, because the
tests inherit the contradiction.

**Static versus dynamic**, and the distinction the exam wants precisely:

| | Static testing | Dynamic testing |
|---|---|---|
| Software runs? | No | Yes |
| Finds | **Defects, directly** | **Failures**, from which defects are found |
| Can start | As soon as a draft exists | Once something executable exists |
| Also assesses | Maintainability, consistency, testability | Behaviour under conditions |

Both aim at improving quality and both find defects — that shared purpose is why
questions can make the two sound interchangeable. The separator is that dynamic
testing observes a *failure* and infers a defect, while a review reads the defect
off the page.

## 3.2 Feedback and the review process

**Why early and frequent stakeholder feedback.** It surfaces risks early,
prevents misunderstandings about requirements, and lets the team build what the
customer actually needs rather than discovering the gap at acceptance. The
alternative is expensive rework, and the syllabus frames it exactly that way.

**The review process has five activities**, and they are examinable in order:

| Activity | What happens |
|---|---|
| **Planning** | Define scope, objectives, type, roles, entry and exit criteria |
| **Review initiation** | Give participants the work product and everything they need |
| **Individual review** | Each reviewer examines it alone and notes possible defects |
| **Communication and analysis** | Discuss, decide what is really a defect, agree what to do |
| **Fixing and reporting** | The author fixes; defects are reported and status tracked |

Note that **individual review comes before the meeting**, and that a large part
of a review's value is realised there. That is also why "participants had time to
prepare" is one of the success factors.

**The roles**, and their responsibilities:

| Role | Responsibility |
|---|---|
| **Manager** | Decides what is reviewed, allocates time and resources |
| **Author** | Wrote the work product; fixes the defects found |
| **Moderator / facilitator** | Runs the meeting, keeps it effective and safe |
| **Scribe / recorder** | Records the defects found and the decisions taken |
| **Reviewer** | Examines the work product and reports possible defects |
| **Review leader** | Takes overall responsibility, decides who takes part, schedules it |

One person may hold more than one role — the same rule chapter 1 gave for test
management and testing roles.

**The four review types**, in increasing formality. This table is where the
chapter's marks are:

| Type | Led by | Characteristics |
|---|---|---|
| **Informal review** | No formal process | No documented output required; cheap, common, useful |
| **Walkthrough** | **The author** | Author leads the group through it; scenario-based; may include preparation |
| **Technical review** | A **trained moderator** (not the author) | Technically qualified peers; aims at consensus and technical decisions |
| **Inspection** | A **trained moderator** (not the author) | Most formal: defined roles, entry and exit criteria, metrics collected, process improvement |

**The exam question here is almost always "who leads it".** The walkthrough is
the one led by its author; the technical review and the inspection are
deliberately not, because the author is the person least able to see their own
omissions.

**What makes a review succeed** — a K1 list, and the items that get tested are
the human ones:

- clear, agreed objectives, and the **right review type** for those objectives,
  the people, and the situation
- work products reviewed in **small chunks**, so attention holds
- participants given **adequate time to prepare**
- **feedback given constructively** — defects raised about the work product, not
  about the author
- management supports it, and it is part of the organisation's culture
- participants are trained, and meetings are well led

A review culture dies from feedback that reads as personal criticism, and the
syllabus says so; a question offering "defects are attributed to the responsible
individual" as a success factor is offering a failure factor.

## The distinctions that decide marks

| Confused pair | The line between them |
|---|---|
| Static / dynamic | Finds defects directly / observes failures and infers defects |
| Walkthrough / inspection | Led by the author / led by a trained moderator, most formal |
| Technical review / inspection | Consensus and technical decisions / formal, metrics, entry-exit criteria |
| Review / static analysis | People reading a work product / tools examining it unexecuted |
| Individual review / the meeting | Preparation, where much of the value is / discussion and decisions |
| Author's role | Fixes defects; never leads a technical review or inspection |
| Constructive feedback / attribution | A success factor / the thing that kills the practice |

## Drill it

**[Chapter 3 quiz →](/academy/istqb/practice-exam/chapter/3)**

Eight questions, untimed, every answer explained. This chapter rewards a second
pass more than any other — the lists are short, and the questions are drawn
almost directly from them.

**Next:** Chapter 4 — test analysis and design, the largest chapter in the
syllabus and the first with K3 objectives, where you have to apply a technique
rather than recognise one.
`,
  selfCheck: [
    {
      id: "q1",
      stem: "Which review type is led by the author of the work product?",
      choices: [
        {
          id: "a",
          text: "Walkthrough",
          correct: true,
        },
        {
          id: "b",
          text: "Inspection",
        },
        {
          id: "c",
          text: "Technical review",
        },
        {
          id: "d",
          text: "All review types are led by the author, since they know the material best",
        },
      ],
      explanation:
        "The walkthrough is the type where the author leads the group through the work product, often scenario by scenario. The technical review and the inspection are led by a trained moderator or facilitator precisely because the author is the person least able to see their own omissions — the inspection being the most formal, with defined roles, entry and exit criteria, and collected metrics. 'Who leads it' is the single most examined fact in this chapter.",
    },
    {
      id: "q2",
      stem: "What can static testing find that dynamic testing cannot?",
      choices: [
        {
          id: "a",
          text: "Failures that occur only under heavy load",
        },
        {
          id: "b",
          text: "Defects in the test basis itself — ambiguous, inconsistent, missing or untestable requirements — and unreachable or dead code",
          correct: true,
        },
        {
          id: "c",
          text: "Defects caused by the production environment's configuration",
        },
        {
          id: "d",
          text: "Nothing — static testing finds a subset of what execution finds, earlier",
        },
      ],
      explanation:
        "A contradictory or ambiguous requirement cannot be found by executing anything, because the tests written from it inherit the same contradiction and pass. Dead and unreachable code is the other classic example: by definition execution never reaches it. This is why static testing is not merely an earlier version of dynamic testing — the two find genuinely different classes of defect. Load-related failures and environment-specific behaviour need execution in a realistic environment, which is dynamic testing's territory.",
    },
    {
      id: "q3",
      stem: "Which of these are success factors for reviews as the syllabus presents them?",
      multi: true,
      choices: [
        {
          id: "a",
          text: "Reviewing the work product in small chunks rather than all at once",
          correct: true,
        },
        {
          id: "b",
          text: "Giving participants adequate time to prepare before the meeting",
          correct: true,
        },
        {
          id: "c",
          text: "Raising defects constructively, about the work product rather than its author",
          correct: true,
        },
        {
          id: "d",
          text: "Recording which individual was responsible for each defect found, so accountability is clear",
        },
      ],
      explanation:
        "Small chunks keep attention and yield high; preparation matters because individual review is where a large share of the defects are actually found, before anyone meets; and constructive framing is what keeps people willing to submit work at all. The fourth is the inversion — attributing defects to individuals is how a review culture dies, and the syllabus treats psychological safety as a condition of the practice working rather than as an optional courtesy.",
    },
  ],
};
