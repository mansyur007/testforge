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
import {
  checkWritingTestCases,
  checkBva,
  checkEquivalencePartitioning,
  checkDecisionTables,
  checkBugReport,
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

if (failed > 0) {
  console.error(`\nacademy-checks-selftest: ${failed} FAILED`);
  process.exit(1);
}
console.log("academy-checks-selftest: OK (5 checkers, good and bad submissions)");
