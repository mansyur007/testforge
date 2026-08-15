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
const KNOWN_UNCHECKED = [
  "api-testing",
  "ci-github-actions",
  "exploratory-testing",
  "first-playwright-test",
  "junit-to-testforge",
  "metrics-that-mean-something",
  "test-planning",
].sort();

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
  `academy-checks-selftest: OK (6 checkers, good and bad submissions; ${unchecked.length} sandbox lessons still uncheckered)`,
);
