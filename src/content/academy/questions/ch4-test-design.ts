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
        text: "The test basis and knowledge each draws test cases from — black-box uses only the specification, white-box uses the internal structure, and experience-based draws on the tester's own knowledge and intuition",
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
    kLevel: "K2",
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
    kLevel: "K2",
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
    kLevel: "K2",
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
      { id: "a", text: "An invalid transition ('sneak path') — that the system correctly refuses a transition the model does not define", correct: true },
      { id: "b", text: "0-switch coverage of the PENDING → PAID transition" },
      { id: "c", text: "1-switch coverage of two consecutive valid transitions" },
      { id: "d", text: "That every reachable state has been visited at least once" },
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
    syllabusRef: "FL-4.2.5",
    stem: "A 'place order' use case has a main flow ending in payment confirmation, and an alternative flow triggered when the customer's saved card is declined, which redirects them to add a new payment method before rejoining the main flow. Which test exercises this alternative flow specifically?",
    choices: [
      { id: "a", text: "Checking out with a card that will be declined, then completing payment with a newly added card", correct: true },
      { id: "b", text: "Checking out with a valid saved card and confirming the order total" },
      { id: "c", text: "Checking that the cart page displays the correct item count" },
      { id: "d", text: "Checking that the order confirmation email is sent after a successful main-flow checkout" },
    ],
    explanation:
      "The alternative flow is specifically the declined-card path that detours through adding a new payment method before rejoining the main flow — only a test that triggers the decline and follows that detour exercises it. The other options exercise the main flow or an unrelated part of the system.",
  },
  {
    id: "ch4-q23",
    chapter: 4,
    kLevel: "K3",
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
    kLevel: "K3",
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
    kLevel: "K3",
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
        text: "A tester designs and executes tests to cover the items of a checklist built from experience, knowledge of the application, or common failure modes",
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
      { id: "a", text: "To surface ambiguities, missing detail, and edge cases early, before they turn into defects found later in development", correct: true },
      { id: "b", text: "Because exactly three people are required to sign off on every story" },
      { id: "c", text: "To replace the need for any acceptance criteria" },
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
        text: "Testability concerns and technical constraints that a developer or tester would normally flag go unnoticed until later in development",
        correct: true,
      },
      { id: "b", text: "The story will automatically fail static analysis" },
      { id: "c", text: "The story cannot be estimated by the team" },
      { id: "d", text: "The story becomes a formal legal contract" },
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
        text: "To define specific, testable conditions the story must satisfy to be considered done, and to serve as the basis for acceptance tests",
        correct: true,
      },
      { id: "b", text: "To describe the internal code structure that will implement the story" },
      { id: "c", text: "To replace the need for any collaboration between business and development" },
      { id: "d", text: "To record the estimated effort for the story in story points" },
    ],
    explanation:
      "Acceptance criteria spell out concrete, checkable conditions a story must meet — they give 'done' a testable definition and are what acceptance tests are written against, rather than describing implementation detail or effort estimates.",
  },
  {
    id: "ch4-q34",
    chapter: 4,
    kLevel: "K3",
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
    kLevel: "K2",
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
    kLevel: "K2",
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
];
