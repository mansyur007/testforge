import type { ExamQuestion } from "../types";

// A-06: Chapter 3 — Static Testing. Original questions on static vs. dynamic
// testing, the benefits of static testing, review types, and the roles
// involved in a formal review. See docs/QA-ACADEMY.md §7.2.

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
];
