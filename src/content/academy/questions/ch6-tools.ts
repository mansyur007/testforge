import type { ExamQuestion } from "../types";

// A-06: Chapter 6 — Test Tools. Original questions on tool categories,
// benefits/risks of tool support, and considerations for introducing a tool
// into an organization. See docs/QA-ACADEMY.md §7.2.

export const CH6_TOOLS: ExamQuestion[] = [
  {
    id: "ch6-q1",
    chapter: 6,
    kLevel: "K1",
    syllabusRef: "FL-6.1.1",
    stem: "A test management tool primarily supports:",
    choices: [
      {
        id: "a",
        text: "Planning, tracking, and reporting on test cases, test runs, and defects",
        correct: true,
      },
      { id: "b", text: "Compiling application source code" },
      { id: "c", text: "Generating production infrastructure" },
      { id: "d", text: "Rendering the application's UI at runtime" },
    ],
    explanation:
      "Test management tools organize and track test artefacts — cases, suites, runs, results — and usually integrate with defect trackers, giving a picture of test progress and coverage over time.",
  },
  {
    id: "ch6-q2",
    chapter: 6,
    kLevel: "K1",
    syllabusRef: "FL-6.1.1",
    stem: "Which of the following is an example of a static analysis tool, as opposed to a test execution tool?",
    choices: [
      { id: "a", text: "A linter that flags unused variables in source code without running it", correct: true },
      { id: "b", text: "A tool that clicks through a UI and asserts on screen text" },
      { id: "c", text: "A load generator that simulates concurrent users" },
      { id: "d", text: "A tool that replays recorded API calls" },
    ],
    explanation:
      "A linter examines source code without executing it, which is exactly what makes it a static analysis tool — the other three all require the application to actually run.",
  },
  {
    id: "ch6-q3",
    chapter: 6,
    kLevel: "K2",
    syllabusRef: "FL-6.2.1",
    stem: "Which of these is a genuine benefit of using test automation tools?",
    choices: [
      {
        id: "a",
        text: "Repetitive regression checks can run far faster and more consistently than a person re-running them by hand",
        correct: true,
      },
      { id: "b", text: "Tools eliminate the need for any human test design" },
      { id: "c", text: "Automated tests never need maintenance once written" },
      { id: "d", text: "Tools guarantee 100% defect detection" },
    ],
    explanation:
      "Tools are excellent at repetitive, precise, fast execution — ideal for regression. They don't replace the judgement needed to design good tests, they still need maintenance as the software changes, and no tool guarantees complete defect detection.",
  },
  {
    id: "ch6-q4",
    chapter: 6,
    kLevel: "K2",
    syllabusRef: "FL-6.2.1",
    stem: "A team introduces a UI test automation tool expecting it to immediately replace all manual testing, without budgeting time to maintain scripts as the UI changes. What risk are they most likely to run into?",
    choices: [
      {
        id: "a",
        text: "The suite becomes brittle and either breaks constantly or is abandoned, because unrealistic expectations weren't matched with a maintenance plan",
        correct: true,
      },
      { id: "b", text: "The tool will automatically write its own test cases" },
      { id: "c", text: "Automation always reduces total project cost immediately" },
      { id: "d", text: "There is no risk; more automation is always strictly better" },
    ],
    explanation:
      "A commonly cited risk of tool support is unrealistic expectations (thinking a tool is a complete substitute for skilled human test design) combined with underestimating the effort to introduce and maintain it — exactly the scenario described.",
  },
  {
    id: "ch6-q5",
    chapter: 6,
    kLevel: "K1",
    syllabusRef: "FL-6.3.1",
    stem: "Before selecting a test tool for an organization, which of these is a recommended first step?",
    choices: [
      { id: "a", text: "Buy the most expensive tool available, since price implies quality" },
      {
        id: "b",
        text: "Assess the organization's actual needs, maturity, and existing processes/tools it must integrate with",
        correct: true,
      },
      { id: "c", text: "Skip evaluation and copy whatever a competitor uses" },
      { id: "d", text: "Choose a tool with no trial period so the decision is final" },
    ],
    explanation:
      "Tool selection should start from the organization's real requirements — team skills, process maturity, budget, and what it needs to integrate with — rather than price, imitation, or a decision made without ever trying the tool first.",
  },
  {
    id: "ch6-q6",
    chapter: 6,
    kLevel: "K2",
    syllabusRef: "FL-6.3.1",
    stem: "A pilot project is recommended before rolling a new test tool out organization-wide. What is the main purpose of the pilot?",
    choices: [
      {
        id: "a",
        text: "To learn, on a small scale, whether the tool actually fits the team's real workflows and to surface problems before a costly wide rollout",
        correct: true,
      },
      { id: "b", text: "To satisfy a legal requirement" },
      { id: "c", text: "To avoid ever writing documentation for the tool" },
      { id: "d", text: "To guarantee the tool has zero defects" },
    ],
    explanation:
      "A pilot is a controlled, small-scale trial that reveals integration issues, training needs, and fit-for-purpose problems while the cost of being wrong is still low — far cheaper than discovering the tool doesn't fit after a full rollout.",
  },
  {
    id: "ch6-q7",
    chapter: 6,
    kLevel: "K1",
    syllabusRef: "FL-6.1.1",
    stem: "A performance testing tool that simulates thousands of concurrent virtual users hitting an API is best classified as which category of tool?",
    choices: [
      { id: "a", text: "Static analysis tool" },
      { id: "b", text: "Test execution / non-functional testing tool", correct: true },
      { id: "c", text: "Requirements management tool" },
      { id: "d", text: "Configuration management tool" },
    ],
    explanation:
      "Load/performance tools drive real execution against a running system to measure non-functional characteristics like response time and throughput under load — a test execution tool, not a static one, since it requires the software to actually run.",
  },
  {
    id: "ch6-q8",
    chapter: 6,
    kLevel: "K2",
    syllabusRef: "FL-6.2.1",
    stem: "Which of the following is a realistic risk of test automation, separate from the cost of initial tool purchase?",
    choices: [
      {
        id: "a",
        text: "Ongoing maintenance effort as the application under test evolves and scripts need updating",
        correct: true,
      },
      { id: "b", text: "Automated tests can never produce a false positive" },
      { id: "c", text: "Automated tests always run faster than is technically possible" },
      { id: "d", text: "Tool vendors guarantee lifetime free support for every tool" },
    ],
    explanation:
      "Automated checks need upkeep as the application's UI, APIs, and behaviour change — underestimating this ongoing cost is one of the most common reasons automation initiatives stall, alongside flaky tests that do produce false positives.",
  },
  {
    id: "ch6-q9",
    chapter: 6,
    kLevel: "K1",
    syllabusRef: "FL-6.1.1",
    stem: "A tool that automatically records and replays API requests as part of a CI pipeline, comparing responses against a saved baseline, is an example of:",
    choices: [
      { id: "a", text: "A test execution tool", correct: true },
      { id: "b", text: "A requirements management tool" },
      { id: "c", text: "A pure static analysis tool" },
      { id: "d", text: "A project management tool" },
    ],
    explanation:
      "Recording, replaying, and asserting on real API calls all require the system under test to actually execute — the defining trait of a test execution tool, distinct from tools that only inspect artefacts without running anything.",
  },
  {
    id: "ch6-q10",
    chapter: 6,
    kLevel: "K2",
    syllabusRef: "FL-6.3.1",
    stem: "An organization rolls out a new test automation tool but gives the team no training and no time allotted to learn it. What is the most likely outcome, per the syllabus's tool-introduction guidance?",
    choices: [
      {
        id: "a",
        text: "Low adoption and poor results, since successful tool introduction depends on adequate training and time to become proficient, not just the tool itself",
        correct: true,
      },
      { id: "b", text: "The tool will train the team automatically" },
      { id: "c", text: "Results will be identical to a fully trained team" },
      { id: "d", text: "No training is ever necessary for any tool" },
    ],
    explanation:
      "Tool introduction guidance stresses that training, coaching, and time to reach proficiency are success factors — skipping them is one of the most common reasons an otherwise suitable tool fails to deliver value.",
  },
  {
    id: "ch6-q11",
    chapter: 6,
    kLevel: "K1",
    syllabusRef: "FL-6.1.1",
    stem: "Which of these tool categories is primarily concerned with managing test data — generating, masking, or provisioning it for test environments?",
    choices: [
      { id: "a", text: "Test data preparation tools", correct: true },
      { id: "b", text: "Build and continuous integration tools" },
      { id: "c", text: "Coverage measurement tools" },
      { id: "d", text: "Bug/incident management tools" },
    ],
    explanation:
      "Test data preparation tools generate synthetic data, mask sensitive production data, or otherwise provision realistic data sets for testing — a distinct category from tools focused on builds, coverage, or defect tracking.",
  },
  {
    id: "ch6-q12",
    chapter: 6,
    kLevel: "K2",
    syllabusRef: "FL-6.1.1",
    stem: "A coverage tool reports that a test suite exercises 40% of a module's branches. What is the most appropriate use of that number?",
    choices: [
      {
        id: "a",
        text: "As one input, alongside risk and test design, to decide where more tests are needed — not as proof the module is 40% 'tested' in every sense",
        correct: true,
      },
      { id: "b", text: "As proof the module is bug-free in the covered 40%" },
      { id: "c", text: "As a replacement for all other test metrics" },
      { id: "d", text: "As irrelevant, since coverage tools are never accurate" },
    ],
    explanation:
      "Coverage measurement tells you what code was *executed*, not what was *properly checked* — a branch can run without its outcome being asserted on. It's a useful signal for gap analysis, not a certificate of correctness.",
  },
];
