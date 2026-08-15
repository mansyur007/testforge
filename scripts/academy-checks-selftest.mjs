// A-04b: unit tests for the Academy sandbox task checkers, over a handful of
// good and bad submissions per checker (docs/QA-ACADEMY.md §6.2, §9 —
// "Checker brittleness is the sharpest product risk. Every checker ships with
// unit tests over real good/bad submissions.").
//
// Runs against `src/lib/academy/checks-core.mjs` directly — the pure functions,
// no database — so this executes in milliseconds under bare `node` as part of
// `npm run build`, the same shape as scripts/totp-selftest.mjs. The typed
// wrapper (`checks.ts`) that fetches real rows and calls these is exercised by
// the sandbox e2e specs instead, where a database is actually available.
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import {
  checkWritingTestCases,
  checkBva,
  checkEquivalencePartitioning,
  checkDecisionTables,
  checkBugReport,
  checkPortfolioShare,
  checkExploratorySession,
  checkTestPlan,
  checkMetricsDashboard,
  checkCiRun,
  checkCapstoneRun,
} from "../src/lib/academy/checks-core.mjs";

let failed = 0;

function assert(name, result, wantPassed) {
  if (result.passed !== wantPassed) {
    failed++;
    console.error(`FAIL: ${name}`);
    console.error(`  expected passed=${wantPassed}, got passed=${result.passed}`);
    console.error(`  feedback: ${JSON.stringify(result.feedback)}`);
  } else if (!result.feedback?.length) {
    failed++;
    console.error(`FAIL: ${name} — passed=${result.passed} but feedback[] is empty`);
  }
}

function tcase({ title, preconditions = "", steps = [], expectedResult = "" }) {
  return { title, preconditions, stepsJson: JSON.stringify(steps), expectedResult };
}

// ---------------------------------------------------------------------------
// writing-test-cases
// ---------------------------------------------------------------------------

assert(
  "writing-test-cases: empty suite fails",
  checkWritingTestCases([]),
  false,
);

assert(
  "writing-test-cases: vague one-liner fails",
  checkWritingTestCases([
    tcase({ title: "Test quantity", steps: [{ action: "try stuff", expected: "" }] }),
  ]),
  false,
);

assert(
  "writing-test-cases: the lesson's own worked example passes",
  checkWritingTestCases([
    tcase({
      title: "Checkout — quantity above maximum (100) is rejected",
      preconditions: "Cart contains 1 x Kaos Polos",
      steps: [
        { action: "Open /cart", expected: "The line item shows quantity 1" },
        { action: "Type 100 into the quantity field", expected: "" },
        { action: "Click Update cart", expected: 'Inline error "Maximum 99 per order" appears' },
      ],
      expectedResult: "Quantity stays at 99; cart subtotal unchanged.",
    }),
  ]),
  true,
);

// ---------------------------------------------------------------------------
// boundary-value-analysis
// ---------------------------------------------------------------------------

assert("boundary-value-analysis: empty suite fails", checkBva([]), false);

const bvaMissing99 = checkBva([
  tcase({
    title: "Cart quantity boundaries",
    steps: [
      { action: "Set quantity to 0", expected: "rejected" },
      { action: "Set quantity to 1", expected: "accepted" },
      { action: "Set quantity to 100", expected: "rejected" },
    ],
    expectedResult: "Boundaries enforced.",
  }),
]);
assert("boundary-value-analysis: 0/1/100 without 99 fails", bvaMissing99, false);
if (!bvaMissing99.feedback.some((f) => f.includes("99"))) {
  failed++;
  console.error("FAIL: boundary-value-analysis feedback should call out the missing 99");
}

assert(
  "boundary-value-analysis: all four edges passes",
  checkBva([
    tcase({
      title: "Cart quantity boundaries — 0, 1, 99, 100",
      steps: [
        { action: "Set quantity to 0", expected: "rejected, error shown" },
        { action: "Set quantity to 1", expected: "accepted" },
        { action: "Set quantity to 99", expected: "accepted" },
        { action: "Set quantity to 100", expected: "rejected, error shown" },
      ],
      expectedResult: "Only 1-99 is accepted.",
    }),
  ]),
  true,
);

// ---------------------------------------------------------------------------
// equivalence-partitioning
// ---------------------------------------------------------------------------

assert("equivalence-partitioning: empty suite fails", checkEquivalencePartitioning([]), false);

assert(
  "equivalence-partitioning: one partition only fails",
  checkEquivalencePartitioning([
    tcase({
      title: "Discount code — a valid code is accepted",
      steps: [{ action: "Enter SAVE2026", expected: "code applied" }],
      expectedResult: "Valid code is accepted.",
    }),
  ]),
  false,
);

assert(
  "equivalence-partitioning: three distinct partitions passes",
  checkEquivalencePartitioning([
    tcase({
      title: "Discount code — a valid 8-character code is accepted",
      steps: [{ action: "Enter SAVE2026", expected: "code applied" }],
      expectedResult: "Valid code accepted.",
    }),
    tcase({
      title: "Discount code — too short (5 characters) is rejected",
      steps: [{ action: "Enter ABC12", expected: "" }],
      expectedResult: "Rejected — code too short.",
    }),
    tcase({
      title: "Discount code — too long (11 characters) is rejected",
      steps: [{ action: "Enter ABCDEFGHIJK", expected: "" }],
      expectedResult: "Rejected — code too long.",
    }),
  ]),
  true,
);

// ---------------------------------------------------------------------------
// decision-tables
// ---------------------------------------------------------------------------

assert("decision-tables: too few cases fails", checkDecisionTables([]), false);

const shippingRules = (overrides) =>
  [
    tcase({
      title: "Shipping — over Rp 500,000, non-member, domestic → free shipping",
      expectedResult: "Free shipping.",
    }),
    tcase({
      title: "Shipping — under Rp 500,000, non-member, domestic → Rp 20,000 shipping",
      expectedResult: "Rp 20,000 shipping charged.",
    }),
    tcase({
      title: "Shipping — non-member, international → paid shipping (international never free)",
      expectedResult: "Shipping charged regardless of amount.",
    }),
    tcase({
      title: "Shipping — member, domestic, under Rp 500,000 → free shipping (member override)",
      expectedResult: "Free shipping — member overrides the threshold.",
    }),
    tcase({
      title: "Shipping — member + international → ambiguous, flag for product owner",
      expectedResult:
        "Not defined by the requirement: member always gets free shipping, but international never does. Raise with the product owner rather than guessing.",
    }),
    tcase({
      title: "Shipping — over Rp 500,000, member, domestic → free shipping",
      expectedResult: "Free shipping.",
    }),
  ].concat(overrides ?? []);

assert(
  "decision-tables: six rules incl. the flagged member+international case passes",
  checkDecisionTables(shippingRules()),
  true,
);

assert(
  "decision-tables: six rules but no flagged contradiction fails",
  checkDecisionTables(
    shippingRules().map((c) =>
      c.title.includes("ambiguous")
        ? tcase({ title: "Shipping — member + international → free shipping", expectedResult: "Free shipping." })
        : c,
    ),
  ),
  false,
);

// ---------------------------------------------------------------------------
// bug-reports
// ---------------------------------------------------------------------------

function defect({ title, bodyMd = "" }) {
  return { title, bodyMd };
}

assert("bug-reports: no defect filed fails", checkBugReport([]), false);

assert(
  "bug-reports: a bare title with no body fails",
  checkBugReport([defect({ title: "bug", bodyMd: "" })]),
  false,
);

assert(
  "bug-reports: the lesson's own before/after example passes",
  checkBugReport([
    defect({
      title: "Checkout returns 500 when the cart has an out-of-stock item (staging, build 1.4.2)",
      bodyMd: `Environment: staging, build 1.4.2, Chrome 126 / Windows 11, account buyer@shopmini.test

Preconditions: Cart contains 1 x SKU-1042. Stock for SKU-1042 set to 0 after the item was added.

Steps to reproduce:
1. Open /cart
2. Click Checkout

Actual: Page shows "Something went wrong". POST /api/checkout returns 500.

Expected: The customer is shown a clear out-of-stock message and stays on the cart (AC-4 of ShopMini story #212).`,
    }),
  ]),
  true,
);

// ---------------------------------------------------------------------------
// A-11a: portfolio (share target)
// ---------------------------------------------------------------------------

assert("portfolio: no share row fails", checkPortfolioShare(null), false);

assert(
  "portfolio: share row present but disabled fails",
  checkPortfolioShare({
    enabled: false,
    showCases: true,
    showRuns: true,
    showReports: true,
  }),
  false,
);

assert(
  "portfolio: enabled without the cases section fails",
  checkPortfolioShare({
    enabled: true,
    showCases: false,
    showRuns: true,
    showReports: true,
  }),
  false,
);

assert(
  "portfolio: enabled with cases passes, and still says what is off",
  checkPortfolioShare({
    enabled: true,
    showCases: true,
    showRuns: false,
    showReports: false,
  }),
  true,
);

assert(
  "portfolio: all three sections on passes",
  checkPortfolioShare({
    enabled: true,
    showCases: true,
    showRuns: true,
    showReports: true,
  }),
  true,
);

// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------
// A-11b: exploratory-testing
// ---------------------------------------------------------------------------

const GOOD_CHARTER =
  "Explore ShopMini's discount code field with expired, over-long and mixed-case codes to discover ways to get a discount that should be rejected";

function tsession({
  charter = GOOD_CHARTER,
  timeboxMinutes = 45,
  status = "ENDED",
  notes = [
    { kind: "NOTE", convertedType: null },
    { kind: "BUG", convertedType: "CASE" },
    { kind: "QUESTION", convertedType: null },
  ],
} = {}) {
  return { charter, timeboxMinutes, status, notes };
}

assert("exploratory-testing: no session fails", checkExploratorySession([]), false);
assert(
  "exploratory-testing: a full session passes",
  checkExploratorySession([tsession()]),
  true,
);
assert(
  "exploratory-testing: a page name as a charter fails",
  checkExploratorySession([tsession({ charter: "Test the checkout page" })]),
  false,
);
// The lesson's own self-check q1: a charter must say what information it is
// hunting for. This one names a target and an approach and stops there.
assert(
  "exploratory-testing: charter with no purpose fails",
  checkExploratorySession([
    tsession({
      charter:
        "Explore the ShopMini checkout flow with a member account and an international shipping address",
    }),
  ]),
  false,
);
assert(
  "exploratory-testing: an open session fails",
  checkExploratorySession([tsession({ status: "ACTIVE" })]),
  false,
);
assert(
  "exploratory-testing: no timebox fails",
  checkExploratorySession([tsession({ timeboxMinutes: null })]),
  false,
);
assert(
  "exploratory-testing: two notes fails",
  checkExploratorySession([
    tsession({
      notes: [
        { kind: "BUG", convertedType: "CASE" },
        { kind: "NOTE", convertedType: null },
      ],
    }),
  ]),
  false,
);
assert(
  "exploratory-testing: no BUG note fails",
  checkExploratorySession([
    tsession({
      notes: [
        { kind: "NOTE", convertedType: "CASE" },
        { kind: "NOTE", convertedType: null },
        { kind: "IDEA", convertedType: null },
      ],
    }),
  ]),
  false,
);
assert(
  "exploratory-testing: nothing converted fails",
  checkExploratorySession([
    tsession({
      notes: [
        { kind: "BUG", convertedType: null },
        { kind: "NOTE", convertedType: null },
        { kind: "IDEA", convertedType: null },
      ],
    }),
  ]),
  false,
);
// The best attempt is the one graded: an abandoned first session must not fail
// an exercise a later one satisfies.
assert(
  "exploratory-testing: a good session alongside an abandoned one passes",
  checkExploratorySession([
    tsession({ charter: "Test the cart", status: "ACTIVE", notes: [] }),
    tsession(),
  ]),
  true,
);
// Forgiving about wording, strict about structure: this charter uses none of
// the lesson's literal phrasing and is a better charter than most that would
// pass a keyword match.
assert(
  "exploratory-testing: an idiomatic charter in the learner's own words passes",
  checkExploratorySession([
    tsession({
      charter:
        "Poke at cart quantity limits using pasted values, negative numbers and browser-back, looking for a way to get past 99 per line",
    }),
  ]),
  true,
);

// ---------------------------------------------------------------------------
// A-11b: test-planning
// ---------------------------------------------------------------------------

const GOOD_PLAN = `Feature: guest checkout (SM-214)

In scope: guest order placement, email validation, order confirmation, and the
existing signed-in path as regression.
Not covered: the payment provider itself, iOS Safari below 15, bulk import.
Risks: guest order not linked to email (H); signed-in checkout regressed by the
shared component (H); duplicate order on double-submit (M).
Environment: staging, payment provider in sandbox mode; guest and admin accounts.
Entry: deployed to staging, smoke passes.
Exit: all planned cases run, no open Critical or High.`;

assert("test-planning: no plan fails", checkTestPlan([]), false);
assert(
  "test-planning: a full plan with three linked cases passes",
  checkTestPlan([{ description: GOOD_PLAN, linkedCaseIds: ["c1", "c2", "c3"] }]),
  true,
);
assert(
  "test-planning: a plan with no description fails",
  checkTestPlan([{ description: null, linkedCaseIds: ["c1", "c2", "c3"] }]),
  false,
);
assert(
  "test-planning: a full description with no linked cases fails",
  checkTestPlan([{ description: GOOD_PLAN, linkedCaseIds: [] }]),
  false,
);
assert(
  "test-planning: two linked cases fails",
  checkTestPlan([{ description: GOOD_PLAN, linkedCaseIds: ["c1", "c2"] }]),
  false,
);
// Scope and risks but no exclusions, entry or exit — the sections the lesson
// argues are the ones a reviewer actually uses.
assert(
  "test-planning: a description missing most sections fails",
  checkTestPlan([
    {
      description:
        "In scope: the whole checkout flow, including guest and signed-in paths, plus the confirmation email. Risks: the shared component might regress.",
      linkedCaseIds: ["c1", "c2", "c3"],
    },
  ]),
  false,
);
assert(
  "test-planning: the best of several plans is the one graded",
  checkTestPlan([
    { description: "First attempt, abandoned.", linkedCaseIds: [] },
    { description: GOOD_PLAN, linkedCaseIds: ["c1", "c2", "c3", "c4"] },
  ]),
  true,
);

// ---------------------------------------------------------------------------
// A-11b: metrics-that-mean-something
// ---------------------------------------------------------------------------

assert("metrics: no dashboard fails", checkMetricsDashboard([]), false);
assert(
  "metrics: an empty dashboard fails",
  checkMetricsDashboard([{ name: "QA", widgetCount: 0 }]),
  false,
);
assert(
  "metrics: five widgets passes",
  checkMetricsDashboard([{ name: "QA", widgetCount: 5 }]),
  true,
);
assert(
  "metrics: one widget passes",
  checkMetricsDashboard([{ name: "QA", widgetCount: 1 }]),
  true,
);
// The ceiling is the exercise. A checker with only a floor would invert the
// lesson, so this is the case that matters most in this block.
assert(
  "metrics: six widgets fails",
  checkMetricsDashboard([{ name: "Everything", widgetCount: 6 }]),
  false,
);
assert(
  "metrics: a disciplined dashboard beside an overloaded one passes",
  checkMetricsDashboard([
    { name: "Everything", widgetCount: 11 },
    { name: "The five", widgetCount: 4 },
  ]),
  true,
);

// ---------------------------------------------------------------------------
// A-11c: ci-github-actions and junit-to-testforge
// ---------------------------------------------------------------------------

assert("ci-github-actions: no runs fails", checkCiRun([]), false);
assert(
  "ci-github-actions: a hand-made run fails",
  checkCiRun([{ source: "MANUAL", origin: null, resultCount: 4 }]),
  false,
);
assert(
  "ci-github-actions: an uploaded run with results passes",
  checkCiRun([
    { source: "JUNIT", origin: "CI · GitHub Actions (Linux)", resultCount: 3 },
  ]),
  true,
);
assert(
  "ci-github-actions: an uploaded run with no origin still passes",
  checkCiRun([{ source: "JUNIT", origin: null, resultCount: 1 }]),
  true,
);
// The whole point of the decided pass bar: the capstone deliberately asks the
// learner to produce a failing result, so a red run is a pass. Statuses are not
// selected from the database at all — this asserts the shape stays that way.
assert(
  "junit-to-testforge: a run of nothing but failures passes",
  checkCapstoneRun([{ source: "JUNIT", origin: null, resultCount: 2 }]),
  true,
);
// `ingestResults()` returns 422 before `createRun` when nothing matched, so a
// zero-result ingested run should not exist — if one ever does, it is not the
// exercise, and the feedback must point at the 422 rather than pass.
assert(
  "junit-to-testforge: an ingested run with zero results fails",
  checkCapstoneRun([{ source: "JUNIT", origin: null, resultCount: 0 }]),
  false,
);
assert(
  "junit-to-testforge: the uploaded run is found among manual ones",
  checkCapstoneRun([
    { source: "MANUAL", origin: null, resultCount: 9 },
    { source: "PLAYWRIGHT", origin: "Local · Windows", resultCount: 2 },
  ]),
  true,
);

// A-11a: the checker debt, derived instead of counted by hand.
//
// docs/QA-ACADEMY.md carried this number in prose and got it wrong twice — it
// said six, then seven, while the real figure was eight, because `test-planning`
// was `sandbox: true` from A-08's first slice and never entered the tally. A
// number maintained by addition drifts; this derives it from source and names
// the lessons, so adding a `sandbox: true` lesson without a task fails the
// build with the slug in the message rather than silently growing the debt.
//
// Source text, not imports: these are TypeScript modules and this file runs
// under bare `node` (same reasoning as scripts/academy-trademark-check.mjs).
// ---------------------------------------------------------------------------

const TRACKS_DIR = "src/content/academy/tracks";

/** Lesson slugs whose module sets `sandbox: true`. */
function sandboxLessonSlugs() {
  const slugs = [];
  for (const entry of readdirSync(TRACKS_DIR)) {
    const path = join(TRACKS_DIR, entry);
    const files = statSync(path).isDirectory()
      ? readdirSync(path)
          .filter((f) => f.endsWith(".ts") && f !== "index.ts")
          .map((f) => join(path, f))
      : entry.endsWith(".ts")
        ? [path]
        : [];
    for (const file of files) {
      const src = readFileSync(file, "utf8");
      if (!/^\s*sandbox:\s*true\s*,/m.test(src)) continue;
      const slug = /^\s*slug:\s*"([a-z0-9-]+)"/m.exec(src);
      if (slug) slugs.push(slug[1]);
    }
  }
  return slugs.sort();
}

/** Lesson slugs with a `SANDBOX_TASKS` entry. */
function checkedSlugs() {
  const src = readFileSync("src/content/academy/sandbox.ts", "utf8");
  const body = src.slice(src.indexOf("SANDBOX_TASKS"));
  return [...body.matchAll(/^ {2}"?([a-z0-9-]+)"?:\s*\{$/gm)]
    .map((m) => m[1])
    .sort();
}

// The debt A-11 is working through, newest-first in the work order's table.
// Remove a slug here in the same commit that adds its checker.
const KNOWN_UNCHECKED = ["api-testing", "first-playwright-test"].sort();

const unchecked = sandboxLessonSlugs().filter(
  (s) => !checkedSlugs().includes(s),
);

if (JSON.stringify(unchecked) !== JSON.stringify(KNOWN_UNCHECKED)) {
  failed++;
  console.error("FAIL: the set of sandbox lessons without a checker has changed");
  console.error(`  expected: ${JSON.stringify(KNOWN_UNCHECKED)}`);
  console.error(`  actual:   ${JSON.stringify(unchecked)}`);
  console.error(
    "  Add the checker, or update KNOWN_UNCHECKED here and A-11's table in docs/QA-ACADEMY.md.",
  );
}

// ---------------------------------------------------------------------------

if (failed > 0) {
  console.error(`\nacademy-checks-selftest: ${failed} FAILED`);
  process.exit(1);
}
console.log(
  `academy-checks-selftest: OK (11 checkers, good and bad submissions; ${unchecked.length} sandbox lessons still uncheckered)`,
);
