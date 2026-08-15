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
// A-11a: share targets. Takes the project's `PublicShare` row or null.
// ---------------------------------------------------------------------------

/**
 * T4 `portfolio`. The exercise is "publish your sandbox and read it as a
 * stranger", so the only machine-checkable half is which sections are on.
 *
 * Feedback names the sections still off rather than reporting a bare failure,
 * and it never claims the portfolio is *good* — a checker that said so would
 * be overstating what a boolean can tell you.
 *
 * @param {{ enabled: boolean, showCases: boolean, showRuns: boolean, showReports: boolean } | null} share
 * @returns {CheckResult}
 */
export function checkPortfolioShare(share) {
  if (!share || !share.enabled) {
    return {
      passed: false,
      feedback: [
        "Public sharing is still off. Open Settings → Public sharing in your sandbox project and turn on the master toggle.",
      ],
    };
  }

  const off = [];
  if (!share.showCases) off.push("Test Cases");
  if (!share.showRuns) off.push("Runs");
  if (!share.showReports) off.push("Reports");

  // Cases is the one that decides pass/fail: a public project with no case
  // browser is an empty page with a description on it, which is not a
  // portfolio. Runs and Reports are strongly advised and reported as such.
  if (!share.showCases) {
    return {
      passed: false,
      feedback: [
        `Sharing is on, but these sections are off: ${off.join(", ")}.`,
        "Test Cases is the one a reviewer opens first — without it the public page shows a description and two counters.",
      ],
    };
  }

  if (off.length) {
    return {
      passed: true,
      feedback: [
        "Published, and your cases are visible — that is the exercise.",
        `Still off: ${off.join(", ")}. Cases show that you can design; runs show that you executed and maintained them, which is the half most portfolios are missing.`,
        "Now open the public URL logged out and score yourself on the sixty-second pass in the lesson.",
      ],
    };
  }

  return {
    passed: true,
    feedback: [
      "Published with cases, runs and reports visible.",
      "The checker can only see which sections are on. Whether the page is worth opening is the part you have to judge — open it in a private window and read it as a stranger.",
    ],
  };
}

// ---------------------------------------------------------------------------
// A-11b: session, plan and dashboard targets.
// ---------------------------------------------------------------------------

/**
 * A charter names a *target*, an *approach*, and the *information* it is
 * hunting for — the lesson's own "explore X with Y to discover Z" shape, and
 * its self-check turns on exactly that third part. Matched loosely, per §6.2's
 * rule: forgiving about wording, strict about structure. Requiring the literal
 * words would fail "Poke at the discount code field using expired and
 * malformed codes, looking for ways to get a discount I should not have",
 * which is a better charter than most that would pass a keyword match.
 */
const CHARTER_PURPOSE_RE =
  /\b(to discover|to find|to learn|looking for|hunting|in order to|so as to|find out|uncover|identify|to see (?:if|whether|how)|to check (?:if|whether|how)|to understand|risk|ways? to)\b/i;
const CHARTER_APPROACH_RE =
  /\b(with|using|via|through|by|explore|exploring|probe|probing|poke|poking|attack|attacking|try|trying|vary|varying)\b/i;

/**
 * T2 `exploratory-testing`. The exercise is "run one real session, and turn
 * what you find into a defect and at least one case" — every clause of which
 * is a column.
 *
 * @param {{ charter: string, timeboxMinutes: number|null, status: string,
 *           notes: { kind: string, convertedType: string|null }[] }[]} sessions
 * @returns {CheckResult}
 */
export function checkExploratorySession(sessions) {
  if (!sessions.length) {
    return {
      passed: false,
      feedback: [
        "No session found. Open Sessions in your sandbox and start one — the charter is the first thing it asks you for.",
      ],
    };
  }

  // Grade the learner's best attempt rather than their most recent one: a
  // second session started to re-read the form must not fail the exercise the
  // first one already satisfied.
  const ranked = [...sessions].sort((a, b) => rankSession(b) - rankSession(a));
  const s = ranked[0];
  const notes = s.notes ?? [];
  const missing = [];

  const charter = (s.charter ?? "").trim();
  if (charter.length < 40) {
    missing.push(
      `The charter is ${charter.length} characters. A charter that fits in a tweet is usually a page name — say what you are exploring, how, and what you are hunting for.`,
    );
  } else if (!CHARTER_PURPOSE_RE.test(charter)) {
    missing.push(
      'The charter names what you will look at but not what you are hunting for. "Explore X with Y" is a destination; the part that ends a session well is "…to discover Z".',
    );
  } else if (!CHARTER_APPROACH_RE.test(charter)) {
    missing.push(
      "The charter names a target and a purpose but no approach — the resources, data or attack you will use to get there.",
    );
  }

  if (!s.timeboxMinutes) {
    missing.push("No timebox set. The clock is what makes the session a countable unit rather than an afternoon.");
  }
  if (s.status !== "ENDED") {
    missing.push(
      "The session is still open. End it — an unfinished session has no coverage statement, which is the half a release report actually needs.",
    );
  }

  if (notes.length < 3) {
    missing.push(
      `Only ${notes.length} note${notes.length === 1 ? "" : "s"}. Take at least 3 as you go — notes written afterwards are a summary, and the exact input you used is the part that gets lost.`,
    );
  }
  if (!notes.some((n) => n.kind === "BUG")) {
    missing.push('No note marked BUG. Mark the findings as you hit them — "b" while the session runs.');
  }
  if (!notes.some((n) => n.convertedType)) {
    missing.push(
      'No note converted yet. "Convert to case" on a note is the step that makes the repeatable findings survive into the next release.',
    );
  }

  if (missing.length) return { passed: false, feedback: missing };

  return {
    passed: true,
    feedback: [
      "A charter, a clock, notes, and a finding that outlived the session — that is a session that counts as work.",
      "What the checker cannot see is whether the charter was worth an hour. The lesson's own test: could someone else read it and tell you the session went badly? If not, it was a to-do, not a charter.",
    ],
  };
}

/** Score a session by how much of the exercise it satisfies, so the best
 *  attempt is the one graded and the feedback describes it. */
function rankSession(s) {
  const notes = s.notes ?? [];
  return (
    (s.status === "ENDED" ? 8 : 0) +
    (notes.some((n) => n.convertedType) ? 4 : 0) +
    (notes.some((n) => n.kind === "BUG") ? 2 : 0) +
    Math.min(notes.length, 3) / 3 +
    ((s.charter ?? "").trim().length >= 40 ? 1 : 0)
  );
}

/**
 * The worked example's section shape. Matched on any two, because the lesson's
 * argument is that the page is short and honest, not that it uses these
 * headings — and because "Not covered" is the section it says matters most,
 * which is a prose judgement no checker should pretend to make.
 */
const PLAN_SECTIONS = [
  { name: "scope", re: /\b(in scope|scope)\b/i },
  { name: "what is not covered", re: /\b(not cover(?:ed|ing)?|out of scope|excluded?|exclusions?|won'?t test|not test(?:ed|ing)?)\b/i },
  { name: "risks", re: /\brisks?\b/i },
  { name: "environment", re: /\b(environment|staging|accounts?|test data)\b/i },
  { name: "entry criteria", re: /\bentry\b/i },
  { name: "exit criteria", re: /\bexit\b/i },
];

/**
 * T2 `test-planning`. Weakest of the six by design, and the feedback says so:
 * a plan's quality lives in its "Not covered" section, and no checker can grade
 * prose. What *is* checkable is the lesson's own structural claim — that scope
 * stops being prose and starts being a list you can count.
 *
 * **`linkedCaseIds` is not a plan→case relation.** There isn't one: `TestPlan`
 * holds `runs`, a run holds `results`, and a result references a case. A-11's
 * table said "`TestPlan` + its linked cases", which reads like a column and is
 * not — `checks.ts` walks the two hops and passes the distinct ids in.
 *
 * Takes every plan created since the panel opened and grades the best of them,
 * for the same reason `checkExploratorySession` does: a second plan started to
 * re-read the form must not fail the exercise the first one satisfied.
 *
 * @param {{ description: string|null, linkedCaseIds: string[] }[]} plans
 * @returns {CheckResult}
 */
export function checkTestPlan(plans) {
  const plan = [...(plans ?? [])].sort(
    (a, b) =>
      (b.linkedCaseIds?.length ?? 0) - (a.linkedCaseIds?.length ?? 0) ||
      (b.description ?? "").length - (a.description ?? "").length,
  )[0];
  if (!plan) {
    return {
      passed: false,
      feedback: [
        "No test plan found. Open Plans in your sandbox and create one — the guest-checkout example in the lesson is fifteen lines, and that is the target.",
      ],
    };
  }

  const description = (plan.description ?? "").trim();
  const found = PLAN_SECTIONS.filter((s) => s.re.test(description));
  const missing = [];

  if (description.length < 80) {
    missing.push(
      "The plan has no real description yet. The plan *is* the description — scope, what is not covered, risks, entry and exit, on one page.",
    );
  } else if (found.length < 4) {
    const absent = PLAN_SECTIONS.filter((s) => !s.re.test(description)).map((s) => s.name);
    missing.push(
      `The description is missing: ${absent.join(", ")}. The worked example carries all of them in fifteen lines.`,
    );
  }

  const linked = plan.linkedCaseIds?.length ?? 0;
  if (linked < 3) {
    missing.push(
      `${linked === 0 ? "No cases are" : `Only ${linked} case${linked === 1 ? " is" : "s are"}`} attached to this plan. Create a run under it and pick at least 3 of the cases you have already written — that is the step that turns scope into something you can count.`,
    );
  }

  if (missing.length) return { passed: false, feedback: missing };

  return {
    passed: true,
    feedback: [
      `A plan with the sections that matter and ${linked} cases attached to it. Exit criteria can now read off the run instead of off somebody's memory.`,
      "Read honestly: this checked the structure, not the thinking. Whether your \"Not covered\" list is the one a reviewer would argue with is the part that decides if the page was worth writing — and it is the section the lesson says to defend hardest.",
    ],
  };
}

/**
 * T2 `metrics-that-mean-something`. The exercise is *at most* five numbers, so
 * the ceiling is the graded half and a checker that enforced only a floor would
 * invert the lesson.
 *
 * What cannot be checked, and the feedback says so: the widget types are
 * `passRateTrend | statusPie | coverageBar | flakyList | runVelocity |
 * textNote`, so there is **no raw case-count widget** for the lesson's "resist
 * putting the case count on the dashboard" warning to catch. The count bound is
 * checkable; the reasoning behind each number is not.
 *
 * @param {{ name: string, widgetCount: number }[]} dashboards
 * @returns {CheckResult}
 */
export function checkMetricsDashboard(dashboards) {
  const built = (dashboards ?? []).filter((d) => d.widgetCount > 0);
  if (!built.length) {
    return {
      passed: false,
      feedback: [
        (dashboards ?? []).length
          ? "The dashboard is empty. Add the numbers you would actually act on — the exercise is the subtraction that follows, not the adding."
          : "No dashboard found. Open Dashboards in your sandbox and create one.",
      ],
    };
  }

  // The learner's best attempt again: an experiment left at seven widgets must
  // not fail an exercise a second, disciplined dashboard already satisfies.
  const within = built.filter((d) => d.widgetCount <= 5);
  if (!within.length) {
    const smallest = built.reduce((a, b) => (a.widgetCount <= b.widgetCount ? a : b));
    return {
      passed: false,
      feedback: [
        `"${smallest.name}" has ${smallest.widgetCount} widgets. The exercise is at most five — and the ceiling is the whole point, because the screen that shows everything is the screen nobody reads.`,
        "Delete until removing one more would cost you a decision. If you cannot say what you would do differently when a number moves, it is not one of your five.",
      ],
    };
  }

  const best = within.reduce((a, b) => (a.widgetCount >= b.widgetCount ? a : b));
  return {
    passed: true,
    feedback: [
      `"${best.name}" holds ${best.widgetCount} widget${best.widgetCount === 1 ? "" : "s"} — inside the five the exercise allows.`,
      "The count is all a checker can see. Whether each one answers a question and drives a decision is yours to defend, and it is the only part that decides whether the screen is worth having.",
      "One thing the product cannot get wrong for you here: there is no raw case-count widget to add, so the lesson's most tempting number is not on offer.",
    ],
  };
}

// ---------------------------------------------------------------------------
// A-11c: run targets — the two CI lessons.
// ---------------------------------------------------------------------------

/**
 * T3 `ci-github-actions` and its capstone `junit-to-testforge`. Both exercises
 * end the same way: a run in the sandbox whose results arrived through
 * `/api/v1/junit`.
 *
 * **The pass bar needed less machinery than it looked like it would.** The
 * eleventh A-08 slice framed the choice as *any run* / *a run with ≥1 matched
 * case* / *a matched run that is also green*, and named the third as a trap —
 * the capstone deliberately asks the learner to produce a 422 and a failing
 * result on the way, so grading on green fails them for following the
 * instructions. Reading `ingestResults()` settles the first two as well: it
 * returns 422 **before** `createRun` when nothing matched, so a run that exists
 * at all already implies at least one matched case. The two predicates are the
 * same one.
 *
 * So: a run created since the panel opened, not `MANUAL` (the schema default,
 * and the only thing the UI's own create action can produce — it sets no
 * `source` at all), carrying at least one result. **No assertion about
 * statuses**, deliberately.
 *
 * @param {{ source: string, origin: string|null, resultCount: number }[]} runs
 * @param {"ci"|"capstone"} variant
 * @returns {CheckResult}
 */
function checkIngestedRun(runs, variant) {
  const ingested = (runs ?? []).filter(
    (r) => r.source && r.source.toUpperCase() !== "MANUAL",
  );
  const withResults = ingested.filter((r) => r.resultCount > 0);

  if (!withResults.length) {
    const manualOnly = (runs ?? []).length > 0 && !ingested.length;
    return {
      passed: false,
      feedback: [
        manualOnly
          ? "There are runs in your sandbox, but they were created by hand. This exercise wants one that arrived through the API — the upload is the part being practised."
          : "No uploaded run found yet. POST your JUnit XML to /api/v1/junit with your sandbox's slug and an API key.",
        "If you got a 422, that is the endpoint telling you nothing matched — no run is created in that case. Add a TC-<SLUG>-<n> annotation to a test name, or make the test name identical to a case title, and upload again.",
      ],
    };
  }

  const best = withResults.reduce((a, b) => (a.resultCount >= b.resultCount ? a : b));
  const feedback = [
    `A run arrived through the API with ${best.resultCount} result${best.resultCount === 1 ? "" : "s"} attached to your cases.`,
  ];

  if (variant === "ci") {
    feedback.push(
      best.origin
        ? `It reports its origin as "${best.origin}".`
        : "It carries no origin. Pass ?origin= on the upload so a run's page says where it came from — six months from now that is the difference between a result you trust and one you re-run.",
      "Worth being straight about: the checker cannot tell a GitHub runner from a curl on your laptop — both are the same POST. What proves the workflow is that it ran without you, on a push you did not babysit.",
    );
  } else {
    feedback.push(
      "That is the loop this whole track was building toward: a test you wrote, producing a result, attached to the case it exercises, with a history that will still be there next month.",
      "Open the run and then the case — the case's history now has an entry. That entry is the thing a spreadsheet of test results has never been able to give you.",
    );
  }

  return { passed: true, feedback };
}

/** @param {object[]} runs @returns {CheckResult} */
export function checkCiRun(runs) {
  return checkIngestedRun(runs, "ci");
}

/** @param {object[]} runs @returns {CheckResult} */
export function checkCapstoneRun(runs) {
  return checkIngestedRun(runs, "capstone");
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

export const SHARE_CHECKERS = {
  portfolio: checkPortfolioShare,
};

export const SESSION_CHECKERS = {
  "exploratory-testing": checkExploratorySession,
};

export const PLAN_CHECKERS = {
  "test-planning": checkTestPlan,
};

export const DASHBOARD_CHECKERS = {
  "metrics-that-mean-something": checkMetricsDashboard,
};

export const RUN_CHECKERS = {
  "ci-github-actions": checkCiRun,
  "junit-to-testforge": checkCapstoneRun,
};
