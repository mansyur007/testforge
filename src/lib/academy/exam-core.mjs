// A-06: the pure half of the exam engine — deterministic seeded drawing and
// grading, with no database, no JWT, no Next.js. Plain ESM, same reasoning as
// checks-core.mjs and backup-core.mjs: scripts/academy-exam-selftest.mjs runs
// this under bare `node`, so the acceptance criteria in docs/QA-ACADEMY.md
// §8 (A-06) — same seed reproduces the same paper, drawn chapter counts match
// the blueprint over 1000 seeded draws — run in milliseconds as part of
// `npm run build`, no test database, no TS loader.
//
// `src/lib/academy/exam.ts` is the thin, `server-only` typed wrapper that
// pulls real questions out of the git-versioned bank and signs/verifies the
// ticket around all of this.

/** xorshift-ish 32-bit hash of a string seed into a PRNG state. */
function seedToState(seed) {
  let h = 1779033703 ^ String(seed).length;
  for (let i = 0; i < String(seed).length; i++) {
    h = Math.imul(h ^ String(seed).charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return h >>> 0;
}

/** mulberry32 — small, fast, deterministic. Same seed → same sequence forever. */
function mulberry32(a) {
  let state = a;
  return function next() {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Deterministic Fisher-Yates: same `seed` always yields the same order. */
export function seededShuffle(items, seed) {
  const rng = mulberry32(seedToState(seed));
  const arr = items.slice();
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Draw a paper: `bank` is `{ id, chapter }[]`, `chapters` is
 * `{ chapter, count }[]` from the blueprint. Returns an array of question ids
 * in the order the paper is presented — chapter-by-chapter internally (so the
 * per-chapter count is exact and testable), then the whole paper is
 * seed-shuffled once more so chapters aren't presented in a fixed block order
 * every time. No repeats, ever, within one paper. Throws if a chapter's bank
 * is smaller than what the blueprint asks for — a content bug, not a runtime
 * one a learner should ever see.
 */
export function drawQuestionIds(bank, chapters, seed) {
  const byChapter = new Map();
  for (const q of bank) {
    const list = byChapter.get(q.chapter) ?? [];
    list.push(q.id);
    byChapter.set(q.chapter, list);
  }

  const picked = [];
  for (const { chapter, count } of chapters) {
    const pool = byChapter.get(chapter) ?? [];
    if (pool.length < count) {
      throw new Error(
        `academy exam: chapter ${chapter} bank has ${pool.length} questions, blueprint needs ${count}`,
      );
    }
    const shuffled = seededShuffle(pool, `${seed}:ch${chapter}`);
    picked.push(...shuffled.slice(0, count));
  }

  return seededShuffle(picked, `${seed}:paper`);
}

/**
 * A-10a: put one paper's questions into the order they are presented in.
 *
 * Only choice order changes — the question order is already decided by
 * `drawQuestionIds`. Position must carry no information: the bank as authored
 * answers `a` or `b` in 66 of its 70 questions and never `d`, so two of the
 * four options are dead on almost every question and a candidate who notices
 * lifts a blind guess from 25% to ~47% by reading the bank rather than the
 * syllabus. Rebalancing the content by hand would fix only the questions that
 * exist today and re-break the moment someone writes the next one with the
 * answer first.
 *
 * Seeded, not random, so an attempt stays reproducible from its ticket — the
 * same property the draw itself has. Lives here, in the pure core, so
 * `scripts/academy-bank-check.mjs` measures the real function rather than a
 * copy of it that could drift.
 */
export function presentPaper(questions, seed) {
  return questions.map((q) => ({
    ...q,
    choices: seededShuffle(q.choices, `${seed}:${q.id}:choices`),
  }));
}

/**
 * `questions` are full bank rows: `{ id, chapter, choices: [{id, correct}] }`.
 * `answers` is `{ [questionId]: string[] }`, exactly what the client posts —
 * nothing about it is trusted beyond "an array of strings". Grading is set
 * equality per choice, same rule as the self-check quizzes (A-02): selecting
 * every choice on a multi-answer question is not a pass.
 */
export function gradeAttempt(questions, answers, passPct) {
  const chapterScores = {};
  const verdicts = [];
  let score = 0;

  for (const q of questions) {
    const want = q.choices.filter((c) => c.correct).map((c) => c.id);
    const got = Array.from(new Set(answers?.[q.id] ?? []));
    const correct =
      want.length === got.length && want.every((id) => got.includes(id));
    if (correct) score++;

    const bucket = chapterScores[q.chapter] ?? { correct: 0, total: 0 };
    bucket.total++;
    if (correct) bucket.correct++;
    chapterScores[q.chapter] = bucket;

    verdicts.push({ id: q.id, correct, correctChoiceIds: want });
  }

  const total = questions.length;
  const passed = total > 0 && score / total >= passPct / 100;
  return { score, total, passed, chapterScores, verdicts };
}

/**
 * The server-authoritative clock check (docs/QA-ACADEMY.md §2.3). Pure
 * arithmetic on the ticket's own signed `startedAt`/`durationSec` against
 * `now` — nothing the client sends is ever consulted here, which is what
 * makes a tampered client-side "elapsed" claim irrelevant: this function
 * doesn't take one as a parameter at all.
 */
export function isLate(startedAtMs, durationSec, nowMs, graceMs) {
  return nowMs > startedAtMs + durationSec * 1000 + graceMs;
}
