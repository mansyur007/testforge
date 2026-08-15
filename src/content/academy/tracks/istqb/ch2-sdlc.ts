import type { Lesson } from "../../types";

// §7.2/§7.3: written from the published learning objectives for this chapter,
// in our own words. No syllabus text is reproduced and no question here is
// derived from any real or sample paper.
export const ch2Sdlc: Lesson = {
  slug: "ch2-sdlc",
  title: "Chapter 2 — Testing throughout the SDLC",
  summary:
    "Development models, test levels, test types, and maintenance testing.",
  minutes: 22,
  status: "published",
  body: `
## What this chapter costs

Chapter 2 supplies **6 of the 40 questions** in our practice paper, across 10
objectives — and as in chapter 1, **every one is K1 or K2**. Nothing here asks
you to apply a technique.

| Section | Objectives | What it wants |
|---|---|---|
| 2.1 Testing in the context of an SDLC | 6 | Lifecycles, good practices, test-first, DevOps, shift left, retrospectives |
| 2.2 Test levels and test types | 3 | The five levels, the four types, confirmation versus regression |
| 2.3 Maintenance testing | 1 | Its three triggers, and what decides its scope |

Note the shape: **§2.1 is 6 of the 10 objectives**, but §2.2 is where most people
lose marks, because level-versus-type is the most reliably confused pair in the
whole syllabus. Read §2.1 for recognition and §2.2 for precision.

## 2.1 Testing in the context of a lifecycle

**How the lifecycle changes testing.** The model in use affects the *timing* of
test activities, the *level of detail* of test documentation, the *techniques*
chosen, and the *extent of automation*. Sequential models (waterfall, V-model)
put each level after the corresponding development stage; iterative and
incremental models (Scrum, Kanban, spiral) run them continuously, in smaller
pieces, and rely far more on regression automation because the same ground is
re-covered every iteration.

Track 1's [SDLC and STLC lesson](/academy/fundamentals/sdlc-and-stlc) covers the
models themselves. What the exam wants is the *consequence* for testing.

**Good practices that hold in every lifecycle** — a K1 list worth recognising:

- every development activity has a corresponding test activity
- each test level has objectives **specific to that level**, so the same thing is
  not tested three times
- test analysis and design for a level begin **during** the corresponding
  development activity, not after it
- testers review work products **as soon as drafts exist**

**Test-first approaches.** All three write tests before the code; the exam
distinguishes them by *who* and *in what language*:

| | Written from | Expressed as | Mostly at |
|---|---|---|---|
| **TDD** | The developer's intent for the code | Unit tests, then code, then refactor | Component level |
| **ATDD** | Acceptance criteria, agreed with the business | Acceptance tests | Feature level |
| **BDD** | Desired behaviour, in business language | Given / When / Then scenarios | Feature level |

**DevOps.** Continuous integration and delivery, automated build and test,
shared responsibility for quality, and fast feedback. Its benefits and its costs
are both examinable: faster feedback and higher confidence in the pipeline,
against real setup effort, extra infrastructure, and the fact that **automation
does not replace exploratory and other manual testing** — a delivery pipeline
can only run the checks somebody thought of.

**Shift left** means testing earlier: reviewing requirements, writing tests
before the code, static analysis, and pulling non-functional testing forward
instead of leaving it to the week before release. The honest caveat the syllabus
makes and candidates forget: **shift left can cost more up front**, and it needs
management buy-in rather than a tester's enthusiasm.

**Retrospectives** are the syllabus's process-improvement mechanism. Held at the
end of an iteration, milestone or project, their benefits are increased test
effectiveness and efficiency, better testware quality, better test basis quality,
and team learning. If a question asks where testing process improvement lives in
an Agile lifecycle, this is the answer it wants.

## 2.2 Test levels and test types

**The five levels**, distinguished by test object, objectives, test basis, the
kinds of defect they find, and who is responsible:

| Level | Object | Typically finds |
|---|---|---|
| **Component** (unit) | A single component in isolation | Logic errors in that component |
| **Component integration** | Interfaces between components | Wrong data passed, interface mismatches |
| **System** | The whole system's behaviour | Requirements not met, end-to-end flow defects |
| **System integration** | Interfaces with other systems and services | Interface and interoperability defects |
| **Acceptance** | Fitness for purpose, readiness to deploy | Whether it does what users actually need |

**Acceptance testing has forms**, and they are worth knowing by name: user
acceptance testing, operational acceptance testing (backup, restore, security,
disaster recovery), contractual and regulatory acceptance, and **alpha and beta
testing** — alpha at the developing organisation's site, beta at the customer's.

**The four test types:**

| Type | Asks |
|---|---|
| **Functional** | *What* does it do? |
| **Non-functional** | *How well* does it do it? |
| **Black-box** | Behaviour derived from a specification, without regard to internals |
| **White-box** | Derived from the internal structure |

**The trap, and it is the chapter's biggest: every type can be applied at every
level.** Performance testing at component level is normal. Black-box technique at
component level is normal. A question offering "non-functional testing is
performed at system level only" is offering you a false statement.

The second trap is level versus type generally:

> A **level** is a group of test activities organised around a **test object** —
> it answers *when* and *on what*. A **type** groups activities around a
> **quality characteristic or approach** — it answers *what is being evaluated*.

Track 1's [test levels](/academy/fundamentals/test-levels) and
[test types](/academy/fundamentals/test-types) lessons teach these; the exam tests
that you never mix the two words.

**Confirmation versus regression** — both are *change-related* testing:

- **Confirmation testing** re-executes what failed, to check the fix worked.
- **Regression testing** checks the change has not broken something that was
  working, elsewhere.

Regression suites grow, run often, and change rarely — which is exactly the
profile that makes them the strongest candidate for automation.

## 2.3 Maintenance testing

One objective, and reliably one question. **Three triggers:**

| Trigger | Examples |
|---|---|
| **Modification** | Enhancements, corrective changes, environment upgrades, patches, hot fixes |
| **Migration** | Moving to another platform; data conversion, plus operational tests of the new environment |
| **Retirement** | Data archiving, and testing the **restore and retrieval** procedures |

Retirement is the one people forget, and it is the one that shows up in a
question: decommissioning a system still needs testing, because archived data has
to be readable afterwards.

**Scope depends on** the risk of the change, the size of the existing system, and
the size of the change. **Impact analysis** is what identifies the areas affected
and therefore how much regression testing the change deserves — and the syllabus
is clear that impact analysis can be difficult when specifications are out of
date or missing.

## The distinctions that decide marks

| Confused pair | The line between them |
|---|---|
| Test level / test type | Object and timing / what is being evaluated |
| "Types belong to levels" | Any type can be applied at any level |
| Confirmation / regression | Did the fix work / did the fix break anything else |
| Component integration / system integration | Between our components / between systems |
| Alpha / beta | At the developer's site / at the customer's |
| TDD / ATDD / BDD | Unit-level and developer-driven / from acceptance criteria / in business-readable scenarios |
| Shift left as free / shift left as an investment | It costs up-front effort and needs buy-in |
| Maintenance triggers | Modification, migration **and retirement** |

## Drill it

**[Chapter 2 quiz →](/academy/istqb/practice-exam/chapter/2)**

Eight questions, untimed, every answer explained. If you miss one, check whether
the mistake was a fact or a *word* — in this chapter it is almost always the
word.

**Next:** Chapter 3 — static testing, and the defects you can find before
anything runs.
`,
  selfCheck: [
    {
      id: "q1",
      stem: "Which statement about test levels and test types is correct?",
      choices: [
        {
          id: "a",
          text: "Non-functional testing is performed only at system and acceptance level",
        },
        {
          id: "b",
          text: "Any test type can be applied at any test level — functional, non-functional, black-box and white-box tests can all be run at component level as well as system level",
          correct: true,
        },
        {
          id: "c",
          text: "White-box testing is a test level, and component testing is a test type",
        },
        {
          id: "d",
          text: "Each test level is associated with exactly one test type",
        },
      ],
      explanation:
        "Levels and types are independent dimensions: a level is a group of activities organised around a test object, and a type groups activities by what is being evaluated. Performance testing a single component and running a white-box test at system level are both entirely normal, which is why 'non-functional means system level' is the distractor that catches people. Options c and d invert or fuse the two words, and the exam relies on candidates who use them loosely.",
    },
    {
      id: "q2",
      stem: "A defect was fixed. The team re-runs the test that originally failed, and then runs a broader suite covering the surrounding features. What are these two activities?",
      choices: [
        {
          id: "a",
          text: "Confirmation testing, then regression testing",
          correct: true,
        },
        {
          id: "b",
          text: "Regression testing, then confirmation testing",
        },
        {
          id: "c",
          text: "Maintenance testing, then system testing",
        },
        {
          id: "d",
          text: "Retesting, then acceptance testing",
        },
      ],
      explanation:
        "Confirmation testing re-executes the test that exposed the defect, to establish that the fix works. Regression testing then checks that the change has not broken something elsewhere that was previously working. Both are change-related testing and the order in the question is the usual one. Regression suites are the classic automation candidate precisely because they are large, repeated often, and change slowly.",
    },
    {
      id: "q3",
      stem: "Which of these are triggers for maintenance testing?",
      multi: true,
      choices: [
        {
          id: "a",
          text: "An operating system patch applied to the production environment",
          correct: true,
        },
        {
          id: "b",
          text: "Migrating the application to a new platform, including converting its data",
          correct: true,
        },
        {
          id: "c",
          text: "Retiring the system, where archived data must remain retrievable",
          correct: true,
        },
        {
          id: "d",
          text: "Writing the acceptance criteria for a feature that has not been built yet",
        },
      ],
      explanation:
        "The three triggers are modification (enhancements, corrective changes, environment upgrades and patches), migration (moving platform, converting data, plus operational testing of the new environment), and retirement (archiving, and testing that restore and retrieval still work). Retirement is the one candidates forget, and it is a favourite because decommissioning intuitively sounds like the end of testing rather than an occasion for it. Writing acceptance criteria for unbuilt work is development-side test-first activity, not maintenance.",
    },
  ],
};
