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
    if (q.choices[0].correct) score++;
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

// ---------------------------------------------------------------------------
// Reported, not asserted: the content debt A-10a's later PRs still owe.
// ---------------------------------------------------------------------------

const perChapter = {};
for (const q of bank) perChapter[q.chapter] = (perChapter[q.chapter] ?? 0) + 1;
const thin = FULL_EXAM_CHAPTERS.filter((c) => (perChapter[c.chapter] ?? 0) < c.count * 5)
  .map((c) => `ch${c.chapter} ${perChapter[c.chapter] ?? 0}/${c.count * 5}`)
  .join(", ");
const multiCount = bank.filter((q) => q.multi).length;

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
