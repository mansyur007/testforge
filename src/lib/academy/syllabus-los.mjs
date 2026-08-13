// A-10e: the CTFL v4.0 learning objectives, as structure rather than prose.
//
// Every question in `src/content/academy/questions/` carries a `syllabusRef`
// like "FL-4.2.1". Until this file existed, nothing checked that the ref named
// a real objective — and most of them did not. Chapter 5's whole scheme was
// invented by an author working from topic order rather than from the syllabus
// (`FL-5.4.1` meant "estimation" here and "configuration management" in the
// document), chapter 2 referenced `FL-2.4.1`, chapter 3 `FL-3.3.1` and chapter
// 6 `FL-6.3.1`, none of which exist at all. A ref that resolves to nothing
// cannot be reviewed against anything, which is the entire reason §7.2 asks for
// one. `scripts/academy-bank-check.mjs` now fails the build on a ref that is
// not in this table.
//
// **Provenance.** Read off the ISTQB Certified Tester Foundation Level syllabus
// **v4.0.1, released 2024-09-15** — the "Learning Objectives for Chapter N"
// pages (14, 24, 32, 38, 47 and 58 of 78). v4.0.1 is an errata release against
// v4.0: its own release notes list glossary-alignment wording changes only, no
// objective added, removed or re-levelled. **64 objectives**, which is the
// count the document itself yields, chapter by chapter: 14 / 10 / 8 / 14 / 16 /
// 2.
//
// **`topic` is written here, not copied.** The syllabus states each objective
// as a sentence ("(K2) Exemplify the purpose and content of a test plan"); what
// this table carries is a short label of our own for the same objective. The
// facts — the identifier, which section it sits under, and its K-level — are
// the syllabus's and are reproduced exactly, because they are what the guard
// checks. The prose is not ours to ship, and §7.2's rule about writing original
// material rather than reproducing anyone else's applies to this file as much
// as to a question.
//
// **What this file is not.** It is not the exam blueprint — the per-chapter
// question counts and the pass mark live in `exams.ts` and are still unverified
// (docs/QA-ACADEMY.md §5.1: the syllabus defers both to two documents nobody
// has). Objectives and blueprint are separate facts from separate sources, and
// only one of them is now settled.
//
// Deliberately not `server-only`: this is public syllabus structure, not
// answer-key material. Nothing here would help a candidate who has the
// syllabus, which is everyone sitting the exam.
//
// Plain ESM for the same reason as `exam-core.mjs` and `checks-core.mjs`:
// `scripts/academy-bank-check.mjs` runs under bare `node` as part of
// `prebuild`, so the table has to be importable without a TypeScript loader.
// `src/content/academy/syllabus-los.ts` is the typed wrapper the app imports.

export const CHAPTER_TITLES = {
  1: "Fundamentals of Testing",
  2: "Testing Throughout the Software Development Lifecycle",
  3: "Static Testing",
  4: "Test Analysis and Design",
  5: "Managing the Test Activities",
  6: "Test Tools",
};

export const SYLLABUS_OBJECTIVES = [
  // --- Chapter 1: Fundamentals of Testing (14) ---------------------------
  { id: "FL-1.1.1", chapter: 1, section: "1.1", sectionTitle: "What is Testing?", kLevel: "K1", topic: "Typical test objectives" },
  { id: "FL-1.1.2", chapter: 1, section: "1.1", sectionTitle: "What is Testing?", kLevel: "K2", topic: "Testing versus debugging" },
  { id: "FL-1.2.1", chapter: 1, section: "1.2", sectionTitle: "Why is Testing Necessary?", kLevel: "K2", topic: "Why testing is necessary" },
  { id: "FL-1.2.2", chapter: 1, section: "1.2", sectionTitle: "Why is Testing Necessary?", kLevel: "K1", topic: "Testing and quality assurance" },
  { id: "FL-1.2.3", chapter: 1, section: "1.2", sectionTitle: "Why is Testing Necessary?", kLevel: "K2", topic: "Root cause, error, defect, failure" },
  { id: "FL-1.3.1", chapter: 1, section: "1.3", sectionTitle: "Testing Principles", kLevel: "K2", topic: "The seven testing principles" },
  { id: "FL-1.4.1", chapter: 1, section: "1.4", sectionTitle: "Test Activities, Testware and Test Roles", kLevel: "K2", topic: "The test activities and their tasks" },
  { id: "FL-1.4.2", chapter: 1, section: "1.4", sectionTitle: "Test Activities, Testware and Test Roles", kLevel: "K2", topic: "How context shapes the test process" },
  { id: "FL-1.4.3", chapter: 1, section: "1.4", sectionTitle: "Test Activities, Testware and Test Roles", kLevel: "K2", topic: "Testware produced by each activity" },
  { id: "FL-1.4.4", chapter: 1, section: "1.4", sectionTitle: "Test Activities, Testware and Test Roles", kLevel: "K2", topic: "The value of traceability" },
  { id: "FL-1.4.5", chapter: 1, section: "1.4", sectionTitle: "Test Activities, Testware and Test Roles", kLevel: "K2", topic: "Test management and testing roles" },
  { id: "FL-1.5.1", chapter: 1, section: "1.5", sectionTitle: "Essential Skills and Good Practices in Testing", kLevel: "K2", topic: "Generic skills a tester needs" },
  { id: "FL-1.5.2", chapter: 1, section: "1.5", sectionTitle: "Essential Skills and Good Practices in Testing", kLevel: "K1", topic: "Advantages of the whole team approach" },
  { id: "FL-1.5.3", chapter: 1, section: "1.5", sectionTitle: "Essential Skills and Good Practices in Testing", kLevel: "K2", topic: "Benefits and drawbacks of test independence" },

  // --- Chapter 2: Testing Throughout the SDLC (10) -----------------------
  { id: "FL-2.1.1", chapter: 2, section: "2.1", sectionTitle: "Testing in the Context of a Software Development Lifecycle", kLevel: "K2", topic: "How the chosen lifecycle affects testing" },
  { id: "FL-2.1.2", chapter: 2, section: "2.1", sectionTitle: "Testing in the Context of a Software Development Lifecycle", kLevel: "K1", topic: "Good testing practices common to all lifecycles" },
  { id: "FL-2.1.3", chapter: 2, section: "2.1", sectionTitle: "Testing in the Context of a Software Development Lifecycle", kLevel: "K1", topic: "Test-first approaches (TDD, ATDD, BDD)" },
  { id: "FL-2.1.4", chapter: 2, section: "2.1", sectionTitle: "Testing in the Context of a Software Development Lifecycle", kLevel: "K2", topic: "DevOps and its impact on testing" },
  { id: "FL-2.1.5", chapter: 2, section: "2.1", sectionTitle: "Testing in the Context of a Software Development Lifecycle", kLevel: "K2", topic: "Shift left" },
  { id: "FL-2.1.6", chapter: 2, section: "2.1", sectionTitle: "Testing in the Context of a Software Development Lifecycle", kLevel: "K2", topic: "Retrospectives as process improvement" },
  { id: "FL-2.2.1", chapter: 2, section: "2.2", sectionTitle: "Test Levels and Test Types", kLevel: "K2", topic: "The test levels" },
  { id: "FL-2.2.2", chapter: 2, section: "2.2", sectionTitle: "Test Levels and Test Types", kLevel: "K2", topic: "The test types" },
  { id: "FL-2.2.3", chapter: 2, section: "2.2", sectionTitle: "Test Levels and Test Types", kLevel: "K2", topic: "Confirmation versus regression testing" },
  { id: "FL-2.3.1", chapter: 2, section: "2.3", sectionTitle: "Maintenance Testing", kLevel: "K2", topic: "Maintenance testing and its triggers" },

  // --- Chapter 3: Static Testing (8) -------------------------------------
  { id: "FL-3.1.1", chapter: 3, section: "3.1", sectionTitle: "Static Testing Basics", kLevel: "K1", topic: "Work products that static testing can examine" },
  { id: "FL-3.1.2", chapter: 3, section: "3.1", sectionTitle: "Static Testing Basics", kLevel: "K2", topic: "The value of static testing" },
  { id: "FL-3.1.3", chapter: 3, section: "3.1", sectionTitle: "Static Testing Basics", kLevel: "K2", topic: "Static versus dynamic testing" },
  { id: "FL-3.2.1", chapter: 3, section: "3.2", sectionTitle: "Feedback and Review Process", kLevel: "K1", topic: "Benefits of early and frequent stakeholder feedback" },
  { id: "FL-3.2.2", chapter: 3, section: "3.2", sectionTitle: "Feedback and Review Process", kLevel: "K2", topic: "The activities of the review process" },
  { id: "FL-3.2.3", chapter: 3, section: "3.2", sectionTitle: "Feedback and Review Process", kLevel: "K1", topic: "Responsibilities of the review roles" },
  { id: "FL-3.2.4", chapter: 3, section: "3.2", sectionTitle: "Feedback and Review Process", kLevel: "K2", topic: "The review types" },
  { id: "FL-3.2.5", chapter: 3, section: "3.2", sectionTitle: "Feedback and Review Process", kLevel: "K1", topic: "What makes a review succeed" },

  // --- Chapter 4: Test Analysis and Design (14) --------------------------
  { id: "FL-4.1.1", chapter: 4, section: "4.1", sectionTitle: "Test Techniques Overview", kLevel: "K2", topic: "Black-box, white-box and experience-based techniques" },
  { id: "FL-4.2.1", chapter: 4, section: "4.2", sectionTitle: "Black-box Test Techniques", kLevel: "K3", topic: "Deriving test cases by equivalence partitioning" },
  { id: "FL-4.2.2", chapter: 4, section: "4.2", sectionTitle: "Black-box Test Techniques", kLevel: "K3", topic: "Deriving test cases by boundary value analysis" },
  { id: "FL-4.2.3", chapter: 4, section: "4.2", sectionTitle: "Black-box Test Techniques", kLevel: "K3", topic: "Deriving test cases by decision table testing" },
  { id: "FL-4.2.4", chapter: 4, section: "4.2", sectionTitle: "Black-box Test Techniques", kLevel: "K3", topic: "Deriving test cases by state transition testing" },
  { id: "FL-4.3.1", chapter: 4, section: "4.3", sectionTitle: "White-box Test Techniques", kLevel: "K2", topic: "Statement testing" },
  { id: "FL-4.3.2", chapter: 4, section: "4.3", sectionTitle: "White-box Test Techniques", kLevel: "K2", topic: "Branch testing" },
  { id: "FL-4.3.3", chapter: 4, section: "4.3", sectionTitle: "White-box Test Techniques", kLevel: "K2", topic: "The value of white-box testing" },
  { id: "FL-4.4.1", chapter: 4, section: "4.4", sectionTitle: "Experience-based Test Techniques", kLevel: "K2", topic: "Error guessing" },
  { id: "FL-4.4.2", chapter: 4, section: "4.4", sectionTitle: "Experience-based Test Techniques", kLevel: "K2", topic: "Exploratory testing" },
  { id: "FL-4.4.3", chapter: 4, section: "4.4", sectionTitle: "Experience-based Test Techniques", kLevel: "K2", topic: "Checklist-based testing" },
  { id: "FL-4.5.1", chapter: 4, section: "4.5", sectionTitle: "Collaboration-based Test Approaches", kLevel: "K2", topic: "Writing user stories collaboratively" },
  { id: "FL-4.5.2", chapter: 4, section: "4.5", sectionTitle: "Collaboration-based Test Approaches", kLevel: "K2", topic: "Ways of writing acceptance criteria" },
  { id: "FL-4.5.3", chapter: 4, section: "4.5", sectionTitle: "Collaboration-based Test Approaches", kLevel: "K3", topic: "Deriving test cases with ATDD" },

  // --- Chapter 5: Managing the Test Activities (16) ----------------------
  { id: "FL-5.1.1", chapter: 5, section: "5.1", sectionTitle: "Test Planning", kLevel: "K2", topic: "Purpose and content of a test plan" },
  { id: "FL-5.1.2", chapter: 5, section: "5.1", sectionTitle: "Test Planning", kLevel: "K1", topic: "The tester's value in iteration and release planning" },
  { id: "FL-5.1.3", chapter: 5, section: "5.1", sectionTitle: "Test Planning", kLevel: "K2", topic: "Entry criteria versus exit criteria" },
  { id: "FL-5.1.4", chapter: 5, section: "5.1", sectionTitle: "Test Planning", kLevel: "K3", topic: "Estimating the required test effort" },
  { id: "FL-5.1.5", chapter: 5, section: "5.1", sectionTitle: "Test Planning", kLevel: "K3", topic: "Applying test case prioritization" },
  { id: "FL-5.1.6", chapter: 5, section: "5.1", sectionTitle: "Test Planning", kLevel: "K1", topic: "The test pyramid" },
  { id: "FL-5.1.7", chapter: 5, section: "5.1", sectionTitle: "Test Planning", kLevel: "K2", topic: "The testing quadrants" },
  { id: "FL-5.2.1", chapter: 5, section: "5.2", sectionTitle: "Risk Management", kLevel: "K1", topic: "Risk level from likelihood and impact" },
  { id: "FL-5.2.2", chapter: 5, section: "5.2", sectionTitle: "Risk Management", kLevel: "K2", topic: "Project risks versus product risks" },
  { id: "FL-5.2.3", chapter: 5, section: "5.2", sectionTitle: "Risk Management", kLevel: "K2", topic: "How product risk analysis shapes test scope" },
  { id: "FL-5.2.4", chapter: 5, section: "5.2", sectionTitle: "Risk Management", kLevel: "K2", topic: "Responding to analyzed product risks" },
  { id: "FL-5.3.1", chapter: 5, section: "5.3", sectionTitle: "Test Monitoring, Test Control and Test Completion", kLevel: "K1", topic: "Metrics used for testing" },
  { id: "FL-5.3.2", chapter: 5, section: "5.3", sectionTitle: "Test Monitoring, Test Control and Test Completion", kLevel: "K2", topic: "Purpose, content and audience of test reports" },
  { id: "FL-5.3.3", chapter: 5, section: "5.3", sectionTitle: "Test Monitoring, Test Control and Test Completion", kLevel: "K2", topic: "Communicating the status of testing" },
  { id: "FL-5.4.1", chapter: 5, section: "5.4", sectionTitle: "Configuration Management", kLevel: "K2", topic: "How configuration management supports testing" },
  { id: "FL-5.5.1", chapter: 5, section: "5.5", sectionTitle: "Defect Management", kLevel: "K3", topic: "Preparing a defect report" },

  // --- Chapter 6: Test Tools (2) -----------------------------------------
  { id: "FL-6.1.1", chapter: 6, section: "6.1", sectionTitle: "Tool Support for Testing", kLevel: "K2", topic: "How the types of test tool support testing" },
  { id: "FL-6.2.1", chapter: 6, section: "6.2", sectionTitle: "Benefits and Risks of Test Automation", kLevel: "K1", topic: "Benefits and risks of test automation" },
];

export const OBJECTIVES_BY_ID = new Map(
  SYLLABUS_OBJECTIVES.map((o) => [o.id, o]),
);
