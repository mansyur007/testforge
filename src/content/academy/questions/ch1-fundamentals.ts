import type { ExamQuestion } from "../types";

// A-06: Chapter 1 — Fundamentals of Testing. Original questions written from
// the CTFL v4.0 syllabus's learning objectives (chapter 1: what testing is,
// why it's necessary, the seven principles, the test process, and the
// psychology of testing) — never copied or reworded from a real paper, a
// sample paper, or a commercial bank. See docs/QA-ACADEMY.md §7.2.
//
// A-10d's fifth slice grew this chapter 12 → 40, its full 5x blueprint target,
// and it is the first chapter written *after* A-10e — so the 28 new questions
// were authored objective by objective from the syllabus text rather than from
// a topic list. That changed what got written: eight of chapter 1's fourteen
// objectives had no question at all (testing vs debugging, testing vs QA, test
// process in context, testware, traceability, roles, generic skills, the whole
// team approach), and between them they now carry 21 of the 28. All 14
// objectives are covered.
//
// A-10d's eighth slice added 4 more (q41–q44) to bring FL-1.2.3, FL-1.4.4,
// FL-1.5.1 and FL-1.5.2 up to the bank's depth floor of 3 questions each. The
// floor is now asserted: "at least one question" was the right bar while 17
// objectives had none, but it is satisfied by an objective a paper can only
// ever ask about one way.

export const CH1_FUNDAMENTALS: ExamQuestion[] = [
  {
    id: "ch1-q1",
    chapter: 1,
    kLevel: "K1",
    syllabusRef: "FL-1.1.1",
    stem: "Which of these best describes what software testing actually is?",
    choices: [
      { id: "a", text: "Proving that a program contains no defects at all before release" },
      {
        id: "b",
        text: "An evaluation of a component or system, reporting on its quality",
        correct: true,
      },
      { id: "c", text: "Writing the code that fixes the bugs reported by end users" },
      { id: "d", text: "Running the software repeatedly to see whether it crashes" },
    ],
    explanation:
      "Testing is a set of activities — planning, analysis, design, execution, evaluation, reporting — carried out to give stakeholders objective information about quality. It is not a proof of absence of defects; it reduces the risk of undiscovered ones.",
  },
  {
    id: "ch1-q2",
    chapter: 1,
    kLevel: "K2",
    syllabusRef: "FL-1.2.3",
    stem: "A user enters a valid discount code and the checkout total does not change. What is the discount code field's incorrect output an example of?",
    choices: [
      { id: "a", text: "An error" },
      { id: "b", text: "A failure", correct: true },
      { id: "c", text: "A defect report" },
      { id: "d", text: "A test condition" },
    ],
    explanation:
      "A failure is the observable, external symptom — the system behaving other than expected. The underlying mistake in the code is a defect (fault); the human mistake that introduced it is an error.",
  },
  {
    id: "ch1-q3",
    chapter: 1,
    kLevel: "K2",
    syllabusRef: "FL-1.2.3",
    stem: "A developer misreads a requirement and writes the wrong tax calculation. Put the three terms in the order they occur: the mistake itself, the flaw left in the code, and the wrong total a customer sees.",
    choices: [
      { id: "a", text: "Defect → Error → Failure" },
      { id: "b", text: "Failure → Defect → Error" },
      { id: "c", text: "Error → Defect → Failure", correct: true },
      { id: "d", text: "Error → Failure → Defect" },
    ],
    explanation:
      "A human error (misreading the requirement) introduces a defect (the wrong formula in the code), which under the right conditions produces a failure (the wrong total shown to a user).",
  },
  {
    id: "ch1-q4",
    chapter: 1,
    kLevel: "K2",
    syllabusRef: "FL-1.2.1",
    stem: "Which of the following is a reason testing is necessary, beyond finding defects?",
    choices: [
      { id: "a", text: "It guarantees that the software is free of defects before release" },
      {
        id: "b",
        text: "It gives stakeholders information for release and risk decisions",
        correct: true,
      },
      { id: "c", text: "It replaces the need to review the requirements at all" },
      { id: "d", text: "It removes the need for any production monitoring system" },
    ],
    explanation:
      "Testing contributes to confidence and decision-making — showing that the software meets its requirements and giving stakeholders enough information to judge quality and risk, not a guarantee of zero defects.",
  },
  {
    id: "ch1-q5",
    chapter: 1,
    kLevel: "K2",
    syllabusRef: "FL-1.3.1",
    stem: "A team assumes that because their payment feature passed all 40 planned tests, it has no remaining defects. Which testing principle does this reasoning violate?",
    choices: [
      { id: "a", text: "Testing shows the presence of defects, not their absence", correct: true },
      { id: "b", text: "Exhaustive testing is possible for small features" },
      { id: "c", text: "Defects cluster" },
      { id: "d", text: "Early testing saves time and money" },
    ],
    explanation:
      "Passing tests reduces the probability of undiscovered defects in the areas covered; it never proves their absence, because the untested paths, inputs, and conditions might still hide one.",
  },
  {
    id: "ch1-q6",
    chapter: 1,
    kLevel: "K2",
    syllabusRef: "FL-1.3.1",
    stem: "Which testing principle explains why running every possible input combination through a login form is not a realistic test strategy?",
    choices: [
      { id: "a", text: "Pesticide paradox" },
      { id: "b", text: "Exhaustive testing is impossible", correct: true },
      { id: "c", text: "Testing is context dependent" },
      { id: "d", text: "Absence-of-errors fallacy" },
    ],
    explanation:
      "Except for trivial cases, the number of input/precondition/timing combinations is too large to cover completely, so risk analysis and test techniques are used to choose a feasible, effective subset.",
  },
  {
    id: "ch1-q7",
    chapter: 1,
    kLevel: "K2",
    syllabusRef: "FL-1.3.1",
    stem: "A regression suite keeps running the exact same cases every release and defect discovery has flattened over the last year even though the codebase keeps changing. What does this illustrate?",
    choices: [
      { id: "a", text: "Defect clustering" },
      { id: "b", text: "The pesticide paradox", correct: true },
      { id: "c", text: "Early testing" },
      { id: "d", text: "Absence-of-errors fallacy" },
    ],
    explanation:
      "Running the same tests repeatedly stops finding new defects, because the software 'develops immunity' to them — the fix is to regularly review and vary tests, not just repeat the existing set.",
  },
  {
    id: "ch1-q8",
    chapter: 1,
    kLevel: "K2",
    syllabusRef: "FL-1.3.1",
    stem: "\"A small number of modules usually contain most of the defects found in a system\" describes which principle?",
    choices: [
      { id: "a", text: "Defect clustering", correct: true },
      { id: "b", text: "Testing shows presence of defects" },
      { id: "c", text: "Testing is context dependent" },
      { id: "d", text: "Early testing" },
    ],
    explanation:
      "Defect clustering (loosely following the Pareto principle) means effort should be weighted toward the modules and areas known or predicted to be riskiest, rather than spread evenly.",
  },
  {
    id: "ch1-q9",
    chapter: 1,
    kLevel: "K2",
    syllabusRef: "FL-1.3.1",
    stem: "A team ships a product with zero open defects, but users abandon it within a week because it is confusing and slow. Which principle does this scenario best illustrate?",
    choices: [
      { id: "a", text: "Absence-of-errors fallacy", correct: true },
      { id: "b", text: "Defect clustering" },
      { id: "c", text: "Exhaustive testing is impossible" },
      { id: "d", text: "Pesticide paradox" },
    ],
    explanation:
      "Finding and fixing every reported defect does not guarantee success if the system does not fulfil users' needs and expectations — quality is about fitness for purpose, not just a defect count of zero.",
  },
  {
    id: "ch1-q10",
    chapter: 1,
    kLevel: "K2",
    syllabusRef: "FL-1.4.1",
    stem: "Which of the following is one of the test activities in the ISTQB test process (alongside test design, implementation, and execution)?",
    choices: [
      { id: "a", text: "Test planning and monitoring & control", correct: true },
      { id: "b", text: "Sprint retrospective" },
      { id: "c", text: "Product backlog grooming" },
      { id: "d", text: "Continuous deployment" },
    ],
    explanation:
      "The test process spans planning, monitoring & control, analysis, design, implementation, execution, and completion — an ongoing set of activities, not a single one-off step, and they often overlap rather than run strictly in sequence.",
  },
  {
    id: "ch1-q11",
    chapter: 1,
    kLevel: "K2",
    syllabusRef: "FL-1.4.1",
    stem: "A tester writes 'verify that an expired discount code is rejected at checkout' before deciding on the specific input values or steps to use. Which test-process activity does writing that item belong to?",
    choices: [
      { id: "a", text: "Test design" },
      { id: "b", text: "Test analysis", correct: true },
      { id: "c", text: "Test implementation" },
      { id: "d", text: "Test execution" },
    ],
    explanation:
      "Writing down what should be true, with no values or steps attached, is a test condition — and identifying test conditions from the test basis is test analysis, the activity that answers 'what to test'. Test design answers 'how': it elaborates that condition into concrete test cases with input values and expected results. Test implementation then assembles what those cases need in order to run — procedures, test data, suites, environment — and execution runs them.",
  },
  {
    id: "ch1-q12",
    chapter: 1,
    kLevel: "K2",
    syllabusRef: "FL-1.5.3",
    stem: "Why does the ISTQB syllabus recommend that testers and authors of the work under test not be the same person for the most important test activities?",
    choices: [
      { id: "a", text: "Because developers are legally barred from testing their own code" },
      {
        id: "b",
        text: "Because independence helps a tester see what the author cannot",
        correct: true,
      },
      { id: "c", text: "Because independent testers never need to talk to the developers" },
      { id: "d", text: "Because independent testing removes the need to hold reviews" },
    ],
    explanation:
      "Independence reduces author bias — the same assumptions that led to a defect can make it invisible to its author. It is a matter of degree (self-checking vs. a dedicated team vs. an outside specialist), not an absolute rule, and it does not remove the need to collaborate.",
  },
  {
    id: "ch1-q13",
    chapter: 1,
    kLevel: "K1",
    syllabusRef: "FL-1.1.1",
    stem: "Which of the following is an objective of testing, rather than a description of how testing is carried out?",
    choices: [
      { id: "a", text: "Building confidence in the quality of the test object", correct: true },
      { id: "b", text: "Running the automated suite on every merge to the main branch" },
      { id: "c", text: "Assigning each open defect to the developer who wrote the code" },
      { id: "d", text: "Recording the steps a tester followed while exploring a feature" },
    ],
    explanation:
      "An objective is what the testing is for — evaluating work products, causing failures and finding defects, reducing the risk of inadequate quality, informing stakeholders, building confidence. The other three describe mechanics: when tests run, who fixes what, and how work is logged. Useful practices, but none of them is a reason to test.",
  },
  {
    id: "ch1-q14",
    chapter: 1,
    kLevel: "K1",
    syllabusRef: "FL-1.1.1",
    multi: true,
    stem: "Which of the following are typical test objectives? (Select all that apply.)",
    choices: [
      { id: "a", text: "Reducing the risk level of inadequate software quality", correct: true },
      { id: "b", text: "Verifying whether specified requirements have been fulfilled", correct: true },
      { id: "c", text: "Providing stakeholders with information for their decisions", correct: true },
      { id: "d", text: "Eliminating the causes of the failures that testing exposes" },
      { id: "e", text: "Guaranteeing the test object contains no remaining defects" },
    ],
    explanation:
      "The first three are on the syllabus's list of typical objectives. Eliminating causes is debugging — a development activity that testing triggers but does not perform. And no amount of testing guarantees the absence of defects; that is the first testing principle, and an exam question that offers it as an objective is offering the one thing testing cannot do.",
  },
  {
    id: "ch1-q15",
    chapter: 1,
    kLevel: "K2",
    syllabusRef: "FL-1.1.2",
    stem: "A dynamic test triggers a failure. Which of the following work is debugging rather than testing?",
    choices: [
      { id: "a", text: "Reproducing the failure, locating the defect, and fixing it", correct: true },
      { id: "b", text: "Re-running the test that failed once a fix has been delivered" },
      { id: "c", text: "Running the surrounding tests to see whether the fix broke them" },
      { id: "d", text: "Comparing an actual result against the one that was expected" },
    ],
    explanation:
      "Debugging is the development activity that follows a failure: reproduce, diagnose, fix. Everything else here is testing — b is confirmation testing, c is regression testing, and d is what test execution does. Testing finds and reports; debugging removes.",
  },
  {
    id: "ch1-q16",
    chapter: 1,
    kLevel: "K2",
    syllabusRef: "FL-1.1.2",
    stem: "A tester reports a failure observed during test execution. In what order does the debugging that follows proceed?",
    choices: [
      { id: "a", text: "Reproduce the failure, diagnose the defect, fix the defect", correct: true },
      { id: "b", text: "Fix the defect, reproduce the failure, diagnose the defect" },
      { id: "c", text: "Diagnose the defect, reproduce the failure, fix the defect" },
      { id: "d", text: "Reproduce the failure, fix the defect, diagnose the defect" },
    ],
    explanation:
      "Reproduction comes first because a failure that cannot be reproduced cannot reliably be diagnosed or shown to be fixed. Diagnosis then locates the defect behind the failure, and only then is there something specific to fix. Confirmation testing afterwards checks the fix worked — preferably run by the tester who found it.",
  },
  {
    id: "ch1-q17",
    chapter: 1,
    kLevel: "K2",
    syllabusRef: "FL-1.1.2",
    stem: "A review finds a defect in a requirements document. How does the debugging that follows differ from debugging after a failure in dynamic testing?",
    choices: [
      {
        id: "a",
        text: "There is nothing to reproduce or diagnose — the defect is already located",
        correct: true,
      },
      { id: "b", text: "It must still begin by reproducing the failure the review observed" },
      { id: "c", text: "It requires a confirmation test before the defect can be removed" },
      { id: "d", text: "It cannot start until the document has been executed in some form" },
    ],
    explanation:
      "Static testing finds defects directly rather than causing failures, so the reproduce-and-diagnose steps have nothing to do: the defect is in front of you, in the document. Debugging here is removal alone. That is also why a review can find defects in work products that could never be executed at all.",
  },
  {
    id: "ch1-q18",
    chapter: 1,
    kLevel: "K2",
    syllabusRef: "FL-1.2.1",
    stem: "Most projects cannot keep a representative group of real users involved throughout development. How does testing partly compensate?",
    choices: [
      {
        id: "a",
        text: "Testers carry an understanding of user needs through the lifecycle",
        correct: true,
      },
      { id: "b", text: "Testers sign the release off on the users' legal behalf" },
      { id: "c", text: "Testers replace the need for any acceptance testing by the business" },
      { id: "d", text: "Testers collect the user interviews the business analyst skipped" },
    ],
    explanation:
      "The syllabus calls this indirect representation: testers hold the users' perspective inside the project when the users themselves are too expensive or too unavailable to have there. It is a partial substitute, not a full one — it does not replace acceptance testing by real business representatives, and it confers no authority the users would have had.",
  },
  {
    id: "ch1-q19",
    chapter: 1,
    kLevel: "K2",
    syllabusRef: "FL-1.2.1",
    stem: "A medical device company runs and documents a test campaign it would not otherwise need for defect detection, because an auditor will ask to see the evidence. Which contribution of testing is this?",
    choices: [
      { id: "a", text: "Meeting contractual, legal or regulatory requirements", correct: true },
      { id: "b", text: "Reducing the cost of fixing defects found late in the project" },
      { id: "c", text: "Giving the development team feedback on its own processes" },
      { id: "d", text: "Replacing the quality assurance function within the company" },
    ],
    explanation:
      "Testing is sometimes required rather than chosen — by a contract, by law, or by a regulatory standard the product must comply with. The tests may find defects too, but that is not why they are being run, and the evidence that they were run is part of the deliverable.",
  },
  {
    id: "ch1-q20",
    chapter: 1,
    kLevel: "K1",
    syllabusRef: "FL-1.2.2",
    stem: "What is the essential difference between testing and quality assurance?",
    choices: [
      {
        id: "a",
        text: "Testing is product-oriented and corrective; QA is process-oriented and preventive",
        correct: true,
      },
      { id: "b", text: "Testing is performed by engineers; QA is performed by auditors from outside the organization" },
      { id: "c", text: "Testing applies to code; QA applies to documentation and requirements" },
      { id: "d", text: "Testing happens before release; QA happens once the product has shipped" },
    ],
    explanation:
      "Testing is a form of quality control: it looks at the product that exists and reports on it, so that defects can be corrected. QA looks at the processes that produce the product, on the premise that a good process followed properly yields a good product. They are different approaches to the same goal, not different departments or different phases.",
  },
  {
    id: "ch1-q21",
    chapter: 1,
    kLevel: "K1",
    syllabusRef: "FL-1.2.2",
    stem: "Whose responsibility is quality assurance on a project?",
    choices: [
      { id: "a", text: "Everyone on the project", correct: true },
      { id: "b", text: "The test team, since testing is where quality gets measured" },
      { id: "c", text: "The QA department, which owns the process definitions" },
      { id: "d", text: "The project manager, who signs off the release decision" },
    ],
    explanation:
      "QA is about how the work is done, and everyone doing the work shapes that — developers, testers, analysts, managers. It applies to the development process and the test process alike. Handing it to one team or one person is a common misreading, and it tends to produce a process nobody outside that team feels bound by.",
  },
  {
    id: "ch1-q22",
    chapter: 1,
    kLevel: "K1",
    syllabusRef: "FL-1.2.2",
    stem: "A test run produces a list of failures. How do testing and quality assurance use that same result differently?",
    choices: [
      {
        id: "a",
        text: "Testing uses it to get defects fixed; QA uses it to judge the process",
        correct: true,
      },
      { id: "b", text: "Testing uses it to plan the next release; QA uses it to size the team for the one after" },
      { id: "c", text: "Testing uses it to update the test plan; QA uses it to update the risk register" },
      { id: "d", text: "Testing uses it to bill the client; QA uses it to schedule an audit" },
    ],
    explanation:
      "The same results serve two purposes. Testing reads them as defects to be removed from this product. QA reads them as evidence about how well the development and test processes are performing — a cluster of similar defects says something about the process that produced them, not just about the code.",
  },
  {
    id: "ch1-q23",
    chapter: 1,
    kLevel: "K2",
    syllabusRef: "FL-1.4.1",
    stem: "Two of the test activities answer two different questions: 'what to test?' and 'how to test?'. Which pairing is right?",
    choices: [
      { id: "a", text: "Test analysis answers what; test design answers how", correct: true },
      { id: "b", text: "Test planning answers what; test analysis answers how" },
      { id: "c", text: "Test design answers what; test implementation answers how" },
      { id: "d", text: "Test monitoring answers what; test control answers how" },
    ],
    explanation:
      "Test analysis works over the test basis to identify testable features and define test conditions — what is worth testing, expressed as measurable coverage criteria. Test design elaborates those conditions into test cases, coverage items, data requirements and environment requirements — how they will actually be tested.",
  },
  {
    id: "ch1-q24",
    chapter: 1,
    kLevel: "K2",
    syllabusRef: "FL-1.4.2",
    stem: "Two teams in one company test to very different depths: one ships an internal reporting tool, the other a system a regulator inspects. What does the syllabus say about that?",
    choices: [
      { id: "a", text: "The test approach is expected to vary with the context", correct: true },
      { id: "b", text: "One of the two teams must be doing its testing wrongly" },
      { id: "c", text: "Test effort should be equal, since both are the same company" },
      { id: "d", text: "The regulator's involvement removes the need for a test plan" },
    ],
    explanation:
      "Testing is not performed in isolation — it is funded by stakeholders to serve business needs, and how it is carried out depends on the criticality of the test object, the risks, the regulations in the domain, the team's skills, the project's constraints and more. Two very different depths of testing in one company is what tailoring to context looks like, not a sign that one team is wrong.",
  },
  {
    id: "ch1-q25",
    chapter: 1,
    kLevel: "K2",
    syllabusRef: "FL-1.4.2",
    multi: true,
    stem: "Which of the following are contextual factors that shape how testing is carried out, rather than work products the test process itself produces? (Select all that apply.)",
    choices: [
      { id: "a", text: "The legal regulations that apply in the product's business domain", correct: true },
      { id: "b", text: "The tools available to the team and how usable they are", correct: true },
      { id: "c", text: "The test progress report issued at the end of each iteration" },
      { id: "d", text: "The prioritized test conditions produced by test analysis" },
      { id: "e", text: "The test completion report handed to the stakeholders" },
    ],
    explanation:
      "Contextual factors are inputs — stakeholders, team, business domain, technical factors, project constraints, organizational factors, the lifecycle, and the tools. They shape the test strategy, the techniques, the degree of automation and the level of detail of the testware. The other three options are testware: outputs of the process, not conditions on it.",
  },
  {
    id: "ch1-q26",
    chapter: 1,
    kLevel: "K2",
    syllabusRef: "FL-1.4.2",
    stem: "A team moves from quarterly releases to deploying several times a day. What follows for its testing?",
    choices: [
      { id: "a", text: "The way testing is carried out has to change with the lifecycle", correct: true },
      { id: "b", text: "Testing is unaffected, since the test basis has not changed" },
      { id: "c", text: "Testing must be cut, since there is no time left to run it" },
      { id: "d", text: "Testing becomes the sole responsibility of the operations team from then on" },
    ],
    explanation:
      "The software development lifecycle is one of the contextual factors, and a change of this size reaches everything: the degree of automation, when testing starts, how much is run per deployment, how results are reported. What does not follow is that testing shrinks or moves elsewhere — it is redesigned for the new rhythm.",
  },
  {
    id: "ch1-q27",
    chapter: 1,
    kLevel: "K2",
    syllabusRef: "FL-1.4.3",
    stem: "A team has produced test procedures, automated test scripts, test suites and test data. These are the output of which test activity?",
    choices: [
      { id: "a", text: "Test implementation, which prepares what execution will need", correct: true },
      { id: "b", text: "Test analysis, which decides which features are worth testing at all" },
      { id: "c", text: "Test planning, which sets the objectives and the approach" },
      { id: "d", text: "Test completion, which archives testware for later reuse" },
    ],
    explanation:
      "Test implementation creates or acquires everything execution needs: test procedures assembled from test cases, manual and automated scripts, suites, test data, the execution schedule, and a verified test environment. Test design decided what those cases would be; implementation makes them runnable.",
  },
  {
    id: "ch1-q28",
    chapter: 1,
    kLevel: "K2",
    syllabusRef: "FL-1.4.3",
    stem: "A risk register listing each risk with its likelihood, its impact and how it will be mitigated is a work product of which activity?",
    choices: [
      { id: "a", text: "Test planning, alongside the test plan and the exit criteria", correct: true },
      { id: "b", text: "Test execution, alongside the test logs and the defect reports" },
      { id: "c", text: "Test completion, alongside the lessons learned and change requests" },
      { id: "d", text: "Test design, alongside the test cases and the coverage items" },
    ],
    explanation:
      "The risk register is a test planning work product, and is often part of the test plan itself — along with the test schedule and the entry and exit criteria. The other three options list real testware, but from later activities: what gets logged during execution, what gets archived at completion, what gets specified during design.",
  },
  {
    id: "ch1-q29",
    chapter: 1,
    kLevel: "K2",
    syllabusRef: "FL-1.4.3",
    stem: "Test logs and defect reports are produced by which test activity?",
    choices: [
      { id: "a", text: "Test execution, where actual results meet expected ones", correct: true },
      { id: "b", text: "Test implementation, where the test environment gets built" },
      { id: "c", text: "Test monitoring and control, where progress is compared to plan" },
      { id: "d", text: "Test analysis, where the test basis is examined for defects" },
    ],
    explanation:
      "Running the tests is what produces logs and, where an anomaly is analyzed and turns out to be worth reporting, defect reports. Note that test analysis can produce defect reports too, but about defects in the test basis — a requirement that contradicts itself — rather than about failures observed in a running system.",
  },
  {
    id: "ch1-q30",
    chapter: 1,
    kLevel: "K2",
    syllabusRef: "FL-1.4.4",
    stem: "A team can show that every requirement has at least one test case pointing back at it. What does that traceability let them state?",
    choices: [
      { id: "a", text: "That the requirements are covered by the test cases", correct: true },
      { id: "b", text: "That the test cases will all pass on the next test run" },
      { id: "c", text: "That the requirements contain no defects of their own" },
      { id: "d", text: "That the code implementing them has full branch coverage" },
    ],
    explanation:
      "Traceability from test cases to requirements supports coverage evaluation: it shows that nothing in the test basis has been left without a test. It says nothing about whether those tests pass, whether the requirements themselves are any good, or how much of the code they happen to exercise.",
  },
  {
    id: "ch1-q31",
    chapter: 1,
    kLevel: "K2",
    syllabusRef: "FL-1.4.4",
    multi: true,
    stem: "Besides evaluating coverage, what does good traceability between the test basis and the testware make possible? (Select all that apply.)",
    choices: [
      { id: "a", text: "Judging the impact of a change on what has to be retested", correct: true },
      { id: "b", text: "Making test progress reports easier for stakeholders to read", correct: true },
      { id: "c", text: "Supporting audits and IT governance criteria", correct: true },
      { id: "d", text: "Removing the need to prioritize the test cases at all" },
      { id: "e", text: "Proving that the test basis itself is free of defects" },
      { id: "f", text: "Guaranteeing that no requirement will change after sign-off" },
    ],
    explanation:
      "Traceability answers 'what does this connect to', which is why it supports impact analysis, audits and governance, and reports that can name the status of test basis elements rather than just counting tests. It cannot prove anything about quality on its own — not that the test basis is clean, and certainly not that it will stop changing.",
  },
  {
    id: "ch1-q32",
    chapter: 1,
    kLevel: "K2",
    syllabusRef: "FL-1.4.5",
    stem: "The syllabus describes two principal roles in testing. Which activities sit mainly with the test management role?",
    choices: [
      { id: "a", text: "Planning, monitoring, control and completion", correct: true },
      { id: "b", text: "Analysis, design, implementation and execution" },
      { id: "c", text: "Reviewing code and approving pull requests" },
      { id: "d", text: "Writing acceptance criteria for each user story" },
    ],
    explanation:
      "The test management role owns the test process, the team and the leadership of the test activities, which puts it on planning, monitoring, control and completion. Option b is the other role — the testing role, which owns the engineering side. The remaining two are real work, but neither is what the syllabus means by a testing role.",
  },
  {
    id: "ch1-q33",
    chapter: 1,
    kLevel: "K2",
    syllabusRef: "FL-1.4.5",
    stem: "On a small team, one person plans the testing and tracks its progress, and also designs and runs the tests. What does the syllabus say about this?",
    choices: [
      { id: "a", text: "One person may hold both roles at the same time", correct: true },
      { id: "b", text: "The two roles must always be held by different people" },
      { id: "c", text: "The testing role may never include any planning work" },
      { id: "d", text: "A team this small is not permitted to run system testing" },
    ],
    explanation:
      "The two roles are responsibilities, not job titles or headcount. Different people may hold them at different times, one person may hold both, and the test management role might be carried by a team leader or a development manager rather than by anyone called a test manager.",
  },
  {
    id: "ch1-q34",
    chapter: 1,
    kLevel: "K2",
    syllabusRef: "FL-1.4.5",
    stem: "An Agile team has no test manager. Who typically carries the test management tasks?",
    choices: [
      { id: "a", text: "The Agile team itself takes on many of them", correct: true },
      { id: "b", text: "They are dropped, since Agile has no test planning" },
      { id: "c", text: "The Scrum Master becomes accountable for all of them" },
      { id: "d", text: "An external test manager must be appointed for each sprint" },
    ],
    explanation:
      "In Agile development some of the test management tasks are handled by the team itself. What tends to stay outside the team is work that spans several teams or the whole organization, which may be done by test managers who sit elsewhere. The tasks do not disappear — the responsibility moves.",
  },
  {
    id: "ch1-q35",
    chapter: 1,
    kLevel: "K2",
    syllabusRef: "FL-1.5.1",
    stem: "Why does the syllabus single out communication skills as particularly important for testers?",
    choices: [
      {
        id: "a",
        text: "Because a tester's findings can read as criticism of someone's work",
        correct: true,
      },
      { id: "b", text: "Because testers write most of the product's user documentation" },
      { id: "c", text: "Because testers negotiate the delivery dates with stakeholders" },
      { id: "d", text: "Because testers are the only people who talk to the end users" },
    ],
    explanation:
      "Testers are often the bearers of bad news, and blaming the bearer is a very human response. Test results can be received as criticism of the product and of the person who built it, and confirmation bias makes information that contradicts a held belief harder to accept. Hence the emphasis on communicating defects constructively.",
  },
  {
    id: "ch1-q36",
    chapter: 1,
    kLevel: "K2",
    syllabusRef: "FL-1.5.1",
    multi: true,
    stem: "Which of these are among the generic skills the syllabus says testers particularly need? (Select all that apply.)",
    choices: [
      { id: "a", text: "Domain knowledge of the business the software serves", correct: true },
      { id: "b", text: "Analytical and critical thinking", correct: true },
      { id: "c", text: "Authority to block a release single-handedly" },
      { id: "d", text: "Line-management responsibility for the developers" },
      { id: "e", text: "Formal ownership of the product backlog" },
    ],
    explanation:
      "The list is skills, not powers: testing knowledge, thoroughness and curiosity, communication, analytical and critical thinking and creativity, technical knowledge, and domain knowledge. The other three options describe authority someone might or might not hold, which is an organizational arrangement rather than a skill a tester brings.",
  },
  {
    id: "ch1-q37",
    chapter: 1,
    kLevel: "K1",
    syllabusRef: "FL-1.5.2",
    stem: "What characterises the whole team approach?",
    choices: [
      {
        id: "a",
        text: "Any member with the right skills can take any task, and quality is everyone's",
        correct: true,
      },
      { id: "b", text: "Testers are assigned permanently to one component each" },
      { id: "c", text: "The test manager allocates every task at the start of the iteration" },
      { id: "d", text: "Developers and testers work apart in order to stay independent" },
    ],
    explanation:
      "The whole team approach comes from Extreme Programming: anyone with the necessary knowledge and skills can perform any task, everyone is responsible for quality, and the team shares a workspace so that communication and interaction are cheap. Testers work with business representatives on acceptance tests and with developers on strategy and automation, spreading testing knowledge as they go.",
  },
  {
    id: "ch1-q38",
    chapter: 1,
    kLevel: "K1",
    syllabusRef: "FL-1.5.2",
    stem: "In which situation does the syllabus warn that the whole team approach may not be appropriate?",
    choices: [
      { id: "a", text: "Safety-critical work, where high test independence may be needed", correct: true },
      { id: "b", text: "Any project with more than ten people on the team" },
      { id: "c", text: "Projects that run their automated tests in a pipeline" },
      { id: "d", text: "Teams whose members are not all physically in the same building or city" },
    ],
    explanation:
      "The approach depends on context, and safety-critical work is the example the syllabus gives: there, a high level of test independence may matter more than the speed and shared ownership that co-located, everyone-can-do-anything working buys. Note that the shared workspace it describes can be virtual, so distributed teams are not the exception.",
  },
  {
    id: "ch1-q39",
    chapter: 1,
    kLevel: "K2",
    syllabusRef: "FL-1.5.3",
    stem: "A tester employed by a different company is brought in to test a system. Where does that sit on the scale of test independence?",
    choices: [
      { id: "a", text: "Very high — the tester is outside the organization entirely", correct: true },
      { id: "b", text: "High — the tester is outside the team but inside the company" },
      { id: "c", text: "Some — the tester is a peer of the author on the same team" },
      { id: "d", text: "None — the tester and the author are effectively the same role" },
    ],
    explanation:
      "The scale runs: the author testing their own work (none), a peer on the same team (some), a tester from another team in the same organization (high), a tester from outside the organization (very high). Most projects are best served by several of these at once — developers testing components, a test team on system testing, business representatives on acceptance testing.",
  },
  {
    id: "ch1-q40",
    chapter: 1,
    kLevel: "K2",
    syllabusRef: "FL-1.5.3",
    stem: "A company moves all testing into a separate department that receives builds and returns defect reports. Which drawback of independence does this most invite?",
    choices: [
      { id: "a", text: "Developers may stop feeling responsible for quality", correct: true },
      { id: "b", text: "Independent testers cannot apply black-box techniques" },
      { id: "c", text: "Defect reports stop being usable as audit evidence" },
      { id: "d", text: "Regression testing can no longer be automated at all" },
    ],
    explanation:
      "Independence buys a different set of biases and the standing to challenge assumptions, but at a distance it costs collaboration: the test team can become isolated, relations can turn adversarial, testers get treated as a bottleneck or blamed for delays, and quality drifts into being someone else's job. None of the other three follows from where the testers sit.",
  },
  {
    id: "ch1-q41",
    chapter: 1,
    kLevel: "K2",
    syllabusRef: "FL-1.2.3",
    stem: "A tax miscalculation is traced back to a training gap: the developer had never been told how the regional rules differ. In the root cause, error, defect and failure chain, what is that gap?",
    choices: [
      { id: "a", text: "The root cause — the thing that made the mistake likely", correct: true },
      { id: "b", text: "The error, since the developer acted on what they knew" },
      { id: "c", text: "The defect, because it explains what the code got wrong" },
      { id: "d", text: "The failure, as it is what the customer eventually saw" },
    ],
    explanation:
      "The root cause is the earliest thing that, had it been addressed, would have prevented the whole chain — here a gap in what the developer had been taught. The error is the mistake they then made, the defect is the flaw left in the code, and the failure is the wrong total a customer sees. Root cause analysis exists to reach past the defect to the conditions that produced it, because that is where a fix also stops the next one.",
  },
  {
    id: "ch1-q42",
    chapter: 1,
    kLevel: "K2",
    syllabusRef: "FL-1.4.4",
    stem: "A requirement changes late in a release, and nobody can say which test cases now need rerunning. Which failing does that point to?",
    choices: [
      { id: "a", text: "Traceability between the test basis and the testware is missing", correct: true },
      { id: "b", text: "The regression suite has not been automated far enough yet" },
      { id: "c", text: "The exit criteria for system testing were never agreed on" },
      { id: "d", text: "The team has no defect taxonomy to classify the change against" },
    ],
    explanation:
      "Traceability links each element of the test basis to the testware derived from it, which is what makes impact analysis possible: change a requirement and the affected test cases can be identified. Without it the team must rerun everything or guess which is which. Automation, exit criteria and defect taxonomies each address a different problem.",
  },
  {
    id: "ch1-q43",
    chapter: 1,
    kLevel: "K2",
    syllabusRef: "FL-1.5.1",
    stem: "In a review meeting a tester says 'this section contradicts section 4' rather than 'you contradicted yourself in section 4'. What does that choice of wording demonstrate?",
    choices: [
      { id: "a", text: "Communicating findings about the work rather than its author", correct: true },
      { id: "b", text: "Analytical thinking applied to the structure of the document" },
      { id: "c", text: "Domain knowledge of the business the document describes" },
      { id: "d", text: "Attention to detail in spotting a contradiction between sections" },
    ],
    explanation:
      "Both sentences carry the same finding; only one avoids putting the author on the defensive. The syllabus singles out communication because test results are so often received as criticism, and a finding phrased about the work is far more likely to be acted on. Spotting the contradiction took analysis and attention — how it was said is what this question asks about.",
  },
  {
    id: "ch1-q44",
    chapter: 1,
    kLevel: "K1",
    syllabusRef: "FL-1.5.2",
    stem: "What does the whole team approach do for the testers on a team?",
    choices: [
      { id: "a", text: "Their knowledge feeds the product early, alongside everyone else's", correct: true },
      { id: "b", text: "It gives them the final say over whether a release goes ahead" },
      { id: "c", text: "It removes the need for anyone on the team to hold testing skills" },
      { id: "d", text: "It puts them in a separate reporting line from the developers" },
    ],
    explanation:
      "In a whole team approach anyone with the necessary skills can take on any task, and quality is the responsibility of the team as a whole — so testing knowledge shapes requirements and design rather than arriving after the code exists. It does not hand testers release authority, does not dissolve the skill itself, and works by bringing people together rather than separating anyone out.",
  },
];
