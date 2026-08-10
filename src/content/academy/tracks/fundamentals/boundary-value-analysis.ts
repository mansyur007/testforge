import type { Lesson } from "../../types";

export const boundaryValueAnalysis: Lesson = {
  slug: "boundary-value-analysis",
  title: "Boundary value analysis",
  summary:
    "Bugs live at the edges. BVA is the technique with the best defect-per-test ratio in testing.",
  minutes: 12,
  status: "published",
  sandbox: true,
  body: `
## Why edges break

Almost every range in software is implemented by a comparison, and comparisons
are where fingers slip:

\`\`\`js
if (qty > 0 && qty < 99) { ... }   // 99 silently rejected
if (age >= 18) { ... }             // correct
if (age > 18) { ... }              // 18-year-olds refused
for (let i = 0; i <= items.length; i++)  // reads one past the end
\`\`\`

Nobody writes \`if (qty === 47)\` wrong. The middle of a partition is safe; the
**boundary** is where the off-by-one lives. That's why boundary value analysis
finds more defects per test than any other basic technique — and why it's the
first thing an interviewer asks you to demonstrate.

BVA is not a replacement for [equivalence
partitioning](/academy/fundamentals/equivalence-partitioning) — it's the second
half of it. Partition first, then test the edges of each partition.

## 2-value BVA (the common form)

For each boundary, test **the value on each side of it**: the last value of one
partition and the first value of the next.

ShopMini quantity, valid range **1 … 99**:

| Boundary | Values to test | Expected |
|---|---|---|
| Lower edge | **0** | rejected |
| | **1** | accepted |
| Upper edge | **99** | accepted |
| | **100** | rejected |

Four tests. Add one mid-partition value (say 42) if you want a sanity check and
you're at five.

## 3-value BVA

Some standards (and some interviewers) want **below, on, and above** each
boundary: 0, 1, 2 and 98, 99, 100. It costs two extra tests and catches a
narrower class of mistake (\`>=\` written as \`>\` *and* an adjacent off-by-one).
Use it when the cost of failure is high; 2-value is the everyday default.

## Boundaries are everywhere, not just in number fields

This is what separates people who "know BVA" from people who use it:

| Thing | Boundaries you should test |
|---|---|
| Text field, 6–10 chars | 5, 6, 10, 11 characters |
| File upload, max 5 MB | 5 MB exactly, 5 MB + 1 byte, 0-byte file |
| Date range "last 30 days" | today, 30 days ago, 31 days ago, the DST change, 29 Feb |
| Pagination, 20 per page | 19, 20, 21 items; page 1; the last page; one past it |
| Session timeout 15 min | 14:59, 15:01 |
| Discount at ≥ Rp 500,000 | 499,999 / 500,000 / 500,001 |
| List with a limit of 99 | 0 items (empty state!), 1, 99, 100 |
| Money | 0.00, 0.01, negative, the currency's smallest unit, values that need rounding |

**Zero and empty are boundaries.** The empty state — no results, no items, no
data yet — is the single most commonly broken screen in any product, because the
developer always has data on their machine.

## Watch for the boundary you weren't told about

Requirements state the business boundary. The system has **technical**
boundaries too, and nobody documents them: \`int\` limits, VARCHAR lengths,
upload timeouts, page-size caps in an API, the 1000-row limit in an export.
When you find one, that's a finding in itself — either it needs handling or it
needs documenting.

## Worked example: the discount rule

> Orders **over** Rp 500,000 ship free.

The word "over" is doing a lot of work. Test 500,000 exactly — this is where
requirement ambiguity turns into a defect, because half the team read "over" as
"≥". If your test at exactly 500,000 disagrees with the developer's reading, you
haven't found a code bug; you've found a **requirements** bug, which is more
valuable.

## 🛠 Your turn, in TestForge

The sandbox exercise for this lesson: write boundary cases for ShopMini's
quantity field in a real project, and the checker looks for the four edge values
above (0, 1, 99, 100) with a clear expected result on each. The most common miss
is **99** — people test 0, 1, 100 and stop, leaving the upper *valid* edge, the
likeliest broken one, untested.

Until then, extend yesterday's partition list with the edges. You should now
have something like nine to eleven cases for one number field — and every one of
them earns its place.

## Check your understanding

- The rule is "password must be 8–64 characters". Give the six values you'd test
  for 3-value BVA.
- Why is a 0-byte file worth testing on an upload capped at 5 MB?
- Which single value would you test first if you only had one shot at "orders
  over Rp 500,000 ship free"?

**Next:** decision tables, for when the rules stop being a single range and start
combining.
`,
};
