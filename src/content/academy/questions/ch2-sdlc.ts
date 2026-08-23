import type { ExamQuestion } from "../types";

// A-06: Chapter 2 — Testing Throughout the SDLC. Original questions on test
// levels, test types, maintenance testing, and how testing fits Agile and
// other lifecycle models. See docs/QA-ACADEMY.md §7.2 — no question here is
// copied or reworded from a real paper or commercial bank.
//
// A-10d's sixth slice grew this chapter 12 → 30, its full 5x blueprint target.
// It was the most lopsided chapter in the bank: seven of its twelve questions
// were on test levels and types, and **five of the six FL-2.1.x objectives had
// no question at all** — DevOps, shift left, test-first approaches,
// retrospectives, and the good practices that hold across every lifecycle. A
// chapter about testing throughout the lifecycle had almost nothing about
// lifecycles in it. The 18 new questions put that right: 14 of them land on
// FL-2.1.x, and all 10 objectives are now covered.
//
// A-10d's eighth slice added 3 more (q31–q33), taking FL-2.1.2, FL-2.1.5 and
// FL-2.1.6 to the bank's depth floor of 3 questions per objective — the same
// three FL-2.1.x topics the sixth slice had only just opened.

export const CH2_SDLC: ExamQuestion[] = [
  {
    id: "ch2-q1",
    chapter: 2,
    kLevel: "K2",
    syllabusRef: "FL-2.1.5",
    stem: "A team writes acceptance criteria before coding a feature and uses them to drive both development and testing. Which lifecycle characteristic does this best reflect?",
    choices: [
      { id: "a", text: "Waterfall's strict gating between one phase and the next" },
      {
        id: "b",
        text: "Testing starts early and runs alongside development",
        correct: true,
      },
      { id: "c", text: "Testing begins only once the whole system is code-complete" },
      { id: "d", text: "Test levels must always run strictly in a fixed sequence" },
    ],
    explanation:
      "In iterative and Agile lifecycles, test activities (including deriving conditions from acceptance criteria) start alongside — not after — development, which is exactly what 'shift left' means in practice.",
  },
  {
    id: "ch2-q2",
    chapter: 2,
    kLevel: "K2",
    syllabusRef: "FL-2.2.1",
    stem: "Which is a defining characteristic of a test level, as distinct from a test type?",
    choices: [
      {
        id: "a",
        text: "A group of test activities tied to a stage of development",
        correct: true,
      },
      { id: "b", text: "A test level is always automated, whereas a test type never is" },
      { id: "c", text: "A test level always follows the test type that precedes it" },
      { id: "d", text: "A test level applies only to non-functional testing" },
    ],
    explanation:
      "Test levels (component, integration, system, acceptance) are organized around the software's stage of development; test types (functional, non-functional, etc.) are categories of behaviour being verified, and any test type can appear at more than one level.",
  },
  {
    id: "ch2-q3",
    chapter: 2,
    kLevel: "K2",
    syllabusRef: "FL-2.2.1",
    stem: "A test verifies that the 'Cart' service correctly calls the 'Pricing' service and handles its response. Which test level does this belong to?",
    choices: [
      { id: "a", text: "Component testing" },
      { id: "b", text: "Integration testing", correct: true },
      { id: "c", text: "Acceptance testing" },
      { id: "d", text: "Maintenance testing" },
    ],
    explanation:
      "Integration testing targets the interfaces and interactions between components or systems — here, whether Cart and Pricing correctly exchange data — rather than either service's internal logic in isolation.",
  },
  {
    id: "ch2-q4",
    chapter: 2,
    kLevel: "K2",
    syllabusRef: "FL-2.2.1",
    stem: "Which of the following is typically the primary goal of acceptance testing?",
    choices: [
      { id: "a", text: "Finding as many defects as possible inside isolated units of code" },
      {
        id: "b",
        text: "Establishing confidence that the system meets the requirements",
        correct: true,
      },
      { id: "c", text: "Verifying that two components exchange data correctly" },
      { id: "d", text: "Measuring the code coverage reached by the unit tests" },
    ],
    explanation:
      "Acceptance testing is usually about building confidence that the system is fit for its intended use and ready to release, from the perspective of users, customers, or other authorized stakeholders — not primarily about maximizing defect count.",
  },
  {
    id: "ch2-q5",
    chapter: 2,
    kLevel: "K2",
    syllabusRef: "FL-2.2.2",
    stem: "A test confirms the 'export to CSV' button produces a downloadable file with the right rows. Which test type is this?",
    choices: [
      { id: "a", text: "Functional testing", correct: true },
      { id: "b", text: "Performance testing" },
      { id: "c", text: "Usability testing" },
      { id: "d", text: "Maintainability testing" },
    ],
    explanation:
      "Functional testing evaluates what the system does — here, whether the export feature behaves as specified. Non-functional test types (performance, usability, etc.) evaluate how well it does it.",
  },
  {
    id: "ch2-q6",
    chapter: 2,
    kLevel: "K2",
    syllabusRef: "FL-2.2.2",
    stem: "Load testing, measuring page response time under 500 concurrent users, is an example of which test type?",
    choices: [
      { id: "a", text: "Functional testing" },
      { id: "b", text: "Non-functional testing", correct: true },
      { id: "c", text: "White-box testing" },
      { id: "d", text: "Change-related testing" },
    ],
    explanation:
      "Non-functional testing evaluates quality characteristics such as performance efficiency, usability, reliability, and security — attributes of how the system behaves, not what functions it exposes.",
  },
  {
    id: "ch2-q7",
    chapter: 2,
    kLevel: "K2",
    syllabusRef: "FL-2.2.2",
    stem: "A tester inspects the source code of a discount calculator to design test cases that exercise every branch of its if/else logic. Which test type is this?",
    choices: [
      { id: "a", text: "Black-box testing" },
      { id: "b", text: "White-box testing", correct: true },
      { id: "c", text: "Acceptance testing" },
      { id: "d", text: "Exploratory testing" },
    ],
    explanation:
      "White-box (structure-based) testing derives tests from the internal structure of the component — here, the code's branches — rather than from external specifications alone, which is the black-box approach.",
  },
  {
    id: "ch2-q8",
    chapter: 2,
    kLevel: "K2",
    syllabusRef: "FL-2.2.3",
    stem: "After deploying a bug fix, the team re-runs prior passing tests on the surrounding features to make sure nothing else broke. What is this test type called?",
    choices: [
      { id: "a", text: "Confirmation testing" },
      { id: "b", text: "Regression testing", correct: true },
      { id: "c", text: "Smoke testing" },
      { id: "d", text: "Static testing" },
    ],
    explanation:
      "Regression testing re-runs existing tests to check that a change hasn't broken previously working functionality elsewhere in the system. Re-testing the actual fixed defect itself is confirmation testing, a related but distinct activity.",
  },
  {
    id: "ch2-q9",
    chapter: 2,
    kLevel: "K2",
    syllabusRef: "FL-2.2.3",
    stem: "A defect ticket is marked fixed. The tester runs the exact steps that originally reproduced the bug, using the same inputs, to check it no longer occurs. What is this?",
    choices: [
      { id: "a", text: "Confirmation testing", correct: true },
      { id: "b", text: "Regression testing" },
      { id: "c", text: "Maintenance testing" },
      { id: "d", text: "Integration testing" },
    ],
    explanation:
      "Confirmation testing (retesting) specifically re-runs the failed test that found a defect, to confirm the fix resolved it — distinct from regression testing, which checks that unrelated behaviour still works.",
  },
  {
    id: "ch2-q10",
    chapter: 2,
    kLevel: "K2",
    syllabusRef: "FL-2.3.1",
    stem: "Testing performed on a live system after a data migration, to check existing functionality wasn't broken by the migration, is an example of:",
    choices: [
      { id: "a", text: "Component testing" },
      { id: "b", text: "Maintenance testing", correct: true },
      { id: "c", text: "Test design" },
      { id: "d", text: "Static analysis" },
    ],
    explanation:
      "Maintenance testing is done on an already-deployed system, triggered by modification, migration, or retirement, rather than as part of new development — the trigger here is the migration, not a new feature.",
  },
  {
    id: "ch2-q11",
    chapter: 2,
    kLevel: "K2",
    syllabusRef: "FL-2.3.1",
    stem: "Which of these is a typical trigger for maintenance testing?",
    choices: [
      { id: "a", text: "Writing the first draft of a new requirement" },
      { id: "b", text: "A scheduled operating-system upgrade on the production servers", correct: true },
      { id: "c", text: "Reviewing the design document before any coding starts" },
      { id: "d", text: "Estimating story points in sprint planning" },
    ],
    explanation:
      "Maintenance testing is triggered by modification, migration or retirement, not by upfront requirements or planning activities. An operating-system upgrade is a modification: alongside enhancements, corrective changes and patches, the syllabus counts changes to the operational environment there. Migration is moving the software to another platform, which brings data conversion and operational testing of the new environment with it.",
  },
  {
    id: "ch2-q12",
    chapter: 2,
    kLevel: "K2",
    syllabusRef: "FL-2.2.1",
    stem: "System testing, as distinct from integration testing, is primarily concerned with:",
    choices: [
      {
        id: "a",
        text: "The behaviour of the whole system or product, end to end",
        correct: true,
      },
      { id: "b", text: "The interface between exactly two of the components" },
      { id: "c", text: "Only the internal logic of one individual function" },
      { id: "d", text: "Only non-functional characteristics, never functional ones" },
    ],
    explanation:
      "System testing evaluates the complete, integrated system against its specified requirements, both functional and non-functional — integration testing's scope is narrower, focused on the interfaces between parts.",
  },
  {
    id: "ch2-q13",
    chapter: 2,
    kLevel: "K2",
    syllabusRef: "FL-2.1.1",
    stem: "A team follows a sequential lifecycle in which executable code appears only in the later phases. What do its testers typically do in the early ones?",
    choices: [
      { id: "a", text: "Review requirements and carry out test analysis and design", correct: true },
      { id: "b", text: "Execute the component tests against the first working build" },
      { id: "c", text: "Run regression suites against each nightly integration build" },
      { id: "d", text: "Perform exploratory sessions on a working prototype" },
    ],
    explanation:
      "Dynamic testing needs something to run, and in a sequential model there is nothing to run yet. What testers can do early is static: reviewing requirements, analysing the test basis, designing test cases against it. The other three options all assume executable code that does not exist at that point in this lifecycle.",
  },
  {
    id: "ch2-q14",
    chapter: 2,
    kLevel: "K2",
    syllabusRef: "FL-2.1.1",
    stem: "An Agile team expects requirements to keep changing throughout the project. Which combination does the syllabus say such projects tend to favour?",
    choices: [
      {
        id: "a",
        text: "Lightweight documentation, extensive automation, experience-based manual testing",
        correct: true,
      },
      { id: "b", text: "Detailed test specifications signed off before any coding starts" },
      { id: "c", text: "Manual regression runs at the end of each quarterly release" },
      { id: "d", text: "A single system test phase after all increments are complete" },
    ],
    explanation:
      "If change is expected, heavy documentation is expensive to keep accurate, so it stays light. Frequent increments mean regression testing runs constantly, which is only affordable if it is automated. And manual testing leans on experience-based techniques, which need no extensive prior analysis and design — the part that would have to be redone each time the requirement moves.",
  },
  {
    id: "ch2-q15",
    chapter: 2,
    kLevel: "K2",
    syllabusRef: "FL-2.1.1",
    stem: "Which of these does the choice of lifecycle model directly affect?",
    choices: [
      {
        id: "a",
        text: "The scope and timing of test activities, and how much is automated",
        correct: true,
      },
      { id: "b", text: "Whether defects are recorded in a dedicated tracker or in a shared spreadsheet" },
      { id: "c", text: "How many people the organization employs in its test function" },
      { id: "d", text: "Which programming language the development team will use" },
    ],
    explanation:
      "The syllabus lists five things the lifecycle shapes: the scope and timing of test activities, the level of detail of test documentation, the choice of techniques and approach, the extent of automation, and the tester's role and responsibilities. Tooling choices, headcount and language are decided on other grounds.",
  },
  {
    id: "ch2-q16",
    chapter: 2,
    kLevel: "K1",
    syllabusRef: "FL-2.1.2",
    multi: true,
    stem: "Which of these are good testing practices that hold whatever lifecycle model is in use? (Select all that apply.)",
    choices: [
      { id: "a", text: "Every development activity has a corresponding test activity", correct: true },
      { id: "b", text: "Testers review work products as soon as drafts exist", correct: true },
      { id: "c", text: "All test execution waits until the code is feature-complete" },
      { id: "d", text: "Every test level pursues the same objectives, for consistency" },
      { id: "e", text: "Test analysis begins only once the build has been deployed" },
    ],
    explanation:
      "Pairing each development activity with a test activity puts every piece of work under quality control, and reviewing drafts early is what makes shift left possible. The three wrong options all push testing later or flatten the levels: test levels are supposed to have specific and *different* objectives, which is what keeps testing comprehensive without becoming redundant.",
  },
  {
    id: "ch2-q17",
    chapter: 2,
    kLevel: "K1",
    syllabusRef: "FL-2.1.2",
    stem: "Why does the syllabus insist that different test levels pursue specific and different objectives?",
    choices: [
      { id: "a", text: "So testing is comprehensive without repeating itself at each level", correct: true },
      { id: "b", text: "So the same test cases can be reused unchanged at every level" },
      { id: "c", text: "So a single team can own every level of testing in the project" },
      { id: "d", text: "So the test levels can all be executed on the same day of a sprint" },
    ],
    explanation:
      "Levels that chase the same objectives duplicate each other's work and still leave gaps, because nobody has asked what only this level can answer. Distinct objectives per level — component, integration, system, acceptance — are what make the set add up to comprehensive coverage rather than to four passes over the same ground.",
  },
  {
    id: "ch2-q18",
    chapter: 2,
    kLevel: "K1",
    syllabusRef: "FL-2.1.3",
    stem: "In test-driven development, in what order does the work proceed?",
    choices: [
      { id: "a", text: "Write the tests, write code to satisfy them, then refactor", correct: true },
      { id: "b", text: "Write the code, write tests that confirm it, then refactor both" },
      { id: "c", text: "Write the design document, write the code, then write the tests" },
      { id: "d", text: "Write the tests, run them against the old build, then write code" },
    ],
    explanation:
      "TDD directs the coding through test cases rather than through extensive up-front design: the test comes first and fails, the code is written to make it pass, and then both are refactored. Writing tests after the code is ordinary unit testing, not TDD, and it tends to produce tests shaped by the implementation rather than by the requirement.",
  },
  {
    id: "ch2-q19",
    chapter: 2,
    kLevel: "K1",
    syllabusRef: "FL-2.1.3",
    stem: "What distinguishes behavior-driven development from the other test-first approaches?",
    choices: [
      { id: "a", text: "Its cases are written in plain language stakeholders can read", correct: true },
      { id: "b", text: "Its cases are derived from the acceptance criteria of a story" },
      { id: "c", text: "Its cases are generated automatically from the source code" },
      { id: "d", text: "Its cases replace the need for any component-level testing at all" },
    ],
    explanation:
      "BDD expresses desired behaviour in a simple, natural-language form — usually Given/When/Then — so that stakeholders who do not read code can still read the tests, which are then translated into executable ones. Option b describes ATDD: all three approaches are test-first, and what separates them is where the tests come from and who is meant to be able to read them.",
  },
  {
    id: "ch2-q20",
    chapter: 2,
    kLevel: "K1",
    syllabusRef: "FL-2.1.3",
    stem: "What do TDD, ATDD and BDD have in common?",
    choices: [
      { id: "a", text: "The tests are defined before the code, so they shift testing left", correct: true },
      { id: "b", text: "They remove the need for a separate regression suite later on" },
      { id: "c", text: "They apply only to sequential lifecycles with a design phase" },
      { id: "d", text: "They require the tests to be written by a test team independent of the developers" },
    ],
    explanation:
      "All three define tests as a means of directing development, which puts them squarely on the early testing principle and on shift left, and all three suit iterative development. The tests they produce usually persist as automated tests guarding future refactoring — so they feed a regression suite rather than replacing one.",
  },
  {
    id: "ch2-q21",
    chapter: 2,
    kLevel: "K2",
    syllabusRef: "FL-2.1.4",
    stem: "What is DevOps, as the syllabus describes it?",
    choices: [
      {
        id: "a",
        text: "An organizational approach getting development and operations to shared goals",
        correct: true,
      },
      { id: "b", text: "A tool that builds and deploys code automatically on each commit" },
      { id: "c", text: "A test level sitting between system testing and acceptance testing" },
      { id: "d", text: "A job title for the engineer who maintains the build pipeline" },
    ],
    explanation:
      "DevOps is organizational before it is technical: it needs a cultural shift that treats development, testing and operations as equally valuable, and it promotes team autonomy, fast feedback and integrated toolchains. CI and CD are practices that serve it, not definitions of it — which is why buying a pipeline tool does not make an organization DevOps.",
  },
  {
    id: "ch2-q22",
    chapter: 2,
    kLevel: "K2",
    syllabusRef: "FL-2.1.4",
    multi: true,
    stem: "Which of these are benefits DevOps brings to testing? (Select all that apply.)",
    choices: [
      { id: "a", text: "Fast feedback on whether a change has damaged existing code", correct: true },
      { id: "b", text: "More visible non-functional characteristics such as performance", correct: true },
      { id: "c", text: "Less repetitive manual testing, thanks to the delivery pipeline", correct: true },
      { id: "d", text: "The end of any need for manual testing from a user's perspective" },
      { id: "e", text: "A pipeline that requires no definition or maintenance of its own" },
    ],
    explanation:
      "Fast feedback, better visibility of non-functional characteristics, less repetitive manual work and a smaller regression risk are the benefits the syllabus lists. The last two options are the two things it explicitly denies: manual testing from the user's perspective is still needed however much is automated, and the pipeline and its tools have to be defined, introduced and maintained.",
  },
  {
    id: "ch2-q23",
    chapter: 2,
    kLevel: "K2",
    syllabusRef: "FL-2.1.4",
    stem: "A team adopting DevOps budgets no ongoing effort for testing, on the grounds that the pipeline will handle it. Which warning applies?",
    choices: [
      { id: "a", text: "Automation needs resources to build and to keep working", correct: true },
      { id: "b", text: "Automated pipelines make component testing unnecessary" },
      { id: "c", text: "DevOps removes the need for stable test environments" },
      { id: "d", text: "Continuous delivery eliminates the risk of regression entirely" },
      { id: "e", text: "A CI tool can be adopted without anyone maintaining it" },
    ],
    explanation:
      "Test automation is listed among DevOps' own risks: it takes additional resources and can be hard to establish and to keep working as the product moves. The other options invert benefits into absolutes — automated regression reduces regression risk rather than removing it, and CI/CD makes stable environments easier to have, not unnecessary.",
  },
  {
    id: "ch2-q24",
    chapter: 2,
    kLevel: "K2",
    syllabusRef: "FL-2.1.5",
    stem: "A manager reads about shift left and proposes moving all testing to the start of the project. What is wrong with that reading?",
    choices: [
      {
        id: "a",
        text: "Shift left adds earlier testing; it does not remove the later testing",
        correct: true,
      },
      { id: "b", text: "Shift left applies only to static testing, never to dynamic testing" },
      { id: "c", text: "Shift left is a tool choice rather than a way of scheduling testing" },
      { id: "d", text: "Shift left requires the team to stop using continuous integration" },
    ],
    explanation:
      "Shift left says testing should start earlier — reviewing specifications, writing tests before the code, running static analysis before dynamic testing, pulling non-functional testing down to component level where possible. It does not say that testing later in the lifecycle may be neglected. It also costs more effort early in exchange for saving more later, which is a trade stakeholders have to be brought into deliberately.",
  },
  {
    id: "ch2-q25",
    chapter: 2,
    kLevel: "K2",
    syllabusRef: "FL-2.1.6",
    stem: "What does a retrospective set out to establish?",
    choices: [
      { id: "a", text: "What went well, what did not, and how to act on both", correct: true },
      { id: "b", text: "Which team member is accountable for each defect found" },
      { id: "c", text: "Whether the exit criteria for the release were all met" },
      { id: "d", text: "How many test cases each tester executed in the iteration" },
    ],
    explanation:
      "The three questions are what was successful and should be kept, what was not and could be improved, and how to carry both forward. The results are recorded — normally as part of the test completion report — and the recommended improvements have to be followed up, or the meeting produces nothing. It is a process review, not a performance review.",
  },
  {
    id: "ch2-q26",
    chapter: 2,
    kLevel: "K2",
    syllabusRef: "FL-2.1.6",
    stem: "A team invites only its testers to the retrospective. What does that miss?",
    choices: [
      { id: "a", text: "Developers, architects and the product owner take part too", correct: true },
      { id: "b", text: "The meeting has to be chaired by someone outside the organization" },
      { id: "c", text: "Retrospectives are only valid at the very end of a whole project" },
      { id: "d", text: "Only defects found after release may be discussed in the meeting" },
    ],
    explanation:
      "Retrospectives are for everyone involved — developers, architects, the product owner, business analysts, testers — and several of the benefits the syllabus lists depend on that: better cooperation between development and testing, and an improved test basis, are things testers cannot fix alone in a room. Timing varies with the lifecycle: end of iteration, release milestone, or whenever needed.",
  },
  {
    id: "ch2-q27",
    chapter: 2,
    kLevel: "K2",
    syllabusRef: "FL-2.2.1",
    stem: "A test checks that two separately deployed services, owned by different teams, exchange messages correctly through a shared broker. Which test level is that?",
    choices: [
      { id: "a", text: "System integration testing, across separately deployed systems", correct: true },
      { id: "b", text: "Component integration testing, between the modules inside a single system" },
      { id: "c", text: "Component testing, isolating one module from its neighbours" },
      { id: "d", text: "Acceptance testing, confirming the business need is served" },
    ],
    explanation:
      "v4.0 splits integration testing into two levels. Component integration testing looks at the interactions between the parts inside one system; system integration testing looks at the interactions between systems, or between a system and external services. Two independently deployed services talking over a broker is the second.",
  },
  {
    id: "ch2-q28",
    chapter: 2,
    kLevel: "K2",
    syllabusRef: "FL-2.2.2",
    multi: true,
    stem: "Which of the following are non-functional tests? (Select all that apply.)",
    choices: [
      { id: "a", text: "Measuring how long the checkout page takes under peak load", correct: true },
      { id: "b", text: "Checking how the system recovers after its database fails over", correct: true },
      { id: "c", text: "Checking that an expired discount code is rejected at checkout" },
      { id: "d", text: "Checking that a refund reverses the original payment amount" },
    ],
    explanation:
      "Functional testing asks what the system does; non-functional testing asks how well it does it. Response time under load is performance efficiency and recovery after a failover is reliability — both non-functional characteristics. Rejecting an expired code and reversing the right amount are rules the system is supposed to implement, so they are functional.",
  },
  {
    id: "ch2-q29",
    chapter: 2,
    kLevel: "K2",
    syllabusRef: "FL-2.2.3",
    stem: "A defect is fixed and the fix is delivered. Which pair of activities follows, and in which order?",
    choices: [
      { id: "a", text: "Confirm the fix works, then check nothing around it broke", correct: true },
      { id: "b", text: "Regression testing of the fix, then confirmation testing around it" },
      { id: "c", text: "Confirmation testing only, since regression is a separate release" },
      { id: "d", text: "Regression testing only, since the fix was verified by its author" },
    ],
    explanation:
      "Confirmation testing re-runs the test that exposed the defect, ideally by the person who found it, to establish that the fix works. Regression testing then checks that the change has not broken anything else. The order matters: there is no point hunting for side effects of a fix that has not yet been shown to fix anything.",
  },
  {
    id: "ch2-q30",
    chapter: 2,
    kLevel: "K2",
    syllabusRef: "FL-2.3.1",
    stem: "An application is being retired and its data archived for future reference. Does that call for maintenance testing?",
    choices: [
      { id: "a", text: "Yes — retirement and data archiving are triggers for it", correct: true },
      { id: "b", text: "No — maintenance testing covers modifications only" },
      { id: "c", text: "No — the system is going out of use, so nothing about it needs testing" },
      { id: "d", text: "Yes, but only if the archive will later be read back" },
    ],
    explanation:
      "Retirement is one of the three triggers the syllabus names, alongside modification — which covers enhancements, fixes, patches and upgrades of the operational environment — and migration. Archiving is precisely where it matters: data that has to be readable years later, and a restore procedure nobody has ever exercised, are worth testing while the people who understand the system are still available.",
  },
  {
    id: "ch2-q31",
    chapter: 2,
    kLevel: "K1",
    syllabusRef: "FL-2.1.2",
    stem: "Whatever lifecycle model a team follows, some testing practices hold across all of them. Which of these is one?",
    choices: [
      { id: "a", text: "Testers are involved while requirements are still being refined", correct: true },
      { id: "b", text: "All test levels are executed by one dedicated testing team" },
      { id: "c", text: "Test execution starts only after the code has been frozen" },
      { id: "d", text: "Each iteration repeats the previous iteration's test cases exactly" },
    ],
    explanation:
      "The practices that survive any model include pairing every development activity with a test activity, giving each test level its own objectives, starting test analysis and design for a level during the corresponding development activity, and involving testers early enough to shape the work products they will later test. Freezing code before testing starts, concentrating every level in one team and repeating a fixed suite are choices a particular model might make, not general good practice.",
  },
  {
    id: "ch2-q32",
    chapter: 2,
    kLevel: "K2",
    syllabusRef: "FL-2.1.5",
    stem: "A team wants to shift left. Which of these changes actually does that?",
    choices: [
      { id: "a", text: "Reviewing requirements before any code is written for them", correct: true },
      { id: "b", text: "Adding a second round of system testing before the release" },
      { id: "c", text: "Running the regression suite nightly instead of weekly" },
      { id: "d", text: "Adding more testers to the phase that runs closest to release" },
    ],
    explanation:
      "Shifting left means performing testing activities earlier in the lifecycle — static testing of requirements and designs, writing tests before the code, getting feedback from continuous integration on every change. Running an existing late activity more often, or staffing it more heavily, leaves that activity exactly where it sat in the sequence.",
  },
  {
    id: "ch2-q33",
    chapter: 2,
    kLevel: "K2",
    syllabusRef: "FL-2.1.6",
    stem: "A retrospective finds that defects keep reaching system testing because stories are accepted without acceptance criteria. What makes that a useful retrospective outcome rather than a complaint?",
    choices: [
      { id: "a", text: "It names a change the team can make in the next iteration", correct: true },
      { id: "b", text: "It identifies which team member accepted the stories" },
      { id: "c", text: "It records the defect counts for the release report" },
      { id: "d", text: "It confirms the exit criteria for system testing were met" },
    ],
    explanation:
      "A retrospective is a process improvement activity, so its value lies in what the team agrees to do differently and in the follow-through that makes the change stick. Attributing the problem to a person, collecting numbers for a report and checking criteria are all separate activities, and the first of them actively discourages the candour a retrospective depends on.",
  },
];
