import type { ExamQuestion } from "../types";

// A-06: Chapter 4 — Test Analysis and Design. Original questions on
// black-box techniques (equivalence partitioning, boundary value analysis,
// decision tables, state transition testing, use case testing), white-box
// coverage (statement/branch), and experience-based techniques. See
// docs/QA-ACADEMY.md §7.2 — no question copied or reworded from a real paper.

export const CH4_TEST_DESIGN: ExamQuestion[] = [
  {
    id: "ch4-q1",
    chapter: 4,
    kLevel: "K2",
    syllabusRef: "FL-4.2.1",
    stem: "A quantity field accepts whole numbers from 1 to 99. Using equivalence partitioning alone, how many valid partitions does this input have?",
    choices: [
      { id: "a", text: "One — the whole 1 to 99 range behaves the same way", correct: true },
      { id: "b", text: "99 — one partition per allowed value" },
      { id: "c", text: "Two — one for even numbers, one for odd" },
      { id: "d", text: "Zero — quantity fields cannot be partitioned" },
    ],
    explanation:
      "Equivalence partitioning groups inputs the system is expected to treat the same way into one partition. 1–99 is a single valid partition; below 1 and above 99 are separate invalid partitions, each also worth one representative test.",
  },
  {
    id: "ch4-q2",
    chapter: 4,
    kLevel: "K3",
    syllabusRef: "FL-4.2.1",
    stem: "For a field that accepts 1–99 as valid, which set of three values gives full coverage of one valid and two invalid equivalence partitions?",
    choices: [
      { id: "a", text: "1, 50, 99" },
      { id: "b", text: "0, 50, 100", correct: true },
      { id: "c", text: "1, 99, 100" },
      { id: "d", text: "50, 51, 52" },
    ],
    explanation:
      "0 falls in the below-range invalid partition, 50 in the single valid partition, and 100 in the above-range invalid partition — one representative value from each of the three partitions, which is what equivalence partitioning coverage requires.",
  },
  {
    id: "ch4-q3",
    chapter: 4,
    kLevel: "K3",
    syllabusRef: "FL-4.2.2",
    stem: "A quantity field is valid from 1 to 99. Which set of values gives boundary value analysis coverage of the lower boundary using the two-value approach?",
    choices: [
      { id: "a", text: "1 and 2" },
      { id: "b", text: "0 and 1", correct: true },
      { id: "c", text: "1 and 99" },
      { id: "d", text: "0 and 100" },
    ],
    explanation:
      "The two-value BVA approach tests the boundary value itself and its nearest neighbour on the invalid side: for the lower boundary of a 1–99 range that is 1 (valid, minimum) and 0 (invalid, just below it).",
  },
  {
    id: "ch4-q4",
    chapter: 4,
    kLevel: "K3",
    syllabusRef: "FL-4.2.2",
    stem: "For the same 1–99 quantity field, which value set covers the upper boundary?",
    choices: [
      { id: "a", text: "98 and 99" },
      { id: "b", text: "99 and 100", correct: true },
      { id: "c", text: "100 and 101" },
      { id: "d", text: "0 and 99" },
    ],
    explanation:
      "99 is the maximum valid value and 100 is the first invalid value just above it — the pair BVA calls for at the upper boundary. A test suite that covers 0, 1, and 100 but misses 99 has skipped the upper valid boundary itself.",
  },
  {
    id: "ch4-q5",
    chapter: 4,
    kLevel: "K2",
    syllabusRef: "FL-4.2.2",
    stem: "Why is boundary value analysis considered a natural extension of equivalence partitioning, rather than an unrelated technique?",
    choices: [
      {
        id: "a",
        text: "Because it targets the edges of the same partitions equivalence partitioning identifies, where defects are statistically more likely",
        correct: true,
      },
      { id: "b", text: "Because it replaces the need to identify partitions at all" },
      { id: "c", text: "Because it only applies to string inputs, never numeric ones" },
      { id: "d", text: "Because it requires a state diagram to be drawn first" },
    ],
    explanation:
      "BVA is applied to the boundaries of the partitions already identified by equivalence partitioning — off-by-one defects cluster at exactly these edges, which is why testing them is disproportionately effective.",
  },
  {
    id: "ch4-q6",
    chapter: 4,
    kLevel: "K3",
    syllabusRef: "FL-4.2.3",
    stem: "A checkout rule says: 'Free shipping applies if (loyalty member) AND (order total ≥ $50)'. In a decision table for this rule, how many columns (rules) are needed to cover every combination of the two conditions?",
    choices: [
      { id: "a", text: "2" },
      { id: "b", text: "3" },
      { id: "c", text: "4", correct: true },
      { id: "d", text: "8" },
    ],
    explanation:
      "Two binary conditions produce 2² = 4 combinations (T/T, T/F, F/T, F/F), so a full decision table needs four columns/rules to cover them all, even though only one combination actually triggers free shipping.",
  },
  {
    id: "ch4-q7",
    chapter: 4,
    kLevel: "K2",
    syllabusRef: "FL-4.2.3",
    stem: "What is a key strength of decision table testing over plain equivalence partitioning?",
    choices: [
      {
        id: "a",
        text: "It systematically covers combinations of conditions, which is exactly where logic-heavy business rules tend to hide defects",
        correct: true,
      },
      { id: "b", text: "It never requires more than two test cases" },
      { id: "c", text: "It only works on numeric ranges" },
      { id: "d", text: "It avoids the need to know the expected result" },
    ],
    explanation:
      "Decision tables are built for testing combinations of conditions and their resulting actions — the kind of rule-based logic ('if this AND that, then...') where equivalence partitioning, which looks at one input at a time, is more likely to miss an interaction defect.",
  },
  {
    id: "ch4-q8",
    chapter: 4,
    kLevel: "K2",
    syllabusRef: "FL-4.2.4",
    stem: "In state transition testing, what does an 'invalid transition' test aim to check?",
    choices: [
      {
        id: "a",
        text: "That the system correctly rejects or ignores an event that is not allowed in the current state",
        correct: true,
      },
      { id: "b", text: "That every valid state can be reached at least once" },
      { id: "c", text: "That the system's response time stays under one second" },
      { id: "d", text: "That the UI layout matches the design mockup" },
    ],
    explanation:
      "State transition testing includes deliberately triggering events that shouldn't be possible from the current state (e.g. 'ship' an order that was never paid) to confirm the system correctly refuses or handles the invalid transition rather than silently corrupting state.",
  },
  {
    id: "ch4-q9",
    chapter: 4,
    kLevel: "K3",
    syllabusRef: "FL-4.2.4",
    stem: "An order can move PENDING → PAID → SHIPPED, or PENDING → CANCELLED. Which sequence, tested as a single case, gives 0-switch coverage of the PAID → SHIPPED transition specifically?",
    choices: [
      { id: "a", text: "PENDING → CANCELLED" },
      { id: "b", text: "PENDING → PAID → SHIPPED", correct: true },
      { id: "c", text: "PENDING → PAID → CANCELLED" },
      { id: "d", text: "SHIPPED → PENDING" },
    ],
    explanation:
      "0-switch (single transition) coverage means exercising one valid transition per test. PENDING → PAID → SHIPPED includes the PAID → SHIPPED edge; the cancellation path never reaches SHIPPED at all.",
  },
  {
    id: "ch4-q10",
    chapter: 4,
    kLevel: "K2",
    syllabusRef: "FL-4.2.5",
    stem: "Use case testing derives test cases primarily from:",
    choices: [
      { id: "a", text: "The internal source code structure" },
      {
        id: "b",
        text: "Documented interactions between an actor and the system, including the main flow and its alternative/exception flows",
        correct: true,
      },
      { id: "c", text: "Random input generation" },
      { id: "d", text: "Cyclomatic complexity scores" },
    ],
    explanation:
      "Use cases describe a sequence of interactions between an actor (user or external system) and the system to achieve a goal, including its main success scenario and alternative/exception paths — use case testing exercises these end-to-end flows, which is valuable for finding integration-level and business-process defects.",
  },
  {
    id: "ch4-q11",
    chapter: 4,
    kLevel: "K3",
    syllabusRef: "FL-4.3.1",
    stem: "A function has one `if` statement and no loops. A test suite executes every line of the function but only ever takes the `true` branch of the `if`. What coverage has it achieved?",
    choices: [
      { id: "a", text: "100% statement coverage, but not 100% branch coverage", correct: true },
      { id: "b", text: "100% branch coverage, but not 100% statement coverage" },
      { id: "c", text: "100% of both" },
      { id: "d", text: "0% of both" },
    ],
    explanation:
      "Statement coverage only requires every line to execute at least once, which is possible while only ever taking one branch of a decision. Branch coverage additionally requires every branch outcome (true and false) to be exercised — the false branch here was never taken.",
  },
  {
    id: "ch4-q12",
    chapter: 4,
    kLevel: "K2",
    syllabusRef: "FL-4.4.1",
    stem: "A tester explores an unfamiliar feature with no predefined test cases, learning the system and designing tests simultaneously, adapting each next step based on what was just observed. This is:",
    choices: [
      { id: "a", text: "Decision table testing" },
      { id: "b", text: "Exploratory testing", correct: true },
      { id: "c", text: "State transition testing" },
      { id: "d", text: "Static review" },
    ],
    explanation:
      "Exploratory testing is an experience-based technique where test design and execution happen together, with each test informing the next — well suited to unfamiliar areas, weak or missing documentation, and finding defects structured techniques might not anticipate.",
  },
];
