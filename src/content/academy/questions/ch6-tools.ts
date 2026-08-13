import type { ExamQuestion } from "../types";

// A-06: Chapter 6 — Test Tools. Original questions on tool categories and on
// the benefits and risks of test automation. See docs/QA-ACADEMY.md §7.2.
//
// The whole chapter hangs off two learning objectives — FL-6.1.1 (K2) and
// FL-6.2.1 (K1) — which is the shortest chapter in the syllabus and why 12
// questions already clear its 5x blueprint target of 10.
//
// A-10e rewrote q5, q6 and q10. They asked about tool selection, running a
// pilot project, and introducing a tool into an organization: v4.0 removed that
// section as too advanced for foundation level, so all three referenced an
// objective (`FL-6.3.1`) that does not exist and tested material no paper would
// ask about.

export const CH6_TOOLS: ExamQuestion[] = [
  {
    id: "ch6-q1",
    chapter: 6,
    kLevel: "K2",
    syllabusRef: "FL-6.1.1",
    stem: "A test management tool primarily supports:",
    choices: [
      {
        id: "a",
        text: "Planning, tracking and reporting on test cases, runs and defects",
        correct: true,
      },
      { id: "b", text: "Compiling the application's source code into a deployable artifact" },
      { id: "c", text: "Generating the production infrastructure the application runs on" },
      { id: "d", text: "Rendering the application's user interface at runtime" },
    ],
    explanation:
      "Test management tools organize and track test artefacts — cases, suites, runs, results — and usually integrate with defect trackers, giving a picture of test progress and coverage over time.",
  },
  {
    id: "ch6-q2",
    chapter: 6,
    kLevel: "K2",
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
    kLevel: "K1",
    syllabusRef: "FL-6.2.1",
    stem: "Which of these is a genuine benefit of using test automation tools?",
    choices: [
      {
        id: "a",
        text: "Repetitive regression checks run faster and more consistently",
        correct: true,
      },
      { id: "b", text: "Tools remove the need for any human involvement in test design" },
      { id: "c", text: "Automated tests never need maintenance once they have been written" },
      { id: "d", text: "Tools guarantee that every defect in the product will be detected" },
    ],
    explanation:
      "Tools are excellent at repetitive, precise, fast execution — ideal for regression. They don't replace the judgement needed to design good tests, they still need maintenance as the software changes, and no tool guarantees complete defect detection.",
  },
  {
    id: "ch6-q4",
    chapter: 6,
    kLevel: "K1",
    syllabusRef: "FL-6.2.1",
    stem: "A team introduces a UI test automation tool expecting it to immediately replace all manual testing, without budgeting time to maintain scripts as the UI changes. What risk are they most likely to run into?",
    choices: [
      {
        id: "a",
        text: "The suite becomes brittle and is eventually abandoned",
        correct: true,
      },
      { id: "b", text: "The tool will begin writing its own test cases from the UI" },
      { id: "c", text: "Automation always reduces the total project cost immediately" },
      { id: "d", text: "There is no risk, since more automation is always strictly better" },
    ],
    explanation:
      "A commonly cited risk of tool support is unrealistic expectations (thinking a tool is a complete substitute for skilled human test design) combined with underestimating the effort to introduce and maintain it — exactly the scenario described.",
  },
  {
    id: "ch6-q5",
    chapter: 6,
    kLevel: "K2",
    syllabusRef: "FL-6.1.1",
    stem: "A team wants one place where every reported anomaly is tracked from the first report through to a verified fix. Which category of test tool is that?",
    choices: [
      { id: "a", text: "Test execution tools, which replay scripted checks against each new build" },
      {
        id: "b",
        text: "Defect management tools, which hold each anomaly's state and history",
        correct: true,
      },
      { id: "c", text: "Static analysis tools, which inspect source code without ever running it" },
      { id: "d", text: "Continuous integration tools, which build and deploy each merged change" },
    ],
    explanation:
      "Defect management tools store reported anomalies and carry each one through its lifecycle — new, assigned, fixed, retested, closed — which is what makes the state of every known problem visible in one place. The other three categories all support testing, but none of them is where a defect's status lives.",
  },
  {
    id: "ch6-q6",
    chapter: 6,
    kLevel: "K1",
    syllabusRef: "FL-6.2.1",
    stem: "A suite of 800 automated checks is green on every run, yet users keep reporting problems the suite never flags. Which risk of test automation does this best illustrate?",
    choices: [
      {
        id: "a",
        text: "Automated checks verify only what someone thought to encode in them",
        correct: true,
      },
      { id: "b", text: "Automated checks take longer to execute than the same checks run by hand" },
      { id: "c", text: "Automated checks cannot be run more than once against a given build" },
      { id: "d", text: "Automated checks report their results in a format no other tool can read" },
    ],
    explanation:
      "An automated suite is a record of the risks someone already thought of. It re-asks those questions cheaply and reliably, which is its value, but a green run says nothing about the areas nobody wrote a check for — so a suite that never goes red can coexist with users hitting problems daily.",
  },
  {
    id: "ch6-q7",
    chapter: 6,
    kLevel: "K2",
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
    kLevel: "K1",
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
    kLevel: "K2",
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
    syllabusRef: "FL-6.1.1",
    stem: "A team wires its component tests, a linter and a coverage report into the pipeline that runs on every push. What has the tooling actually changed?",
    choices: [
      {
        id: "a",
        text: "Feedback on each change arrives without anyone having to ask for it",
        correct: true,
      },
      { id: "b", text: "The team no longer has to decide which risks are worth testing for" },
      { id: "c", text: "The pipeline stands in for the test design work behind each check" },
      { id: "d", text: "Defects in the areas no check covers will now surface automatically" },
    ],
    explanation:
      "Continuous integration tooling changes when feedback arrives, not what is being checked: the same component tests, linter and coverage report now run on every push instead of when someone remembers. Deciding what is worth checking, and designing the checks, is unchanged — and nothing in the pipeline can see a defect in code no check touches.",
  },
  {
    id: "ch6-q11",
    chapter: 6,
    kLevel: "K2",
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
        text: "As one input, alongside risk, to decide where more tests are needed",
        correct: true,
      },
      { id: "b", text: "As proof that the covered 40% of the module is free of defects" },
      { id: "c", text: "As a replacement for every other test metric the team currently collects" },
      { id: "d", text: "As irrelevant, since coverage tools are never accurate enough" },
    ],
    explanation:
      "Coverage measurement tells you what code was *executed*, not what was *properly checked* — a branch can run without its outcome being asserted on. It's a useful signal for gap analysis, not a certificate of correctness.",
  },
];
