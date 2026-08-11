// A-04b: the five sandbox task checkers, as pure functions.
//
// Plain ESM, not TypeScript, on purpose — same reasoning as src/lib/backup-core.mjs:
// `scripts/academy-checks-selftest.mjs` runs these under bare `node`, with no TS
// loader and no database, so the good/bad-submission unit tests docs/QA-ACADEMY.md
// §9 asks for can run in a few milliseconds as part of `npm run build`.
// `src/lib/academy/checks.ts` is the typed wrapper that fetches real rows from the
// sandbox project and hands them to the function with the matching lesson slug —
// it is the only thing that touches the database.
//
// Every checker takes an array of plain objects shaped like the Prisma rows
// (never a live `db` handle) and returns `{ passed, feedback: string[] }`.
// Per docs/QA-ACADEMY.md §6.2 and §9: forgiving about wording, strict about
// structure. Feedback always says what's missing, never just "wrong" — a
// checker that can't explain itself destroys trust in one interaction.

/** @typedef {{ passed: boolean, feedback: string[] }} CheckResult */

function parseSteps(stepsJson) {
  try {
    const parsed = JSON.parse(stepsJson ?? "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function caseText(c) {
  const steps = parseSteps(c.stepsJson);
  const stepsText = steps
    .map((s) => `${s.action ?? ""} ${s.expected ?? ""}`)
    .join(" ");
  return [c.title ?? "", c.preconditions ?? "", stepsText, c.expectedResult ?? ""]
    .join(" ")
    .toLowerCase();
}

function boundaryHits(text, boundaries) {
  return boundaries.filter((b) => new RegExp(`(?<!\\d)${b}(?!\\d)`).test(text));
}

const QUANTITY_BOUNDARIES = ["0", "1", "99", "100"];

// ---------------------------------------------------------------------------
// writing-test-cases — Checkout suite, per the lesson's own worked example.
// ---------------------------------------------------------------------------

function scoreCaseAnatomy(info) {
  return (info.steps.length >= 3 ? 1 : 0) + (info.expectedOk ? 1 : 0) + info.hits.length;
}

/** @param {object[]} cases @returns {CheckResult} */
export function checkWritingTestCases(cases) {
  if (cases.length === 0) {
    return {
      passed: false,
      feedback: [
        "No case found in the Checkout suite yet. Create the quantity case from the worked example.",
      ],
    };
  }
  let best = null;
  for (const c of cases) {
    const steps = parseSteps(c.stepsJson);
    const text = caseText(c);
    const hits = boundaryHits(text, QUANTITY_BOUNDARIES);
    const info = { c, steps, hits, expectedOk: Boolean(c.expectedResult?.trim()) };
    if (!best || scoreCaseAnatomy(info) > scoreCaseAnatomy(best)) best = info;
    if (steps.length >= 3 && info.expectedOk && hits.length >= 2) {
      return {
        passed: true,
        feedback: [
          `"${c.title}" has ${steps.length} steps, a clear expected result, and names boundary value(s) ${hits.join(", ")}.`,
        ],
      };
    }
  }
  const feedback = [];
  if (best.steps.length < 3) {
    feedback.push(`"${best.c.title}" has only ${best.steps.length} step(s) — aim for at least 3.`);
  }
  if (!best.expectedOk) feedback.push("Add a specific, observable expected result.");
  if (best.hits.length < 2) {
    feedback.push(
      `Name at least two boundary values (0, 1, 99, 100) — found ${best.hits.length ? best.hits.join(", ") : "none"}.`,
    );
  }
  return { passed: false, feedback };
}

// ---------------------------------------------------------------------------
// boundary-value-analysis — Cart suite, the same field the reference case
// (seeded by the fixture) lives next to.
// ---------------------------------------------------------------------------

/** @param {object[]} cases @returns {CheckResult} */
export function checkBva(cases) {
  if (cases.length === 0) {
    return {
      passed: false,
      feedback: ["No case found in the Cart suite yet. Write the quantity boundary cases there."],
    };
  }
  let best = null;
  for (const c of cases) {
    const steps = parseSteps(c.stepsJson);
    const text = caseText(c);
    const hits = boundaryHits(text, QUANTITY_BOUNDARIES);
    const info = { c, steps, hits, expectedOk: Boolean(c.expectedResult?.trim()) };
    if (!best || info.hits.length > best.hits.length) best = info;
    // 99 — the upper *valid* edge — is required, not just "any three of four":
    // it is the one the lesson names as the likeliest to be wrongly rejected,
    // and a checker that accepts 0/1/100 without it would pass the exact gap
    // the lesson exists to close.
    if (steps.length >= 3 && info.expectedOk && hits.length >= 3 && hits.includes("99")) {
      return {
        passed: true,
        feedback: [`"${c.title}" covers boundary value(s) ${hits.join(", ")} with a clear expected result.`],
      };
    }
  }
  const feedback = [];
  const missing = QUANTITY_BOUNDARIES.filter((b) => !best.hits.includes(b));
  if (best.steps.length < 3) {
    feedback.push(`"${best.c.title}" has only ${best.steps.length} step(s) — aim for at least 3.`);
  }
  if (!best.expectedOk) feedback.push("Add a clear expected result.");
  if (missing.includes("99")) {
    feedback.push(
      `You covered ${best.hits.length ? best.hits.join(", ") : "none of the four boundaries"} but not 99 — the upper valid boundary is the one most likely to be wrongly rejected.`,
    );
  } else if (missing.length) {
    feedback.push(`Still missing: ${missing.join(", ")}.`);
  }
  return { passed: false, feedback };
}

// ---------------------------------------------------------------------------
// equivalence-partitioning — Checkout suite, the discount-code field.
// ---------------------------------------------------------------------------

const EP_PARTITIONS = [
  { id: "valid", label: "a valid code (6–10 letters/digits)", re: /\bvalid\b/i },
  {
    id: "too-short",
    label: "a too-short code",
    re: /too\s*short|shorter than\s*6|under\s*6\b|\b[1-5]\s*-?\s*char/i,
  },
  {
    id: "too-long",
    label: "a too-long code",
    re: /too\s*long|longer than\s*10|over\s*10\b|\b(1[1-9]|[2-9]\d)\s*-?\s*char/i,
  },
  {
    id: "invalid-chars",
    label: "a code with a disallowed character",
    re: /symbol|special char|non-?alphanumeric|punctuation|disallowed char|invalid char/i,
  },
  { id: "expired", label: "an expired code", re: /expired/i },
];

/** @param {object[]} cases @returns {CheckResult} */
export function checkEquivalencePartitioning(cases) {
  if (cases.length === 0) {
    return {
      passed: false,
      feedback: ["No case found in the Checkout suite yet. Write at least three, one per partition."],
    };
  }
  const hit = new Set();
  for (const c of cases) {
    const text = caseText(c);
    for (const p of EP_PARTITIONS) if (p.re.test(text)) hit.add(p.id);
  }
  const wellFormed = cases.filter((c) => {
    const steps = parseSteps(c.stepsJson);
    return steps.length >= 1 && Boolean(c.expectedResult?.trim());
  }).length;

  const feedback = [];
  if (wellFormed < Math.min(3, cases.length)) {
    feedback.push("Some cases are missing steps or an expected result — every case needs both.");
  }
  if (hit.size < 3) {
    const missing = EP_PARTITIONS.filter((p) => !hit.has(p.id)).map((p) => p.label);
    feedback.push(
      `Only ${hit.size} of the discount-code partitions show up in your cases (need at least 3). Still missing, e.g.: ${missing.slice(0, 3).join(", ")}.`,
    );
  }
  if (feedback.length === 0) {
    return {
      passed: true,
      feedback: [`${hit.size} distinct partitions are represented across your ${cases.length} case(s).`],
    };
  }
  return { passed: false, feedback };
}

// ---------------------------------------------------------------------------
// decision-tables — Checkout suite, the shipping rule (§6 of the fixture).
// ---------------------------------------------------------------------------

const MEMBER_RE = /member/i;
const INTL_RE = /international/i;
const AMOUNT_RE = /rp\s?500[.,]?000|500[.,]?000|500k/i;
const AMBIGUITY_RE =
  /\?|ambigu|contradict|clarif|\braise\b|\bflag\b|confirm with|product owner|not defined|undefined|\btbd\b|doesn't say|does not say|unclear/i;

/** @param {object[]} cases @returns {CheckResult} */
export function checkDecisionTables(cases) {
  const feedback = [];
  if (cases.length < 6) {
    feedback.push(
      `You have ${cases.length} case(s); the shipping rule has 8 rule combinations (over/under Rp 500,000 × member/non-member × domestic/international) — aim for at least 6.`,
    );
  }
  const texts = cases.map(caseText);
  const memberHits = texts.filter((t) => MEMBER_RE.test(t)).length;
  const intlHits = texts.filter((t) => INTL_RE.test(t)).length;
  const amountHits = texts.filter((t) => AMOUNT_RE.test(t)).length;
  if (memberHits < 2) feedback.push("Fewer than two cases mention membership — cover both member and non-member.");
  if (intlHits < 2) feedback.push("Fewer than two cases mention international vs domestic addresses.");
  if (amountHits < 2) feedback.push("Fewer than two cases reference the Rp 500,000 threshold.");

  const ambiguityCovered = texts.some(
    (t) => MEMBER_RE.test(t) && INTL_RE.test(t) && AMBIGUITY_RE.test(t),
  );
  if (!ambiguityCovered) {
    feedback.push(
      "No case raises the member + international combination as unresolved — \"members always get free shipping\" and \"international never does\" contradict each other there. Flag it rather than guessing an answer.",
    );
  }

  if (feedback.length === 0) {
    return {
      passed: true,
      feedback: [
        `${cases.length} cases cover membership, the international rule and the Rp 500,000 threshold, and the member + international contradiction is flagged rather than guessed at.`,
      ],
    };
  }
  return { passed: false, feedback };
}

// ---------------------------------------------------------------------------
// bug-reports — a Defect, not a TestCase (no suite; graded on the body text).
// ---------------------------------------------------------------------------

function rankDefect(info) {
  return info.signals + (info.titleOk ? 1 : 0) + (info.bodyLong ? 1 : 0);
}

/** @param {object[]} defects @returns {CheckResult} */
export function checkBugReport(defects) {
  if (defects.length === 0) {
    return {
      passed: false,
      feedback: ['No defect filed yet. Use "Report a defect" on the Defects tab.'],
    };
  }
  let best = null;
  for (const d of defects) {
    const body = d.bodyMd ?? "";
    const titleWords = d.title.trim().split(/\s+/).filter(Boolean).length;
    const hasEnvironment = /environment|build|browser|version/i.test(body);
    const hasSteps = /steps?\s*to\s*reproduce|\n\s*1[.)]/i.test(body);
    const hasActual = /actual/i.test(body);
    const hasExpected = /expected/i.test(body);
    const signals = [hasEnvironment, hasSteps, hasActual, hasExpected].filter(Boolean).length;
    const titleOk = titleWords >= 4 && d.title.trim().length >= 15;
    const bodyLong = body.trim().length >= 120;
    const info = { d, signals, titleOk, bodyLong };
    if (!best || rankDefect(info) > rankDefect(best)) best = info;
    if (titleOk && bodyLong && signals >= 3) {
      return {
        passed: true,
        feedback: [
          `"${d.title}" reads like a report a developer could act on — it has ${signals} of the four key sections and a specific title.`,
        ],
      };
    }
  }
  const feedback = [];
  if (!best.titleOk) {
    feedback.push(
      'Give the title three parts: what happens, where, under what condition — "bug" or "Checkout broken" isn\'t enough.',
    );
  }
  if (!best.bodyLong) {
    feedback.push("The report is thin — add environment, steps to reproduce, an actual result and an expected result.");
  } else {
    const body = best.d.bodyMd ?? "";
    if (!/environment|build|browser|version/i.test(body)) feedback.push("Add an Environment line — build/version, browser, account.");
    if (!/steps?\s*to\s*reproduce|\n\s*1[.)]/i.test(body)) feedback.push("Number the steps to reproduce.");
    if (!/actual/i.test(body)) feedback.push("State the Actual result — what you saw, quoted exactly.");
    if (!/expected/i.test(body)) feedback.push("State the Expected result, tied to a requirement.");
  }
  return { passed: false, feedback };
}

// ---------------------------------------------------------------------------

/** Keyed by lesson slug — same key `src/content/academy/sandbox.ts` uses for
 *  `SANDBOX_TASKS`, so `checks.ts` can look up both with one string. */
export const CASE_CHECKERS = {
  "writing-test-cases": checkWritingTestCases,
  "boundary-value-analysis": checkBva,
  "equivalence-partitioning": checkEquivalencePartitioning,
  "decision-tables": checkDecisionTables,
};

export const DEFECT_CHECKERS = {
  "bug-reports": checkBugReport,
};
