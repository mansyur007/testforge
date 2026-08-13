import type { ExamQuestion } from "../types";

// A-06: Chapter 5 — Managing the Test Activities. Original questions on test
// planning, entry/exit criteria, risk management, test monitoring and
// reporting, configuration management and defect management. See
// docs/QA-ACADEMY.md §7.2.
//
// **A-10e realigned every `syllabusRef` in this file.** The chapter's refs used
// to be topic-sequential in the order the questions were authored — `FL-5.1.2`
// meant risk-based testing, `FL-5.4.1` meant estimation, `FL-5.6.1` meant
// configuration management — and none of that matched the syllabus, where 5.1
// is Test Planning, 5.2 Risk Management, 5.3 Test Monitoring/Control/
// Completion, 5.4 Configuration Management and 5.5 Defect Management. Two of
// the old ids (`FL-5.1.8`, `FL-5.6.1`) named nothing at all; the rest resolved
// to real objectives about entirely different topics, which is the worse
// failure of the two because a reviewer checking the ref would have found a
// plausible-looking answer. All 45 questions now sit on the objective they
// actually test, and all 16 of the chapter's objectives have at least one.

export const CH5_MANAGING_TESTING: ExamQuestion[] = [
  {
    id: "ch5-q1",
    chapter: 5,
    kLevel: "K2",
    syllabusRef: "FL-5.1.1",
    stem: "A test plan primarily documents:",
    choices: [
      {
        id: "a",
        text: "The scope, objectives, approach, resources and schedule of the testing",
        correct: true,
      },
      { id: "b", text: "The exact steps, test data and expected result of every individual test case" },
      { id: "c", text: "A running list of the defects found so far, with the status of each one" },
      { id: "d", text: "The production deployment schedule and the rollback plan that accompanies it" },
    ],
    explanation:
      "A test plan sets out what will be tested, why, how, by whom, with what resources, and on what schedule — the strategic and organizational picture, not the step-by-step content of individual test cases (that lives in the test cases themselves).",
  },
  {
    id: "ch5-q2",
    chapter: 5,
    kLevel: "K2",
    syllabusRef: "FL-5.2.3",
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
    kLevel: "K1",
    syllabusRef: "FL-5.2.1",
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
    kLevel: "K2",
    syllabusRef: "FL-5.1.3",
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
    syllabusRef: "FL-5.1.3",
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
    kLevel: "K3",
    syllabusRef: "FL-5.5.1",
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
    kLevel: "K3",
    syllabusRef: "FL-5.5.1",
    stem: "A defect makes the entire checkout page fail to load for every user. A separate defect causes a tooltip to display slightly misaligned text. How do severity and priority typically differ for these two?",
    choices: [
      {
        id: "a",
        text: "Severity reflects the defect's impact; priority reflects how urgently it is fixed",
        correct: true,
      },
      { id: "b", text: "Severity and priority always carry the same meaning, so recording both is redundant" },
      { id: "c", text: "Priority is set by whoever found the defect, and severity by whoever will fix it" },
      { id: "d", text: "Severity stops being relevant as soon as the defect has been logged and triaged" },
    ],
    explanation:
      "Severity is about impact (how bad is it), priority is about urgency (how soon must it be fixed) — they usually move together but can diverge, e.g. a cosmetic defect on the CEO's favourite screen might get high priority despite low severity.",
  },
  {
    id: "ch5-q8",
    chapter: 5,
    kLevel: "K3",
    syllabusRef: "FL-5.1.4",
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
    kLevel: "K1",
    syllabusRef: "FL-5.3.1",
    stem: "Which metric is most useful for tracking whether test execution is on schedule during a test cycle?",
    choices: [
      { id: "a", text: "Number of test cases executed vs. planned, over time", correct: true },
      { id: "b", text: "Defect reports closed last quarter" },
      { id: "c", text: "Test cases written before execution began" },
      { id: "d", text: "Automated tests added this sprint" },
    ],
    explanation:
      "Progress metrics like executed-vs-planned test case counts (often shown as a burn-down/burn-up) directly answer 'are we on track', which is exactly what test monitoring and control needs to decide whether to adjust the plan.",
  },
  {
    id: "ch5-q10",
    chapter: 5,
    kLevel: "K2",
    syllabusRef: "FL-5.3.2",
    stem: "A dashboard reports '92% of test cases passed' with no other detail. Why is a raw pass-rate number, on its own, a risky way to judge whether a release is ready?",
    choices: [
      {
        id: "a",
        text: "It hides what the failing 8% covers and how much was never tested at all",
        correct: true,
      },
      { id: "b", text: "Because a pass rate measured before a cycle ends is never accurate enough to publish" },
      { id: "c", text: "Because a pass rate above 90% is not mathematically achievable on a large suite" },
      { id: "d", text: "Because only a fully automated suite can produce a pass rate worth reporting" },
    ],
    explanation:
      "A single aggregate percentage hides which tests failed and why, whether high-risk areas were even covered, and whether the passing 92% tested anything meaningful — 'pass-rate theatre' is exactly the failure mode of reporting a number instead of a picture.",
  },

  // A-10d, second slice: chapter 5 to its full 45-question target. Chapter 5
  // was the sharpest remaining gap — 9 of the paper's 40 questions drawn from
  // a pool of 10, so two papers shared almost all of their chapter 5 content.
  //
  // On `syllabusRef`: this chapter's refs are topic-sequential in the order
  // the first ten were written (5.1 planning+risk, 5.2 criteria, 5.3 defect
  // management, 5.4 estimation, 5.5 metrics), which is NOT how chapter 4's
  // refs track the syllabus's own section structure. Extending the existing
  // scheme rather than realigning it is deliberate: docs/QA-ACADEMY.md §8
  // ("Not in A-10, deliberately") rules that syllabus verification gets its
  // own pass and that folding it into a code PR would bury it. The full
  // topic→ref table is recorded in §A-10d so that pass is a mechanical diff.
  //
  // On shapes: per the A-10d correction, multi-answer questions here span
  // 2/3/4 correct answers over 4-, 5- and 6-choice questions, and single-
  // answer questions use both 4 and 5 choices. Uniformity is the leak.
  {
    id: "ch5-q11",
    chapter: 5,
    kLevel: "K2",
    syllabusRef: "FL-5.1.1",
    stem: "What distinguishes a test plan from a test policy?",
    choices: [
      {
        id: "a",
        text: "A policy states the organization's testing principles; a plan covers one project",
        correct: true,
      },
      { id: "b", text: "A policy is written and owned by testers, and a plan by the development team" },
      { id: "c", text: "A policy lists the test cases to be run, and a plan lists the defects they found" },
      { id: "d", text: "They are the same document under two names, and usage depends on the industry" },
      { id: "e", text: "A policy applies only to automated testing, and a plan only to manual testing" },
    ],
    explanation:
      "A test policy sits above any single project — it expresses how the organization thinks about testing at all. A test plan is the project-level instrument that turns those principles into concrete scope, approach, resources and dates for a particular piece of work.",
  },
  {
    id: "ch5-q12",
    chapter: 5,
    kLevel: "K2",
    syllabusRef: "FL-5.1.1",
    multi: true,
    stem: "Which of the following would you expect to find in a test plan? (Select all that apply.)",
    choices: [
      { id: "a", text: "The scope of testing and what is explicitly out of scope", correct: true },
      { id: "b", text: "The entry and exit criteria for the test activities it covers", correct: true },
      { id: "c", text: "The environments, tools and test data the work depends on", correct: true },
      { id: "d", text: "The reproduction steps for each defect found during execution" },
      { id: "e", text: "The line-by-line source code of the features under test" },
    ],
    explanation:
      "A test plan describes the shape of the work: what is and is not being tested, what gates its start and finish, and what resources it needs. Defect reproduction steps belong in defect reports and code belongs in the repository — a plan that tried to carry either would be obsolete the day it was written.",
  },
  {
    id: "ch5-q13",
    chapter: 5,
    kLevel: "K1",
    syllabusRef: "FL-5.1.2",
    stem: "During release planning, what is the most useful contribution a tester can make?",
    choices: [
      {
        id: "a",
        text: "Assessing the testability of the proposed features and the risks each carries",
        correct: true,
      },
      { id: "b", text: "Writing the detailed test scripts for every feature before the scope is agreed" },
      { id: "c", text: "Deciding unilaterally which of the proposed features are cut from the release" },
      { id: "d", text: "Waiting until the scope is fixed, then reporting how long the testing will take" },
    ],
    explanation:
      "Release planning is where scope is still negotiable, so the tester's leverage is information: which features will be hard to test, what risks they carry, and roughly what they will cost to verify. Writing scripts against unagreed scope is waste, and reporting a duration after the fact gives the plan nothing it could have acted on.",
  },
  {
    id: "ch5-q14",
    chapter: 5,
    kLevel: "K1",
    syllabusRef: "FL-5.1.2",
    stem: "How does a tester's contribution to iteration planning differ from their contribution to release planning?",
    choices: [
      {
        id: "a",
        text: "Iteration planning works at story level, release planning at feature level",
        correct: true,
      },
      { id: "b", text: "Testers contribute to release planning only, and iteration planning is for developers" },
      { id: "c", text: "Iteration planning is the activity in which the organization's test policy is set" },
      { id: "d", text: "There is no difference — the same activities happen at both, on different dates" },
    ],
    explanation:
      "Both are planning, but at different granularity and horizon. Iteration planning is concrete and near-term — this story, its acceptance criteria, its test effort. Release planning is coarser and further out, concerned with features, overall risk and the shape of the release.",
  },
  {
    id: "ch5-q15",
    chapter: 5,
    kLevel: "K2",
    syllabusRef: "FL-5.1.3",
    stem: "A team lists four conditions for its system test phase: (1) the build is deployed to the staging environment, (2) no open critical defects remain, (3) test data has been loaded, (4) 95% of planned test cases have been executed. Which pair are entry criteria?",
    choices: [
      { id: "a", text: "1 and 3", correct: true },
      { id: "b", text: "2 and 4" },
      { id: "c", text: "1 and 2" },
      { id: "d", text: "3 and 4" },
    ],
    explanation:
      "Entry criteria describe the preconditions that must hold before testing can sensibly start — a deployed build and loaded test data. A defect ceiling and an execution percentage are both statements about work already done, so they gate the exit, not the entry.",
  },
  {
    id: "ch5-q16",
    chapter: 5,
    kLevel: "K2",
    syllabusRef: "FL-5.1.3",
    multi: true,
    stem: "Why does a team define exit criteria in advance rather than deciding when to stop testing as they go? (Select all that apply.)",
    choices: [
      {
        id: "a",
        text: "It makes 'done' an agreed, checkable condition rather than a judgement made under deadline pressure",
        correct: true,
      },
      { id: "b", text: "It gives stakeholders an objective basis for the release decision", correct: true },
      { id: "c", text: "It guarantees that no defects will remain in the product once they are met" },
      { id: "d", text: "It removes the need to report test results to anyone" },
    ],
    explanation:
      "Exit criteria are agreed before the pressure arrives, which is exactly when 'are we done?' becomes hardest to answer honestly, and they give the release decision something objective to rest on. They never guarantee a defect-free product — no criterion can, since exhaustive testing is impossible — and meeting them is something you report, not a substitute for reporting.",
  },
  {
    id: "ch5-q17",
    chapter: 5,
    kLevel: "K2",
    syllabusRef: "FL-5.1.3",
    stem: "A team treats 'acceptance criteria written and reviewed, and test data identified' as a condition a story must satisfy before it can enter a sprint. What is this an example of?",
    choices: [
      { id: "a", text: "A definition of ready", correct: true },
      { id: "b", text: "A definition of done" },
      { id: "c", text: "A test charter" },
      { id: "d", text: "A risk register" },
    ],
    explanation:
      "A definition of ready is the shared checklist a work item must pass to be considered fit to start — it protects the iteration from stories that will stall halfway through. A definition of done applies at the other end, stating what must be true before the story counts as complete.",
  },
  {
    id: "ch5-q18",
    chapter: 5,
    kLevel: "K3",
    syllabusRef: "FL-5.1.4",
    stem: "What is the essential difference between metrics-based and expert-based test estimation?",
    choices: [
      {
        id: "a",
        text: "Metrics-based extrapolates from past data; expert-based draws on judgement",
        correct: true,
      },
      { id: "b", text: "Metrics-based estimation is always more accurate than the expert-based kind" },
      { id: "c", text: "Expert-based estimation can only be applied on projects that follow agile methods" },
      { id: "d", text: "Metrics-based estimation needs no data to be collected before it can be applied" },
    ],
    explanation:
      "The two families differ in where the number comes from: recorded history in one case, informed human judgement in the other. Neither is universally more accurate — historical data is only as good as its comparability, and expert judgement is only as good as the expert's experience of similar work.",
  },
  {
    id: "ch5-q19",
    chapter: 5,
    kLevel: "K3",
    syllabusRef: "FL-5.1.4",
    stem: "A team estimates test effort for a feature using the three-point technique, with an optimistic estimate of 10 days, a most likely estimate of 15 days, and a pessimistic estimate of 26 days. Using the weighted formula E = (optimistic + 4 × most likely + pessimistic) / 6, what is the estimate?",
    choices: [
      { id: "a", text: "16 days", correct: true },
      { id: "b", text: "17 days" },
      { id: "c", text: "15 days" },
      { id: "d", text: "20 days" },
    ],
    explanation:
      "(10 + 4 × 15 + 26) / 6 = (10 + 60 + 26) / 6 = 96 / 6 = 16 days. The plain average of the three numbers is 17, which is what the weighting is there to avoid — quadrupling the most likely value pulls the estimate toward it rather than letting a long pessimistic tail dominate.",
  },
  {
    id: "ch5-q20",
    chapter: 5,
    kLevel: "K3",
    syllabusRef: "FL-5.1.4",
    stem: "In planning poker, why do team members reveal their estimates simultaneously rather than one at a time?",
    choices: [
      {
        id: "a",
        text: "To stop the first or most senior estimate from anchoring everyone else's",
        correct: true,
      },
      { id: "b", text: "To make the session finish faster than a round-by-round discussion would" },
      { id: "c", text: "Because the technique requires an odd number of participants to break ties" },
      { id: "d", text: "To make sure the highest estimate in the room is the one that gets adopted" },
    ],
    explanation:
      "Simultaneous reveal is the whole mechanism: it prevents anchoring. When estimates then diverge widely, that divergence is the useful signal — it usually means people are holding different assumptions about the work, and the conversation that follows is worth more than the number.",
  },
  {
    id: "ch5-q21",
    chapter: 5,
    kLevel: "K3",
    syllabusRef: "FL-5.1.4",
    stem: "A team's last four comparable features each took roughly 4 test-days per user story, and the next feature contains 7 stories of similar size. The team estimates 28 test-days. Which estimation approach is this, and what is its main vulnerability here?",
    choices: [
      {
        id: "a",
        text: "Metrics-based — it assumes the new stories really are comparable to the old",
        correct: true,
      },
      { id: "b", text: "Expert-based — it relies on individual judgement rather than on recorded history" },
      { id: "c", text: "Three-point — it combines an optimistic, a most likely and a pessimistic figure" },
      { id: "d", text: "Risk-based — it allocates the effort according to likelihood and to impact" },
    ],
    explanation:
      "Extrapolating 4 test-days per story from four past features is metrics-based estimation. Its weak point is always comparability: if the new stories touch an unfamiliar integration or a riskier area, the historical rate quietly stops applying and the estimate inherits an assumption nobody stated.",
  },
  {
    id: "ch5-q22",
    chapter: 5,
    kLevel: "K3",
    syllabusRef: "FL-5.1.5",
    stem: "A team orders its regression suite so that tests covering the areas most likely to fail and most damaging if they do run first. Which prioritization strategy is this?",
    choices: [
      { id: "a", text: "Risk-based prioritization", correct: true },
      { id: "b", text: "Coverage-based prioritization" },
      { id: "c", text: "Requirements-based prioritization" },
      { id: "d", text: "Alphabetical prioritization by test case name" },
    ],
    explanation:
      "Ordering by likelihood-and-impact is risk-based prioritization. Coverage-based ordering instead maximises how much of the code or specification is exercised earliest, and requirements-based ordering follows the stakeholder priority attached to each requirement.",
  },
  {
    id: "ch5-q23",
    chapter: 5,
    kLevel: "K3",
    syllabusRef: "FL-5.1.5",
    stem: "A regression run takes six hours, but a hotfix must ship in two. The team can only execute part of the suite. What is the soundest basis for choosing which tests to run?",
    choices: [
      {
        id: "a",
        text: "The areas the hotfix touches, plus the highest-risk core flows",
        correct: true,
      },
      { id: "b", text: "The tests that run fastest, to maximise how many complete within the two hours" },
      { id: "c", text: "The tests that have passed most consistently across recent regression runs" },
      { id: "d", text: "A random sample of the whole suite, so that the selection stays unbiased" },
    ],
    explanation:
      "Under a hard time box, value comes from covering what the change could have broken and what would hurt most if broken — and from being explicit that the remainder was skipped. Optimising for test count, or for tests that reliably pass, deliberately selects the runs least likely to tell you anything new.",
  },
  {
    id: "ch5-q24",
    chapter: 5,
    kLevel: "K3",
    syllabusRef: "FL-5.1.5",
    multi: true,
    stem: "Which of the following are recognised bases for prioritizing test cases? (Select all that apply.)",
    choices: [
      { id: "a", text: "The risk associated with the area a test covers", correct: true },
      { id: "b", text: "The stakeholder-assigned priority of the requirement a test verifies", correct: true },
      { id: "c", text: "The order in which the test cases happen to have been written" },
      { id: "d", text: "The length of the test case description" },
      { id: "e", text: "Whether the test author is available that day" },
    ],
    explanation:
      "Prioritization is meant to run the most valuable tests first, and value is judged by risk or by how much the requirement matters to stakeholders (coverage is the third common basis). Authoring order, description length and staff availability are all accidents of how the suite was produced, and ordering by them is prioritization in name only.",
  },
  {
    id: "ch5-q25",
    chapter: 5,
    kLevel: "K1",
    syllabusRef: "FL-5.1.6",
    stem: "The test pyramid recommends a large base of low-level tests and progressively fewer tests toward the top. What property of the tests changes as you move up the levels?",
    choices: [
      {
        id: "a",
        text: "They integrate more of the system, so they are slower and less precise",
        correct: true,
      },
      { id: "b", text: "They become cheaper to write and faster to run than the levels below them" },
      { id: "c", text: "They exercise smaller units of code, in greater isolation from each other" },
      { id: "d", text: "They become progressively less likely to find any defect worth reporting" },
    ],
    explanation:
      "Higher levels exercise more of the system at once. That buys realism, but the tests get slower, more brittle and less precise about where a failure came from — which is why the shape argues for many cheap tests underneath and comparatively few at the top, not for skipping the top.",
  },
  {
    id: "ch5-q26",
    chapter: 5,
    kLevel: "K1",
    syllabusRef: "FL-5.1.6",
    stem: "A team's suite is 900 end-to-end UI tests, 60 integration tests and 40 unit tests. The suite takes four hours and fails intermittently, and a failure rarely says which component is at fault. Which diagnosis fits?",
    choices: [
      {
        id: "a",
        text: "The pyramid is inverted — the bulk of the coverage sits at the worst level",
        correct: true,
      },
      { id: "b", text: "The suite has too few tests overall and needs more of every kind of test" },
      { id: "c", text: "The unit tests are causing the intermittency and should be removed first" },
      { id: "d", text: "End-to-end tests cannot fail intermittently, so the test data must be at fault" },
    ],
    explanation:
      "This is the inverted pyramid (sometimes the 'ice cream cone'). Both symptoms follow directly from the shape: end-to-end tests are slow and involve enough moving parts to flake, and when one fails it implicates the whole stack rather than a component. The fix is to push coverage down, not to add more at the top.",
  },
  {
    id: "ch5-q27",
    chapter: 5,
    kLevel: "K2",
    syllabusRef: "FL-5.1.7",
    stem: "The testing quadrants classify tests along two axes. What are they?",
    choices: [
      {
        id: "a",
        text: "Business-facing or technology-facing, and supporting or critiquing",
        correct: true,
      },
      { id: "b", text: "Whether the test is manual or automated, and functional or non-functional" },
      { id: "c", text: "Whether the test is written before or after the code, and how long it runs" },
      { id: "d", text: "Whether a tester or a developer runs it, and which level it belongs to" },
    ],
    explanation:
      "The quadrants cross two questions: who the test speaks to (business or technology), and what it is for (guiding the team as it builds, or critiquing what has been built). Automation status cuts across the quadrants rather than defining them — some quadrants are heavily automated, others necessarily manual.",
  },
  {
    id: "ch5-q28",
    chapter: 5,
    kLevel: "K2",
    syllabusRef: "FL-5.1.7",
    stem: "A team runs a load test to confirm the checkout service holds its response time at 5,000 concurrent users. In the testing quadrants, where does this test sit?",
    choices: [
      { id: "a", text: "Technology-facing, and critiquing the product", correct: true },
      { id: "b", text: "Business-facing, and supporting the team" },
      { id: "c", text: "Technology-facing, and supporting the team" },
      { id: "d", text: "Business-facing, and critiquing the product" },
    ],
    explanation:
      "A load test is expressed in technical terms (concurrency, response time) rather than business language, and it is run against a built system to find where it breaks — critique rather than guidance. Unit tests are the technology-facing tests that support the team; exploratory and usability testing are the business-facing ones that critique the product.",
  },
  {
    id: "ch5-q29",
    chapter: 5,
    kLevel: "K2",
    syllabusRef: "FL-5.2.2",
    stem: "What distinguishes a product risk from a project risk?",
    choices: [
      {
        id: "a",
        text: "A product risk is a shortfall in the software; a project risk threatens delivery",
        correct: true,
      },
      { id: "b", text: "A product risk is always more severe than a project risk on the same project" },
      { id: "c", text: "Product risks are identified by the developers and project risks by the managers" },
      { id: "d", text: "A product risk applies before release, and a project risk only after release" },
    ],
    explanation:
      "The distinction is about what is at stake. Product risks concern the quality of the thing being built — it might be slow, wrong, or insecure. Project risks concern the endeavour — staff leaving, environments arriving late, a supplier slipping. Testing addresses product risks directly and surfaces information about project ones.",
  },
  {
    id: "ch5-q30",
    chapter: 5,
    kLevel: "K2",
    syllabusRef: "FL-5.2.2",
    stem: "Which of these is a project risk rather than a product risk?",
    choices: [
      { id: "a", text: "The only engineer who understands the payment integration is leaving in three weeks", correct: true },
      { id: "b", text: "The checkout page may not meet its accessibility requirements" },
      { id: "c", text: "The search results may be returned in the wrong order under load" },
      { id: "d", text: "The password reset flow may allow an account to be taken over" },
    ],
    explanation:
      "Losing the one person who knows a subsystem threatens the project's ability to deliver, whatever the software ends up doing — a project risk. The other three are all statements about how the delivered product might fall short, which is what makes them product risks and what testing is aimed at.",
  },
  {
    id: "ch5-q31",
    chapter: 5,
    kLevel: "K1",
    syllabusRef: "FL-5.2.1",
    stem: "A team rates four risks on likelihood and impact, each from 1 (low) to 5 (high), and treats risk level as the product of the two. Which risk should receive the most test effort? (A) likelihood 5, impact 2. (B) likelihood 2, impact 5. (C) likelihood 4, impact 4. (D) likelihood 1, impact 5.",
    choices: [
      { id: "a", text: "C — risk level 16", correct: true },
      { id: "b", text: "A — because it is the most likely to occur" },
      { id: "c", text: "B — because a high impact always outranks a high likelihood" },
      { id: "d", text: "D — because impact is the only factor that matters" },
    ],
    explanation:
      "Multiplying gives A = 10, B = 10, C = 16, D = 5, so C is the highest. The distractors each collapse the two dimensions into one — treating likelihood or impact alone as decisive — which is precisely what combining them into a risk level is meant to prevent.",
  },
  {
    id: "ch5-q32",
    chapter: 5,
    kLevel: "K2",
    syllabusRef: "FL-5.2.4",
    multi: true,
    stem: "Product risk analysis has identified a high risk in the payment flow. Which of the following are legitimate risk-control responses? (Select all that apply.)",
    choices: [
      { id: "a", text: "Concentrate more test effort and more experienced testers on that flow", correct: true },
      { id: "b", text: "Apply additional review or static analysis to the code implementing it", correct: true },
      { id: "c", text: "Prepare a contingency plan, such as a tested rollback, in case the risk materialises anyway", correct: true },
      { id: "d", text: "Accept the risk explicitly, with the decision recorded and agreed by stakeholders", correct: true },
      { id: "e", text: "Remove the risk from the risk register so it stops appearing in status reports" },
    ],
    explanation:
      "Mitigating through extra testing or review, preparing a contingency, and consciously accepting a risk are all valid responses — accepting is a decision, provided it is explicit and owned. Deleting the entry changes nothing about the software and only removes the team's visibility of it, which is how a known risk turns into a surprise.",
  },
  {
    id: "ch5-q33",
    chapter: 5,
    kLevel: "K2",
    syllabusRef: "FL-5.2.3",
    stem: "Why is product risk analysis repeated during a project rather than done once at the start?",
    choices: [
      {
        id: "a",
        text: "Because risks change as the product and its context change during the work",
        correct: true,
      },
      { id: "b", text: "Because the initial analysis is normally discarded and redone from scratch" },
      { id: "c", text: "Because auditors require the analysis to be re-signed at the end of each month" },
      { id: "d", text: "Because risk levels have to be recalculated whenever the team's size changes" },
    ],
    explanation:
      "A risk analysis is a snapshot of what the team believed at one moment. Testing then produces exactly the evidence that should change those beliefs — an area that keeps failing was riskier than assumed, one that holds up may be less so — so revisiting the analysis periodically is how the test effort stays pointed at where the risk actually is.",
  },
  {
    id: "ch5-q34",
    chapter: 5,
    kLevel: "K1",
    syllabusRef: "FL-5.3.1",
    stem: "What does defect density measure?",
    choices: [
      { id: "a", text: "The number of defects found, relative to the size of the component or system", correct: true },
      { id: "b", text: "The number of defects found per tester per day" },
      { id: "c", text: "The proportion of defects that have been fixed" },
      { id: "d", text: "How long a defect stays open before it is resolved" },
      { id: "e", text: "The severity distribution of the defects found so far" },
    ],
    explanation:
      "Defect density normalises a raw defect count by size — per thousand lines of code, per module, per function point — which is what makes it possible to compare components of different sizes. A raw count on its own says as much about how big something is as about how faulty it is.",
  },
  {
    id: "ch5-q35",
    chapter: 5,
    kLevel: "K1",
    syllabusRef: "FL-5.3.1",
    stem: "Testing found 152 defects before release. In the three months after release, users reported a further 8 defects that had been present at release. What is the defect detection percentage (DDP)?",
    choices: [
      { id: "a", text: "95%", correct: true },
      { id: "b", text: "5%" },
      { id: "c", text: "19%" },
      { id: "d", text: "94%" },
    ],
    explanation:
      "DDP is defects found by testing divided by the total defects known to have been present, expressed as a percentage: 152 / (152 + 8) = 152 / 160 = 95%. Note it can only ever be calculated in arrears — the denominator depends on what escapes, which is not knowable at the point of release.",
  },
  {
    id: "ch5-q36",
    chapter: 5,
    kLevel: "K1",
    syllabusRef: "FL-5.3.1",
    stem: "A team's defect discovery curve was climbing steeply for three weeks and has now flattened for a week, with test execution still proceeding at the same rate. What is the most defensible reading?",
    choices: [
      {
        id: "a",
        text: "It fits the tested areas stabilising, but also the tests exploring nothing new",
        correct: true,
      },
      { id: "b", text: "The product is now defect-free, so the test execution can safely be stopped" },
      { id: "c", text: "The testers have become less effective and should be replaced on this project" },
      { id: "d", text: "The curve carries no meaning, because defect counts vary naturally week to week" },
    ],
    explanation:
      "A flattening curve is genuinely ambiguous: it looks the same whether the code has stabilised or the suite has run out of new ground to cover. That is why it is read alongside coverage and what is actually being executed, rather than treated as a finish line on its own.",
  },
  {
    id: "ch5-q37",
    chapter: 5,
    kLevel: "K2",
    syllabusRef: "FL-5.3.2",
    stem: "How does a test progress report differ from a test completion report?",
    choices: [
      {
        id: "a",
        text: "A progress report supports control during the work; a completion report sums it up",
        correct: true,
      },
      { id: "b", text: "A progress report is written for testers and a completion report for developers" },
      { id: "c", text: "A progress report contains metrics, and a completion report contains none at all" },
      { id: "d", text: "They differ only in length, and either can be issued at any point in the work" },
    ],
    explanation:
      "The difference is timing and purpose. A progress report exists to let someone steer while the work is still running — reallocate effort, adjust scope. A completion report closes the activity out: what was covered, what was found, what residual risk the release carries.",
  },
  {
    id: "ch5-q38",
    chapter: 5,
    kLevel: "K2",
    syllabusRef: "FL-5.3.2",
    multi: true,
    stem: "Which of the following belong in a test completion report? (Select all that apply.)",
    choices: [
      { id: "a", text: "A summary of what was tested and what was deliberately not tested", correct: true },
      { id: "b", text: "The residual risk carried into the release", correct: true },
      { id: "c", text: "Whether the agreed exit criteria were met, and where they were not", correct: true },
      { id: "d", text: "The full step-by-step script of every test case executed" },
      { id: "e", text: "The individual performance ratings of each tester on the team" },
      { id: "f", text: "The source code diff of every defect fix made during the cycle" },
    ],
    explanation:
      "A completion report is for whoever must decide what to do next, so it carries scope, residual risk and the exit-criteria verdict. Full scripts and code diffs already live in the test management and version control systems, and individual performance ratings turn a quality record into a personnel document — which is a fast way to make people stop reporting bad news.",
  },
  {
    id: "ch5-q39",
    chapter: 5,
    kLevel: "K2",
    syllabusRef: "FL-5.3.3",
    stem: "A test manager writes the same detailed defect-by-defect breakdown for the development team and for the executive sponsor. What is the problem?",
    choices: [
      {
        id: "a",
        text: "The report is not adapted to its audience; the sponsor needs risk and readiness",
        correct: true,
      },
      { id: "b", text: "Executives should never be sent test reports of any kind during a release" },
      { id: "c", text: "Defect details are confidential and cannot be shared outside the test team" },
      { id: "d", text: "There is no problem — one report for every audience is the recommended practice" },
    ],
    explanation:
      "Communicating test status means shaping the same underlying information for what each audience must decide. The development team acts on specifics; a sponsor is deciding whether to ship, and needs risk, coverage and readiness. Sending both the same document usually means one of them stops reading it.",
  },
  {
    id: "ch5-q40",
    chapter: 5,
    kLevel: "K3",
    syllabusRef: "FL-5.5.1",
    stem: "What is the main purpose of a defect management process?",
    choices: [
      {
        id: "a",
        text: "To track each defect from discovery to resolution, so that none is lost",
        correct: true,
      },
      { id: "b", text: "To determine which member of the team is responsible for each defect found" },
      { id: "c", text: "To ensure that every defect found is fixed before release, without exception" },
      { id: "d", text: "To count defects, so that testers can be measured on how many they report" },
    ],
    explanation:
      "Defect management exists so that a defect, once found, has a definite state and a definite owner until it is resolved or consciously deferred — and so the accumulated record can support analysis later. Not every defect gets fixed; that is a prioritization decision, and the process is what makes deferral explicit rather than accidental.",
  },
  {
    id: "ch5-q41",
    chapter: 5,
    kLevel: "K3",
    syllabusRef: "FL-5.5.1",
    stem: "A defect report reads in full: 'Export is broken, please fix.' What is the single most important thing missing?",
    choices: [
      {
        id: "a",
        text: "Steps to reproduce, with the expected and the actual result",
        correct: true,
      },
      { id: "b", text: "The name of the developer who originally wrote the export feature" },
      { id: "c", text: "A suggested code change that would resolve the reported problem" },
      { id: "d", text: "The total number of other defects that were found on the same day" },
    ],
    explanation:
      "Everything a defect report does downstream depends on reproduction: a developer cannot investigate what they cannot trigger, and nobody can tell whether a fix worked without knowing what 'working' looks like. Attribution and proposed fixes are optional at best, and naming a culprit tends to make reports worse rather than better.",
  },
  {
    id: "ch5-q42",
    chapter: 5,
    kLevel: "K3",
    syllabusRef: "FL-5.5.1",
    stem: "A tester hits a defect that only appears roughly one time in twenty, and cannot pin down a reliable sequence to trigger it. What is the most useful way to report it?",
    choices: [
      {
        id: "a",
        text: "Report it as intermittent, with the observed frequency and what was captured",
        correct: true,
      },
      { id: "b", text: "Do not report it at all until reliable reproduction steps have been found" },
      { id: "c", text: "Report it as fully reproducible, and let the developer discover otherwise" },
      { id: "d", text: "Report it verbally, since intermittent defects do not belong in the tracker" },
    ],
    explanation:
      "Intermittent defects are often the serious ones — races, leaks, state dependence — so suppressing the report until it reproduces cleanly can bury the worst bug in the release. What makes such a report useful is honesty about the frequency plus every scrap of context from the occurrences that were seen; overstating reproducibility just costs the developer a wasted afternoon.",
  },
  {
    id: "ch5-q43",
    chapter: 5,
    kLevel: "K3",
    syllabusRef: "FL-5.5.1",
    multi: true,
    stem: "Which of the following make a defect report more actionable? (Select all that apply.)",
    choices: [
      { id: "a", text: "The build or version identifier the defect was observed on", correct: true },
      { id: "b", text: "Expected result alongside actual result", correct: true },
      { id: "c", text: "The environment and configuration in use", correct: true },
      { id: "d", text: "A judgement about the competence of whoever introduced it" },
    ],
    explanation:
      "A build identifier, the expected-versus-actual pair, and the environment are the three things that most often decide whether a defect can be reproduced at all. Attributing blame adds nothing an investigator can act on and reliably degrades the working relationship the fix depends on.",
  },
  {
    id: "ch5-q44",
    chapter: 5,
    kLevel: "K2",
    syllabusRef: "FL-5.4.1",
    stem: "How does configuration management support testing?",
    choices: [
      {
        id: "a",
        text: "It keeps test items and testware identified and version-controlled",
        correct: true,
      },
      { id: "b", text: "It generates the test cases automatically from the module's source code" },
      { id: "c", text: "It removes the need for a separate defect tracking system on the project" },
      { id: "d", text: "It measures how much of the code the executed tests actually cover" },
    ],
    explanation:
      "Configuration management is what makes a test result mean something: it establishes which version of which item produced it, and keeps tests, test data and the software under test in step. Without that, a pass or fail is attached to an unknown thing.",
  },
  {
    id: "ch5-q45",
    chapter: 5,
    kLevel: "K2",
    syllabusRef: "FL-5.4.1",
    stem: "A tester logs a defect against 'the latest build'. Two weeks later the developer cannot reproduce it, and nobody can establish which build was actually tested or whether the test data has since changed. Which failing does this most directly illustrate?",
    choices: [
      { id: "a", text: "Inadequate configuration management", correct: true },
      { id: "b", text: "Inadequate boundary value analysis" },
      { id: "c", text: "Missing exit criteria" },
      { id: "d", text: "An inverted test pyramid" },
    ],
    explanation:
      "Every part of this — an unidentifiable build, testware drifting out of step with the software, a result that can no longer be tied to a version — is what configuration management exists to prevent. The defect may well be real, but without the version and data pinned down it can no longer be investigated.",
  },
];
