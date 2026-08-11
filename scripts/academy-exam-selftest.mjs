// A-06: unit tests for the exam engine's pure core (docs/QA-ACADEMY.md §8's
// A-06 acceptance criteria): the same seed reproduces the same paper, drawn
// chapter counts match the blueprint over 1000 seeded draws, and the
// server-clock check ignores everything except its own signed inputs.
//
// Runs against src/lib/academy/exam-core.mjs directly — no ticket, no
// database, no TS — same shape as scripts/academy-checks-selftest.mjs, wired
// into `prebuild` so `npm run build` covers it with no CI change.
import { drawQuestionIds, gradeAttempt, isLate } from "../src/lib/academy/exam-core.mjs";

let failed = 0;
function assert(name, ok, detail) {
  if (!ok) {
    failed++;
    console.error(`FAIL: ${name}${detail ? ` — ${detail}` : ""}`);
  }
}

// A synthetic bank — 12 questions per chapter, chapters 1-6 — standing in for
// the real content bank so this test never has to import TS content modules.
function makeBank() {
  const bank = [];
  for (let ch = 1; ch <= 6; ch++) {
    for (let i = 1; i <= 12; i++) bank.push({ id: `ch${ch}-q${i}`, chapter: ch });
  }
  return bank;
}

const FULL_EXAM_CHAPTERS = [
  { chapter: 1, count: 8 },
  { chapter: 2, count: 6 },
  { chapter: 3, count: 4 },
  { chapter: 4, count: 11 },
  { chapter: 5, count: 9 },
  { chapter: 6, count: 2 },
];

// ---------------------------------------------------------------------------
// drawQuestionIds
// ---------------------------------------------------------------------------

{
  const bank = makeBank();
  const a = drawQuestionIds(bank, FULL_EXAM_CHAPTERS, "seed-alpha");
  const b = drawQuestionIds(bank, FULL_EXAM_CHAPTERS, "seed-alpha");
  assert(
    "draw: same seed reproduces the same paper",
    JSON.stringify(a) === JSON.stringify(b),
  );

  const c = drawQuestionIds(bank, FULL_EXAM_CHAPTERS, "seed-beta");
  assert(
    "draw: a different seed produces a different paper",
    JSON.stringify(a) !== JSON.stringify(c),
  );

  const total = FULL_EXAM_CHAPTERS.reduce((n, c2) => n + c2.count, 0);
  assert("draw: paper length matches blueprint total", a.length === total, `got ${a.length}, want ${total}`);
  assert("draw: no repeated question ids within one paper", new Set(a).size === a.length);
}

// 1000 seeded draws: every draw's per-chapter count must match the blueprint
// exactly (it's not a statistical distribution claim — the draw function
// picks an exact count per chapter every time, so this is really "no draw
// ever violates its own contract" over a large, varied sample of seeds).
{
  const bank = makeBank();
  let violations = 0;
  for (let i = 0; i < 1000; i++) {
    const ids = drawQuestionIds(bank, FULL_EXAM_CHAPTERS, `seed-${i}`);
    const byChapter = new Map(bank.map((q) => [q.id, q.chapter]));
    const counts = new Map();
    for (const id of ids) counts.set(byChapter.get(id), (counts.get(byChapter.get(id)) ?? 0) + 1);
    for (const { chapter, count } of FULL_EXAM_CHAPTERS) {
      if ((counts.get(chapter) ?? 0) !== count) violations++;
    }
  }
  assert("draw: chapter counts match blueprint over 1000 seeded draws", violations === 0, `${violations} violations`);
}

{
  let threw = false;
  try {
    drawQuestionIds(
      [{ id: "ch1-q1", chapter: 1 }],
      [{ chapter: 1, count: 5 }],
      "seed",
    );
  } catch {
    threw = true;
  }
  assert("draw: throws when a chapter's bank is smaller than the blueprint needs", threw);
}

// ---------------------------------------------------------------------------
// gradeAttempt
// ---------------------------------------------------------------------------

{
  const questions = [
    { id: "q1", chapter: 1, choices: [{ id: "a", correct: true }, { id: "b", correct: false }] },
    { id: "q2", chapter: 1, choices: [{ id: "a", correct: false }, { id: "b", correct: true }] },
    {
      id: "q3",
      chapter: 2,
      choices: [
        { id: "a", correct: true },
        { id: "b", correct: true },
        { id: "c", correct: false },
      ],
    },
  ];

  const perfect = gradeAttempt(
    questions,
    { q1: ["a"], q2: ["b"], q3: ["a", "b"] },
    65,
  );
  assert("grade: full marks scores 3/3", perfect.score === 3 && perfect.total === 3);
  assert("grade: full marks passes at 65%", perfect.passed === true);
  assert(
    "grade: chapter scores split correctly",
    perfect.chapterScores["1"].correct === 2 &&
      perfect.chapterScores["1"].total === 2 &&
      perfect.chapterScores["2"].correct === 1 &&
      perfect.chapterScores["2"].total === 1,
  );

  const overselect = gradeAttempt(questions, { q1: ["a"], q2: ["b"], q3: ["a", "b", "c"] }, 65);
  assert(
    "grade: selecting every choice on a multi-answer question is not a pass for that question",
    overselect.verdicts.find((v) => v.id === "q3").correct === false,
  );
  assert("grade: partial credit still scores the other two", overselect.score === 2);

  const blank = gradeAttempt(questions, {}, 65);
  assert("grade: no answers at all scores 0", blank.score === 0);
  assert("grade: 0/3 does not pass", blank.passed === false);

  const belowPass = gradeAttempt(questions, { q1: ["a"] }, 65);
  assert(
    "grade: 1/3 (33%) does not clear a 65% pass mark",
    belowPass.passed === false,
  );
}

// ---------------------------------------------------------------------------
// isLate — the server-clock check. No client-supplied "elapsed" value is
// ever a parameter, which is the point: there is nothing for a tampered
// client clock to influence.
// ---------------------------------------------------------------------------

{
  const startedAt = 1_000_000;
  const durationSec = 3600;
  const graceMs = 30_000;

  assert(
    "isLate: false well within the duration",
    isLate(startedAt, durationSec, startedAt + 10_000, graceMs) === false,
  );
  assert(
    "isLate: false right at the edge of the grace window",
    isLate(startedAt, durationSec, startedAt + durationSec * 1000 + graceMs - 1, graceMs) === false,
  );
  assert(
    "isLate: true once past duration + grace",
    isLate(startedAt, durationSec, startedAt + durationSec * 1000 + graceMs + 1, graceMs) === true,
  );
}

if (failed > 0) {
  console.error(`academy-exam-selftest: FAILED (${failed} assertion(s))`);
  process.exit(1);
}
console.log("academy-exam-selftest: OK (draw determinism, 1000 seeded draws, grading, server-clock check)");
