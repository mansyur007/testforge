import type { ExamQuestion } from "../types";

// A-06: Chapter 1 — Fundamentals of Testing. Original questions written from
// the CTFL v4.0 syllabus's learning objectives (chapter 1: what testing is,
// why it's necessary, the seven principles, the test process, and the
// psychology of testing) — never copied or reworded from a real paper, a
// sample paper, or a commercial bank. See docs/QA-ACADEMY.md §7.2.

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
      { id: "a", text: "Test design", correct: true },
      { id: "b", text: "Test implementation" },
      { id: "c", text: "Test execution" },
      { id: "d", text: "Test completion" },
    ],
    explanation:
      "Deriving a testable item ('what should be true') from the test basis is test analysis/design; turning it into a concrete case with input values, steps, and expected results is test implementation, which comes after.",
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
];
