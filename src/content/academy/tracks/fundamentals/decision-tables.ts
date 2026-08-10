import type { Lesson } from "../../types";

export const decisionTables: Lesson = {
  slug: "decision-tables",
  title: "Decision tables",
  summary:
    "When several conditions combine to produce different outcomes, a table finds the rules nobody specified.",
  minutes: 12,
  status: "published",
  sandbox: true,
  body: `
## When to reach for one

Partitioning and BVA handle *one* input at a time. Decision tables handle
**combinations**: "free shipping if the order is over Rp 500,000 **and** the
address is domestic, **unless** the customer is a member, in which case…".

Prose hides gaps in rules like that. A table makes them impossible to hide —
which is why the technique's real value is often found **before** you run
anything: you fill in the table, three cells have no defined answer, and you go
ask.

## Building one, step by step

> **Requirement.** ShopMini checkout: a customer gets **free shipping** if the
> order total is over Rp 500,000. **Members** always get free shipping. Orders to
> **international** addresses never get free shipping.

**Step 1 — list the conditions** (the inputs, as yes/no where you can):

- C1: total over Rp 500,000?
- C2: customer is a member?
- C3: international address?

**Step 2 — list the actions** (the outcomes):

- A1: free shipping
- A2: charge Rp 20,000 shipping

**Step 3 — enumerate the combinations.** Three binary conditions → 2³ = 8 rules.

| | R1 | R2 | R3 | R4 | R5 | R6 | R7 | R8 |
|---|---|---|---|---|---|---|---|---|
| C1 over 500k | Y | Y | Y | Y | N | N | N | N |
| C2 member | Y | Y | N | N | Y | Y | N | N |
| C3 international | Y | N | Y | N | Y | N | Y | N |
| **A1 free shipping** | ? | ✓ | ✗ | ✓ | ? | ✓ | ✗ | ✗ |
| **A2 charge 20k** | ? | | ✓ | | ? | | ✓ | ✓ |

**Step 4 — fill in the actions and mark the ones you can't.** R1 and R5 are
question marks: a *member* with an *international* address. "Members always get
free shipping" and "international never gets free shipping" contradict each
other. The requirement doesn't say which wins.

**That's the deliverable.** Before writing a single test you've found a real
defect in the specification — the kind that ships as an argument between support
and finance three months later. Take R1 and R5 to the product owner.

**Step 5 — one test case per rule.** Eight columns, eight tests, each with
concrete data.

## Collapsing the table

2ⁿ grows fast: six conditions is 64 rules. Two legitimate ways to shrink it:

**Dashes for irrelevant conditions.** If international always means paid
shipping regardless of the rest, R3 and R7 collapse into one rule where C1 and
C2 are "–" (don't care). Fewer tests, same coverage of *outcomes*.

**Test the distinct actions, not every combination.** If eight rules produce
only two distinct outcomes, prioritise at least one test per outcome, plus the
combinations that involve the trickiest conditions.

Be careful: collapsing assumes you already know the conditions are independent.
That assumption is exactly what a decision table exists to check, so collapse
*after* you've enumerated, never instead of it.

## Coverage, stated plainly

Minimum decision table coverage = **one test per rule** (per column). If someone
asks "how do you know this pricing logic is covered?", the table is the answer,
and it's a much better one than a number.

## A second, sneakier example

> Login: an account can be *unverified*, *active* or *locked*. The password can
> be right or wrong. 2FA can be on or off.

3 × 2 × 2 = 12 rules. Now try to answer from the requirement: what happens when a
**locked** account enters the **correct** password with 2FA **on**? Should the
error reveal that the account is locked (helpful) or stay generic (secure)?
Nobody wrote that down. The table found it.

## 🛠 Your turn, in TestForge

The sandbox exercise asks you to build the shipping table for ShopMini as a
suite of test cases — one case per rule, named so a reader can tell which rule it
covers, with the contradictory rules raised as a question rather than guessed at.

The checker rewards two things: full rule coverage, and *not* silently inventing
an answer for R1/R5.

## Check your understanding

- Four binary conditions. How many rules before collapsing?
- What do you do with a cell whose outcome the requirement doesn't define?
- Why is "we tested the main combinations" a weaker answer than a decision table?

**Next:** state transition testing, for behaviour that depends on what happened
*before*.
`,
};
