import type { ExamQuestion } from "../types";

// A-06: Chapter 5 — Managing the Test Activities. Original questions on test
// planning, entry/exit criteria, risk-based testing, defect management, and
// test estimation. See docs/QA-ACADEMY.md §7.2.

export const CH5_MANAGING_TESTING: ExamQuestion[] = [
  {
    id: "ch5-q1",
    chapter: 5,
    kLevel: "K1",
    syllabusRef: "FL-5.1.1",
    stem: "A test plan primarily documents:",
    choices: [
      {
        id: "a",
        text: "The scope, objectives, approach, resources, and schedule of the test activities for a project or feature",
        correct: true,
      },
      { id: "b", text: "The exact steps of every individual test case" },
      { id: "c", text: "Only the defects found so far" },
      { id: "d", text: "The production deployment schedule" },
    ],
    explanation:
      "A test plan sets out what will be tested, why, how, by whom, with what resources, and on what schedule — the strategic and organizational picture, not the step-by-step content of individual test cases (that lives in the test cases themselves).",
  },
  {
    id: "ch5-q2",
    chapter: 5,
    kLevel: "K2",
    syllabusRef: "FL-5.1.2",
    stem: "A team decides to spend more test effort on the payment flow than on the 'About us' page because a payment defect would be far more damaging. This is an example of:",
    choices: [
      { id: "a", text: "Exhaustive testing" },
      { id: "b", text: "Risk-based testing", correct: true },
      { id: "c", text: "Confirmation testing" },
      { id: "d", text: "Static analysis" },
    ],
    explanation:
      "Risk-based testing allocates effort according to the likelihood and impact of things going wrong — a high-impact area like payments earns more scrutiny than a low-risk static page, given the same limited time and budget.",
  },
  {
    id: "ch5-q3",
    chapter: 5,
    kLevel: "K2",
    syllabusRef: "FL-5.1.2",
    stem: "In risk-based testing, 'risk level' is typically a function of which two factors?",
    choices: [
      { id: "a", text: "Team size and sprint length" },
      { id: "b", text: "Likelihood of a problem occurring and the impact if it does", correct: true },
      { id: "c", text: "Number of test cases written and number automated" },
      { id: "d", text: "Code coverage percentage and lines of code" },
    ],
    explanation:
      "Risk is generally assessed as a combination of the probability that something will go wrong and the impact (cost, harm, reputational damage) if it does — higher on both dimensions means higher priority for test effort.",
  },
  {
    id: "ch5-q4",
    chapter: 5,
    kLevel: "K1",
    syllabusRef: "FL-5.2.1",
    stem: "Entry criteria for a test level define:",
    choices: [
      { id: "a", text: "The conditions that must be met before testing at that level can begin", correct: true },
      { id: "b", text: "The final release date of the product" },
      { id: "c", text: "How many testers are needed for the whole project" },
      { id: "d", text: "The programming language the team uses" },
    ],
    explanation:
      "Entry criteria (e.g. the build is deployed to the test environment, test data is available) gate the start of testing at a level; exit criteria gate when that level's testing is considered done — different checkpoints on the same test level.",
  },
  {
    id: "ch5-q5",
    chapter: 5,
    kLevel: "K2",
    syllabusRef: "FL-5.2.1",
    stem: "A team decides system testing is 'done' once 95% of planned test cases have passed and no open critical or high-severity defects remain. This is an example of:",
    choices: [
      { id: "a", text: "Entry criteria" },
      { id: "b", text: "Exit criteria", correct: true },
      { id: "c", text: "A test charter" },
      { id: "d", text: "A defect taxonomy" },
    ],
    explanation:
      "Exit criteria define what 'finished testing' means for a given level or cycle — here, a pass-rate threshold plus a defect-severity ceiling — used to decide whether to move on rather than to decide when to start.",
  },
  {
    id: "ch5-q6",
    chapter: 5,
    kLevel: "K1",
    syllabusRef: "FL-5.3.1",
    stem: "Which of the following is typically included in a well-written defect report?",
    choices: [
      { id: "a", text: "Only the reporter's opinion that the software is 'bad'" },
      {
        id: "b",
        text: "Steps to reproduce, expected vs. actual result, environment, and severity",
        correct: true,
      },
      { id: "c", text: "The full source code of the affected module" },
      { id: "d", text: "A guess at which developer caused it" },
    ],
    explanation:
      "A defect report that gets fixed quickly gives whoever picks it up everything needed to reproduce and understand the problem: precise steps, what was expected versus what actually happened, the environment it occurred in, and how severe/urgent it is — not blame or speculation.",
  },
  {
    id: "ch5-q7",
    chapter: 5,
    kLevel: "K2",
    syllabusRef: "FL-5.3.1",
    stem: "A defect makes the entire checkout page fail to load for every user. A separate defect causes a tooltip to display slightly misaligned text. How do severity and priority typically differ for these two?",
    choices: [
      {
        id: "a",
        text: "Severity reflects the technical/business impact of the defect; priority reflects how urgently it should be fixed — the checkout defect is likely high on both, the tooltip low on both, but the two dimensions can diverge",
        correct: true,
      },
      { id: "b", text: "Severity and priority always mean exactly the same thing" },
      { id: "c", text: "Priority is decided only by the tester who found the bug" },
      { id: "d", text: "Severity is irrelevant once a defect is logged" },
    ],
    explanation:
      "Severity is about impact (how bad is it), priority is about urgency (how soon must it be fixed) — they usually move together but can diverge, e.g. a cosmetic defect on the CEO's favourite screen might get high priority despite low severity.",
  },
  {
    id: "ch5-q8",
    chapter: 5,
    kLevel: "K1",
    syllabusRef: "FL-5.4.1",
    stem: "Which of these is a widely used approach to estimating test effort?",
    choices: [
      {
        id: "a",
        text: "Expert-based estimation, drawing on the experience of the people who will do the work",
        correct: true,
      },
      { id: "b", text: "Always assuming testing takes exactly 10% of development time" },
      { id: "c", text: "Skipping estimation and testing until the deadline arrives" },
      { id: "d", text: "Estimating based only on the number of developers on the team" },
    ],
    explanation:
      "Expert-based (and metrics-based, using historical data from similar past projects) approaches are the two general families of test estimation technique — both grounded in real information rather than a fixed rule of thumb.",
  },
  {
    id: "ch5-q9",
    chapter: 5,
    kLevel: "K2",
    syllabusRef: "FL-5.5.1",
    stem: "Which metric is most useful for tracking whether test execution is on schedule during a test cycle?",
    choices: [
      { id: "a", text: "Number of test cases executed vs. planned, over time", correct: true },
      { id: "b", text: "The office's total electricity usage" },
      { id: "c", text: "The number of team lunches held" },
      { id: "d", text: "The color scheme of the test management tool" },
    ],
    explanation:
      "Progress metrics like executed-vs-planned test case counts (often shown as a burn-down/burn-up) directly answer 'are we on track', which is exactly what test monitoring and control needs to decide whether to adjust the plan.",
  },
  {
    id: "ch5-q10",
    chapter: 5,
    kLevel: "K2",
    syllabusRef: "FL-5.5.1",
    stem: "A dashboard reports '92% of test cases passed' with no other detail. Why is a raw pass-rate number, on its own, a risky way to judge whether a release is ready?",
    choices: [
      {
        id: "a",
        text: "It says nothing about what the failing 8% covers, how severe those failures are, or how much of the risk area was even tested",
        correct: true,
      },
      { id: "b", text: "Because pass rates are never accurate" },
      { id: "c", text: "Because 92% is mathematically impossible" },
      { id: "d", text: "Because only automated tests can produce a pass rate" },
    ],
    explanation:
      "A single aggregate percentage hides which tests failed and why, whether high-risk areas were even covered, and whether the passing 92% tested anything meaningful — 'pass-rate theatre' is exactly the failure mode of reporting a number instead of a picture.",
  },
];
