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
// A-11a: `kind` picks both the landing page (`openSandboxTask`) and the rows
// `runChecker` fetches — one discriminant, two dispatches, which is why adding
// a target kind is two small branches rather than a new subsystem.
//
// **`share` is the first non-append-shaped target.** A case or a defect is a
// new row, so A-04b's "only rows created since the panel opened" rule works;
// `PublicShare` is one row per project (`@unique projectId`) that gets
// upserted, so a learner who enabled sharing before opening the exercise would
// fail a `createdAt >= since` filter for doing the exercise early. The checker
// for it ignores `since` deliberately — see `runChecker`.
//
// A-11b adds three more non-case kinds. `session`, `plan` and `dashboard` are
// all append-shaped like `case`, so they keep the `since` filter — with one
// exception noted on `dashboard` in `runChecker`, which has no timestamp to
// filter a *revision* by.
export type SandboxTaskTarget =
  | { kind: "case"; suite: string }
  | { kind: "defect" }
  | { kind: "share" }
  | { kind: "session" }
  | { kind: "plan" }
  | { kind: "dashboard" }
  | { kind: "run" };

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
  // A-11a: the first checker outside T1, and the simplest of the eight the
  // work order covers — the exercise's whole demand is a boolean on one row.
  portfolio: {
    trackSlug: "beyond",
    lessonTitle: "Building a QA portfolio",
    target: { kind: "share" },
    task: "Publish your sandbox project: turn on public sharing, then enable the Test Cases, Runs and Reports sections. Open the public URL in a private window and read it as a stranger would.",
    criteria: [
      "Public sharing is on.",
      "The Test Cases section is enabled — a portfolio with no cases in it shows nothing.",
      "Runs and Reports are on too, so a reviewer can see you executed and maintained the suite.",
    ],
    hint: "Settings → Public sharing. The URL is your project slug, so treat anything you enable as readable by anyone who guesses it — that is the point of the exercise, not a warning against doing it.",
  },
  // A-11b: the three T2 exercises whose output is a row the product already
  // models. The deferral these inherited claimed none of them was "a DB row
  // with fields to inspect"; `Session`, `TestPlan` and `Dashboard` had all been
  // in the schema since long before the lessons were written.
  "exploratory-testing": {
    trackSlug: "manual-pro",
    lessonTitle: "Exploratory and session-based testing",
    target: { kind: "session" },
    task: "Run one real 45-minute session against ShopMini: write a charter, take notes as you go, and turn what you find into a defect and at least one case. End the session when the clock does.",
    criteria: [
      "A charter that names a target, an approach, and what you are hunting for — not \"test the checkout page\".",
      "A timebox set, and the session actually ended.",
      "At least 3 notes, including at least one marked BUG.",
      "At least one note converted into a case.",
    ],
    hint: 'The lesson\'s charter shape is "explore <target> with <approach> to discover <information>". Notes take hotkeys while the session runs — b for a bug, n for a note. "Convert to case" is on the note itself, after you end the session.',
  },
  "test-planning": {
    trackSlug: "manual-pro",
    lessonTitle: "Test planning that fits on one page",
    target: { kind: "plan" },
    task: "Write the guest-checkout plan from the worked example as a real Test Plan against your sandbox, then attach the cases you have already written to it by creating a run under the plan.",
    criteria: [
      "A plan whose description carries the sections from the worked example — scope, what is not covered, risks, entry and exit.",
      "At least 3 cases reachable through the plan — add a run under the plan and include them.",
    ],
    hint: "Scope stops being prose when it becomes a run you can count. Create the plan first, then New run from inside it and pick your cases — the plan's page then reads its own totals off the run.",
  },
  "metrics-that-mean-something": {
    trackSlug: "manual-pro",
    lessonTitle: "Metrics that mean something",
    target: { kind: "dashboard" },
    task: "Build the one-screen view for your sandbox: at most five numbers, each one answering a question and driving a decision. Be able to defend deleting everything else.",
    criteria: [
      "A dashboard with between 1 and 5 widgets — the ceiling is the exercise, not a limitation.",
      "Every widget earns its place: you can say what question it answers and what you would do differently if it moved.",
    ],
    hint: "The hard part is subtraction. Start by adding the ones you are sure about, then delete until removing one more would cost you a decision — that is the screen you keep.",
  },
  // A-11c: T3's two CI exercises. Same predicate, different feedback — the
  // checker cannot tell a GitHub runner from a curl, and says so rather than
  // implying it verified the workflow ran unattended.
  "ci-github-actions": {
    trackSlug: "automation",
    lessonTitle: "Running in CI with GitHub Actions",
    target: { kind: "run" },
    task: "Add the JUnit reporter and the upload step to your workflow, and let CI create a run in your sandbox project.",
    criteria: [
      "A run in your sandbox that arrived through /api/v1/junit, not one created by hand.",
      "At least one result attached to a case — a 422 means nothing matched and no run was created.",
    ],
    hint: "Upload with ?origin= so the run's page says where it came from. Store the API key as a repository secret, never in the workflow file.",
  },
  "junit-to-testforge": {
    trackSlug: "automation",
    lessonTitle: "Capstone: publish results to TestForge",
    target: { kind: "run" },
    task: "The capstone: emit JUnit XML from your Playwright suite, upload it to /api/v1/junit, and read back the run you just created — including the entry it added to the case's history.",
    criteria: [
      "A run in your sandbox created by the upload, with at least one result matched to a case.",
      "Pass or fail does not matter — the exercise asks you to produce a failing result on the way, and grading on green would punish you for following it.",
    ],
    hint: "Get the 422 on purpose first: upload a file where no test name matches anything, and read the error. Then rename a test to carry TC-<SLUG>-<n> and upload again.",
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
