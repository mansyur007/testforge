import type { Lesson } from "../../types";

// §7.2/§7.3: written from the published learning objectives for this chapter,
// in our own words. No syllabus text is reproduced and no question here is
// derived from any real or sample paper.
export const ch1Fundamentals: Lesson = {
  slug: "ch1-fundamentals",
  title: "Chapter 1 — Fundamentals of testing",
  summary:
    "What testing is, why it's needed, the seven principles, the test process, and the tester's mindset.",
  minutes: 25,
  status: "draft",
  body: `
## How to read this track

This is not a first course in testing — Track 1 is. This is **exam preparation**:
the same material arranged the way the paper asks about it, with the
distinctions that decide marks pulled to the front.

Chapter 1 supplies **8 of the 40 questions** in our practice paper, which makes
it the third-heaviest chapter, and by some distance the cheapest to score on.
Every objective here is **K1 (recall) or K2 (explain, compare, classify)** —
there is **no K3 in this chapter**, so no question can require you to apply a
technique or work anything out. If you find yourself calculating, you have
misread the question.

The chapter has 14 learning objectives across five sections:

| Section | Objectives | What it wants |
|---|---|---|
| 1.1 What testing is | 2 | Test objectives; testing versus debugging |
| 1.2 Why it is necessary | 3 | Contribution to success; testing versus QA; error → defect → failure |
| 1.3 Testing principles | 1 | All seven, and what each one licenses |
| 1.4 Activities, testware, roles | 5 | The activities, context, testware, traceability, roles |
| 1.5 Skills and practices | 3 | Tester skills; whole-team approach; independence |

Section 1.4 is over a third of the chapter. Weight your revision accordingly.

## 1.1 What testing is

**Testing is more than running tests.** It includes planning, analysing,
designing, reporting and evaluating — and it includes **static** work (reviewing
a document) as well as **dynamic** work (executing software). A question that
defines testing as "executing software to find defects" is offering you a
distractor.

**Typical objectives of testing** — the list worth being able to recognise:

- evaluating work products: requirements, designs, code, user stories
- causing failures and finding defects
- ensuring the required coverage of a test object
- reducing the level of risk of inadequate quality
- **verifying** that specified requirements have been met
- **validating** that the object works as users expect and is fit for purpose
- building confidence, and providing information for decision-making
- complying with contractual, legal or regulatory requirements or standards

Verification and validation are a standing exam favourite: **verification asks
whether it was built right, validation asks whether the right thing was built.**
A product can pass every requirement and still fail validation.

**Testing versus debugging.** Different activities with different owners:

| | Testing | Debugging |
|---|---|---|
| Finds | A failure | The cause of the failure |
| Then | Reports it | Reproduces, diagnoses, fixes |
| After the fix | **Confirmation testing** checks it | — |

Two nuances the paper likes. Static testing can find a **defect directly**, with
no failure involved, so nothing needs reproducing — the fix is all that remains.
And in a whole-team setting a tester may well help debug; that does not make
debugging a testing activity.

## 1.2 Why testing is necessary

**How it contributes to success.** Testing reduces the risk of failures in
operation, is a cost-effective way of finding defects, helps meet contractual or
regulatory obligations, and — the part people forget — **prevents** defects when
testers are involved early, because reviewing a requirement removes a defect
before any code carries it.

**Testing is not quality assurance.** This distinction is examined more often
than its size suggests:

| | Focus | Nature |
|---|---|---|
| **Quality assurance** | The **process** — is a good process being followed? | Preventive |
| **Quality control** | The **product** — does what we built meet the bar? | Corrective |
| **Testing** | A major form of quality control | Corrective |

Fixing a defect improves the product; changing how requirements are reviewed so
that class of defect stops arriving is QA.

**Error, defect, failure, root cause.** The causal chain, and the two exceptions
that carry most of the marks:

1. A person makes an **error** (a mistake).
2. The error produces a **defect** in a work product (a fault in code, a
   document, a design).
3. If the defective code is executed under the right conditions, a **failure**
   occurs — the observable wrong behaviour.
4. The **root cause** is the origin of the error: the reason the mistake was
   made, and the thing an improvement should address.

- **Not every defect causes a failure.** Code that is never executed, or is
  executed only under conditions that never arise, hides its defect
  indefinitely.
- **Not every failure is caused by a defect.** Environmental conditions —
  radiation, electromagnetic interference, pollution — can alter execution
  without anybody having made a mistake.

If a question asks what *causes* a failure and offers both "a defect in the code"
and "an error made by a developer", read carefully: the error caused the defect,
the defect caused the failure.

## 1.3 The seven principles

One objective, but a reliable one to two questions. Track 1's
[seven principles lesson](/academy/fundamentals/seven-principles) teaches them;
here is what each one is *for*, because the paper tests the consequence rather
than the name:

1. **Testing shows the presence of defects, not their absence.** Passing tests
   never prove correctness. Testing reduces the probability of undiscovered
   defects; it cannot get it to zero.
2. **Exhaustive testing is impossible.** Except for genuinely trivial cases, you
   cannot test every input and combination — which is *why* techniques,
   prioritisation and risk exist. This principle licenses the rest of the
   syllabus.
3. **Early testing saves time and money.** Static and dynamic testing started
   early find defects while they are cheap; this is the shift-left argument.
4. **Defects cluster together.** A small number of modules usually contains most
   of the defects, which is what makes it rational to concentrate effort where
   defects have already been found.
5. **Tests wear out.** Repeating the same tests stops finding new defects — the
   principle formerly known as the pesticide paradox. The response is to revise
   and add tests, not to abandon regression testing.
6. **Testing is context dependent.** There is no universally correct approach; a
   safety-critical system and an internal reporting tool are not tested the same
   way.
7. **The absence-of-defects fallacy.** Finding and fixing many defects does not
   guarantee success — a system that meets every requirement can still be
   unusable, or the wrong system entirely. This is principle 1 and validation
   meeting each other.

Principles 4 and 5 are the pair most often confused. Clustering is about **where**
defects are; wearing out is about **repetition** losing its yield.

## 1.4 Test activities, testware and roles

The heaviest section: five objectives, and a third of the chapter's questions.

**The activities.** Seven of them, and they are **not a strict sequence** — they
overlap, iterate, and in an iterative lifecycle run largely in parallel:

| Activity | Produces | One-line job |
|---|---|---|
| **Test planning** | The test plan | Objectives, approach, resources, schedule |
| **Test monitoring and control** | Progress reports | Compare actual to plan; act on the difference |
| **Test analysis** | Test conditions | **What** to test — analyse the test basis |
| **Test design** | Test cases, coverage items | **How** to test it |
| **Test implementation** | Test procedures, data, suites, environment | Everything needed to be able to run |
| **Test execution** | Logs, defect reports | Run, compare actual to expected, report |
| **Test completion** | Completion report, archived testware | Close out, hand over, record lessons |

**Analysis versus design is the trap in this section.** Analysis identifies what
should be tested; design turns those conditions into concrete test cases. If a
question describes deciding *that* the discount rule needs testing, that is
analysis; deriving the boundary values for it is design.

**Context shapes the process.** Which activities you perform, how, and in what
depth depends on the stakeholders and their expectations, the team's skills, the
business domain, technical factors, project constraints (budget, time), the
organisation, and the lifecycle in use. This is principle 6 as a process
statement.

**Testware is the output of the activities**, and matching each artefact to its
activity is directly examinable — the table above is that objective. Note the
easy confusion: **test cases come from design, test procedures and test data
come from implementation.**

**Traceability** between the test basis, test conditions, test cases and results
is what lets you evaluate coverage, assess the impact of a change, audit the
process, report status in terms stakeholders understand, and demonstrate that
objectives were met. If a requirement changes, traceability tells you which tests
are now suspect — that is its most examined benefit.

**Roles, not job titles.** Two roles: **test management** (planning, monitoring,
control, completion reporting) and **testing** (analysis, design,
implementation, execution). One person can hold both, and in a whole-team setting
they can be spread across people who do not have "tester" in their job title.

## 1.5 Skills and good practices

**Generic tester skills** worth recognising: testing knowledge, thoroughness,
curiosity and attention to detail, good communication (with developers and with
stakeholders), analytical and critical thinking, domain knowledge, and technical
knowledge. Communication is on the list deliberately — a defect nobody acts on
was not usefully found.

**The whole-team approach.** Anyone with the necessary knowledge can perform any
task, and **everybody is responsible for quality**. Benefits: better
communication and collaboration, a quality mindset across the team, and testers
contributing to requirements discussions where they prevent defects rather than
find them. Its limitation is honest — it does not suit every context, which is
principle 6 again.

**Independence of testing**, and it cuts both ways:

| Benefits | Drawbacks |
|---|---|
| Independent testers recognise different kinds of failure | Isolation from the development team |
| They can challenge assumptions the authors cannot see | Developers may lose their sense of responsibility for quality |
| Bias is reduced — an author testing their own work is the weakest case | Independent testing can be seen as a bottleneck, and blamed for delay |

A question asking for a *drawback* of independence is asking for one of the right
column. "It costs more" is a plausible-sounding distractor that is not the
syllabus's point.

## The distinctions that decide marks

Everything above, compressed to what people actually get wrong:

| Confused pair | The line between them |
|---|---|
| Testing / debugging | Finding a failure / finding and fixing its cause |
| QA / testing | Process, preventive / product, corrective |
| Error / defect / failure | Human mistake / fault in a work product / observed wrong behaviour |
| Verification / validation | Built right / built the right thing |
| Test analysis / test design | What to test / how to test it |
| Test cases / test procedures | Output of design / output of implementation |
| Defect clustering / tests wearing out | Where defects are / repetition losing yield |
| Role / job title | Two roles exist; one person may hold both |

## Drill it

Reading a chapter is not revision. Take the chapter 1 quiz — eight questions,
untimed, every answer explained:

**[Chapter 1 quiz →](/academy/istqb/practice-exam/chapter/1)**

Score below 6 of 8 and the useful move is not re-reading this page, it is reading
the explanations on the ones you missed and coming back tomorrow. Every
explanation names the distinction being tested, and the distinctions are the
chapter.

**Next:** Chapter 2 — testing throughout the software development lifecycle.
`,
  selfCheck: [
    {
      id: "q1",
      stem: "A tester reports that the total on the invoice screen is wrong. A developer reproduces it, traces it to a rounding statement, and corrects it. Which statement is accurate?",
      choices: [
        {
          id: "a",
          text: "The tester performed testing and the developer performed debugging; confirmation testing then checks the fix",
          correct: true,
        },
        {
          id: "b",
          text: "Both activities are testing, because both are aimed at defect removal",
        },
        {
          id: "c",
          text: "The developer performed debugging, and no further testing is required once the fix is applied",
        },
        {
          id: "d",
          text: "The tester performed debugging, since identifying the wrong total is diagnosis",
        },
      ],
      explanation:
        "Testing causes and observes the failure; debugging reproduces it, diagnoses the cause and fixes it. They are distinct activities even when the same person happens to do both, which is common on a whole-team. The fix is then confirmed by re-executing the failing test — confirmation testing — and typically followed by regression testing, so the work is not finished when the code changes. Noticing that a total is wrong is observation, not diagnosis, so it is not debugging.",
    },
    {
      id: "q2",
      stem: "Which of these is true about the relationship between defects and failures?",
      choices: [
        {
          id: "a",
          text: "Every defect will eventually produce a failure if the system runs long enough",
        },
        {
          id: "b",
          text: "A defect need not ever cause a failure, and a failure can occur without any defect being present",
          correct: true,
        },
        {
          id: "c",
          text: "A failure always indicates a defect in the code under test",
        },
        {
          id: "d",
          text: "The root cause of a failure is the defect that produced it",
        },
      ],
      explanation:
        "A defect in code that is never executed, or is executed only under conditions that never occur, may never produce a failure at all. In the other direction, environmental conditions — radiation, electromagnetic interference, pollution — can alter execution and cause a failure with no defect involved. The root cause is not the defect either: it is the origin of the human error that introduced the defect, which is what a process improvement has to address.",
    },
    {
      id: "q3",
      stem: "A team decides that the new discount rule needs to be tested, and later derives the specific values to use at each tier boundary. Which activities are these?",
      choices: [
        {
          id: "a",
          text: "Test planning, then test implementation",
        },
        {
          id: "b",
          text: "Test analysis, then test design",
          correct: true,
        },
        {
          id: "c",
          text: "Test design, then test implementation",
        },
        {
          id: "d",
          text: "Test monitoring and control, then test execution",
        },
      ],
      explanation:
        "Test analysis answers what to test — it examines the test basis and identifies test conditions, of which 'the discount rule' is one. Test design answers how to test it, turning conditions into concrete test cases with their coverage items, which is where the boundary values are derived. Implementation comes after: assembling the test procedures, data, suites and environment needed to actually run what design produced. Keeping analysis and design apart is the most frequently examined distinction in this section.",
    },
    {
      id: "q4",
      stem: "Which of these are genuine drawbacks of independent testing as the syllabus presents it?",
      multi: true,
      choices: [
        {
          id: "a",
          text: "Isolation of the test team from the development team",
          correct: true,
        },
        {
          id: "b",
          text: "Developers may lose their own sense of responsibility for quality",
          correct: true,
        },
        {
          id: "c",
          text: "Independent testers may be seen as a bottleneck and blamed for delays",
          correct: true,
        },
        {
          id: "d",
          text: "Independent testers are less able to recognise different kinds of failure than the authors of the code",
        },
      ],
      explanation:
        "The first three are the drawbacks: distance from the development team, a diffusion of ownership where quality becomes somebody else's department, and the political position of being the last gate before release. The fourth inverts a benefit — independence exists precisely because an independent tester recognises different kinds of failure and can challenge assumptions the author is unable to see in their own work. Cost is a common distractor here and is not the syllabus's point either.",
    },
  ],
};
