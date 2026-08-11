import type { Lesson } from "../../types";

export const writingTestCases: Lesson = {
  slug: "writing-test-cases",
  title: "Writing test cases people can actually run",
  summary:
    "Anatomy of a good case, the five failure modes of bad ones, and how much detail is the right amount.",
  minutes: 13,
  status: "published",
  sandbox: true,
  body: `
## The one test that matters

**Could a competent person who has never seen this feature run your case and get
the same verdict you would?** If yes, it's a good test case. Everything below is
in service of that.

## Anatomy

| Part | What it's for | Example |
|---|---|---|
| **Title** | Findable, and tells a reader what's covered without opening it | *Checkout — quantity above maximum (100) is rejected* |
| **Preconditions** | The state the world must be in before step 1 | *Logged in as a customer; cart contains 1 × "Kaos Polos"; stock ≥ 200* |
| **Test data** | Concrete values, not descriptions | *quantity = 100* |
| **Steps** | Numbered actions, one action each | *1. Open the cart. 2. Set quantity to 100. 3. Click Update.* |
| **Expected result** | Observable, specific, one per step where it matters | *Quantity stays 99; inline error "Maximum 99 per order"; cart total unchanged* |
| **Priority** | What runs first when time runs out | *High* |

TestForge gives each of these a field, and steps are action/expected pairs — so
the structure above is the form you'll be filling in.

## Titles: the part everyone rushes

A title is read a hundred times and written once. Use a shape and stick to it:

> **[Area] — [condition] → [expected outcome]**

- ✅ *Checkout — quantity above maximum (100) is rejected*
- ✅ *Login — locked account with correct password shows generic error*
- ❌ *Test quantity* — covers what? passes when?
- ❌ *Verify that the system works correctly* — nothing at all
- ❌ *TC-17* — the ID is not a title

The test: read only the title and predict the expected result. If you can't,
rewrite it.

## Expected results must be observable

"Works correctly", "as expected", "the system behaves properly" are not expected
results — they're a promise to argue later. Write what a person can **see**:

- ❌ *Order is processed correctly*
- ✅ *Order status becomes "Paid"; confirmation email arrives at the customer's
  address within 1 minute; stock for SKU-1042 drops from 200 to 198*

If the expected result can't be observed from the outside, say where to look —
a database row, a log line, a webhook payload. That's still observable.

## The five ways test cases go bad

**1. Too vague.** "Enter an invalid email." Which invalid email? \`a@b\`,
\`no-at-sign\`, \`x@x.\`, 300 characters, unicode? Each is a different partition
and they don't behave the same.

**2. Too detailed.** Twelve steps to log in, described click by click, in every
case. Put shared setup in preconditions, or in a shared step group, and start the
case at the thing it's actually testing. A case should be ~3–8 steps.

**3. Testing five things at once.** A case that checks login, then the dashboard,
then the profile page fails on step 2 and tells you nothing about the rest. **One
case, one reason to fail.**

**4. Depends on the last test's leftovers.** Case 12 passes only if case 11 ran
first and left the cart full. Someone runs case 12 alone, it fails, and everyone
wastes an hour. State the precondition, or make the case set itself up.

**5. Encodes the implementation.** "Click the button with class \`.btn-primary\`
at the top right." When the design changes, the case is wrong but the software is
fine. Describe intent — "Confirm the order" — not markup.

## How much detail is right?

It depends on who runs it and how often, and there is a real trade-off:

| Situation | Style |
|---|---|
| You'll run it once, today, yourself | A charter or a checklist line. Don't gold-plate it |
| A new joiner will run it | Full steps, explicit data |
| It's a regression case run every release | Full steps — it will outlive you |
| It's regulated / auditable | Full steps, plus evidence of the run |
| You'll automate it next sprint | Precise data and assertions; skip the UI choreography |

The failure mode of junior QA is writing 200 exhaustively detailed cases nobody
maintains. Detail costs maintenance. Spend it where a case will be re-run by
someone who isn't you.

## Worked example

> **Requirement.** ShopMini cart: quantity 1–99 per line item.

Bad:

> **Title:** Quantity test
> **Steps:** Test the quantity field with different values
> **Expected:** Works correctly

Good — and note it's *one* partition, with its own case:

> **Title:** Cart — quantity above maximum (100) is rejected
> **Priority:** High
> **Preconditions:** Logged in as customer \`buyer@shopmini.test\`; cart contains
> 1 × "Kaos Polos" (SKU-1042); stock ≥ 200
> **Steps:**
> 1. Open \`/cart\` → the line item shows quantity 1
> 2. Type \`100\` into the quantity field for SKU-1042
> 3. Click **Update cart**
>
> **Expected result:** Quantity reverts to 99 (or stays at 1 and is not applied);
> inline error "Maximum 99 per order" is shown next to the field; cart subtotal
> is unchanged; no request is sent to the order service.

Its siblings — 0, 1, 99, 2.5, "abc", empty — are separate cases, from your
partition and boundary work in the previous lessons.

## 🛠 Your turn, in TestForge

The sandbox exercise: create the case above (and its boundary siblings) in a real
ShopMini project, with real steps and expected results. The checker looks for a
case in the Checkout suite with at least three steps, a non-empty expected
result, and boundary values in the data — the same standard a reviewer would
apply.

**Next:** the other thing you'll write every day — a defect report that gets
fixed instead of closed as "cannot reproduce".
`,
  selfCheck: [
    {
      id: "q1",
      stem: "Which expected result is usable?",
      choices: [
        { id: "a", text: "The order is processed correctly" },
        { id: "b", text: "The system behaves as expected" },
        { id: "c", text: "Status becomes \"Paid\", a confirmation email arrives, and stock for SKU-1042 drops from 200 to 198", correct: true },
        { id: "d", text: "No errors are shown" },
      ],
      explanation:
        "An expected result has to be observable by someone who has never seen the feature. \"Correctly\" and \"as expected\" postpone the disagreement to the moment the test fails; concrete states, messages and numbers settle it in advance.",
    },
    {
      id: "q2",
      stem: "Case 12 passes only when case 11 ran first and left items in the cart. What is the defect in the case?",
      choices: [
        { id: "a", text: "It is too detailed" },
        { id: "b", text: "It has an unstated precondition, so it fails when run alone", correct: true },
        { id: "c", text: "It tests too many things at once" },
        { id: "d", text: "Nothing — tests are expected to run in order" },
      ],
      explanation:
        "A case that silently depends on its predecessor's leftovers fails for whoever runs it in isolation, and the hour they lose is spent on the case, not the product. State the precondition or have the case set itself up.",
    },
    {
      id: "q3",
      stem: "Which of these belong in a test case?",
      multi: true,
      choices: [
        { id: "a", text: "Concrete test data, not a description of it", correct: true },
        { id: "b", text: "A title that names the condition and the outcome", correct: true },
        { id: "c", text: "The CSS selector of the button to click" },
        { id: "d", text: "Preconditions that put the world in a known state", correct: true },
      ],
      explanation:
        "Data, an informative title and preconditions all survive the product being redesigned. A CSS selector encodes the implementation, so the case goes wrong the moment the markup changes while the software is still perfectly fine.",
    },
  ],
};
