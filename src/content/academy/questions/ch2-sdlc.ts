import type { ExamQuestion } from "../types";

// A-06: Chapter 2 — Testing Throughout the SDLC. Original questions on test
// levels, test types, maintenance testing, and how testing fits Agile and
// other lifecycle models. See docs/QA-ACADEMY.md §7.2 — no question here is
// copied or reworded from a real paper or commercial bank.

export const CH2_SDLC: ExamQuestion[] = [
  {
    id: "ch2-q1",
    chapter: 2,
    kLevel: "K2",
    syllabusRef: "FL-2.1.1",
    stem: "A team writes acceptance criteria before coding a feature and uses them to drive both development and testing. Which lifecycle characteristic does this best reflect?",
    choices: [
      { id: "a", text: "Waterfall's strict phase gating" },
      {
        id: "b",
        text: "Testing activities start as early as possible and run alongside development",
        correct: true,
      },
      { id: "c", text: "Testing only begins once the whole system is code-complete" },
      { id: "d", text: "Test levels must always run strictly in a fixed sequence" },
    ],
    explanation:
      "In iterative and Agile lifecycles, test activities (including deriving conditions from acceptance criteria) start alongside — not after — development, which is exactly what 'shift left' means in practice.",
  },
  {
    id: "ch2-q2",
    chapter: 2,
    kLevel: "K1",
    syllabusRef: "FL-2.2.1",
    stem: "Which is a defining characteristic of a test level, as distinct from a test type?",
    choices: [
      {
        id: "a",
        text: "A test level is a group of test activities organized and managed together, tied to a stage of development (e.g. component, integration, system, acceptance)",
        correct: true,
      },
      { id: "b", text: "A test level is always automated" },
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
    syllabusRef: "FL-2.2.2",
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
    kLevel: "K1",
    syllabusRef: "FL-2.2.4",
    stem: "Which of the following is typically the primary goal of acceptance testing?",
    choices: [
      { id: "a", text: "Finding as many defects as possible in isolated units of code" },
      {
        id: "b",
        text: "Establishing confidence that the system meets user, business, or contractual requirements",
        correct: true,
      },
      { id: "c", text: "Verifying two components exchange data correctly" },
      { id: "d", text: "Measuring code coverage of unit tests" },
    ],
    explanation:
      "Acceptance testing is usually about building confidence that the system is fit for its intended use and ready to release, from the perspective of users, customers, or other authorized stakeholders — not primarily about maximizing defect count.",
  },
  {
    id: "ch2-q5",
    chapter: 2,
    kLevel: "K2",
    syllabusRef: "FL-2.3.1",
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
    kLevel: "K1",
    syllabusRef: "FL-2.3.2",
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
    syllabusRef: "FL-2.3.3",
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
    kLevel: "K1",
    syllabusRef: "FL-2.3.4",
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
    syllabusRef: "FL-2.3.4",
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
    kLevel: "K1",
    syllabusRef: "FL-2.4.1",
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
    syllabusRef: "FL-2.4.1",
    stem: "Which of these is a typical trigger for maintenance testing?",
    choices: [
      { id: "a", text: "Writing the first draft of a new requirement" },
      { id: "b", text: "A scheduled operating-system upgrade on the production servers", correct: true },
      { id: "c", text: "Reviewing a design document before coding starts" },
      { id: "d", text: "Estimating story points in sprint planning" },
    ],
    explanation:
      "Maintenance testing is triggered by modification (a planned enhancement or fix), migration (e.g. between environments or platforms — including an OS upgrade), or retirement of a system, not by upfront requirements or planning activities.",
  },
  {
    id: "ch2-q12",
    chapter: 2,
    kLevel: "K2",
    syllabusRef: "FL-2.2.3",
    stem: "System testing, as distinct from integration testing, is primarily concerned with:",
    choices: [
      {
        id: "a",
        text: "The behaviour and capabilities of the whole system or product, end to end",
        correct: true,
      },
      { id: "b", text: "The interface between exactly two components" },
      { id: "c", text: "Only the internal logic of a single function" },
      { id: "d", text: "Only non-functional characteristics, never functional ones" },
    ],
    explanation:
      "System testing evaluates the complete, integrated system against its specified requirements, both functional and non-functional — integration testing's scope is narrower, focused on the interfaces between parts.",
  },
];
