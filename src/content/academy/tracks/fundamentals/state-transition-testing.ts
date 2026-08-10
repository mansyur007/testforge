import type { Lesson } from "../../types";

export const stateTransitionTesting: Lesson = {
  slug: "state-transition-testing",
  title: "State transition testing",
  summary:
    "For systems with memory: test the transitions, and then test the ones that should be impossible.",
  minutes: 11,
  status: "published",
  body: `
## When the same action gives different results

Click **Pay** on a *pending* order and you get a payment screen. Click **Pay** on
an order that's already *paid* and… what? The input is identical; the outcome
depends on the **state** the system is in.

Anything with a lifecycle needs this technique: orders, subscriptions, user
accounts, tickets, sessions, uploads, approval workflows. In your day job it's
the most under-used of the four basic techniques, and it's where the ugly
production bugs are — double charges, refunds on cancelled orders, tickets that
resurrect themselves.

## The model

Four ingredients:

- **States** — Draft, Pending payment, Paid, Shipped, Cancelled, Refunded
- **Transitions** — the legal moves between them
- **Events** — what triggers a move (customer pays, admin cancels, timeout)
- **Actions** — what else happens on the way (send email, release stock)

Drawn as a table, ShopMini orders:

| From \\ Event | pay | ship | cancel | refund |
|---|---|---|---|---|
| **Pending** | → Paid | – | → Cancelled | – |
| **Paid** | – | → Shipped | → Cancelled | → Refunded |
| **Shipped** | – | – | – | → Refunded |
| **Cancelled** | – | – | – | – |
| **Refunded** | – | – | – | – |

Every filled cell is a valid transition. **Every dash is a test too** — see
below.

## Three levels of coverage

**0-switch (all transitions).** One test per valid transition. Pending→Paid,
Paid→Shipped, Paid→Cancelled, and so on. This is the baseline, and for most
features it's the right amount.

**1-switch (all pairs of consecutive transitions).** Pending→Paid→Shipped,
Pending→Paid→Cancelled, Pending→Paid→Refunded… Catches bugs where the *route*
into a state matters — an order refunded after shipping behaves differently from
one refunded before, because stock was already released.

**All states.** Weakest: just visit every state at least once. Cheap, and better
than nothing when time is gone.

## The tests that matter most: invalid transitions

Every dash in that table is a claim: *"this must not be possible."* Nobody tests
those, so nobody notices when they are possible.

How to actually attempt them — because the UI usually hides the button:

- Open the order in two browser tabs. Cancel in one, then ship in the other.
- Call the API directly: \`POST /orders/42/ship\` on a cancelled order.
- Use the browser back button after a state change, then re-submit.
- Replay a webhook the payment provider already delivered.
- Let a background job (a 30-minute payment timeout) fire while a human is
  clicking.

The double-submit and the two-tab test find money bugs with startling
reliability. If you learn one habit from this lesson, make it **"try it twice,
try it late, try it from the API"**.

## Worked example: the refund that shouldn't exist

Requirement says refunds are allowed from *Paid* and *Shipped*. The table has no
Cancelled→Refunded transition. So:

1. Place an order, pay for it.
2. Cancel it (state: Cancelled, money returned).
3. Send the refund request again — from the API, or the stale tab.

If the system refunds a second time, you've found a defect worth more than the
rest of the sprint's testing put together. Expected result: rejected with a
clear error, and the order stays Cancelled.

## Where the states hide

Not everything with states looks like an order:

- A **form wizard** — can you jump to step 3 by URL without finishing step 2?
- **Auth** — logged out, logged in, session expired, password reset pending,
  2FA challenge outstanding. What does the back button do after logout?
- **Uploads** — queued, uploading, processing, done, failed. Retry from failed?
- **Feature flags and permissions** — the user's role changed while they had the
  page open.

## Check your understanding

- Draw the transition table for a subscription: Trial, Active, Past due,
  Cancelled. Which cells are dashes, and how would you attempt one?
- What does 1-switch coverage catch that 0-switch doesn't?
- Why does "the button isn't shown in that state" not close an invalid-transition
  test?

**Next:** putting it together — writing test cases someone else can run.
`,
};
