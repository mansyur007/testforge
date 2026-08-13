import type { ExamQuestion } from "../types";

// A-06: Chapter 4 — Test Analysis and Design. Original questions on
// black-box techniques (equivalence partitioning, boundary value analysis,
// decision tables, state transition testing), white-box coverage
// (statement/branch), experience-based techniques and the collaboration-based
// approaches. See docs/QA-ACADEMY.md §7.2 — no question copied or reworded
// from a real paper.
//
// A-10e removed the three use case testing questions (q10, q22, q48). Use case
// testing was dropped from the syllabus in v4.0 — its own release notes say so
// — and it has no learning objective left to reference, so those questions
// could not appear on a paper this exam claims to simulate. They were rewritten
// onto checklist-based testing, ATDD and collaborative story writing.
//
// A-10d grew this chapter 12 → 36 → 55, its full 5x blueprint target. The
// third slice (q37–q55) added the collaboration-based questions' missing
// company at FL-4.1.1 and the whole of FL-4.3.3 (the value of white-box
// testing), which no question had covered. It is also the first batch written
// against the length tell: across its 16 single-answer questions the correct
// choice is the longest 4 times, which is chance for a 4-choice question. See
// scripts/academy-bank-check.mjs — the build now ratchets that number.
//
// A-10d's seventh slice took it 55 → 77 (q56–q77), which is 7x rather than 5x
// what the blueprint draws. Chapter 4 draws 11 questions of the paper's 40, more
// than any other, so at 5x two sittings still shared a fifth of their chapter 4
// content. The extra weight went to the four K3 black-box objectives (FL-4.2.x,
// now 9 questions each) and to the two that sat at the depth floor, FL-4.4.1 and
// FL-4.5.2. Every objective in this file now carries at least 4.

export const CH4_TEST_DESIGN: ExamQuestion[] = [
  {
    id: "ch4-q1",
    chapter: 4,
    kLevel: "K3",
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
    kLevel: "K3",
    syllabusRef: "FL-4.2.2",
    stem: "Why is boundary value analysis considered a natural extension of equivalence partitioning, rather than an unrelated technique?",
    choices: [
      {
        id: "a",
        text: "Because it targets the edges of the same partitions, where defects cluster",
        correct: true,
      },
      { id: "b", text: "Because it replaces the need to identify any partitions at all" },
      { id: "c", text: "Because it applies only to string inputs and never to numeric ones" },
      { id: "d", text: "Because it requires that a state diagram be drawn for the input first" },
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
    kLevel: "K3",
    syllabusRef: "FL-4.2.3",
    stem: "What is a key strength of decision table testing over plain equivalence partitioning?",
    choices: [
      {
        id: "a",
        text: "It covers combinations of conditions, where logic-heavy rules hide defects",
        correct: true,
      },
      { id: "b", text: "It never requires more than two test cases, whatever the rule's shape" },
      { id: "c", text: "It works only on numeric ranges, and not on boolean conditions" },
      { id: "d", text: "It avoids the need to know the expected result for each combination" },
    ],
    explanation:
      "Decision tables are built for testing combinations of conditions and their resulting actions — the kind of rule-based logic ('if this AND that, then...') where equivalence partitioning, which looks at one input at a time, is more likely to miss an interaction defect.",
  },
  {
    id: "ch4-q8",
    chapter: 4,
    kLevel: "K3",
    syllabusRef: "FL-4.2.4",
    stem: "In state transition testing, what does an 'invalid transition' test aim to check?",
    choices: [
      {
        id: "a",
        text: "That the system rejects an event not allowed in the current state",
        correct: true,
      },
      { id: "b", text: "That every valid state in the model can be reached at least once" },
      { id: "c", text: "That the system's response time stays under one second per transition" },
      { id: "d", text: "That the UI layout matches the design mockup in every state" },
    ],
    explanation:
      "State transition testing includes deliberately triggering events that shouldn't be possible from the current state (e.g. 'ship' an order that was never paid) to confirm the system correctly refuses or handles the invalid transition rather than silently corrupting state.",
  },
  {
    id: "ch4-q9",
    chapter: 4,
    kLevel: "K3",
    syllabusRef: "FL-4.2.4",
    stem: "An order model defines exactly three transitions: PENDING → PAID, PAID → SHIPPED, and PENDING → CANCELLED. A suite runs one test case, which takes an order from PENDING through PAID to SHIPPED. What 0-switch coverage has that suite achieved?",
    choices: [
      { id: "a", text: "67% — it exercises two of the model's three transitions", correct: true },
      { id: "b", text: "100% — the test reaches a state from which nothing further is defined" },
      { id: "c", text: "33% — a single test case can only ever count as one transition" },
      { id: "d", text: "100% — every transition the test passes through is covered, so the model is covered" },
    ],
    explanation:
      "0-switch coverage is the proportion of individual valid transitions the suite exercises. This test covers PENDING → PAID and PAID → SHIPPED, two of the three the model defines, so 2/3 ≈ 67%. The PENDING → CANCELLED transition is never taken, and reaching a terminal state says nothing about the branches left unvisited.",
  },
  {
    id: "ch4-q10",
    chapter: 4,
    kLevel: "K2",
    syllabusRef: "FL-4.4.3",
    stem: "A team has run the same accessibility checklist at every release for two years, and it now finds almost nothing. What does this say about checklist-based testing?",
    choices: [
      { id: "a", text: "A checklist should be replaced by a scripted suite once it has been written down" },
      {
        id: "b",
        text: "A checklist ages with the product and has to be revised to keep finding defects",
        correct: true,
      },
      { id: "c", text: "A checklist is only ever a suitable basis for testing non-functional behaviour" },
      { id: "d", text: "A checklist stops being valid as soon as every one of its entries has been used" },
    ],
    explanation:
      "A checklist is a set of conditions someone thought worth checking at the time it was written, and a product that has moved on for two years has grown conditions it does not mention. This is the pesticide paradox arriving by another route: the checklist keeps finding nothing not because the product is clean, but because it keeps asking the same questions. Revising and extending it is part of using the technique.",
  },
  {
    id: "ch4-q11",
    chapter: 4,
    kLevel: "K2",
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
    syllabusRef: "FL-4.4.2",
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

  // A-10d: first slice of the question-bank build-out (docs/QA-ACADEMY.md
  // §A-10d). Chapter 4 first — it carries the most exam weight and the
  // sharpest K-level gap. Widens syllabusRef coverage to FL-4.1 and FL-4.5
  // (previously untouched), adds multi-answer questions, and skews new
  // content toward K3 since the existing 12 were mostly K1/K2.
  {
    id: "ch4-q13",
    chapter: 4,
    kLevel: "K2",
    syllabusRef: "FL-4.1.1",
    stem: "What best distinguishes black-box, white-box, and experience-based test techniques from one another?",
    choices: [
      {
        id: "a",
        text: "The test basis each draws from — the specification, the code, or the tester",
        correct: true,
      },
      { id: "b", text: "The test level each is restricted to — black-box only at system level, white-box only at unit level" },
      { id: "c", text: "Whether the technique can be automated — only white-box techniques support automated execution" },
      { id: "d", text: "The number of testers required to run them — white-box techniques always require pair testing" },
      { id: "e", text: "The phase of the SDLC each belongs to — black-box during analysis, white-box during coding, experience-based during acceptance" },
    ],
    explanation:
      "The three categories are defined by what they derive test cases from: black-box (specification-based) needs no knowledge of internals, white-box (structure-based) is built on the code or design structure, and experience-based leans on the tester's history with similar systems. None of the three is tied to a single test level or to automation status.",
  },
  {
    id: "ch4-q14",
    chapter: 4,
    kLevel: "K3",
    syllabusRef: "FL-4.2.1",
    stem: "A discount-code field accepts strings of exactly 8 alphanumeric characters; anything shorter or longer is rejected. Which pair of test values, alongside one valid 8-character code, completes equivalence partitioning coverage of this field?",
    choices: [
      { id: "a", text: "A 7-character code and a 9-character code", correct: true },
      { id: "b", text: "Two more valid 8-character codes" },
      { id: "c", text: "A 5-character code and a 6-character code" },
      { id: "d", text: "A 10-character code and a 12-character code" },
    ],
    explanation:
      "There are three partitions here: too short (<8), valid (=8), and too long (>8). Coverage needs one representative from each. A 7-character code represents the too-short partition and a 9-character code the too-long partition; the other options each draw both values from the same partition and leave one partition untested.",
  },
  {
    id: "ch4-q15",
    chapter: 4,
    kLevel: "K3",
    syllabusRef: "FL-4.2.1",
    multi: true,
    stem: "Which of the following statements about equivalence partitioning are correct? (Select all that apply.)",
    choices: [
      { id: "a", text: "Invalid partitions need test coverage too, not only valid ones", correct: true },
      { id: "b", text: "A value from a partition is assumed to be representative of every other value in that partition", correct: true },
      { id: "c", text: "Every value in a partition must be tested individually before that partition counts as covered" },
      { id: "d", text: "Equivalence partitioning guarantees that all boundary-related defects will be found" },
      { id: "e", text: "Equivalence partitioning can only be applied to numeric input fields" },
    ],
    explanation:
      "Equivalence partitioning covers both valid and invalid partitions, and rests on the assumption that one representative value stands in for its whole partition — testing every value individually is exactly what the technique exists to avoid. It also applies to non-numeric data and to output partitions, and finding boundary defects specifically is what boundary value analysis adds on top of it.",
  },
  {
    id: "ch4-q16",
    chapter: 4,
    kLevel: "K3",
    syllabusRef: "FL-4.2.2",
    stem: "A booking form accepts a travel date from today up to 365 days in the future (inclusive). Using the three-value boundary value analysis approach, which three values test the upper boundary?",
    choices: [
      { id: "a", text: "Day 364, day 365, day 366", correct: true },
      { id: "b", text: "Day 365, day 366, day 367" },
      { id: "c", text: "Day 1, day 365, day 366" },
      { id: "d", text: "Day 363, day 364, day 365" },
    ],
    explanation:
      "The three-value approach at a boundary tests the value just inside it, the value on it, and the value just outside it. For an upper boundary of day 365, that is day 364 (just inside), day 365 (on the boundary), and day 366 (just outside, invalid).",
  },
  {
    id: "ch4-q17",
    chapter: 4,
    kLevel: "K3",
    syllabusRef: "FL-4.2.2",
    multi: true,
    stem: "Which of the following statements about boundary value analysis (BVA) are correct? (Select all that apply.)",
    choices: [
      { id: "a", text: "BVA is applied to the boundaries of the partitions already identified by equivalence partitioning", correct: true },
      { id: "b", text: "BVA can be applied to output values, not only input values", correct: true },
      { id: "c", text: "BVA works well on ordered ranges such as numbers and dates", correct: true },
      { id: "d", text: "BVA is equally effective on partitions with no natural ordering, such as a set of colour names" },
      { id: "e", text: "The two-value approach tests four values per boundary" },
    ],
    explanation:
      "BVA extends equivalence partitioning by targeting partition edges, applies to outputs as well as inputs, and needs an ordered range to have a meaningful boundary — an unordered set like colour names has no 'edge' to test. The two-value approach tests two values per boundary (on it and just outside), not four.",
  },
  {
    id: "ch4-q18",
    chapter: 4,
    kLevel: "K3",
    syllabusRef: "FL-4.2.3",
    stem: "A loan-approval rule has three conditions: (credit score ≥ 650), (income verified), and (existing default on file). The action 'reject' fires whenever there is an existing default, regardless of the other two conditions. Collapsing the decision table on this basis, how many rules does the 'existing default' branch need to represent every combination of the other two conditions?",
    choices: [
      { id: "a", text: "1 — the other two conditions become 'don't care' since the outcome is the same either way", correct: true },
      { id: "b", text: "2 — one for each remaining condition" },
      { id: "c", text: "4 — the full combination of the other two conditions must still be listed" },
      { id: "d", text: "8 — all three conditions must be combined in full" },
    ],
    explanation:
      "When an action's outcome does not depend on a condition, that condition's value is marked 'don't care' and the rules that differ only in it can be collapsed into one. Since 'reject' fires on an existing default no matter what the other two conditions are, all four combinations of those two conditions collapse into a single rule.",
  },
  {
    id: "ch4-q19",
    chapter: 4,
    kLevel: "K3",
    syllabusRef: "FL-4.2.3",
    multi: true,
    stem: "Which of the following statements about decision table testing are correct? (Select all that apply.)",
    choices: [
      { id: "a", text: "A full decision table lists every possible combination of the conditions", correct: true },
      { id: "b", text: "Rules that produce the same action can sometimes be collapsed using 'don't care' values", correct: true },
      { id: "c", text: "Every decision table must include at least four conditions to be valid" },
      { id: "d", text: "A decision table can only represent binary (true/false) conditions" },
    ],
    explanation:
      "A full decision table enumerates every combination of its conditions, and rules that share an action can be collapsed with 'don't care' values where the action doesn't depend on a condition. There is no minimum of four conditions — a table with two conditions is just as valid — and conditions are not limited to binary values.",
  },
  {
    id: "ch4-q20",
    chapter: 4,
    kLevel: "K3",
    syllabusRef: "FL-4.2.4",
    stem: "In the order state model PENDING → PAID → SHIPPED → DELIVERED, with CANCELLED reachable from PENDING or PAID, a tester attempts to move a DELIVERED order directly back to PENDING. What is this test checking?",
    choices: [
      { id: "a", text: "An invalid transition — a 'sneak path' the model does not define", correct: true },
      { id: "b", text: "0-switch coverage of the PENDING → PAID transition in the model" },
      { id: "c", text: "1-switch coverage of two consecutive valid transitions in the model" },
      { id: "d", text: "That every reachable state in the model has been visited at least once" },
    ],
    explanation:
      "DELIVERED → PENDING is not a transition the model defines, so exercising it is a negative test for a 'sneak path' — confirming the system rejects or ignores an event that isn't valid from the current state, rather than exercising a defined transition.",
  },
  {
    id: "ch4-q21",
    chapter: 4,
    kLevel: "K3",
    syllabusRef: "FL-4.2.4",
    stem: "An order model defines exactly five transitions: PENDING → PAID, PAID → SHIPPED, SHIPPED → DELIVERED, PENDING → CANCELLED, and PAID → CANCELLED. DELIVERED and CANCELLED are terminal — no transition leaves them. How many distinct pairs of consecutive transitions must a test suite exercise to reach 100% 1-switch coverage?",
    choices: [
      { id: "a", text: "3", correct: true },
      { id: "b", text: "5" },
      { id: "c", text: "6" },
      { id: "d", text: "10" },
    ],
    explanation:
      "1-switch coverage requires every valid pair of consecutive transitions. A pair is valid only where the first transition's target state is the second's source, so the five transitions chain into just three pairs: (PENDING → PAID, PAID → SHIPPED), (PENDING → PAID, PAID → CANCELLED), and (PAID → SHIPPED, SHIPPED → DELIVERED). Nothing follows a transition into DELIVERED or CANCELLED because both are terminal — which is why the answer is well below the five transitions themselves.",
  },
  {
    id: "ch4-q22",
    chapter: 4,
    kLevel: "K3",
    syllabusRef: "FL-4.5.3",
    stem: "A story reads 'as a shopper I can apply one discount code per order'. In an ATDD session the team agrees three concrete examples: a valid code applies, a second code is refused, an expired code is refused. What are those three examples?",
    choices: [
      { id: "a", text: "The acceptance tests, agreed and written before the code that has to satisfy them", correct: true },
      { id: "b", text: "A defect report for each of the three cases the current build does not yet handle" },
      { id: "c", text: "The story's estimate, expressed as three comparable units of testing effort" },
      { id: "d", text: "A regression suite, assembled from the story once it has been delivered to users" },
    ],
    explanation:
      "ATDD turns the conversation about a story into concrete examples, and those examples are the acceptance tests — written before implementation, from the requirement rather than from the code, and used by developers and testers alike as the definition of done. They are not an estimate, and they precede the build rather than being harvested from it.",
  },
  {
    id: "ch4-q23",
    chapter: 4,
    kLevel: "K2",
    syllabusRef: "FL-4.3.1",
    stem: "A function has 20 executable statements. A test suite executes 16 of them at least once. What is the statement coverage?",
    choices: [
      { id: "a", text: "80%", correct: true },
      { id: "b", text: "16%" },
      { id: "c", text: "20%" },
      { id: "d", text: "125%" },
    ],
    explanation:
      "Statement coverage is the percentage of executable statements exercised at least once: 16 of 20 statements is 16/20 = 80%.",
  },
  {
    id: "ch4-q24",
    chapter: 4,
    kLevel: "K2",
    syllabusRef: "FL-4.3.2",
    stem: "A function contains exactly three `if` statements and no other branching, giving six possible branch outcomes in total (true and false for each). A test suite exercises 4 of those 6 outcomes. What is the branch coverage?",
    choices: [
      { id: "a", text: "67%", correct: true },
      { id: "b", text: "50%" },
      { id: "c", text: "75%" },
      { id: "d", text: "100%" },
    ],
    explanation:
      "Branch (decision) coverage is the percentage of branch outcomes exercised: 4 of 6 possible outcomes is 4/6 ≈ 67%.",
  },
  {
    id: "ch4-q25",
    chapter: 4,
    kLevel: "K2",
    syllabusRef: "FL-4.3.2",
    multi: true,
    stem: "Which of the following statements about statement and branch coverage are correct? (Select all that apply.)",
    choices: [
      { id: "a", text: "100% branch coverage guarantees 100% statement coverage, assuming no unreachable code", correct: true },
      { id: "b", text: "100% statement coverage guarantees 100% branch coverage" },
      { id: "c", text: "Branch coverage requires every decision outcome (true and false) to be exercised at least once", correct: true },
      {
        id: "d",
        text: "Statement coverage only requires every executable line to run at least once, regardless of which branches were taken to get there",
        correct: true,
      },
      { id: "e", text: "Both are classified as white-box (structure-based) techniques", correct: true },
    ],
    explanation:
      "Branch coverage is the stronger criterion: exercising every decision outcome necessarily runs every reachable statement, but running every statement can still leave a branch outcome untaken (e.g. always taking the true side of an if) — so only the implication in option b is the wrong way round. Both criteria are white-box, measured against the code's structure rather than its specification.",
  },
  {
    id: "ch4-q26",
    chapter: 4,
    kLevel: "K2",
    syllabusRef: "FL-4.4.1",
    stem: "A tester who has previously seen off-by-one bugs in pagination writes an extra test for 'last page with exactly one item' before the developer has even finished the feature, without following any formal input-partitioning process. This is an example of:",
    choices: [
      { id: "a", text: "Error guessing — using experience of common defect types to anticipate where a problem is likely to occur", correct: true },
      { id: "b", text: "Decision table testing" },
      { id: "c", text: "Boundary value analysis derived strictly from the specification" },
      { id: "d", text: "Statement coverage measurement" },
      { id: "e", text: "Use case testing, since pagination is part of a documented user flow" },
    ],
    explanation:
      "Error guessing is an experience-based technique where the tester uses knowledge of typical mistakes and past defects — here, a known class of off-by-one pagination bugs — to anticipate and target likely failure points, rather than deriving the test from a formal model of the specification.",
  },
  {
    id: "ch4-q27",
    chapter: 4,
    kLevel: "K2",
    syllabusRef: "FL-4.4.2",
    stem: "In session-based exploratory testing, what is a 'charter'?",
    choices: [
      { id: "a", text: "A time-boxed mission statement that gives a session a goal and scope without prescribing the exact steps", correct: true },
      { id: "b", text: "A fully scripted sequence of test steps and expected results" },
      { id: "c", text: "A record of every defect found across the whole project" },
      { id: "d", text: "A formal sign-off document required before test execution can begin" },
    ],
    explanation:
      "A charter frames an exploratory session with a mission — what to explore, and roughly why — while leaving the specific steps to the tester's judgement during the session; it is not a scripted procedure or a project-wide defect log.",
  },
  {
    id: "ch4-q28",
    chapter: 4,
    kLevel: "K2",
    syllabusRef: "FL-4.4.2",
    stem: "A tester is given a charter: 'Explore the new bulk-export feature, focusing on how it behaves with unusual selections.' During the session they notice exporting zero rows produces an empty file with no header, and immediately try exporting a single row to compare. What does this behaviour illustrate about exploratory testing?",
    choices: [
      { id: "a", text: "Test design and execution happen concurrently — each result observed informs the next test on the spot", correct: true },
      { id: "b", text: "All test cases must be written and reviewed before any execution begins" },
      { id: "c", text: "The tester is following a fixed decision table for export scenarios" },
      { id: "d", text: "The session cannot be documented or reported on afterward" },
    ],
    explanation:
      "The tester designed the follow-up test (single-row export) on the spot, based on what the previous result (empty file, no header) revealed — the concurrent, adaptive design-and-execution loop that defines exploratory testing. Sessions are still typically debriefed and reported afterward.",
  },
  {
    id: "ch4-q29",
    chapter: 4,
    kLevel: "K2",
    syllabusRef: "FL-4.4.3",
    stem: "What best describes checklist-based testing?",
    choices: [
      {
        id: "a",
        text: "A tester covers the items of a checklist built from past experience",
        correct: true,
      },
      { id: "b", text: "A tester follows a fully detailed, step-by-step script with expected results for every step" },
      { id: "c", text: "A tester derives tests purely from the internal code structure" },
      { id: "d", text: "A tester enumerates every combination of input conditions in a table" },
    ],
    explanation:
      "Checklist-based testing works from a list of items, considerations, or rules — built up from experience, requirements, and knowledge of typical failures — that the tester uses to guide test design and execution, without a fully scripted procedure for each item.",
  },
  {
    id: "ch4-q30",
    chapter: 4,
    kLevel: "K2",
    syllabusRef: "FL-4.4.3",
    multi: true,
    stem: "Which of the following are true of checklist-based testing? (Select all that apply.)",
    choices: [
      { id: "a", text: "The checklist is typically built and refined over time from experience and knowledge of the application", correct: true },
      {
        id: "b",
        text: "Because checklist items are usually high-level, different testers can interpret and execute the same item differently",
        correct: true,
      },
      { id: "c", text: "It is classified as an experience-based test technique", correct: true },
      { id: "d", text: "A checklist item always maps to exactly one, fully scripted test case" },
    ],
    explanation:
      "Checklists accumulate and improve over time, but because their items are usually a short prompt rather than a detailed script, different testers can cover the same item differently — which is also why they are experience-based rather than a precise, repeatable procedure with no tester judgement involved.",
  },
  {
    id: "ch4-q31",
    chapter: 4,
    kLevel: "K2",
    syllabusRef: "FL-4.5.1",
    stem: "In collaborative user story writing (e.g. 'three amigos' sessions), why are business, development, and testing perspectives brought together before a story is built?",
    choices: [
      { id: "a", text: "To surface ambiguities and missing detail before they become defects", correct: true },
      { id: "b", text: "Because exactly three people must sign off on every story before it is built" },
      { id: "c", text: "To replace the need to write any acceptance criteria for the story" },
      { id: "d", text: "Because testers are not permitted to see requirements before coding begins" },
    ],
    explanation:
      "Combining business, development, and testing viewpoints while a story is still being shaped surfaces gaps, ambiguity, and edge cases that any single perspective tends to miss — catching them before they become defects is cheaper than finding them after the code is written.",
  },
  {
    id: "ch4-q32",
    chapter: 4,
    kLevel: "K2",
    syllabusRef: "FL-4.5.1",
    stem: "A team writes a new user story but only a business analyst is involved — no developer or tester attends. What is the main risk this creates?",
    choices: [
      {
        id: "a",
        text: "Testability concerns and technical constraints go unnoticed until later",
        correct: true,
      },
      { id: "b", text: "The story will automatically fail the team's static analysis gate" },
      { id: "c", text: "The story cannot be estimated by the team at all until it is built" },
      { id: "d", text: "The story becomes a formal legal contract with the customer's business" },
    ],
    explanation:
      "Collaborative story writing exists precisely to catch what a single perspective misses; skipping the development and testing viewpoints means testability gaps, technical constraints, and edge cases they would normally raise are more likely to surface later, when they are costlier to fix.",
  },
  {
    id: "ch4-q33",
    chapter: 4,
    kLevel: "K2",
    syllabusRef: "FL-4.5.2",
    stem: "What is the main purpose of acceptance criteria on a user story?",
    choices: [
      {
        id: "a",
        text: "To define the testable conditions the story must satisfy to be done",
        correct: true,
      },
      { id: "b", text: "To describe the internal code structure that is going to implement the story" },
      { id: "c", text: "To replace the need for any collaboration between business and development" },
      { id: "d", text: "To record the effort the team estimated for the story, in story points" },
    ],
    explanation:
      "Acceptance criteria spell out concrete, checkable conditions a story must meet — they give 'done' a testable definition and are what acceptance tests are written against, rather than describing implementation detail or effort estimates.",
  },
  {
    id: "ch4-q34",
    chapter: 4,
    kLevel: "K2",
    syllabusRef: "FL-4.5.2",
    stem: "Which of these is written in the scenario-oriented (Given/When/Then) style commonly used for acceptance criteria?",
    choices: [
      { id: "a", text: "Given a logged-in user with an empty cart, when they add one item, then the cart shows a quantity of 1", correct: true },
      { id: "b", text: "The cart module shall use a Map keyed by product ID to store line items" },
      { id: "c", text: "Cart total = sum of (unit price × quantity) for all line items" },
      { id: "d", text: "Story points: 3" },
    ],
    explanation:
      "The Given/When/Then form states a starting context, an action, and an expected outcome — exactly what option a does. The others describe an implementation detail, a business rule/formula, and an estimate respectively, none of which are Given/When/Then scenarios.",
  },
  {
    id: "ch4-q35",
    chapter: 4,
    kLevel: "K3",
    syllabusRef: "FL-4.5.3",
    stem: "In acceptance test-driven development (ATDD), when are acceptance tests derived from the story's acceptance criteria?",
    choices: [
      { id: "a", text: "Collaboratively, before development of that story begins", correct: true },
      { id: "b", text: "By the tester alone, after the feature has already been deployed to production" },
      { id: "c", text: "Automatically generated from the production code once it is written" },
      { id: "d", text: "Only if a defect is found during exploratory testing" },
    ],
    explanation:
      "ATDD derives acceptance tests from acceptance criteria collaboratively (business, development, and testing together) before coding starts, so the tests express shared understanding of 'done' and can guide development, rather than being written after the fact or generated from the implementation.",
  },
  {
    id: "ch4-q36",
    chapter: 4,
    kLevel: "K3",
    syllabusRef: "FL-4.5.3",
    multi: true,
    stem: "Which of the following statements about acceptance test-driven development (ATDD) are correct? (Select all that apply.)",
    choices: [
      { id: "a", text: "The acceptance tests are written by the tester alone, once the story has been estimated and accepted into a sprint" },
      { id: "b", text: "Deriving the tests before coding starts helps prevent defects rather than only detect them after the fact", correct: true },
      {
        id: "c",
        text: "It is closely related to behaviour-driven development (BDD), which often expresses acceptance criteria as Given/When/Then scenarios",
        correct: true,
      },
      { id: "d", text: "It is identical to unit-level test-driven development (TDD), just under a different name" },
      { id: "e", text: "It requires that no manual testing ever be performed on the story" },
    ],
    explanation:
      "ATDD derives acceptance tests from the acceptance criteria before coding — a defect-prevention move rather than a detection one — and overlaps closely with BDD's Given/When/Then style. It is collaborative by definition, so tests written by the tester alone after estimation is the opposite of the approach; it is also distinct from unit-level TDD (different scope, different authors) and does not rule out manual testing elsewhere in the story's lifecycle.",
  },
  {
    id: "ch4-q37",
    chapter: 4,
    kLevel: "K2",
    syllabusRef: "FL-4.1.1",
    stem: "A team must design tests for a payment module. The detailed design and the source code are unavailable to them, but a signed-off requirements specification is. Which category of technique are they best placed to apply?",
    choices: [
      { id: "a", text: "Black-box techniques, which derive tests from the specified behaviour of the test object", correct: true },
      { id: "b", text: "White-box techniques, which derive tests from the internal structure of the test object" },
      { id: "c", text: "Coverage-based techniques, which need an instrumented build and a coverage report first" },
      { id: "d", text: "Structural techniques, which need the module's call graph before any test can be designed" },
    ],
    explanation:
      "Black-box techniques work from a description of what the test object should do — a specification, a model, a user story — and need no visibility of the code. White-box and structural techniques both require the internal structure, which this team does not have.",
  },
  {
    id: "ch4-q38",
    chapter: 4,
    kLevel: "K2",
    syllabusRef: "FL-4.1.1",
    multi: true,
    stem: "Which of the following legitimately influence the choice of test techniques for a given test object? (Select all that apply.)",
    choices: [
      { id: "a", text: "The type of component or system under test, and the risks associated with it", correct: true },
      { id: "b", text: "The knowledge and experience of the testers available to do the work", correct: true },
      { id: "c", text: "The alphabetical order of the technique names in the organisation's test policy" },
      { id: "d", text: "A rule that each project must apply exactly one technique, chosen at kickoff" },
      { id: "e", text: "A rule that black-box techniques may only be used once the code is complete" },
      { id: "f", text: "A prohibition on combining experience-based techniques with any other category" },
    ],
    explanation:
      "Technique selection is driven by the test object and its risks, by the available documentation, regulatory demands, contract, lifecycle model, and by what the team actually knows how to do. The other options are invented constraints: techniques are routinely combined, more than one is normally used per object, and black-box design can start as soon as the specification exists.",
  },
  {
    id: "ch4-q39",
    chapter: 4,
    kLevel: "K3",
    syllabusRef: "FL-4.2.1",
    stem: "A shipping-cost function returns 'free' for order totals of $50 or more, a flat fee for totals from $0.01 to $49.99, and an error for a total of zero or less. Partitioning on the function's *output* rather than its input, how many partitions are there?",
    choices: [
      { id: "a", text: "Three — one for each distinct outcome the function can produce", correct: true },
      { id: "b", text: "Two — an output is only ever partitioned into valid and invalid" },
      { id: "c", text: "Five — one partition for each numeric value named in the rule" },
      { id: "d", text: "One — output partitioning only applies to boolean-valued functions" },
    ],
    explanation:
      "Equivalence partitioning applies to outputs as readily as to inputs: each distinct outcome the function can produce is one partition, so 'free', 'flat fee' and 'error' give three. The valid/invalid split is a property of input partitions, not a limit on how many output partitions may exist.",
  },
  {
    id: "ch4-q40",
    chapter: 4,
    kLevel: "K3",
    syllabusRef: "FL-4.2.1",
    stem: "A form has three fields, each with its own valid and invalid partitions. Why do test designers usually cover invalid partitions one field at a time, rather than combining several invalid values into a single test?",
    choices: [
      { id: "a", text: "Because one rejected value can mask another, leaving the second defect undetected", correct: true },
      { id: "b", text: "Because combining them is forbidden by every recognised testing standard" },
      { id: "c", text: "Because invalid partitions are only ever exercised after a release goes live" },
      { id: "d", text: "Because a test carrying two bad values takes twice as long for a tool to run" },
      { id: "e", text: "Because invalid partitions cannot be identified until the valid ones all pass" },
    ],
    explanation:
      "A system that rejects the first invalid value it meets may never evaluate the second, so a test carrying two of them can pass while a defect in the second field's handling goes unseen. Valid partitions, by contrast, are routinely combined across fields because all of them are expected to be processed.",
  },
  {
    id: "ch4-q41",
    chapter: 4,
    kLevel: "K3",
    syllabusRef: "FL-4.2.2",
    stem: "How does the three-value approach to boundary value analysis differ from the two-value approach?",
    choices: [
      { id: "a", text: "It replaces the boundary value itself with the two nearest neighbouring values" },
      { id: "b", text: "It also exercises the value just inside the boundary, not only the boundary and its outside neighbour", correct: true },
      { id: "c", text: "It applies only where two valid partitions meet, and never at the edge of an invalid one" },
      { id: "d", text: "It requires that three separate testers independently agree where each boundary lies" },
    ],
    explanation:
      "The two-value approach tests the boundary and its nearest neighbour on the other side of it. The three-value approach adds the nearest neighbour on the same side, so for a lower boundary of 1 it covers 0, 1 and 2 — stronger coverage at the cost of a third test per boundary.",
  },
  {
    id: "ch4-q42",
    chapter: 4,
    kLevel: "K3",
    syllabusRef: "FL-4.2.2",
    stem: "A password field accepts between 8 and 20 characters inclusive. Which set of lengths gives two-value boundary coverage of both boundaries?",
    choices: [
      { id: "a", text: "8, 9, 19 and 20" },
      { id: "b", text: "7, 8, 20 and 21", correct: true },
      { id: "c", text: "1, 8, 20 and 50" },
      { id: "d", text: "8 and 20 only" },
    ],
    explanation:
      "Two-value BVA takes the boundary and its nearest neighbour on the invalid side: 8 and 7 at the lower boundary, 20 and 21 at the upper. Lengths 9 and 19 sit inside the valid partition, and 1 and 50 are ordinary invalid-partition representatives rather than boundary neighbours.",
  },
  {
    id: "ch4-q43",
    chapter: 4,
    kLevel: "K3",
    syllabusRef: "FL-4.2.3",
    stem: "A refund rule depends on four independent yes/no conditions. How many columns does its full decision table have, before any collapsing?",
    choices: [
      { id: "a", text: "8" },
      { id: "b", text: "16", correct: true },
      { id: "c", text: "4" },
      { id: "d", text: "32" },
    ],
    explanation:
      "A full decision table enumerates every combination of its conditions, so n binary conditions give 2^n columns — here 2^4 = 16. Collapsing rules that share an action with 'don't care' values reduces that number afterwards, but the full table is the starting point.",
  },
  {
    id: "ch4-q44",
    chapter: 4,
    kLevel: "K3",
    syllabusRef: "FL-4.2.3",
    stem: "A discount rule has three yes/no conditions: member, order of $50 or more, promo code entered. The team has run tests for the combinations Y/Y/Y, Y/N/N, N/Y/N and N/N/Y. What is their decision table coverage?",
    choices: [
      { id: "a", text: "50%, since four of the eight possible condition combinations have been tested", correct: true },
      { id: "b", text: "100%, because every individual condition has been both true and false at least once" },
      { id: "c", text: "25%, because only one of the four tested combinations actually produces a discount" },
      { id: "d", text: "Not expressible as a percentage; a decision table is either complete or it is not" },
    ],
    explanation:
      "Decision table coverage is the proportion of the table's rules (columns) exercised by at least one test. Three binary conditions give eight rules, four of which have been covered, so coverage is 50%. Exercising each condition both ways is a weaker criterion and does not imply full rule coverage.",
  },
  {
    id: "ch4-q45",
    chapter: 4,
    kLevel: "K3",
    syllabusRef: "FL-4.2.4",
    stem: "A state model defines six valid transitions. A test suite exercises four of them at least once, and attempts no invalid ones. What 0-switch coverage has the suite achieved?",
    choices: [
      { id: "a", text: "100%" },
      { id: "b", text: "67%", correct: true },
      { id: "c", text: "40%" },
      { id: "d", text: "0%, because no invalid transitions were attempted" },
    ],
    explanation:
      "0-switch coverage counts single valid transitions exercised as a proportion of all valid transitions in the model: 4 of 6, or about 67%. Invalid transitions are worth testing but are not part of this measure — attempting none of them does not reduce it.",
  },
  {
    id: "ch4-q46",
    chapter: 4,
    kLevel: "K3",
    syllabusRef: "FL-4.2.4",
    stem: "What does a state table make visible that a state transition diagram typically does not?",
    choices: [
      { id: "a", text: "The order in which a tester should execute the resulting test cases at run time" },
      { id: "b", text: "Every state/event pair, including those for which no transition is defined", correct: true },
      { id: "c", text: "The number of defects historically reported against each state in the product" },
      { id: "d", text: "The source code of the handler implementing each of the modelled transitions" },
      { id: "e", text: "The elapsed time the system should spend in each state before it moves on" },
    ],
    explanation:
      "A state table has a row per state and a column per event, so the empty cells are explicit: those are the sneak paths a negative test can aim at. A diagram usually draws only the defined transitions, which makes the undefined ones easy to overlook.",
  },
  {
    id: "ch4-q47",
    chapter: 4,
    kLevel: "K3",
    syllabusRef: "FL-4.2.4",
    multi: true,
    stem: "Which of the following are true of state transition testing? (Select all that apply.)",
    choices: [
      { id: "a", text: "A transition is triggered by an event and may be subject to a guard condition", correct: true },
      { id: "b", text: "The same event can cause different transitions depending on the current state", correct: true },
      { id: "c", text: "0-switch coverage is reached once every valid transition has been exercised", correct: true },
      { id: "d", text: "It applies only to embedded systems with physically distinct hardware modes" },
      { id: "e", text: "A state table is only valid once the implementation's source code is reviewed" },
    ],
    explanation:
      "A state model's transitions are driven by events, optionally guarded by conditions, and the response to an event depends on the state the system is in — which is the whole point of the model. 0-switch coverage is exactly the 'every valid transition once' criterion. The technique is a black-box one and applies to any stateful behaviour, from an order workflow to a login lockout, with no need to read the code.",
  },
  {
    id: "ch4-q48",
    chapter: 4,
    kLevel: "K2",
    syllabusRef: "FL-4.5.1",
    stem: "A product owner, a developer and a tester sit down to write a story about withdrawing cash from an ATM. Which contribution is characteristically the tester's?",
    choices: [
      { id: "a", text: "Asking how each behaviour the story promises would be shown to work", correct: true },
      { id: "b", text: "Deciding which stories the team should commit to for the coming iteration" },
      { id: "c", text: "Choosing the implementation approach the story's back end will end up using" },
      { id: "d", text: "Approving the business value the story is expected to deliver to the customer" },
    ],
    explanation:
      "Collaborative story writing works because the three roles bring different questions. The tester's is testability: how would we know this behaviour works, what happens on the paths the story does not mention, and can the acceptance criteria be checked at all. Committing to scope belongs to the team and the product owner, the design belongs to the developer, and business value belongs to the product owner.",
  },
  {
    id: "ch4-q49",
    chapter: 4,
    kLevel: "K2",
    syllabusRef: "FL-4.3.1",
    stem: "A function was specified to log a warning when a discount exceeds 50%, but the developer omitted that logic entirely. A test suite achieves 100% statement coverage of the function as written. Why does that not detect the omission?",
    choices: [
      { id: "a", text: "Statement coverage counts each statement twice, which conceals any left out" },
      { id: "b", text: "Statement coverage is measured against the specification, not the delivered code" },
      { id: "c", text: "Statement coverage can only exercise code that exists, so absent logic is never counted", correct: true },
      { id: "d", text: "Statement coverage reports a percentage only once every branch has been exercised" },
    ],
    explanation:
      "White-box coverage measures what proportion of the code that was written has been executed. Code that was never written contributes nothing to the denominator, so a missing requirement can coexist with 100% statement coverage — which is why specification-based techniques are needed alongside it.",
  },
  {
    id: "ch4-q50",
    chapter: 4,
    kLevel: "K2",
    syllabusRef: "FL-4.3.2",
    stem: "Which statement correctly describes the relationship between statement coverage and branch coverage?",
    choices: [
      { id: "a", text: "100% statement coverage guarantees 100% branch coverage, but not the reverse" },
      { id: "b", text: "100% branch coverage guarantees 100% statement coverage, but not the reverse", correct: true },
      { id: "c", text: "Each guarantees the other; they differ only in how the tool presents them" },
      { id: "d", text: "Neither implies the other, since they are computed from unrelated models" },
    ],
    explanation:
      "Exercising every branch outcome necessarily executes every statement, so branch coverage is the stronger criterion. The reverse fails on an `if` with no `else`: running the statements inside it gives 100% statement coverage while the false outcome of the decision is never taken.",
  },
  {
    id: "ch4-q51",
    chapter: 4,
    kLevel: "K2",
    syllabusRef: "FL-4.3.3",
    stem: "What does white-box testing provide that black-box testing of the same test object cannot?",
    choices: [
      { id: "a", text: "Assurance that the specified behaviour matches what the customer asked for" },
      { id: "b", text: "Evidence about parts of the implementation that no specified behaviour reaches", correct: true },
      { id: "c", text: "A measure of how many requirements the delivered increment has satisfied" },
      { id: "d", text: "Confidence that the system performs acceptably under production load" },
    ],
    explanation:
      "Because it works from the structure rather than the specification, white-box testing can show which code the specification-based tests never touch — dead code, defensive branches, undocumented shortcuts. Requirements satisfaction and performance under load are answered by other techniques and test types.",
  },
  {
    id: "ch4-q52",
    chapter: 4,
    kLevel: "K2",
    syllabusRef: "FL-4.3.3",
    multi: true,
    stem: "Which of the following are genuine benefits of white-box testing? (Select all that apply.)",
    choices: [
      { id: "a", text: "It can reveal code that no specification-based test would ever execute", correct: true },
      { id: "b", text: "Coverage measurement gives an objective figure for how much code is reached", correct: true },
      { id: "c", text: "Defects can be found without a complete or up-to-date specification", correct: true },
      { id: "d", text: "It can expose implementation shortcuts the specification says nothing about", correct: true },
      { id: "e", text: "It removes the need for specification-based testing of the same object" },
      { id: "f", text: "It proves the absence of defects in any line the test suite has executed" },
    ],
    explanation:
      "White-box testing reaches code that no specified behaviour exercises, measures coverage objectively, works even where the specification is thin or stale, and surfaces shortcuts an implementer took silently. What it cannot do is replace specification-based testing — it says nothing about missing functionality — or prove any line defect-free, since executing a line is not the same as checking every outcome it can produce.",
  },
  {
    id: "ch4-q53",
    chapter: 4,
    kLevel: "K2",
    syllabusRef: "FL-4.3.3",
    stem: "A team reports 100% branch coverage on a module and concludes from it that the module is defect-free. Why is that conclusion unsound?",
    choices: [
      { id: "a", text: "Branch coverage above 90% is unreliable on any module over 100 lines long" },
      { id: "b", text: "Coverage figures count only when produced by a tool the vendor has certified" },
      { id: "c", text: "Coverage shows the tests reached the code, not that they checked the results", correct: true },
      { id: "d", text: "Defect-freedom follows from branch coverage only if the module has no loops" },
      { id: "e", text: "They should have measured statement coverage, which subsumes branch coverage" },
    ],
    explanation:
      "Coverage is a measure of execution, not of verification: a suite with weak or missing assertions can execute every branch and notice nothing. Coverage also cannot speak to functionality that was never implemented, and testing shows the presence of defects rather than their absence.",
  },
  {
    id: "ch4-q54",
    chapter: 4,
    kLevel: "K2",
    syllabusRef: "FL-4.4.1",
    stem: "Before testing a new file-import feature, a tester lists the failures the team has hit in previous importers — truncated last row, wrong delimiter silently accepted, empty file failing without a message — and designs a test for each. What is this an example of?",
    choices: [
      { id: "a", text: "Boundary value analysis over the import file's permitted size partitions" },
      { id: "b", text: "Error guessing, driven by a defect list built from previous experience", correct: true },
      { id: "c", text: "Checklist-based testing against a standard published by an external body" },
      { id: "d", text: "Exploratory testing under a time-boxed charter agreed with the test manager" },
    ],
    explanation:
      "Error guessing anticipates the errors, defects and failures that experience says are likely for this kind of test object, often through a defect list drawn from past projects, and designs tests to expose them. There is no partitioning of an input range here, no externally published checklist, and no time-boxed session with concurrent design and execution.",
  },
  {
    id: "ch4-q55",
    chapter: 4,
    kLevel: "K2",
    syllabusRef: "FL-4.4.2",
    stem: "A manager asks why an exploratory session's results are harder to hand to an auditor than the scripted suite's. What is the fair answer?",
    choices: [
      { id: "a", text: "The tests were designed and executed together, so the record is the session notes", correct: true },
      { id: "b", text: "Exploratory testing produces no defect reports that an auditor would be able to review" },
      { id: "c", text: "Exploratory sessions run without a charter, so nothing about them can be planned ahead" },
      { id: "d", text: "The results cannot be reproduced by anybody, because each session is entirely random" },
    ],
    explanation:
      "In exploratory testing, design, execution and logging happen together, so the evidence trail is the session sheet and notes rather than a pre-written script with recorded results. Sessions are still chartered and time-boxed, they still yield defect reports, and good notes keep findings reproducible — the difference is the form the record takes.",
  },
  {
    id: "ch4-q56",
    chapter: 4,
    kLevel: "K2",
    syllabusRef: "FL-4.1.1",
    stem: "A test approach applies black-box, white-box and experience-based techniques to the same test object. What is the strongest argument for combining them rather than relying on one category?",
    choices: [
      { id: "a", text: "Each category is blind to defects the other two are able to expose", correct: true },
      { id: "b", text: "Only a combination of all three can achieve 100% branch coverage of the code" },
      { id: "c", text: "Certification schemes require every test object to be covered by all three" },
      { id: "d", text: "Applying one category alone removes the need for any test basis at all" },
    ],
    explanation:
      "Black-box techniques work from the test basis and say nothing about code no test reaches; white-box techniques measure what the code does and cannot see functionality nobody implemented; experience-based techniques find what neither anticipated. Branch coverage is a white-box measure on its own, no scheme mandates all three, and every category still needs either a test basis or a tester's experience to work from.",
  },
  {
    id: "ch4-q57",
    chapter: 4,
    kLevel: "K3",
    syllabusRef: "FL-4.2.1",
    stem: "A ticket price depends on age: 0–12 is a child fare, 13–64 an adult fare, 65 and over a senior fare. Ages below 0 are rejected. How many equivalence partitions must a suite cover to reach 100% partition coverage of this input?",
    choices: [
      { id: "a", text: "Four — the three fare bands plus the rejected values", correct: true },
      { id: "b", text: "Three — one partition for each of the fares the rule defines" },
      { id: "c", text: "Two — one valid partition and one invalid partition for the field" },
      { id: "d", text: "Six — each fare band split into its lower and upper halves" },
    ],
    explanation:
      "Each fare band is a distinct partition because the system is expected to treat it differently, and the rejected ages below 0 form a fourth. Partitions follow from differing treatment rather than from a fixed count of valid and invalid ones, and nothing in the rule splits a band in two.",
  },
  {
    id: "ch4-q58",
    chapter: 4,
    kLevel: "K3",
    syllabusRef: "FL-4.2.1",
    stem: "A postcode field defines four partitions: valid format, too short, too long, and containing punctuation. A suite tests one value from the valid partition, one that is too short and one that is too long. What partition coverage has it achieved?",
    choices: [
      { id: "a", text: "75%, since one of the four partitions is untested", correct: true },
      { id: "b", text: "100%, because every test the suite runs passes through a partition" },
      { id: "c", text: "60%, counting the valid partition twice as it carries most of the risk" },
      { id: "d", text: "33%, because only the valid partition counts towards coverage" },
    ],
    explanation:
      "Equivalence partition coverage is the proportion of identified partitions exercised by at least one test — three of four here. Partitions are not weighted by risk when coverage is counted, invalid partitions count as much as valid ones, and a second test through a partition already covered adds nothing to the figure.",
  },
  {
    id: "ch4-q59",
    chapter: 4,
    kLevel: "K3",
    syllabusRef: "FL-4.2.1",
    stem: "A shipping form's destination field accepts any of 27 country codes and rejects everything else. A tester argues that equivalence partitioning does not apply because the values are not a numeric range. What is the correct response?",
    choices: [
      { id: "a", text: "It applies: the 27 codes are treated alike, so they form one partition", correct: true },
      { id: "b", text: "It applies only after the codes have been mapped onto numbers in some order" },
      { id: "c", text: "It does not apply, because partitions must be defined by an ordered range" },
      { id: "d", text: "It does not apply, because a set of 27 values needs 27 separate partitions" },
    ],
    explanation:
      "Partitioning groups values the system is expected to handle in the same way; nothing requires them to be numeric or ordered. The accepted codes form one valid partition and everything else an invalid one. Ordering matters for boundary value analysis, which is why BVA needs a range and partitioning does not.",
  },
  {
    id: "ch4-q60",
    chapter: 4,
    kLevel: "K3",
    syllabusRef: "FL-4.2.2",
    stem: "An interest rule applies 3% to balances up to and including $10,000 and 4% above it. Balances are held to the cent. Which pair of values gives two-value boundary coverage of the single boundary in this rule?",
    choices: [
      { id: "a", text: "$10,000 and $10,000.01", correct: true },
      { id: "b", text: "$9,999 and $10,001" },
      { id: "c", text: "$10,000 and $10,001" },
      { id: "d", text: "$5,000 and $15,000" },
    ],
    explanation:
      "The two-value approach tests the boundary value itself and the nearest value on the other side of it. With balances to the cent, the first value outside the 3% partition is $10,000.01. Pairs that straddle the boundary at a distance leave the values in between untested, and two values drawn from the middle of each partition test no boundary at all.",
  },
  {
    id: "ch4-q61",
    chapter: 4,
    kLevel: "K3",
    syllabusRef: "FL-4.2.2",
    stem: "A specification says 'reject any value over 100'. The developer implements the check as 'reject when the value is 100 or more'. Which single test value exposes the difference, and why?",
    choices: [
      { id: "a", text: "100 — the specification accepts it and the code does not", correct: true },
      { id: "b", text: "101 — the code rejects a value the specification allows through" },
      { id: "c", text: "99 — it sits one step below the boundary the rule states" },
      { id: "d", text: "No single value can; only a scan of the whole range would" },
    ],
    explanation:
      "Shifting a comparison by one moves the boundary by one, so the two versions disagree on exactly one value. 101 is rejected either way and 99 accepted either way, which is precisely why a value drawn from a boundary is worth more than one drawn from the middle of a partition.",
  },
  {
    id: "ch4-q62",
    chapter: 4,
    kLevel: "K3",
    syllabusRef: "FL-4.2.3",
    stem: "An order ships free when the customer is a member, whatever the order value; non-members get free shipping only above $50. How many rules remain once the full decision table is collapsed?",
    choices: [
      { id: "a", text: "Three, once the two member columns collapse into one", correct: true },
      { id: "b", text: "Four, because collapsing never reduces a two-condition table" },
      { id: "c", text: "Two, one for free shipping and one for paid shipping" },
      { id: "d", text: "Six, the four combinations plus the two collapsed rules" },
    ],
    explanation:
      "The full table has four columns, one per combination of the two conditions. A member ships free on either side of $50, so those two columns share an action and differ only in a condition that does not matter — they collapse into a single rule with a 'don't care' entry. The two non-member columns produce different actions and must both stay.",
  },
  {
    id: "ch4-q63",
    chapter: 4,
    kLevel: "K3",
    syllabusRef: "FL-4.2.3",
    stem: "After collapsing, a decision table for a fee rule holds five rules. A tester writes one test case per rule and all five pass. What has that demonstrated?",
    choices: [
      { id: "a", text: "Each rule the table keeps was exercised once and behaved as specified", correct: true },
      { id: "b", text: "The implementation holds no defect in any condition the table lists" },
      { id: "c", text: "All possible combinations of the underlying conditions have been run" },
      { id: "d", text: "The table is proven complete, since five rules covered every case" },
    ],
    explanation:
      "One test per rule is 100% decision table coverage: every combination the table distinguishes was exercised once and produced its specified action. A collapsed rule stands in for several raw combinations rather than executing them all, coverage says nothing about defects outside the conditions modelled, and passing tests never prove the table itself complete.",
  },
  {
    id: "ch4-q64",
    chapter: 4,
    kLevel: "K3",
    syllabusRef: "FL-4.2.3",
    stem: "A shipping rule depends on the destination (domestic, EU, or rest of world) and on whether the order is insured. How large is the full decision table for this rule, before any collapsing?",
    choices: [
      { id: "a", text: "Six columns, one per combination of the two conditions", correct: true },
      { id: "b", text: "Five columns, since domestic and EU share one carrier" },
      { id: "c", text: "Four columns, because a decision table takes binary conditions" },
      { id: "d", text: "Nine columns, three destinations against three insurance states" },
    ],
    explanation:
      "A condition may take more than two values, and the full table holds one column per combination — three destinations times two insurance states gives six. Collapsing happens afterwards and only where the actions agree, and nothing restricts a decision table to true/false conditions.",
  },
  {
    id: "ch4-q65",
    chapter: 4,
    kLevel: "K3",
    syllabusRef: "FL-4.2.4",
    stem: "A door controller has the states LOCKED, UNLOCKED and OPEN, with four valid transitions: LOCKED to UNLOCKED, UNLOCKED to LOCKED, UNLOCKED to OPEN, and OPEN to UNLOCKED. How many pairs of consecutive transitions must a suite exercise for 1-switch coverage?",
    choices: [
      { id: "a", text: "Six — each transition against the ones that can follow it", correct: true },
      { id: "b", text: "Four, since 1-switch coverage tests each transition once" },
      { id: "c", text: "Twelve, every ordered pair that can be formed from four transitions" },
      { id: "d", text: "Three, one pair for each state the model defines" },
    ],
    explanation:
      "1-switch coverage requires every valid sequence of two consecutive transitions. A transition can only be followed by one that starts in the state it ends in: the two transitions ending in UNLOCKED have two possible followers each, and the transitions ending in LOCKED and in OPEN have one each — two plus two plus one plus one.",
  },
  {
    id: "ch4-q66",
    chapter: 4,
    kLevel: "K3",
    syllabusRef: "FL-4.2.4",
    stem: "A state table for a media player lists its states down the side and its events across the top, and several cells are empty. What tests should a tester derive from those empty cells?",
    choices: [
      { id: "a", text: "Tests that fire the event in that state and check nothing breaks", correct: true },
      { id: "b", text: "None — an empty cell means the combination cannot occur at runtime" },
      { id: "c", text: "Tests that confirm the event is disabled everywhere in the interface" },
      { id: "d", text: "A defect report, since a state table with empty cells is incomplete" },
    ],
    explanation:
      "An empty cell is a transition the model does not define — an invalid transition. The system will still receive that event in that state, so the tests worth writing are the ones that trigger it and check the player refuses it gracefully rather than misbehaving. Exposing those combinations is the main thing a state table offers over a diagram.",
  },
  {
    id: "ch4-q67",
    chapter: 4,
    kLevel: "K2",
    syllabusRef: "FL-4.3.1",
    stem: "A function opens with a single `if` that returns early when its input is null, and otherwise runs four further statements. What is the smallest number of test cases that reaches 100% statement coverage?",
    choices: [
      { id: "a", text: "Two — one input that returns early and one that does not", correct: true },
      { id: "b", text: "One, since a single non-null input reaches every line in turn" },
      { id: "c", text: "Four, one for each statement after the early return is skipped" },
      { id: "d", text: "Five, one per executable statement the function contains" },
    ],
    explanation:
      "Statement coverage requires every executable statement to run at least once. A null input executes the guard and its return but none of what follows; a non-null input executes the guard and the four following statements but never the return. Neither is sufficient alone, and one of each is enough.",
  },
  {
    id: "ch4-q68",
    chapter: 4,
    kLevel: "K2",
    syllabusRef: "FL-4.3.2",
    stem: "A method contains one `if/else` and one loop whose body may be skipped. A suite runs three inputs: every one takes the `if` branch, and every one enters the loop at least once. What is holding its branch coverage down?",
    choices: [
      { id: "a", text: "The `else` outcome and the skipped-loop outcome were never taken", correct: true },
      { id: "b", text: "Three inputs are too few to measure branch coverage meaningfully" },
      { id: "c", text: "Loops are excluded from branch coverage, so only the `if` counts" },
      { id: "d", text: "Branch coverage cannot be computed unless every input is distinct" },
    ],
    explanation:
      "Branch coverage counts decision outcomes, and both the `if/else` and the loop condition are decisions with two outcomes each. This suite exercises two of the four, so it sits at 50% however many inputs it runs. The number of inputs is not the measure, a loop condition is a decision like any other, and duplicate inputs simply add nothing new.",
  },
  {
    id: "ch4-q69",
    chapter: 4,
    kLevel: "K2",
    syllabusRef: "FL-4.3.3",
    stem: "A coverage report for a pricing module shows a block of code no test has ever executed. Investigation finds it handles a currency the product dropped two years ago. What has white-box testing contributed here?",
    choices: [
      { id: "a", text: "It surfaced code the specification no longer describes at all", correct: true },
      { id: "b", text: "It proved the rest of the module behaves the way it is specified" },
      { id: "c", text: "It measured how thoroughly the requirements have been tested" },
      { id: "d", text: "It removed the need to test the module against its specification" },
    ],
    explanation:
      "Specification-based tests are derived from what the product is meant to do, so none of them would ever reach code serving a currency the product no longer sells. Coverage measurement points straight at it. What it cannot do is verify behaviour against the specification or measure requirements coverage — both remain black-box concerns.",
  },
  {
    id: "ch4-q70",
    chapter: 4,
    kLevel: "K2",
    syllabusRef: "FL-4.4.1",
    stem: "Two testers apply error guessing to the same new module and produce noticeably different sets of tests. What best explains the difference?",
    choices: [
      { id: "a", text: "The technique draws on each tester's own history of past failures", correct: true },
      { id: "b", text: "Each of them applied the technique to a different test basis" },
      { id: "c", text: "One of them must have misapplied the technique's defined procedure" },
      { id: "d", text: "The module's specification is ambiguous about its expected behaviour" },
    ],
    explanation:
      "Error guessing has no prescribed procedure. It works from what a tester knows about how this kind of software, and this kind of team, has failed before — so two testers with different backgrounds legitimately arrive at different tests. That is also its main limitation: what it covers depends on the individual, which is why it complements systematic techniques rather than replacing them.",
  },
  {
    id: "ch4-q71",
    chapter: 4,
    kLevel: "K2",
    syllabusRef: "FL-4.4.1",
    multi: true,
    stem: "A team is deciding when error guessing is worth applying. Which of the following statements about it are correct? (Select all that apply.)",
    choices: [
      { id: "a", text: "It is most productive in the hands of a tester who knows the domain", correct: true },
      { id: "b", text: "A defect taxonomy or list of past failures can make it more systematic", correct: true },
      { id: "c", text: "It replaces black-box techniques once a tester has enough experience of the domain" },
      { id: "d", text: "It can only be applied after the systematic techniques have been run" },
    ],
    explanation:
      "Error guessing depends on the tester's knowledge of the application, the technology and the failures each tends to produce, and a defect list or taxonomy gives that knowledge a repeatable shape. It complements systematic techniques rather than substituting for them, and nothing about it requires waiting until those have finished.",
  },
  {
    id: "ch4-q72",
    chapter: 4,
    kLevel: "K2",
    syllabusRef: "FL-4.4.2",
    multi: true,
    stem: "Which of the following are true of session-based exploratory testing? (Select all that apply.)",
    choices: [
      { id: "a", text: "Test design and test execution happen within the same session", correct: true },
      { id: "b", text: "The session is time-boxed and works to an agreed charter", correct: true },
      { id: "c", text: "Findings from one session can reshape the charter of the next", correct: true },
      { id: "d", text: "Each session must be preceded by a fully scripted test suite" },
      { id: "e", text: "It is a white-box technique, since the tester reads the code as they go" },
    ],
    explanation:
      "Session-based exploratory testing time-boxes the work, gives it a charter to steer by, and has the tester design, execute and log tests as a single activity — so what one session learns feeds the charter of the next. It needs no scripted suite in front of it, and it is an experience-based technique, working from the tester's knowledge rather than from the structure of the code.",
  },
  {
    id: "ch4-q73",
    chapter: 4,
    kLevel: "K2",
    syllabusRef: "FL-4.4.3",
    stem: "A team wants its checklist-based testing to keep finding defects release after release. What should it do with the checklist itself?",
    choices: [
      { id: "a", text: "Update it as new defect types appear and stale items stop paying", correct: true },
      { id: "b", text: "Freeze it, so results stay comparable from one release to the next" },
      { id: "c", text: "Expand each item into a scripted test case with fixed expected results" },
      { id: "d", text: "Replace it with a coverage target measured against the source code" },
    ],
    explanation:
      "Checklists age. Items stop paying once the team has designed that defect out, and new failure modes arrive that the list never mentioned, so keeping it current is what keeps the technique productive. Freezing it guarantees the decay, scripting every item turns it into a different technique, and code coverage answers an unrelated question.",
  },
  {
    id: "ch4-q74",
    chapter: 4,
    kLevel: "K2",
    syllabusRef: "FL-4.5.1",
    stem: "A coach describes a user story as having three parts: a card, a conversation and a confirmation. Which of the three are the story's acceptance criteria?",
    choices: [
      { id: "a", text: "The confirmation, which says how the team will know the story is done", correct: true },
      { id: "b", text: "The card, which carries the story's text and its estimate" },
      { id: "c", text: "The conversation, held between the business and the developers" },
      { id: "d", text: "None of the three; the acceptance criteria sit outside the story entirely" },
    ],
    explanation:
      "In the three C's, the card holds the short statement of intent, the conversation is where the team works out what it actually means, and the confirmation is the acceptance criteria that settle when the story is finished. Acceptance criteria belong to the story rather than sitting alongside it as a separate artefact.",
  },
  {
    id: "ch4-q75",
    chapter: 4,
    kLevel: "K2",
    syllabusRef: "FL-4.5.2",
    stem: "Which of these acceptance criteria is written so that a tester can tell unambiguously whether it has been met?",
    choices: [
      { id: "a", text: "The export completes within 5 seconds for a file of 10,000 rows", correct: true },
      { id: "b", text: "The export should be fast enough for the users who rely on it" },
      { id: "c", text: "The export must not be noticeably slower than the previous version" },
      { id: "d", text: "The export performance should be improved wherever that is possible" },
    ],
    explanation:
      "A criterion is testable when it states a condition that can be observed as met or not met — here, a stated limit against a stated workload. 'Fast enough', 'noticeably slower' and 'wherever possible' each leave the pass/fail decision to whoever happens to be reading, which is the ambiguity acceptance criteria exist to remove.",
  },
  {
    id: "ch4-q76",
    chapter: 4,
    kLevel: "K2",
    syllabusRef: "FL-4.5.2",
    multi: true,
    stem: "A team reviews the acceptance criteria on a story before development starts. Which properties should they be checking for? (Select all that apply.)",
    choices: [
      { id: "a", text: "Each criterion can be judged met or not met without further debate", correct: true },
      { id: "b", text: "Together they describe what the story must do to be accepted", correct: true },
      { id: "c", text: "They stay clear of naming a particular implementation", correct: true },
      { id: "d", text: "They are understandable by the business as well as the team", correct: true },
      { id: "e", text: "Every criterion is written in Given/When/Then form" },
      { id: "f", text: "There is one criterion for each line of code the story will add" },
    ],
    explanation:
      "Acceptance criteria need to be unambiguous, to cover what acceptance actually requires, to describe behaviour rather than a chosen design, and to be readable by everyone who has to agree to them. The scenario-oriented Given/When/Then style is one option and the rule-oriented style is another, and criteria are a property of the story rather than of the code that eventually implements it.",
  },
  {
    id: "ch4-q77",
    chapter: 4,
    kLevel: "K3",
    syllabusRef: "FL-4.5.3",
    stem: "A story's acceptance criteria say a voucher applies only to orders over $30, only once per order, and never alongside a staff discount. In an ATDD session the team turns these into tests. Which set of examples covers the criteria most directly?",
    choices: [
      { id: "a", text: "Orders at $30 and $30.01, one with two vouchers, one with a staff discount", correct: true },
      { id: "b", text: "One order at $50 with a valid voucher, repeated across five product categories" },
      { id: "c", text: "One order per payment method the checkout supports, each with a voucher" },
      { id: "d", text: "One test per screen in the checkout flow, checking the voucher field renders" },
    ],
    explanation:
      "ATDD derives its tests from the acceptance criteria themselves, so each criterion needs an example that shows it holding and one that shows it being enforced — the threshold from both sides, a second voucher on one order, and the staff-discount combination. Product categories, payment methods and screen rendering are all legitimate tests, but none of them exercises a criterion this story states.",
  },
];
