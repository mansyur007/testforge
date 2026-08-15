import type { Lesson } from "../../types";

export const programmingFoundations: Lesson = {
  slug: "programming-foundations",
  title: "Programming foundations for testers",
  summary:
    "Variables, functions, async, and reading someone else's code — JS/TS path.",
  minutes: 18,
  status: "published",
  body: `
## You are not becoming a developer

You are becoming someone who can **read and change test code without being
afraid of it**. That is a much smaller target than "learn JavaScript", and it is
reachable in a fortnight.

Two things follow from it. First, you need maybe a tenth of the language — the
tenth on this page. Second, **reading matters more than writing**: almost
nobody's first automation job is a green-field suite. It is a repository someone
else built, with 400 tests, three helpers you do not understand and a failing
job nobody has looked at since Tuesday.

Why JavaScript and TypeScript here: it is the browser's own language, it is what
Playwright is written in, and it is almost certainly already in your team's
repository. Python with pytest is an equally respectable path and every concept
below transfers — the syntax is a week's difference, not a career's.

## What you need installed

Node.js (the current LTS) and an editor — VS Code, unless you already have
opinions. Then:

~~~bash
node -v
~~~

If that prints a version, you are done. Playwright itself arrives in the next
lesson.

## Values, and the two words you will type most

~~~ts
const orderId = "ord_8831";   // never reassigned
let attempts = 0;             // this one changes
attempts = attempts + 1;
~~~

**\`const\` by default, \`let\` when the value genuinely changes, \`var\` never.**
Defaulting to \`const\` is not style pedantry — it means the editor catches an
accidental reassignment, which in test code is usually a bug you would otherwise
spend an hour on.

The types you will meet: strings, numbers, booleans, arrays, objects, and the
two flavours of nothing.

~~~ts
const name = "Ada";           // string
const total = 41.5;           // number
const isPaid = true;          // boolean
const codes = ["A1", "B2"];   // array
const order = { id: "ord_8831", status: "PAID", total: 41.5 };  // object

order.status;      // "PAID"      — dot notation
codes[0];          // "A1"        — arrays start at 0
codes.length;      // 2
~~~

\`null\` means *deliberately empty*; \`undefined\` means *never set*. The
distinction matters because a field that arrives as \`undefined\` when you
expected \`null\` is usually the API not sending it at all — which is a finding,
not a nuisance.

**Template strings** are the other thing you will type constantly, for building
URLs and failure messages:

~~~ts
const url = \`/api/v1/orders/\${orderId}\`;
~~~

Backticks, not quotes, and \`\${...}\` for anything you want interpolated.

**Destructuring** is worth ten minutes of your life because Playwright's own API
uses it in every single test:

~~~ts
const { id, status } = order;   // two variables out of one object
~~~

That is exactly what \`async ({ page }) => { ... }\` is doing further down: pulling
\`page\` out of an object Playwright hands you.

## Functions

~~~ts
// declaration
function totalWithTax(amount: number) {
  return amount * 1.2;
}

// arrow function — the form you will see in test files
const totalWithTax = (amount: number) => amount * 1.2;
~~~

They do the same thing here. Arrow functions dominate test code because tests are
written by *passing a function to something else*:

~~~ts
test("checkout shows a confirmation", async ({ page }) => {
  // ...
});
~~~

Read that as: call \`test\`, hand it a name and **a function to run later**. The
function is not executed on that line — Playwright decides when. Once that clicks,
most test-framework syntax stops looking like magic.

## Comparison, and the one that bites

~~~ts
"5" === 5     // false — different types. Use this one.
"5" ==  5     // true  — converts first. Avoid.
~~~

**Always \`===\`.** The loose one exists for historical reasons and produces
exactly the class of confusion you are employed to prevent.

The other trap is falsiness. These are all "falsy": \`false\`, \`0\`, \`""\`,
\`null\`, \`undefined\`, \`NaN\`.

~~~ts
if (order.total) { /* ... */ }        // skipped when total is 0 — a real bug
if (order.total !== undefined) { }    // what you actually meant
~~~

A free order with a total of \`0\` disappearing from a check is a defect *in your
test*, and it is the most common one there is.

## Loops and lists

~~~ts
for (const code of codes) {
  console.log(code);
}

const paid = orders.filter((o) => o.status === "PAID");
const ids  = orders.map((o) => o.id);
const one  = orders.find((o) => o.id === "ord_8831");
~~~

\`filter\`, \`map\` and \`find\` cover most of what you will need, and \`for...of\`
covers the rest. Data-driven tests are built out of exactly this:

~~~ts
const cases = [
  { input: "abc",      valid: false },
  { input: "Abc12345", valid: true },
];

for (const c of cases) {
  test(\`password "\${c.input}" is \${c.valid ? "accepted" : "rejected"}\`, async () => {
    // ...
  });
}
~~~

One loop, N tests, each with its own name — which is the shape you want, not one
test with a loop inside it. A loop inside a test stops at the first failure and
hides the rest.

## Async: the part that actually matters

Everything a browser does takes time, so almost every Playwright call returns a
**Promise** — an object meaning *"a value that is not here yet"*. \`await\` says
*"wait for it, then give me the result"*.

~~~ts
test("checkout", async ({ page }) => {   // note: async
  await page.goto("/cart");
  await page.getByRole("button", { name: "Checkout" }).click();
  await expect(page.getByText("Thank you")).toBeVisible();
});
~~~

**The rule: if it returns a Promise, await it.** A missing \`await\` is the single
biggest source of confusing, intermittent test failures in this ecosystem, and
the reason is worth understanding rather than memorising:

~~~ts
page.getByRole("button", { name: "Checkout" }).click();   // NOT awaited
await expect(page.getByText("Thank you")).toBeVisible();  // races the click
~~~

The click was *started*, not finished. Execution moves on immediately, the
assertion runs against a page mid-navigation, and it fails perhaps one run in
five — on a slow CI machine, and never on your laptop. Worse, when a test ends
while an un-awaited operation is still running, the error surfaces during the
**next** test, which sends you debugging a file that is not broken.

Two consequences:

- \`await\` only works inside a function marked \`async\` — which is why every
  Playwright test callback is \`async ({ page })\`.
- If a test fails in a way that makes no sense, **check for a missing \`await\`
  before you check anything else.** Editors and linters can flag these; turn that
  on early.

## Reading somebody else's suite

The real skill, and it has a method:

1. **Start at the test name.** A good one tells you the claim being made. If the
   names are bad, that is your first finding about the suite.
2. **Find the assertion first.** \`expect(...)\` is what the test claims is true;
   everything above it is setup. Reading backwards from the assertion is far
   faster than reading forwards from line one.
3. **Follow the imports.** \`import { loginAs } from "./helpers/auth"\` tells you
   where the shared machinery lives. Open it once; you will meet it in every file.
4. **Run one test in isolation and watch it.** Ten seconds of watching beats ten
   minutes of reading.
5. **Change nothing cosmetic on day one.** Renaming variables to your taste in a
   suite you do not yet understand produces a large diff, no information, and a
   reviewer who now distrusts you.

## TypeScript, in the amount you need this month

TypeScript is JavaScript with types attached. What it buys a tester is immediate
and practical: the editor tells you what \`page.getByRole(\` accepts *before* you
run anything, and a typo becomes a red underline instead of a three-minute test
failure.

~~~ts
const orderId: string = "ord_8831";

function totalWithTax(amount: number): number {
  return amount * 1.2;
}

type Order = { id: string; status: "PAID" | "PENDING"; total: number };
~~~

That third line is the one worth noticing: \`status\` can only ever be one of two
strings, so a typo like \`"PAId"\` is caught while you type. Generics, decorators
and the rest of the type system can wait indefinitely.

## Git, in one paragraph

You are about to be in the same repository as developers, so: make a branch, keep
commits small, open a pull request, expect review comments and do not take them
personally. \`git status\` before anything, and never commit a \`.only\` — a single
\`test.only\` left in a file turns the whole CI suite into one test, silently
green.

## Errors you will meet in week one

| Message | What it usually means |
|---|---|
| \`Cannot read properties of undefined (reading 'id')\` | The thing before the dot does not exist — usually a setup step that did not run, or a missing \`await\` |
| \`x is not a function\` | Typo in the name, or you imported the wrong thing |
| \`Timeout 30000ms exceeded waiting for locator\` | The element never appeared: wrong locator, or the page genuinely broke — check which before "fixing" the locator |
| An unhandled rejection after a passing test | A Promise nobody awaited, in the test that just "passed" |
| \`SyntaxError: Unexpected token\` | Almost always a bracket or quote, on or just before the reported line |

Read the **first** error, not the last. Everything after it is usually a
consequence.

## Where TestForge fits

One decision to make now rather than later: **name your tests so they map to your
cases.** The capstone in this track uploads JUnit XML to \`/api/v1/junit\`, and the
matching is done on test names — so a test called
\`"TC-SHOP-14 checkout with an expired discount code"\` becomes a result on the
case you already wrote, while \`"test checkout 2"\` becomes an orphan somebody has
to reconcile by hand.

The pattern is \`TC-<PROJECT>-<number>\`, where \`<PROJECT>\` is your project's slug
(\`SHOP\` above) and the number is the case's number in it. The slug is part of it
because case numbers only count within a project. The capstone covers the details;
what matters now is deciding to carry an id at all.

Deciding that convention in your first week costs nothing. Retrofitting it across
400 tests costs a sprint.

**Next:** installing Playwright and writing the first test — then understanding
every line of what you just wrote.
`,
  selfCheck: [
    {
      id: "q1",
      stem: "A test passes on your laptop and fails roughly one run in five on CI, and the error sometimes appears in the following test instead. What should you check first?",
      choices: [
        {
          id: "a",
          text: "Whether CI is running a different browser version",
        },
        {
          id: "b",
          text: "A missing await on a Promise-returning call, so the test continues before the action has finished",
          correct: true,
        },
        {
          id: "c",
          text: "Whether the CI machine needs a longer global timeout",
        },
        {
          id: "d",
          text: "Whether the test data is being shared with another test",
        },
      ],
      explanation:
        "An un-awaited call is started and then abandoned, so execution races ahead to the assertion and the outcome depends on machine speed — which is exactly why it fails on slower CI and not locally. The error appearing in the next test is close to a signature: the abandoned Promise rejects after its own test has ended. Browser versions and shared data cause real flakiness too, but neither explains an error landing in a different test. Raising the timeout is the response to avoid entirely: it hides the race for a while and teaches the suite to be slow.",
    },
    {
      id: "q2",
      stem: "You are handed an unfamiliar 400-test suite and asked to find out what one failing test is actually checking. What is the fastest first move?",
      choices: [
        {
          id: "a",
          text: "Read the file from the first line down, so you understand the setup before the checks",
        },
        {
          id: "b",
          text: "Read the test name and its expect(...) assertion, then work backwards through the setup",
          correct: true,
        },
        {
          id: "c",
          text: "Open the helper files first, since the shared machinery explains everything else",
        },
        {
          id: "d",
          text: "Rewrite the test in a style you find readable",
        },
      ],
      explanation:
        "The assertion is the claim the test makes, and the name should say it in English — together they tell you the point of the test in seconds, after which the setup reads as \"what had to be true for that claim to be checkable\". Reading forwards means holding twenty lines of unexplained setup in your head before you learn what any of it was for. Helpers are worth opening, but second: they make sense once you know what the test is trying to do. And rewriting something you do not yet understand produces a large diff, no new information, and a reviewer who now trusts you less.",
    },
    {
      id: "q3",
      stem: "Which of these are sound habits when working in a test repository for the first time?",
      multi: true,
      choices: [
        {
          id: "a",
          text: "Default to const, and use let only where the value genuinely changes",
          correct: true,
        },
        {
          id: "b",
          text: "Generate one named test per data row rather than looping inside a single test",
          correct: true,
        },
        {
          id: "c",
          text: "Use == rather than === so that \"5\" and 5 compare equal without extra conversion",
        },
        {
          id: "d",
          text: "Check nothing with test.only left in it into version control",
          correct: true,
        },
      ],
      explanation:
        "Defaulting to const turns an accidental reassignment into an editor error rather than an afternoon; a named test per row means every row reports its own result instead of the loop stopping at the first failure and hiding the rest; and a stray test.only silently reduces the whole CI suite to one test, which is worse than a red build because it looks green. Loose equality is the one to reject: it converts types before comparing, so it papers over exactly the string-versus-number confusion a tester is employed to notice.",
    },
  ],
};
