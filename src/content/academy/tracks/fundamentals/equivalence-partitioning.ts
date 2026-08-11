import type { Lesson } from "../../types";

export const equivalencePartitioning: Lesson = {
  slug: "equivalence-partitioning",
  title: "Equivalence partitioning",
  summary:
    "Turn an infinite input space into a handful of tests by grouping inputs the system treats the same way.",
  minutes: 12,
  status: "published",
  sandbox: true,
  body: `
## The idea

If the system handles a whole group of inputs **the same way**, testing one
member of that group tells you roughly as much as testing all of them. Each
group is an **equivalence partition** (or equivalence class).

So: split the input space into partitions, pick one representative from each,
and you've replaced "infinite" with "a handful" — with an explicit, defensible
argument for what you left out.

Two rules that make it work:

1. Partitions must not overlap, and together they must cover **everything** a
   user could enter — including nonsense.
2. Every partition gets tested. Both the **valid** ones (should be accepted) and
   the **invalid** ones (should be rejected, gracefully).

Beginners test three valid values and call it done. The bugs live in the invalid
partitions.

## Worked example: ShopMini quantity

> **Requirement.** On the product page, the customer can order between **1 and
> 99** items. Quantity is a whole number.

Partitions:

| # | Partition | Valid? | Representative |
|---|---|---|---|
| P1 | 1 … 99 | valid | 42 |
| P2 | less than 1 (0, negative) | invalid | -5 |
| P3 | greater than 99 | invalid | 500 |
| P4 | not a whole number | invalid | 2.5 |
| P5 | not a number at all | invalid | \`"abc"\` |
| P6 | empty | invalid | \`""\` |

Six tests instead of infinity — and notice that P4–P6 are the ones a developer
usually didn't think about, which is exactly why they find bugs.

## Partitions exist on outputs too

Don't only partition the input. Ask what distinct **outcomes** the system can
produce and make sure each is reachable by at least one test.

> **Requirement.** Orders over Rp 500,000 ship free; below that, shipping is
> Rp 20,000; orders over Rp 5,000,000 need manager approval.

Output partitions: *paid shipping*, *free shipping*, *free shipping + approval
required*. Three tests, derived from the result rather than the field.

## Where it goes wrong

**Assuming a partition without checking.** "All strings over 255 chars behave
the same" — until 256 truncates silently and 10,000 crashes the request. If you
suspect the system treats part of a group differently, that's two partitions.

**Forgetting that valid ≠ one partition.** If the rule is "students get 20% off,
staff 30%, everyone else 0%", *valid* is three partitions, not one.

**Testing only one invalid value per test.** Enter one invalid field at a time.
If you submit a form with four bad fields and get one error, you've learned
almost nothing about the other three.

**Stopping at partitions.** The edges of each partition are where the real bugs
are — that's the next lesson.

## Practise it

Take this requirement:

> A ShopMini discount code is 6–10 characters, letters and digits only, and is
> case-insensitive. Expired codes are rejected with a specific message.

Write down the partitions before you read on. You should end up with at least:
too short, valid length, too long, contains a symbol, contains a space, lowercase
vs uppercase equivalence, valid-but-expired, unknown code, empty.

That's ~9 tests for a single text field — and it's a *defensible* nine, because
you can say what each one covers.

## 🛠 Your turn, in TestForge

The sandbox exercise for this lesson uses a different field so it doesn't
retread the quantity table above: ShopMini's **discount code** (6–10 letters or
digits, case-insensitive). Write partition cases for it in the Checkout suite
— valid, too short, too long, a disallowed character, expired — and the
checker looks for at least three distinct partitions across your cases, judged
by what each case's title and steps actually say, not exact wording.

If you want the practice before the sandbox is open to you, write the quantity
table above by hand first: one line per partition, with the input you'd use and
the result you'd expect. Keep the list; you'll extend it in the next lesson.

**Next:** boundary value analysis — where the same requirement gives up its real
bugs.
`,
  selfCheck: [
    {
      id: "q1",
      stem: "ShopMini quantity accepts whole numbers 1–99. A colleague tests 5, 40 and 80 and calls the field covered. What is wrong with that?",
      choices: [
        { id: "a", text: "Nothing — three values across the range is reasonable" },
        { id: "b", text: "All three are in the same partition, so two add nothing and every invalid partition is untested", correct: true },
        { id: "c", text: "They should have tested every value from 1 to 99" },
        { id: "d", text: "The values are valid, so no defect can be found" },
      ],
      explanation:
        "5, 40 and 80 are one partition sampled three times — the second and third tests carry almost no new information. The untested partitions are the interesting ones: below 1, above 99, non-integers, non-numbers and empty, which is where the developer's assumptions were never checked.",
    },
    {
      id: "q2",
      stem: "\"Students get 20% off, staff 30%, everyone else nothing.\" How many valid partitions is that?",
      choices: [
        { id: "a", text: "One — all valid customers" },
        { id: "b", text: "Two — discounted and not discounted" },
        { id: "c", text: "Three — student, staff, everyone else", correct: true },
        { id: "d", text: "It depends on how many customers exist" },
      ],
      explanation:
        "A partition is a group the system treats the same way, and these three groups produce three different outcomes. Collapsing them into \"valid\" would leave two of the three discount rules untested.",
    },
    {
      id: "q3",
      stem: "Which of these are legitimate equivalence partitions to test for a required text field?",
      multi: true,
      choices: [
        { id: "a", text: "Empty input", correct: true },
        { id: "b", text: "A value of the expected shape", correct: true },
        { id: "c", text: "Input containing characters the rule forbids", correct: true },
        { id: "d", text: "Every possible string of the allowed length" },
      ],
      explanation:
        "Empty, well-formed and forbidden-character inputs are each handled differently, so each is its own partition. Enumerating every allowed string is exhaustive testing — the thing partitioning exists to avoid.",
    },
  ],
};
