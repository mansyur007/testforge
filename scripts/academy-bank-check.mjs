// A-10a: content-shape guard for the real ISTQB question bank.
//
// `scripts/academy-exam-selftest.mjs` tests the engine against a *synthetic*
// 12-per-chapter bank, which is why it never noticed that chapter 5 actually
// holds 10 questions, or that the correct answer is `a` or `b` in 66 of the
// bank's 70. This script is the other half: it reads the real content and
// checks the properties that make the paper worth sitting.
//
// The headline check is the one that motivated A-10a. As authored, the bank
// answers `a` 35 times, `b` 31, `c` 4 and `d` never. That does not hand anyone
// a pass on its own — always picking `a` scores 50%, under the 65% line — but
// it does mean two of the four options are dead on almost every question, so a
// candidate who notices lifts a blind guess from 25% to ~47% and gets there by
// reading the bank rather than the syllabus. `beginAttempt` now shuffles each
// question's choices per attempt (seeded, so an attempt stays reproducible),
// which makes position carry no information at all. This asserts that end to
// end: simulate always picking the first option over many seeded papers and
// require it to land at chance rather than at the authored ~50%.
//
// It deliberately does NOT assert the bank's authored positions are balanced.
// Shuffling is what makes that irrelevant, and a guard that also demanded
// hand-balanced content would fail every future question whose author happened
// to write the answer first — the exact brittleness A-10a set out to remove.
//
// Wired into `prebuild`, next to its siblings, so `npm run build` covers it
// with no CI change.
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { drawQuestionIds, presentPaper } from "../src/lib/academy/exam-core.mjs";

const QUESTIONS_DIR = "src/content/academy/questions";

let failed = 0;
function assert(name, ok, detail) {
  if (!ok) {
    failed++;
    console.error(`FAIL: ${name}${detail ? ` — ${detail}` : ""}`);
  }
}

// The bank is TypeScript, and this runs under bare `node` like every other
// selftest in this directory. The question files are pure data with exactly one
// export, so stripping the type import and the array's type annotation is
// enough to import them as ESM — and if that ever stops being true, this throws
// loudly at build time rather than silently checking nothing.
async function loadBank() {
  const bank = [];
  for (const file of readdirSync(QUESTIONS_DIR).filter((f) => /^ch\d.*\.ts$/.test(f))) {
    const src = readFileSync(join(QUESTIONS_DIR, file), "utf8")
      .replace(/^import type .*$/m, "")
      .replace(/:\s*ExamQuestion\[\]/, "");
    const mod = await import(
      "data:text/javascript;base64," + Buffer.from(src).toString("base64")
    );
    const exported = Object.values(mod);
    if (exported.length !== 1 || !Array.isArray(exported[0])) {
      throw new Error(`${file}: expected exactly one exported question array`);
    }
    for (const q of exported[0]) bank.push({ ...q, file });
  }
  return bank;
}

const bank = await loadBank();
assert("bank: not empty", bank.length > 0, `${bank.length} questions`);

// ---------------------------------------------------------------------------
// Per-question shape
// ---------------------------------------------------------------------------

const ids = new Set();
for (const q of bank) {
  const correct = q.choices.filter((c) => c.correct);
  assert(`${q.id}: unique id`, !ids.has(q.id));
  ids.add(q.id);
  assert(`${q.id}: at least 3 choices`, q.choices.length >= 3, `${q.choices.length}`);
  assert(`${q.id}: has a correct answer`, correct.length >= 1);
  // A `multi` flag that disagrees with the key is the one content bug that
  // silently changes how a question is graded: set-equality means a
  // single-answer question with two keys is unpassable.
  assert(
    `${q.id}: multi flag matches the number of correct answers`,
    q.multi ? correct.length >= 2 : correct.length === 1,
    `multi=${Boolean(q.multi)}, correct=${correct.length}`,
  );
  assert(`${q.id}: has a syllabusRef`, Boolean(q.syllabusRef));
  assert(`${q.id}: has a kLevel`, Boolean(q.kLevel));
  assert(
    `${q.id}: has a real explanation`,
    typeof q.explanation === "string" && q.explanation.trim().length >= 40,
  );
  // A-10d: the answer must not be sitting in the stem. `ch4-q9` asked which
  // sequence gives 0-switch coverage of a transition and described the model
  // as "PENDING → PAID → SHIPPED", which was also, verbatim, the correct
  // choice — so string matching beat knowing the technique. Shuffling cannot
  // help with this one: position is randomised, the text is not. It survived
  // the original authoring, the A-10a audit and the A-10d review before a
  // scan caught it, which is the argument for having the build do the scan.
  //
  // Normalised to letters, digits and single spaces so punctuation and arrow
  // glyphs can't hide an overlap. The 16-character floor keeps short factual
  // answers ("67%", "16 days") from tripping it when the stem happens to
  // contain the same number — those are legitimately unguessable from the
  // wording, and the whole bank passes at this threshold today.
  const flatten = (s) => s.toLowerCase().replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();
  const flatStem = flatten(q.stem);
  for (const c of correct) {
    const flatChoice = flatten(c.text);
    assert(
      `${q.id}: correct answer is not quoted verbatim in the stem`,
      !(flatChoice.length >= 16 && flatStem.includes(flatChoice)),
      `choice ${c.id} appears in the stem: "${flatChoice.slice(0, 60)}"`,
    );
  }
}

// ---------------------------------------------------------------------------
// The guessing strategy, end to end against the real bank and the real draw
// ---------------------------------------------------------------------------

const FULL_EXAM_CHAPTERS = [
  { chapter: 1, count: 8 },
  { chapter: 2, count: 6 },
  { chapter: 3, count: 4 },
  { chapter: 4, count: 11 },
  { chapter: 5, count: 9 },
  { chapter: 6, count: 2 },
];
const PASS_PCT = 65;
const SEEDS = 300;

const byId = new Map(bank.map((q) => [q.id, q]));
const drawInput = bank.map((q) => ({ id: q.id, chapter: q.chapter }));

// A-10d: the guesser has to know about multi-answer questions, because the
// client is told which questions they are — `sanitizeQuestion` ships `multi`
// so the runner can render checkboxes. Scoring a multi question by its first
// choice alone (what this loop did when the bank held none) counts it wrong
// unconditionally under set-equality grading, so the simulation would quietly
// stop covering exactly the questions being added.
//
// The strategy modelled is the one a candidate actually gets by drilling the
// bank: they know a question is multi, and they know the *number* of correct
// answers the bank habitually uses. Shuffling hides position, not cardinality
// — if every multi question keys 3 of 5, "pick any 3" is 1-in-10 rather than
// the 1-in-26 a subset guess costs when the count is unknown. That is the same
// read-the-bank-not-the-syllabus lift A-10a removed from answer position, so
// it gets the same treatment: modelled here, and asserted below.
const multiKeyCounts = bank.filter((q) => q.multi).map((q) => q.choices.filter((c) => c.correct).length);
const tally = multiKeyCounts.reduce((m, k) => ((m[k] = (m[k] ?? 0) + 1), m), {});
const kModal = Number(Object.entries(tally).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 1);

let firstChoiceWins = 0;
let questionsSeen = 0;
let papersPassed = 0;
for (let i = 0; i < SEEDS; i++) {
  const seed = `guess-${i}`;
  const paper = drawQuestionIds(drawInput, FULL_EXAM_CHAPTERS, seed);
  // The same function `src/lib/academy/exam.ts` hands a paper out with, not a
  // copy of it — a copy would keep passing if the wrapper stopped shuffling.
  const shown = presentPaper(
    paper.map((qid) => byId.get(qid)),
    seed,
  );
  let score = 0;
  for (const q of shown) {
    // Set equality, mirroring `gradeAttempt` — picking a subset of the key is
    // not a partial credit, it is a wrong answer.
    const want = q.choices.filter((c) => c.correct).map((c) => c.id);
    const got = q.choices.slice(0, q.multi ? kModal : 1).map((c) => c.id);
    if (want.length === got.length && want.every((id) => got.includes(id))) score++;
    questionsSeen++;
  }
  firstChoiceWins += score;
  if (score / paper.length >= PASS_PCT / 100) papersPassed++;
}

const guessRate = (firstChoiceWins / questionsSeen) * 100;
// Four choices per question, so blind guessing is 25%. The band is wide on
// purpose: this is asserting "position tells you nothing", not pinning a
// sampling result to a decimal.
assert(
  "guessing the first choice scores at chance, not at the authored position bias",
  guessRate >= 15 && guessRate <= 35,
  `${guessRate.toFixed(1)}% over ${SEEDS} papers (~47% with the authored order, since the answer is first in half the bank)`,
);
assert(
  "guessing the first choice never passes the paper",
  papersPassed === 0,
  `${papersPassed} of ${SEEDS} papers passed at ${PASS_PCT}%`,
);

// A-10d: the structural half of the same concern. The simulation above only
// punishes a constant key count once enough multi questions are drawn into a
// paper to move the rate, and the first few chapters' worth never will. This
// asserts the property directly instead: if the bank's multi questions all key
// the same number of choices, "how many to tick" is a fact about the bank
// rather than about the question, and drilling teaches it. Threshold is 3 so a
// chapter can land its first couple of multi questions without tripping it.
//
// Deliberately not asserted: *which* positions are keyed, or that choice counts
// vary. Position is what `presentPaper` shuffles away, and pinning choice
// counts would be the same brittleness A-10a's header warns about.
const multiQs = bank.filter((q) => q.multi);
if (multiQs.length >= 3) {
  const distinctKeyCounts = new Set(multiKeyCounts);
  assert(
    "multi-answer questions vary how many of their choices are correct",
    distinctKeyCounts.size >= 2,
    `all ${multiQs.length} multi questions key exactly ${[...distinctKeyCounts][0]} choices — ` +
      `a candidate who notices ticks that many and guesses at 1-in-${
        // C(choices, k) for the commonest shape, as the lift they'd get.
        (() => {
          const q = multiQs[0];
          const n = q.choices.length;
          const k = [...distinctKeyCounts][0];
          let c = 1;
          for (let i = 0; i < k; i++) c = (c * (n - i)) / (i + 1);
          return Math.round(c);
        })()
      } instead of guessing the subset size too`,
  );
}

// ---------------------------------------------------------------------------
// The other guessing strategy: always pick the longest choice
// ---------------------------------------------------------------------------
//
// A-10d, third slice. `src/content/academy/questions/index.ts` has said since
// A-10a that "the correct answer being the longest option (true of 76% here)"
// is one of the things shuffling cannot fix — but nobody had measured what it
// is worth, and the answer turned out to be: a pass. Before this slice, always
// picking the longest choice was right on 70.9% of the bank's single-answer
// questions and scored 65.2% over whole papers here — above the 65% line, so a
// candidate who never opened the syllabus could sit the paper and be told they
// were ready for the real one. That is a strictly worse exploit than the
// answer-position bias A-10a was written for (which topped out at ~47%, under
// the line), and it had been sitting in the bank the whole time with a comment
// pointing straight at it.
//
// Length is a *content* property, so unlike position there is no code fix:
// `presentPaper` randomises the order of the choices, not their word count.
// The only remedy is writing distractors as carefully as keys. The fourth
// slice did that pass over all six chapters — 204 choice texts rewritten,
// keys trimmed to a claim and distractors given enough substance to be worth
// reading — and the strategy now scores **31.4% and passes 0 of 300 papers**,
// against a 25% floor for a four-choice question. Every chapter individually
// lands between 25% and 31%.
//
// So this is no longer a ratchet on a live exploit; it is a regression guard on
// a closed one, in the same shape as the first-choice assertions above: a
// ceiling with room for the bank to grow, plus a hard "never passes a paper".
// The ceiling is deliberately not pinned to 31.4% — the pools are still being
// written, and a chapter whose new questions happen to run a few points high
// should not fail the build until it puts the paper score somewhere a
// candidate could exploit.
const LONGEST_CEILING_PCT = 40;
let longestWins = 0;
let longestSeen = 0;
let longestPapersPassed = 0;
for (let i = 0; i < SEEDS; i++) {
  const seed = `length-${i}`;
  const paper = drawQuestionIds(drawInput, FULL_EXAM_CHAPTERS, seed);
  const shown = presentPaper(
    paper.map((qid) => byId.get(qid)),
    seed,
  );
  let score = 0;
  for (const q of shown) {
    const want = q.choices.filter((c) => c.correct).map((c) => c.id);
    // Ties broken by the shuffled order, which is the same coin-flip the
    // candidate faces when two choices are the same length on screen.
    const got = [...q.choices]
      .sort((a, b) => b.text.length - a.text.length)
      .slice(0, q.multi ? kModal : 1)
      .map((c) => c.id);
    if (want.length === got.length && want.every((id) => got.includes(id))) score++;
    longestSeen++;
  }
  longestWins += score;
  if (score / paper.length >= PASS_PCT / 100) longestPapersPassed++;
}
const longestRate = (longestWins / longestSeen) * 100;
assert(
  "guessing the longest choice scores near chance, not at the authored length bias",
  longestRate <= LONGEST_CEILING_PCT,
  `${longestRate.toFixed(1)}% over ${SEEDS} papers, ceiling ${LONGEST_CEILING_PCT}% (~65% as ` +
    `authored, before the length pass) — new questions are making the key the longest choice again. ` +
    `Lengthen the distractors, or trim the key to the claim and let the explanation carry the rest`,
);
assert(
  "guessing the longest choice never passes the paper",
  longestPapersPassed === 0,
  `${longestPapersPassed} of ${SEEDS} papers passed at ${PASS_PCT}%`,
);

// ---------------------------------------------------------------------------
// Reported, not asserted: the content debt A-10a's later PRs still owe.
// ---------------------------------------------------------------------------

const perChapter = {};
for (const q of bank) perChapter[q.chapter] = (perChapter[q.chapter] ?? 0) + 1;
const thin = FULL_EXAM_CHAPTERS.filter((c) => (perChapter[c.chapter] ?? 0) < c.count * 5)
  .map((c) => `ch${c.chapter} ${perChapter[c.chapter] ?? 0}/${c.count * 5}`)
  .join(", ");
const multiCount = bank.filter((q) => q.multi).length;

// Which chapters the length tell lives in, so the next slice knows where to
// point. Single-answer questions only: for a multi question "the longest
// choices" is a set, and the paper-level simulation above already prices it.
const lengthDebt = FULL_EXAM_CHAPTERS.map((c) => {
  const singles = bank.filter((q) => q.chapter === c.chapter && !q.multi);
  const wins = singles.filter((q) => {
    const max = Math.max(...q.choices.map((ch) => ch.text.length));
    return q.choices.filter((ch) => ch.text.length === max).every((ch) => ch.correct);
  }).length;
  return `ch${c.chapter} ${Math.round((wins / singles.length) * 100)}%`;
}).join(", ");

if (failed > 0) {
  console.error(`academy-bank-check: FAILED (${failed} assertion(s))`);
  process.exit(1);
}
console.log(
  `academy-bank-check: OK (${bank.length} questions, first-choice guessing scores ` +
    `${guessRate.toFixed(1)}% and passes ${papersPassed}/${SEEDS} papers)`,
);
console.log(
  `academy-bank-check: content debt — pools below 5x blueprint weight: ${thin || "none"}; ` +
    `multi-answer questions: ${multiCount}`,
);
console.log(
  `academy-bank-check: longest-choice guessing scores ${longestRate.toFixed(1)}% ` +
    `(ceiling ${LONGEST_CEILING_PCT}%) and passes ${longestPapersPassed}/${SEEDS} papers; ` +
    `per chapter, the longest choice is the answer in ${lengthDebt}`,
);
