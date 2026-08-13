import type { ExamQuestion } from "../types";

// A-06: Chapter 3 — Static Testing. Original questions on static vs. dynamic
// testing, the benefits of static testing, review types, and the roles
// involved in a formal review. See docs/QA-ACADEMY.md §7.2.
//
// A-10d's sixth slice grew this chapter 12 → 20, its full 5x blueprint target
// and the last pool in the bank to reach one. The 8 new questions open the two
// objectives nobody had written for — the benefits of early and frequent
// stakeholder feedback (FL-3.2.1) and the activities of the review process
// itself (FL-3.2.2), which is the one a candidate is most likely to be asked to
// put in order.

export const CH3_STATIC_TESTING: ExamQuestion[] = [
  {
    id: "ch3-q1",
    chapter: 3,
    kLevel: "K2",
    syllabusRef: "FL-3.1.3",
    stem: "What is the key difference between static and dynamic testing?",
    choices: [
      {
        id: "a",
        text: "Static testing does not execute the code; dynamic testing does",
        correct: true,
      },
      { id: "b", text: "Static testing can only be performed by developers, never by testers" },
      { id: "c", text: "Dynamic testing is carried out before any of the code has been written" },
      { id: "d", text: "Static testing applies only to test scripts and never to requirements" },
    ],
    explanation:
      "Static testing (reviews, static analysis) evaluates work products — requirements, designs, code — without running them; dynamic testing observes actual execution behaviour. Static testing can be applied to almost any work product, including requirements documents, long before code exists.",
  },
  {
    id: "ch3-q2",
    chapter: 3,
    kLevel: "K2",
    syllabusRef: "FL-3.1.2",
    stem: "A requirements document is reviewed and an ambiguous acceptance criterion is caught before any code is written. Why is this typically cheaper than finding the same problem after release?",
    choices: [
      {
        id: "a",
        text: "Because the cost of fixing a defect rises the later it is found",
        correct: true,
      },
      { id: "b", text: "Because reviews are free to run, unlike test execution on real environments" },
      { id: "c", text: "Because defects in requirements cannot cause failures in the delivered product" },
      { id: "d", text: "Because static testing removes the need to do any dynamic testing at all" },
    ],
    explanation:
      "Defects found early are generally far cheaper to fix than the same defect discovered in production, where it may have propagated into design, code, tests, and documentation, and possibly affected real users.",
  },
  {
    id: "ch3-q3",
    chapter: 3,
    kLevel: "K2",
    syllabusRef: "FL-3.1.2",
    stem: "Which of the following is a benefit of static testing that dynamic testing cannot provide by itself?",
    choices: [
      { id: "a", text: "Confirming the runtime performance of an API under a realistic load" },
      {
        id: "b",
        text: "Finding defects in a document that has no executable form",
        correct: true,
      },
      { id: "c", text: "Verifying the exact HTTP status code an endpoint returns on error" },
      { id: "d", text: "Measuring the memory a process actually uses while it is executing" },
    ],
    explanation:
      "Static testing can evaluate non-executable work products directly, catching defects (ambiguities, missing cases, inconsistencies) in documents that dynamic testing has no way to exercise, since there is nothing to run.",
  },
  {
    id: "ch3-q4",
    chapter: 3,
    kLevel: "K1",
    syllabusRef: "FL-3.1.1",
    stem: "Which of these is a typical work product examined during a review?",
    choices: [
      { id: "a", text: "A compiled binary already running in production" },
      { id: "b", text: "A requirements specification or a user story", correct: true },
      { id: "c", text: "A database backup taken last night" },
      { id: "d", text: "A load-testing dashboard for the API" },
    ],
    explanation:
      "Reviews commonly examine requirements, designs, code, test plans and cases, and similar documents — anything that can be read and evaluated by people without executing it.",
  },
  {
    id: "ch3-q5",
    chapter: 3,
    kLevel: "K1",
    syllabusRef: "FL-3.2.3",
    stem: "In a formal review, whose role is it to lead the meeting, manage the process, and mediate between participants if needed?",
    choices: [
      { id: "a", text: "The author" },
      { id: "b", text: "The scribe" },
      { id: "c", text: "The moderator/facilitator", correct: true },
      { id: "d", text: "The manager" },
    ],
    explanation:
      "The moderator (facilitator) runs the review meeting — scheduling it, keeping it on track, and mediating disagreements — separate from the author (who wrote the work product) and the scribe (who records findings).",
  },
  {
    id: "ch3-q6",
    chapter: 3,
    kLevel: "K1",
    syllabusRef: "FL-3.2.3",
    stem: "Whose responsibility is it, in a formal review, to record each defect, question, and decision raised during the meeting?",
    choices: [
      { id: "a", text: "The scribe/recorder", correct: true },
      { id: "b", text: "The reviewer" },
      { id: "c", text: "The manager" },
      { id: "d", text: "The moderator" },
    ],
    explanation:
      "The scribe (recorder) captures issues, open questions, and decisions during the meeting so nothing raised is lost — a distinct role from the reviewers, who evaluate the work product itself.",
  },
  {
    id: "ch3-q7",
    chapter: 3,
    kLevel: "K2",
    syllabusRef: "FL-3.2.4",
    stem: "Which review type is the most formal, following a defined process with defined roles, entry and exit criteria, and metrics collection?",
    choices: [
      { id: "a", text: "Informal review" },
      { id: "b", text: "Walkthrough" },
      { id: "c", text: "Inspection", correct: true },
      { id: "d", text: "Ad hoc pair review" },
    ],
    explanation:
      "Inspection is the most formal review type — a documented, rule-based process with defined roles, entry/exit criteria, and checklists — sitting at the far end of the formality spectrum from an informal review.",
  },
  {
    id: "ch3-q8",
    chapter: 3,
    kLevel: "K2",
    syllabusRef: "FL-3.2.4",
    stem: "A review where the author leads colleagues through a document to build common understanding and gather feedback, with no strict entry/exit criteria, is typically called:",
    choices: [
      { id: "a", text: "An inspection" },
      { id: "b", text: "A walkthrough", correct: true },
      { id: "c", text: "A technical review only" },
      { id: "d", text: "Static analysis" },
    ],
    explanation:
      "A walkthrough is author-led and less formal than an inspection — its main goals are usually knowledge sharing and gathering feedback, without the strict process and metrics an inspection requires.",
  },
  {
    id: "ch3-q9",
    chapter: 3,
    kLevel: "K1",
    syllabusRef: "FL-3.2.5",
    stem: "Which of the following is a success factor for reviews, as opposed to a common pitfall?",
    choices: [
      { id: "a", text: "Reviewers concentrate on criticizing the author rather than the document" },
      { id: "b", text: "Each review has an agreed objective and reviewers prepare beforehand", correct: true },
      { id: "c", text: "Nobody reads the document until the review meeting has already started" },
      { id: "d", text: "Findings are raised in the meeting but never tracked through to closure" },
    ],
    explanation:
      "Effective reviews have a clear objective, management support, reviewer preparation, and a focus on the work product rather than the person — the alternatives listed are classic pitfalls that make reviews unproductive or resented.",
  },
  {
    id: "ch3-q10",
    chapter: 3,
    kLevel: "K2",
    syllabusRef: "FL-3.1.2",
    stem: "Static analysis tools are typically used to detect which kind of issue without executing the code?",
    choices: [
      { id: "a", text: "Unreachable (dead) code and undeclared variables", correct: true },
      { id: "b", text: "The exact response time of a live API endpoint" },
      { id: "c", text: "Whether users find the checkout flow confusing" },
      { id: "d", text: "Whether a database backup restores correctly" },
    ],
    explanation:
      "Static analysis tools parse code (or models) to find issues like unreachable code, undeclared or unused variables, and certain security weaknesses — all without running the program, unlike performance or usability testing.",
  },
  {
    id: "ch3-q11",
    chapter: 3,
    kLevel: "K2",
    syllabusRef: "FL-3.1.2",
    stem: "A static analysis tool flags a function with a very high cyclomatic complexity score. What does this indicate?",
    choices: [
      {
        id: "a",
        text: "The function has many independent paths through its logic",
        correct: true,
      },
      { id: "b", text: "The function is certain to contain at least one runtime defect" },
      { id: "c", text: "The function's performance under load has been measured and found to be slow" },
      { id: "d", text: "The function has been reviewed and approved by a second developer" },
    ],
    explanation:
      "Cyclomatic complexity counts independent decision paths through code; a high score is a static warning sign correlated with harder testing and maintenance, not a direct report of an actual runtime bug.",
  },
  {
    id: "ch3-q12",
    chapter: 3,
    kLevel: "K2",
    syllabusRef: "FL-3.1.2",
    stem: "Which of these is a benefit of static analysis as part of a CI pipeline?",
    choices: [
      { id: "a", text: "It removes the need for any dynamic or functional testing of the build" },
      { id: "b", text: "It gives fast automated feedback on code-level issues before review", correct: true },
      { id: "c", text: "It guarantees that the software meets all of the business requirements" },
      { id: "d", text: "It eliminates the need for a separate build step in the pipeline" },
    ],
    explanation:
      "Static analysis integrated into CI catches a class of issues automatically and quickly, before code even reaches a human reviewer or a dynamic test — a complement to, not a replacement for, functional and non-functional testing.",
  },
  {
    id: "ch3-q13",
    chapter: 3,
    kLevel: "K1",
    syllabusRef: "FL-3.2.1",
    stem: "A project involves its stakeholders only at the requirements sign-off and again at the final demo. What does the syllabus say this risks?",
    choices: [
      { id: "a", text: "A product that does not match the stakeholder's current vision", correct: true },
      { id: "b", text: "A product whose code cannot be covered by static analysis tools" },
      { id: "c", text: "A team that cannot agree which review type to use for a document" },
      { id: "d", text: "A requirements document too large to be reviewed in one sitting" },
    ],
    explanation:
      "A vision stated once at the start is not the vision six months later, and nobody finds out until the demo. The syllabus is blunt about what follows: costly rework, missed deadlines, blame games, and in the worst case a failed project. Frequent feedback is what keeps the gap small enough to close cheaply.",
  },
  {
    id: "ch3-q14",
    chapter: 3,
    kLevel: "K1",
    syllabusRef: "FL-3.2.1",
    stem: "Besides catching misunderstandings early, what does frequent stakeholder feedback give the development team?",
    choices: [
      { id: "a", text: "A clearer sense of which features actually carry the most value", correct: true },
      { id: "b", text: "A guarantee that the requirements will not change again later" },
      { id: "c", text: "Permission to skip the acceptance testing at the end of the work" },
      { id: "d", text: "An agreed reduction in the number of test levels to be run" },
    ],
    explanation:
      "Feedback improves the team's understanding of what it is building, which lets it concentrate on the features that deliver most value and that bear most on the identified risks. What it does not do is freeze the requirements — the point is to learn about changes earlier, not to prevent them.",
  },
  {
    id: "ch3-q15",
    chapter: 3,
    kLevel: "K2",
    syllabusRef: "FL-3.2.2",
    stem: "In the generic review process, what happens during review initiation?",
    choices: [
      { id: "a", text: "Everyone is given access, roles and what they need to start", correct: true },
      { id: "b", text: "Each reviewer works through the document and logs anomalies" },
      { id: "c", text: "The anomalies are discussed and each is given a status and owner" },
      { id: "d", text: "The scope, exit criteria and timeframes for the review are agreed" },
    ],
    explanation:
      "Initiation is the step that makes the review startable: every participant has the work product, understands their role and has whatever supporting material the review needs. Option d is planning, which precedes it; b is the individual review; c is communication and analysis. Fixing and reporting closes the process.",
  },
  {
    id: "ch3-q16",
    chapter: 3,
    kLevel: "K2",
    syllabusRef: "FL-3.2.2",
    stem: "A reviewer logs 30 anomalies against a design document. What does the review process do with them next?",
    choices: [
      { id: "a", text: "Analyse and discuss each one, since not every anomaly is a defect", correct: true },
      { id: "b", text: "Raise a defect report for each one straight away, then fix them" },
      { id: "c", text: "Hand them to the author to accept or reject without discussion" },
      { id: "d", text: "Count them as the review's exit criteria and close the review" },
    ],
    explanation:
      "An anomaly is something a reviewer noticed, which may turn out to be a defect, a misunderstanding, or a question with a good answer. Communication and analysis — usually a review meeting — decides each one's status, ownership and required actions, and judges the quality level of the work product. Only what survives that becomes a defect report.",
  },
  {
    id: "ch3-q17",
    chapter: 3,
    kLevel: "K2",
    syllabusRef: "FL-3.2.2",
    multi: true,
    stem: "Which of the following are activities of the generic review process? (Select all that apply.)",
    choices: [
      { id: "a", text: "Planning, where the scope and exit criteria are defined", correct: true },
      { id: "b", text: "Individual review, where each reviewer logs what they find", correct: true },
      { id: "c", text: "Fixing and reporting, where the results are communicated", correct: true },
      { id: "d", text: "Test implementation, where the test procedures are assembled" },
      { id: "e", text: "Confirmation testing, where the corrected build is re-run" },
    ],
    explanation:
      "The process runs planning, review initiation, individual review, communication and analysis, then fixing and reporting — and it may be invoked several times over a work product too large to review in one pass. The other two options are dynamic-testing activities from chapters 1 and 2; a review never executes anything.",
  },
  {
    id: "ch3-q18",
    chapter: 3,
    kLevel: "K1",
    syllabusRef: "FL-3.1.1",
    multi: true,
    stem: "Which of these can be examined by static testing? (Select all that apply.)",
    choices: [
      { id: "a", text: "A system architecture specification", correct: true },
      { id: "b", text: "Source code that has never been compiled", correct: true },
      { id: "c", text: "The response time of the checkout endpoint under load" },
      { id: "d", text: "The memory a running process consumes over an hour" },
    ],
    explanation:
      "Static testing examines work products without executing them, so anything written down qualifies — requirements, architecture and design specifications, code, test cases, user stories, contracts. What it cannot reach is behaviour that only exists while the software runs: response times and memory consumption need dynamic testing.",
  },
  {
    id: "ch3-q19",
    chapter: 3,
    kLevel: "K2",
    syllabusRef: "FL-3.1.3",
    stem: "Which quality characteristic can static testing measure that dynamic testing cannot?",
    choices: [
      { id: "a", text: "Maintainability, which does not depend on running the code", correct: true },
      { id: "b", text: "Performance efficiency, measured while the system is running" },
      { id: "c", text: "Reliability, observed over a long period of continuous use" },
      { id: "d", text: "Availability, measured against the agreed service window" },
    ],
    explanation:
      "The split follows execution. Static testing can assess characteristics that are properties of the work product itself, such as maintainability, readability and adherence to standards. Performance efficiency, reliability and availability are all properties of the system in operation, so only dynamic testing can measure them.",
  },
  {
    id: "ch3-q20",
    chapter: 3,
    kLevel: "K1",
    syllabusRef: "FL-3.2.5",
    stem: "A manager proposes using review results to rank the team's engineers at appraisal time. What does the syllabus say?",
    choices: [
      { id: "a", text: "Evaluating participants should never be an objective of a review", correct: true },
      { id: "b", text: "It is acceptable provided the metrics come from inspections only" },
      { id: "c", text: "It is acceptable once the review's exit criteria have been agreed" },
      { id: "d", text: "It is the main reason for collecting metrics during inspections" },
    ],
    explanation:
      "Success factors start with clear objectives and measurable exit criteria, and the syllabus attaches an explicit exception: evaluating the participants is never among those objectives. A review that doubles as an appraisal stops producing candid findings — authors defend, reviewers soften, and the defects stay in the document.",
  },
];
