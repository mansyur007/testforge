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
