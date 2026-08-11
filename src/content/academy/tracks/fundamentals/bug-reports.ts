import type { Lesson } from "../../types";

export const bugReports: Lesson = {
  slug: "bug-reports",
  title: "Writing a bug report that gets fixed",
  summary:
    "Reproduction steps, evidence, and the difference between a report a developer can act on and one they'll close.",
  minutes: 12,
  status: "published",
  sandbox: true,
  body: `
## Your report competes for attention

A developer's backlog has forty items. Yours gets fixed if it's **cheap to
believe and cheap to reproduce**. Every minute you save them is a minute closer
to a fix; every ambiguity is an excuse to move on to the next ticket.

"Cannot reproduce" is almost always a defect in the report, not in the reader.

## The shape

**Title — one line, three parts:** what happens, where, under what condition.

- ✅ *Cart total not recalculated after removing the last item (Chrome 126,
  guest checkout)*
- ❌ *Cart broken*
- ❌ *Bug in checkout* — everything is a bug in checkout

**Environment.** Build/version, browser + version, OS, device, account and role,
environment (staging/prod), and the time it happened (so logs can be found).

**Preconditions.** The state before step 1, with real data: which account, which
product, how much in the cart.

**Steps to reproduce.** Numbered, minimal, deterministic. *Minimal* matters:
strip every step that isn't needed. A 12-step repro that could be 4 buries the
cause.

**Actual result.** What you saw. Quote the error text exactly; don't paraphrase.

**Expected result.** What should have happened, **and why** — link the
requirement, the acceptance criterion, or the test case. Without this you're
offering an opinion.

**Evidence.** Screenshot with the error visible, a short screen recording for
anything involving timing or animation, the failing request/response from the
network tab, the console error, the relevant log lines, the correlation/trace ID.

**Reproducibility.** "5 out of 5 attempts" or "2 out of 10 — appears related to a
slow network". Say it explicitly. Intermittent is a fact about the bug, not a
disclaimer about you.

## Severity vs priority — not the same thing

This distinction gets asked in every interview and misused in every project.

- **Severity** — how bad the *impact* is technically. Data loss, crash, wrong
  money: critical. Cosmetic misalignment: low. **The tester sets this.**
- **Priority** — how *soon* it should be fixed, given business context.
  **The product owner sets this.**

They come apart all the time:

| Case | Severity | Priority |
|---|---|---|
| App crashes on a device 3 users have | High | Low |
| Company name misspelled on the home page | Low | Urgent |
| Rounding error of Rp 1 on every invoice | Medium | Urgent (it's money, and it's every invoice) |
| Admin export fails, used once a quarter | High | Medium |

State severity with evidence and let priority be the business's call. Fighting
over priority is how testers lose credibility; presenting impact clearly is how
they gain it.

## Before you file: three checks

1. **Reproduce it a second time**, from a clean state (new session, incognito,
   fresh data). Half of "bugs" are stale local state.
2. **Reduce it.** Remove steps until it stops happening. The last step you
   removed is a clue about the cause.
3. **Search for a duplicate.** Linking to an existing report is more useful than
   a second copy of it.

Then, if you can, add one diagnostic: does it happen on another browser? another
account? via the API instead of the UI? That single extra data point often
localises the bug for the developer.

## Before / after

**Before**

> **Title:** Checkout doesn't work
> **Steps:** Try to check out, it fails
> **Expected:** It should work

**After**

> **Title:** Checkout returns 500 when the cart has an out-of-stock item
> (staging, build 1.4.2)
>
> **Environment:** staging, build 1.4.2, Chrome 126 / Windows 11, account
> \`buyer@shopmini.test\` (role: customer), 2026-08-10 14:32 WIB
>
> **Preconditions:** Cart contains 1 × SKU-1042 "Kaos Polos". Stock for SKU-1042
> set to 0 by an admin *after* the item was added to the cart.
>
> **Steps:**
> 1. Open \`/cart\`
> 2. Click **Checkout**
>
> **Actual:** Page shows "Something went wrong". \`POST /api/checkout\` returns
> **500**; response body \`{"error":"stock_unavailable"}\`; server log shows
> \`TypeError: Cannot read properties of null (reading 'reserve')\` at
> \`checkout.service.ts:88\`. Trace ID \`a41f-99c2\`.
>
> **Expected:** The customer is shown "Kaos Polos is out of stock — remove it to
> continue" and stays on the cart (AC-4 of ShopMini story #212). A stock race
> should not produce a 500.
>
> **Reproducibility:** 5/5. Also reproduces via the API with no UI involved.
>
> **Severity:** High (checkout blocked, unhandled server error).
> **Attachments:** screenshot, HAR file.

The second one gets fixed today. It also demonstrates something worth noticing:
the report is more valuable *because* the tester checked the API and the log.

## 🛠 Your turn, in TestForge

The sandbox exercise gives you a seeded ShopMini defect to find and file as a
proper defect record — title, environment, steps, actual vs expected, severity —
and the checker grades the structure, not your wording: minimal steps, an
observable actual result, an expected result tied to a requirement, and a
severity you can justify.

**Next:** what happens to that report after you file it.
`,
  selfCheck: [
    {
      id: "q1",
      stem: "The company name is misspelled on the home page. How would you classify it?",
      choices: [
        { id: "a", text: "High severity, high priority" },
        { id: "b", text: "Low severity, high priority", correct: true },
        { id: "c", text: "High severity, low priority" },
        { id: "d", text: "Low severity, low priority" },
      ],
      explanation:
        "Severity measures technical impact: nothing breaks, nothing is lost, so it is low. Priority is a business call about how soon it should be fixed, and a misspelled company name on the front page is embarrassing enough to jump the queue. The two axes are independent.",
    },
    {
      id: "q2",
      stem: "Before filing, which steps make your report harder to close as \"cannot reproduce\"?",
      multi: true,
      choices: [
        { id: "a", text: "Reproduce it a second time from a clean session", correct: true },
        { id: "b", text: "Remove steps until it stops happening", correct: true },
        { id: "c", text: "Record the exact build, browser and account used", correct: true },
        { id: "d", text: "File it immediately so no detail is forgotten" },
      ],
      explanation:
        "A clean-session repro rules out stale local state, reducing the steps localises the cause, and the environment is what lets someone else stand where you stood. Filing first and investigating later is what produces the reports that get bounced.",
    },
    {
      id: "q3",
      stem: "You saw the bug once in ten attempts. What do you do?",
      choices: [
        { id: "a", text: "Don't file it until it reproduces reliably" },
        { id: "b", text: "File it and state 1 in 10, with what you think varies", correct: true },
        { id: "c", text: "File it as though it always happens, so it gets attention" },
        { id: "d", text: "Ask a developer to reproduce it before filing" },
      ],
      explanation:
        "Intermittency is a fact about the defect, not a weakness in the report — and it is often the strongest clue, pointing at timing, concurrency or a slow network. Overstating frequency to get attention destroys the credibility you will need on the next report.",
    },
  ],
};
