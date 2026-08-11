// A-04: the fixture every Academy sandbox is seeded with — "ShopMini", the
// small e-commerce app the T1 lessons already use in their worked examples.
//
// It lives in `src/content/academy` rather than `prisma/seed.mjs` because it is
// *content*: a learner resets it, it gets re-applied, and it must exist in the
// production image, which ships no seed script. Deliberately small — four
// suites and three reference cases. The point is to give the learner somewhere
// to write and a visible standard to write against, not to hand them a finished
// suite they can copy.

/** Reference-quality case: what the checker in A-04b will grade against. */
export type FixtureCase = {
  suite: string;
  title: string;
  priority: string;
  type: string;
  tags: string;
  preconditions: string;
  steps: { action: string; expected: string }[];
  expectedResult: string;
};

export const SANDBOX_PROJECT_NAME = "Academy Sandbox";

/**
 * Shown as the project description and quoted by the lessons. Every rule the
 * exercises test is stated here, because an exercise whose requirement lives
 * only in the lesson text cannot be checked fairly.
 */
export const SHOPMINI_REQUIREMENTS = `ShopMini — the practice product for TestForge QA Academy.

A small online shop. These are the rules the exercises are written against:

- **Cart quantity** is a whole number from 1 to 99 per line item.
- **Free shipping** applies to orders over Rp 500,000. Below that, shipping is Rp 20,000.
- **Members** always get free shipping. **International** addresses never do. (These two rules contradict each other for a member shipping abroad — that is deliberate.)
- **Discount codes** are 6-10 characters, letters and digits only, case-insensitive. Expired codes are rejected with a specific message.
- **Order states**: Pending → Paid → Shipped, with Cancelled reachable from Pending and Paid, and Refunded from Paid and Shipped. Nothing leaves Cancelled or Refunded.

This project is yours. Break it, reset it, start again.`;

export const SANDBOX_SUITES = ["Authentication", "Cart", "Checkout", "Search"];

// A-04b: the hands-on task for each sandbox-marked lesson, and where it lands
// the learner. Deliberately its own (non-`server-only`) module: none of this is
// secret — the task text is the same thing the lesson body already says in
// prose — so `AcademyCoach` (a client component) can import it directly rather
// than round-tripping through a server action just to render a heading. Keyed
// by lesson slug because that is what `?academy=<lessonSlug>` carries and what
// `src/lib/academy/checks.ts` uses to pick a checker — one key, two lookups.
export type SandboxTaskTarget =
  | { kind: "case"; suite: string }
  | { kind: "defect" };

export type SandboxTask = {
  trackSlug: string;
  /** Shown in the coach panel header; kept separate from the lesson content
   *  module so this file has no dependency on `server-only` content. */
  lessonTitle: string;
  target: SandboxTaskTarget;
  task: string;
  criteria: string[];
  hint: string;
};

export const SANDBOX_TASKS: Record<string, SandboxTask> = {
  "writing-test-cases": {
    trackSlug: "fundamentals",
    lessonTitle: "Writing test cases people can actually run",
    target: { kind: "case", suite: "Checkout" },
    task: 'Write the quantity case from the worked example — "Checkout — quantity above maximum (100) is rejected" — as a real case in the Checkout suite.',
    criteria: [
      "At least 3 steps, each with an action.",
      "A specific, non-empty expected result.",
      "At least two of the boundary values 0, 1, 99, 100 named in the case.",
    ],
    hint: "Steps: open the cart, set the quantity, save. Expected result: what happens to the quantity and the cart total — not just \"it works\".",
  },
  "boundary-value-analysis": {
    trackSlug: "fundamentals",
    lessonTitle: "Boundary value analysis",
    target: { kind: "case", suite: "Cart" },
    task: "Write boundary cases for ShopMini's cart quantity field (valid range 1–99) in the Cart suite.",
    criteria: [
      "At least 3 steps and a non-empty expected result.",
      "Names at least three of the four edge values: 0, 1, 99, 100 — including 99.",
    ],
    hint: "The most commonly missed value is 99 — the upper valid edge, and the one most likely to be wrongly rejected by qty < 99 instead of qty <= 99.",
  },
  "equivalence-partitioning": {
    trackSlug: "fundamentals",
    lessonTitle: "Equivalence partitioning",
    target: { kind: "case", suite: "Checkout" },
    task: "Write partition cases for ShopMini's discount code field (6–10 letters/digits, case-insensitive) in the Checkout suite — cover at least three different partitions: valid, too short, too long, a disallowed character, or expired.",
    criteria: [
      "At least three cases, each covering one partition.",
      "The partition each case covers is identifiable from its title or steps.",
    ],
    hint: "One case per partition is easiest to grade and easiest to read later — don't try to cover two partitions in one case.",
  },
  "decision-tables": {
    trackSlug: "fundamentals",
    lessonTitle: "Decision tables",
    target: { kind: "case", suite: "Checkout" },
    task: "Build the shipping decision table for ShopMini as a suite of cases in Checkout — over/under Rp 500,000 × member/non-member × domestic/international.",
    criteria: [
      "At least 6 cases covering the three conditions.",
      "Both \"member\" and \"international\" show up across your cases, not just once each.",
      "The member + international combination is flagged as unresolved — the requirement contradicts itself there — rather than guessed at.",
    ],
    hint: "For the member-and-international case, write down what you'd ask the product owner instead of picking an answer.",
  },
  "bug-reports": {
    trackSlug: "fundamentals",
    lessonTitle: "Writing a bug report that gets fixed",
    target: { kind: "defect" },
    task: "File a defect for a bug you find in the ShopMini rules — the exact-Rp-500,000 shipping ambiguity and the member/international contradiction are both fair game.",
    criteria: [
      "A title with what happens, where, and under what condition — not just \"bug\".",
      "A description with an Environment line, numbered steps to reproduce, an Actual result and an Expected result.",
    ],
    hint: "Reuse the shape from the lesson's before/after example: Environment, Preconditions, Steps, Actual, Expected.",
  },
};

export function getSandboxTask(lessonSlug: string): SandboxTask | undefined {
  return SANDBOX_TASKS[lessonSlug];
}

export const SANDBOX_CASES: FixtureCase[] = [
  {
    suite: "Cart",
    title: "Cart — quantity above maximum (100) is rejected",
    priority: "HIGH",
    type: "FUNCTIONAL",
    tags: "boundary,cart",
    preconditions:
      'Logged in as customer buyer@shopmini.test; cart contains 1 x "Kaos Polos" (SKU-1042); stock >= 200',
    steps: [
      { action: "Open /cart", expected: "The line item shows quantity 1" },
      { action: "Type 100 into the quantity field for SKU-1042", expected: "" },
      {
        action: "Click Update cart",
        expected: 'Inline error "Maximum 99 per order" appears next to the field',
      },
    ],
    expectedResult:
      "Quantity stays at 99 or is not applied; the cart subtotal is unchanged; no request reaches the order service.",
  },
  {
    suite: "Checkout",
    title: "Checkout — order of exactly Rp 500,000 is charged shipping",
    priority: "HIGH",
    type: "FUNCTIONAL",
    tags: "boundary,checkout,shipping",
    preconditions:
      "Logged in as a non-member customer with a domestic address; cart subtotal is exactly Rp 500,000",
    steps: [
      { action: "Open /checkout", expected: "The order summary shows Rp 500,000" },
      {
        action: "Read the shipping line",
        expected: "Shipping shows Rp 20,000, not Rp 0",
      },
    ],
    expectedResult:
      'Free shipping applies "over Rp 500,000", so exactly 500,000 is charged shipping. If the product disagrees, the requirement is ambiguous and that is the finding.',
  },
  {
    suite: "Authentication",
    title: "Login — locked account with the correct password shows a generic error",
    priority: "MEDIUM",
    type: "FUNCTIONAL",
    tags: "auth,security",
    preconditions: "Account locked@shopmini.test exists and is locked",
    steps: [
      { action: "Open /login", expected: "The login form is shown" },
      {
        action: "Enter locked@shopmini.test and its correct password, then submit",
        expected: "",
      },
    ],
    expectedResult:
      "Login is refused with a message that does not reveal whether the account exists or is locked; no session is created.",
  },
];
