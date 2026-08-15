import type { Lesson } from "../../types";

// §7.2/§7.3: written from the published learning objectives for this chapter,
// in our own words. No syllabus text is reproduced and no question here is
// derived from any real or sample paper. The worked examples are original.
export const ch5ManagingTestActivities: Lesson = {
  slug: "ch5-managing-test-activities",
  title: "Chapter 5 — Managing the test activities",
  summary:
    "Planning, risk, monitoring and control, configuration management, and defect management.",
  minutes: 28,
  status: "draft",
  body: `
## The chapter with the most objectives

Chapter 5 supplies **9 of the 40 questions** in our practice paper — second only
to chapter 4 — and it does that across **16 objectives**, more than any other
chapter in the syllabus. That ratio is the thing to plan around: **more ground
per mark than anywhere else**, so recognition matters more than depth here.

| Section | Objectives | K-levels | What it wants |
|---|---|---|---|
| 5.1 Test planning | 7 | K1, K2, **2× K3** | Plans, criteria, estimation, prioritisation, pyramid, quadrants |
| 5.2 Risk management | 4 | K1, K2 | Risk level, project vs product, how risk shapes testing |
| 5.3 Monitoring, control, completion | 3 | K1, K2 | Metrics, the two reports, communicating status |
| 5.4 Configuration management | 1 | K2 | How it supports testing |
| 5.5 Defect management | 1 | **K3** | Write a defect report |

**Three K3 objectives**, and they are scattered rather than clustered: estimation
and prioritisation in §5.1, the defect report in §5.5. Those three are where a
question can hand you material and demand an answer.

## 5.1 Test planning

### Purpose and content of a test plan

A test plan states the objectives and scope of testing, the approach, the
resources and schedule, the risks, the entry and exit criteria, and what testware
will be produced. Its real purpose is the one candidates forget when they picture
a document: **it communicates and aligns.** Writing it forces the questions that
would otherwise surface late — what are we not testing, what has to be ready
before we start, what does "done" mean.

T2's [test planning lesson](/academy/manual-pro/test-planning) has the practical
version; the exam wants the contents and the purpose.

### Entry versus exit criteria

The pair that is examined nearly every time:

| | Entry criteria (definition of ready) | Exit criteria (definition of done) |
|---|---|---|
| Answer | Can testing **start**? | Can testing **stop**? |
| Typical | Testable requirements, test environment ready, testware available, initial quality good enough | Planned coverage achieved, no unresolved critical defects, estimated remaining defects low enough, non-functional levels acceptable |

**Running out of time or money is not an exit criterion.** It is a common
*reason* for stopping, and the syllabus is explicit that it is not the same
thing — a question offering "the schedule ran out" as a valid exit criterion is
offering a distractor.

### Estimating the test effort (K3)

Three approaches worth naming — metrics-based extrapolation from past projects,
expert-based estimation by the people doing the work, and **three-point
estimation**, which the exam can actually make you calculate.

Three-point takes an optimistic **a**, a most likely **m**, and a pessimistic
**b**:

> **E = (a + 4m + b) ÷ 6** and the standard deviation **SD = (b − a) ÷ 6**

**Worked example.** a = 8 days, m = 12 days, b = 28 days.

- E = (8 + 48 + 28) ÷ 6 = **84 ÷ 6 = 14 days**
- SD = (28 − 8) ÷ 6 = **3.33**, so the estimate is usually stated as 14 ± 3.33

Note what the weighting does: the most likely value counts four times, so a
pessimistic outlier moves the answer far less than an average would. If a
question gives you three numbers and asks for an estimate, this is the formula it
wants — and the arithmetic is the whole question.

### Prioritising test cases (K3)

Three bases, and a constraint that overrides all of them:

| Basis | Run first |
|---|---|
| **Risk-based** | The cases covering the highest-risk areas |
| **Coverage-based** | The cases that add the most coverage soonest |
| **Requirements-based** | The cases for the requirements stakeholders rank highest |

**The constraint is dependency.** If case B only makes sense after case A has run
— it needs the record A creates — then A runs first whatever the priorities say.
A question that lists priorities *and* a dependency is testing whether you
noticed the second one.

### The test pyramid and the testing quadrants

Two models, and mixing them up is a reliable trap because both are diagrams
about organising tests.

**The pyramid** is about **granularity and cost**: many fast, cheap, low-level
tests at the base, progressively fewer as you go up, few slow end-to-end tests at
the top. It answers *how many of each level*.

**The quadrants** are about **purpose and audience**, along two axes —
technology-facing versus business-facing, and supporting the team versus
critiquing the product:

| | Supporting the team | Critiquing the product |
|---|---|---|
| **Business-facing** | Functional tests, examples, story tests, prototypes | Exploratory, usability, user acceptance testing |
| **Technology-facing** | Component and integration tests | Performance, security, reliability testing |

**Pyramid: how many, at which level. Quadrants: what for, and who is it aimed
at.** T3's automation track argues the pyramid at length; here you only need to
recognise both.

## 5.2 Risk management

**Risk level is composed of two things: the likelihood of the harm occurring and
the impact if it does.** Not one or the other, and a question describing only
severity of consequence is describing half of it.

**Project risk versus product risk** — the distinction the section is built on:

| | Affects | Examples |
|---|---|---|
| **Project risk** | The project's ability to deliver | Late supplier, staff turnover, unstable environment, unrealistic schedule, skills gaps |
| **Product risk** | The quality of the product itself | Missing or wrong functionality, unreliable behaviour, poor usability, security weakness |

A useful rule of thumb for the exam: **if the harm would show up in the delivered
software, it is a product risk; if it would show up in the plan, it is a project
risk.**

**How product risk analysis shapes testing.** It determines the *extent and
thoroughness* of testing, *which techniques* are used, *which levels and types*
are applied, how cases are *prioritised*, and whether something other than
testing would reduce the risk more cheaply — a review, better training, a
prototype.

**Responding to risk**, once analysed: mitigate it (usually by testing it),
transfer it, accept it deliberately, or prepare a contingency plan. Risks are
**monitored throughout**, not assessed once at the start — new information
changes both likelihood and impact, and risk-based testing that never revisits
its list is running on a stale ranking. T2's
[risk-based testing lesson](/academy/manual-pro/risk-based-testing) is the
working version of all of this.

## 5.3 Monitoring, control and completion

**Metrics** worth recognising by category: project progress, test progress
(cases implemented, executed, passed, failed, blocked), product quality (response
time, availability, defect density, mean time between failures), defect metrics
(found and fixed, detection percentage), risk metrics (residual risk), coverage,
and cost.

T2's [metrics lesson](/academy/manual-pro/metrics-that-mean-something) makes the
argument about which of these mislead; the exam wants the categories.

**The two reports, and the difference is *when*:**

| | Test progress report | Test completion report |
|---|---|---|
| Written | **During** a test activity, periodically | **At the end** of a level, iteration, project or milestone |
| Contains | Status, deviations from plan, new risks, impediments, what is planned next | Summary, evaluation **against the exit criteria**, deviations, metrics, residual risks, reusable testware |

**Communicating status** is its own objective, and its point is that the medium
and the level of detail follow the **audience**: a dashboard for a team, a
written summary for stakeholders who will not read a defect list, verbal updates
in a stand-up. T2's
[stakeholder reporting lesson](/academy/manual-pro/reporting-to-stakeholders)
is the long form.

## 5.4 Configuration management

One objective, one reliable question. Configuration management makes sure every
test item and every piece of testware is **uniquely identified, version
controlled, and related to the version of the test object it belongs to**.

The reason, stated as the exam likes it: **without it, a test result cannot be
reproduced**, because you cannot say with certainty which version of the software
was tested with which version of the tests. That is also why a defect report
names the version and the environment.

## 5.5 Defect management (K3)

The chapter's third K3 objective: given a scenario, produce a defect report.

**What a report has to carry:** a unique identifier; a title and a short summary;
the date, the author and the role; the test object and the **test environment**;
the **steps to reproduce**; **expected and actual results**; **severity** and
**priority**; the status; references to the test case or requirement; and, where
useful, conclusions or recommendations.

**Severity is not priority**, and this is the most examined pair in the section:

> **Severity** is how bad the effect is. **Priority** is how soon it should be
> fixed. A cosmetic typo on the home page can be low severity and high priority
> because everyone sees it; a crash in a feature three customers use annually can
> be high severity and low priority.

Three more points that come up:

- **Defects can be reported from static testing too** — a review finds a defect
  in a requirement, and it is reported the same way. Nothing has to execute.
- **The objectives of a defect report** are to give developers what they need to
  fix it, to provide a means of tracking product quality, and to supply ideas
  for **process improvement** — the third is the one candidates forget.
- **Not every failure is a defect.** Some are caused by the test environment, the
  test data, or an incorrect test — which is why the report names the environment
  and the expected result.

T1's [bug reports](/academy/fundamentals/bug-reports) and
[defect lifecycle](/academy/fundamentals/defect-lifecycle) lessons cover the
craft; here it is a K3 objective, so practise producing one rather than
recognising one.

## The distinctions that decide marks

| Confused pair | The line between them |
|---|---|
| Entry / exit criteria | Can testing start / can testing stop |
| Out of time / exit criteria | A reason for stopping, **not** a valid exit criterion |
| Severity / priority | How bad it is / how soon it is fixed |
| Project risk / product risk | The project's ability to deliver / the quality of the product |
| Risk = impact / risk = likelihood **and** impact | Both factors, always |
| Pyramid / quadrants | How many at which level / what purpose and whose audience |
| Progress report / completion report | Written during / written at the end, against exit criteria |
| Three-point estimate | **(a + 4m + b) ÷ 6**, with the most likely weighted four times |
| Priority order / dependency | Dependencies win regardless of priority |
| Configuration management | Reproducibility — which version was tested with which tests |

## Drill it

**[Chapter 5 quiz →](/academy/istqb/practice-exam/chapter/5)**

Eight questions, untimed, every answer explained. Because this chapter is broad
rather than deep, a missed question here usually means a topic you have not read
at all rather than one you misunderstood — so check *which section* your misses
come from and go back to that one.

**Next:** Chapter 6 — test tools, the smallest chapter in the syllabus, and then
exam strategy.
`,
  selfCheck: [
    {
      id: "q1",
      stem: "A team estimates a testing task as 6 days optimistic, 10 days most likely, and 20 days pessimistic. Using three-point estimation, what is the estimate?",
      choices: [
        {
          id: "a",
          text: "11 days",
          correct: true,
        },
        {
          id: "b",
          text: "12 days",
        },
        {
          id: "c",
          text: "10 days",
        },
        {
          id: "d",
          text: "18 days",
        },
      ],
      explanation:
        "E = (a + 4m + b) ÷ 6 = (6 + 40 + 20) ÷ 6 = 66 ÷ 6 = 11 days. The most likely value is weighted four times, which is the point of the formula: a pessimistic outlier pulls the answer far less than a plain average of the three would (that average is 12, which is option b and the distractor for anyone who forgets the weighting). The standard deviation, if asked, is (b − a) ÷ 6 = 2.33, so the estimate would be stated as 11 ± 2.33.",
    },
    {
      id: "q2",
      stem: "Which of these is a valid exit criterion for a test level?",
      choices: [
        {
          id: "a",
          text: "The time allocated in the schedule has been used up",
        },
        {
          id: "b",
          text: "Planned coverage has been achieved and no critical defects remain unresolved",
          correct: true,
        },
        {
          id: "c",
          text: "The test environment has been made available to the team",
        },
        {
          id: "d",
          text: "The requirements have been reviewed and found testable",
        },
      ],
      explanation:
        "Exit criteria describe the conditions under which testing can be declared complete — coverage achieved, no unresolved critical defects, estimated remaining defects low enough, non-functional levels acceptable. Running out of schedule is a common reason for stopping and explicitly not an exit criterion; treating it as one is how a team ends up declaring done what is merely over. Options c and d are entry criteria: they describe what has to be true before testing can meaningfully start.",
    },
    {
      id: "q3",
      stem: "A spelling mistake in the company name on the landing page is reported. It cannot crash anything, but every visitor sees it and marketing wants it gone today. How should it be classified?",
      choices: [
        {
          id: "a",
          text: "Low severity, high priority",
          correct: true,
        },
        {
          id: "b",
          text: "High severity, high priority",
        },
        {
          id: "c",
          text: "Low severity, low priority",
        },
        {
          id: "d",
          text: "High severity, low priority",
        },
      ],
      explanation:
        "Severity describes how bad the effect on the system is — nothing fails, so it is low. Priority describes how soon it should be fixed, and visibility to every visitor plus a business demand makes it high. The pair is deliberately independent, which is why the reverse case also exists: a crash in a feature a handful of customers use once a year can be high severity and low priority. Collapsing the two into one judgement is the most common error in this section.",
    },
    {
      id: "q4",
      stem: "Which of these are product risks rather than project risks?",
      multi: true,
      choices: [
        {
          id: "a",
          text: "The payment calculation may round incorrectly for certain currencies",
          correct: true,
        },
        {
          id: "b",
          text: "The system may not handle the expected number of concurrent users",
          correct: true,
        },
        {
          id: "c",
          text: "The third-party supplier may deliver its component late",
        },
        {
          id: "d",
          text: "Two of the three testers may leave before the release",
        },
      ],
      explanation:
        "Product risks are possible defects in the delivered software — wrong calculations and inadequate performance both show up in the product itself, and both are addressed by testing them. Late suppliers and staff turnover are project risks: they threaten the project's ability to deliver at all, and they are managed by the project rather than mitigated by a test case. The useful rule is where the harm would appear — in the software, or in the plan.",
    },
  ],
};
