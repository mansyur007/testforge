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
import { SYLLABUS_OBJECTIVES, OBJECTIVES_BY_ID } from "../src/lib/academy/syllabus-los.mjs";

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
  // A-10e: the ref has to name a real learning objective, not merely exist.
  // Before this check the bank carried `FL-2.4.1`, `FL-3.3.1`, `FL-4.2.5`,
  // `FL-5.1.8` and `FL-6.3.1`, none of which are in the syllabus, plus a whole
  // chapter-5 scheme where the ids collided with real ones and meant something
  // else (`FL-5.4.1` was "estimation" here and "configuration management" in
  // the document). A ref that resolves to nothing cannot be reviewed against
  // anything, which is the only reason §7.2 asks a question to carry one.
  const objective = OBJECTIVES_BY_ID.get(q.syllabusRef);
  assert(
    `${q.id}: syllabusRef names a real learning objective`,
    Boolean(objective),
    `"${q.syllabusRef}" is not in the CTFL v4.0 syllabus (see src/lib/academy/syllabus-los.mjs)`,
  );
  if (objective) {
    assert(
      `${q.id}: syllabusRef belongs to the question's own chapter`,
      objective.chapter === q.chapter,
      `chapter ${q.chapter} question on ${q.syllabusRef}, which is a chapter ${objective.chapter} objective`,
    );
    // `kLevel` is the objective's level, not the author's opinion of how hard
    // the question feels. That is the only definition anything can check, and
    // it is the one the real paper uses: a question examines its objective at
    // the level the syllabus assigns that objective. Whether the question as
    // *written* actually demands that much is a content judgement no script
    // can make — see docs/QA-ACADEMY.md §8 (A-10e) for the ones this audit
    // flagged for a human.
    assert(
      `${q.id}: kLevel matches its objective's level`,
      q.kLevel === objective.kLevel,
      `tagged ${q.kLevel}, but ${q.syllabusRef} is ${objective.kLevel}`,
    );
  }
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

// The published CTFL v4.0 exam structure, from ISTQB's *Exam Structure Tables*
// v1.18 (2026-05-27), page "CTFL v4.0". This is the document §5.1 spent four
// months calling for, and it settles the last open number in A-10: the
// per-chapter split. **The project's 8 / 6 / 4 / 11 / 9 / 2 was already exactly
// right** — authored from memory, and now checked rather than trusted.
//
// It is transcribed here as *numbers*, which is the whole of what we use: the
// document's prose, its learning-objective groupings and its layout are ISTQB's
// and are not reproduced. §7.2's rule for the bank applies to the blueprint too.
//
// Why a constant in the checker rather than a comment in `exams.ts`: A-11a's
// lesson was that a number maintained by prose drifts — derive it, or assert it.
// `exams.ts` is now checked against this table on every build, and the
// simulations below run against `exams.ts` rather than against a second copy,
// so there is exactly one place a weight can be changed and it fails the build
// unless the document changed too.
const PUBLISHED_CTFL_V4 = {
  passPct: 65, // 26 of 40
  durationSec: 60 * 60,
  extraTimeSec: 75 * 60, // total under the non-native-language allowance, not the increment
  // `k` is the document's K-level split per chapter. Nothing draws on it yet —
  // `drawQuestionIds` is chapter-weighted only — so it is recorded, reported and
  // deliberately not asserted against the bank. Making the draw honour it would
  // change which questions a stored `seed` re-derives, which is what makes a
  // past attempt reproducible; that is its own work order. See docs/QA-ACADEMY.md §5.1.
  chapters: [
    { chapter: 1, count: 8, k: { K1: 2, K2: 6, K3: 0 } },
    { chapter: 2, count: 6, k: { K1: 2, K2: 4, K3: 0 } },
    { chapter: 3, count: 4, k: { K1: 2, K2: 2, K3: 0 } },
    { chapter: 4, count: 11, k: { K1: 0, K2: 6, K3: 5 } },
    { chapter: 5, count: 9, k: { K1: 1, K2: 5, K3: 3 } },
    { chapter: 6, count: 2, k: { K1: 1, K2: 1, K3: 0 } },
  ],
};

/** `CTFL_V4_FULL` as authored, read out of the TS source the app actually uses.
 *  Same approach as `academy-checks-selftest.mjs` takes to `sandbox.ts`: the
 *  file is data with a fixed shape, and a regex over it beats a second copy. */
function authoredFullExam() {
  const src = readFileSync("src/content/academy/exams.ts", "utf8");
  const body = src.slice(src.indexOf("export const CTFL_V4_FULL"));
  // Values are either a product of literals (`60 * 60`) or a named constant
  // declared earlier in the file (`passPct: FULL_PASS_PCT`). Resolve one level
  // of indirection and evaluate the arithmetic; anything else throws, so a
  // future refactor of `exams.ts` fails the build loudly instead of silently
  // checking nothing — the same contract `loadBank` above holds itself to.
  const product = (expr, field) => {
    const parts = expr.trim().split("*").map((p) => p.trim());
    if (!parts.every((p) => /^\d+$/.test(p))) {
      throw new Error(`exams.ts: CTFL_V4_FULL.${field} is not a product of literals: "${expr}"`);
    }
    return parts.reduce((a, p) => a * Number(p), 1);
  };
  const num = (field) => {
    const m = body.match(new RegExp(`${field}:\\s*([A-Za-z0-9_*\\s]+?),`));
    if (!m) throw new Error(`exams.ts: could not read CTFL_V4_FULL.${field}`);
    const raw = m[1].trim();
    if (/^[A-Za-z_]\w*$/.test(raw)) {
      const decl = src.match(new RegExp(`const\\s+${raw}\\s*=\\s*([^;]+);`));
      if (!decl) throw new Error(`exams.ts: CTFL_V4_FULL.${field} names ${raw}, which is not declared here`);
      return product(decl[1], field);
    }
    return product(raw, field);
  };
  const chapters = [...body.matchAll(/\{\s*chapter:\s*(\d)\s*,\s*topic:\s*"[^"]*"\s*,\s*count:\s*(\d+)\s*\}/g)]
    .map((m) => ({ chapter: Number(m[1]), count: Number(m[2]) }));
  return {
    passPct: num("passPct"),
    durationSec: num("durationSec"),
    extraTimeSec: num("extraTimeSec"),
    chapters,
  };
}

const authored = authoredFullExam();

for (const field of ["passPct", "durationSec", "extraTimeSec"]) {
  assert(
    `exams.ts CTFL_V4_FULL.${field} matches the published CTFL v4.0 exam structure`,
    authored[field] === PUBLISHED_CTFL_V4[field],
    `authored ${authored[field]}, published ${PUBLISHED_CTFL_V4[field]}`,
  );
}
const authoredSplit = authored.chapters.map((c) => `${c.chapter}:${c.count}`).join(" ");
const publishedSplit = PUBLISHED_CTFL_V4.chapters.map((c) => `${c.chapter}:${c.count}`).join(" ");
assert(
  "exams.ts CTFL_V4_FULL per-chapter weights match the published CTFL v4.0 exam structure",
  authoredSplit === publishedSplit,
  `authored ${authoredSplit}, published ${publishedSplit}`,
);
const publishedTotal = PUBLISHED_CTFL_V4.chapters.reduce((n, c) => n + c.count, 0);
assert(
  "the published per-chapter weights total 40 questions",
  publishedTotal === 40,
  `they total ${publishedTotal}`,
);
for (const c of PUBLISHED_CTFL_V4.chapters) {
  const kTotal = c.k.K1 + c.k.K2 + c.k.K3;
  assert(
    `published chapter ${c.chapter}: K-level split totals its question count`,
    kTotal === c.count,
    `K1 ${c.k.K1} + K2 ${c.k.K2} + K3 ${c.k.K3} = ${kTotal}, count ${c.count}`,
  );
}

// The simulations run against what the app ships, not against the table above —
// the table is the guard, `exams.ts` is the subject. If the two disagree the
// assertions above have already failed and this is running on the real weights.
const FULL_EXAM_CHAPTERS = authored.chapters;
const PASS_PCT = authored.passPct;
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
// Pool sizes and objective coverage — asserted since A-10d's sixth slice
// ---------------------------------------------------------------------------
//
// These two were *reported* for five slices, deliberately: a build that fails
// on content the team is halfway through writing gets muted, and muting this
// script would have cost the guessing assertions above along with it. A-10d's
// sixth slice closed the last of the pools, so as of then every chapter is at
// or above 5x its blueprint draw and all 64 learning objectives have a
// question. Both become ratchets at that point — the plan's §8 says to make
// this switch the moment the numbers allow, because what they now protect is
// the reverse of what they measured: not "write more", but "do not delete the
// coverage someone spent five slices writing".
//
// A pool below its multiplier means the same questions recur across papers — at
// 12 questions for chapter 1's 8-question draw, two papers shared two thirds of
// their chapter 1 content, which makes a second sitting a memory test.
//
// A-10d's seventh slice raised the multiplier to 7x for chapters 4 and 5, which
// is the answer to the plan's old "-300 questions" line. 5x everywhere yields
// 200 and reaching 300 uniformly would mean padding chapter 6, which has two
// learning objectives and cannot spread past them. So the multiplier follows
// the draw instead: chapters 4 and 5 take 11 and 9 of the paper's 40 questions
// between them, half the paper, and at 5x two sittings still overlapped by
// about a fifth in each. The number is per chapter rather than global for the
// same reason the pool rule is a multiple of the draw rather than a flat count.
const POOL_MULTIPLIER = { 4: 7, 5: 7 };
const DEFAULT_POOL_MULTIPLIER = 5;
const poolTarget = (c) => c.count * (POOL_MULTIPLIER[c.chapter] ?? DEFAULT_POOL_MULTIPLIER);

const perChapter = {};
for (const q of bank) perChapter[q.chapter] = (perChapter[q.chapter] ?? 0) + 1;
const thin = FULL_EXAM_CHAPTERS.filter((c) => (perChapter[c.chapter] ?? 0) < poolTarget(c))
  .map((c) => `ch${c.chapter} ${perChapter[c.chapter] ?? 0}/${poolTarget(c)}`)
  .join(", ");
assert(
  "every chapter's pool is at least its multiple of what the blueprint draws from it",
  thin === "",
  `${thin} — a paper drawing n questions from a pool short of its multiple of n repeats itself across attempts`,
);
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

// A-10e: which learning objectives nobody has written a question for. The
// sharper of the two measures — a chapter can look well stocked and still leave
// half its objectives untested, which is exactly what chapter 1's original 12
// questions did (5 on the seven principles, 0 on testware). Asserted from
// A-10d's sixth slice, when the last of the 64 got its first question.
const refCounts = new Map();
for (const q of bank) refCounts.set(q.syllabusRef, (refCounts.get(q.syllabusRef) ?? 0) + 1);
const uncovered = SYLLABUS_OBJECTIVES.filter((o) => !refCounts.has(o.id));
assert(
  "every learning objective has at least one question",
  uncovered.length === 0,
  `${uncovered.length} with none: ${uncovered.map((o) => o.id).join(", ")} — a candidate can be examined on any of the 64`,
);
const uncoveredByChapter = FULL_EXAM_CHAPTERS.map((c) => {
  const total = SYLLABUS_OBJECTIVES.filter((o) => o.chapter === c.chapter).length;
  const missing = uncovered.filter((o) => o.chapter === c.chapter).length;
  return `ch${c.chapter} ${total - missing}/${total}`;
}).join(", ");

// A-10d's eighth slice: depth per objective, which is the measure the coverage
// assertion above cannot see. "At least one question" was the right bar while
// 17 objectives had none, but it is satisfied by an objective a paper can only
// ever ask about one way — and a candidate who has drilled the bank meets that
// question knowing the answer rather than the material. `FL-5.2.4` and
// `FL-5.3.3` each sat at one question through six slices for exactly that
// reason: nothing was counting past zero.
//
// Three is deliberately modest. It is what makes two sittings differ on an
// objective rather than what makes the objective well covered — the draw-heavy
// chapters run far above it (chapter 4's black-box objectives carry 9 each).
// Raising this floor is the lever if the bank is ever to grow again; it points
// effort at the objectives that are thin rather than at the chapters that are
// easy to write for, which is the lesson of the fifth slice restated.
const OBJECTIVE_DEPTH_FLOOR = 3;
const shallow = SYLLABUS_OBJECTIVES.filter(
  (o) => (refCounts.get(o.id) ?? 0) < OBJECTIVE_DEPTH_FLOOR,
);
assert(
  `every learning objective has at least ${OBJECTIVE_DEPTH_FLOOR} questions`,
  shallow.length === 0,
  `${shallow.length} below the floor: ${shallow
    .map((o) => `${o.id} ${refCounts.get(o.id) ?? 0}`)
    .join(", ")} — a paper can only ask about these one way, so drilling the bank beats learning the objective`,
);
const depthCounts = SYLLABUS_OBJECTIVES.map((o) => refCounts.get(o.id) ?? 0);
const depthSummary = `min ${Math.min(...depthCounts)}, median ${
  [...depthCounts].sort((a, b) => a - b)[Math.floor(depthCounts.length / 2)]
}, max ${Math.max(...depthCounts)}`;

if (failed > 0) {
  console.error(`academy-bank-check: FAILED (${failed} assertion(s))`);
  process.exit(1);
}
console.log(
  `academy-bank-check: OK (${bank.length} questions, first-choice guessing scores ` +
    `${guessRate.toFixed(1)}% and passes ${papersPassed}/${SEEDS} papers)`,
);
console.log(
  `academy-bank-check: pools below their blueprint multiple (7x ch4/ch5, 5x elsewhere): ` +
    `${thin || "none"}; multi-answer questions: ${multiCount}`,
);
console.log(
  `academy-bank-check: learning objectives with at least one question, per chapter: ` +
    `${uncoveredByChapter}${
      uncovered.length ? ` — untested: ${uncovered.map((o) => o.id).join(", ")}` : ""
    }; questions per objective: ${depthSummary} (floor ${OBJECTIVE_DEPTH_FLOOR})`,
);
console.log(
  `academy-bank-check: longest-choice guessing scores ${longestRate.toFixed(1)}% ` +
    `(ceiling ${LONGEST_CEILING_PCT}%) and passes ${longestPapersPassed}/${SEEDS} papers; ` +
    `per chapter, the longest choice is the answer in ${lengthDebt}`,
);
