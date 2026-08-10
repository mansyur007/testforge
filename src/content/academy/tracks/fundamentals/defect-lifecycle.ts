import type { Lesson } from "../../types";

export const defectLifecycle: Lesson = {
  slug: "defect-lifecycle",
  title: "The defect lifecycle",
  summary:
    "Where a bug report goes after you file it, who moves it, and how to handle 'works on my machine' without a fight.",
  minutes: 9,
  status: "published",
  body: `
## The states

Names differ per tool; the shape doesn't.

\`\`\`
New → Assigned → In progress → Fixed → Ready for test → Verified → Closed
                                   ↘ Reopened ↗
  ↘ Rejected (not a bug / duplicate / works as designed)
  ↘ Deferred (real, not now)
\`\`\`

- **New** — you filed it; nobody has triaged it.
- **Triaged / Assigned** — someone accepted it and set priority. Usually a
  standing meeting or a lead.
- **In progress → Fixed** — the developer's states. "Fixed" means *the code is
  written*, not that it works.
- **Ready for test** — deployed somewhere you can reach. Nothing is testable
  until this happens; a bug marked Fixed on a branch nobody deployed is not yours
  yet.
- **Verified → Closed** — **you** move these, by re-running the original steps
  (confirmation testing) *and* checking around the fix for what it might have
  broken.
- **Reopened** — the fix doesn't work, or works only for the exact steps you
  wrote. Reopen with new evidence; don't file a duplicate.
- **Rejected** — not a defect, a duplicate, or working as designed.
- **Deferred** — accepted as real, not fixed now. Should carry a reason.

**The rule that matters: whoever reported it, verifies it.** Developers closing
their own bugs is how regressions get to production.

## Verifying a fix properly

Re-running your exact steps is the minimum, not the job. Three more things:

1. **Vary the input** within the same partition. A fix that only handles the
   value in your report is a fix for your report, not for the bug.
2. **Test the neighbourhood.** A change to the cart total touches shipping,
   discounts, tax. This is where regression bugs are born.
3. **Check the other side of the boundary.** If the bug was "100 accepted when
   the max is 99", verify 99 still works. Fixes routinely overshoot.

## "Works on my machine"

This is a difference in conditions, not an accusation. Find it methodically:

- **Data.** Their account has 3 orders, yours has 4,000.
- **Build.** Are you on the same version? Was your build stale?
- **Environment.** Different env vars, feature flags, seeded data.
- **Browser/device.** Version, extensions, zoom level, screen width.
- **State.** Cache, cookies, a stale service worker, an old session.
- **Timing.** Slow network, concurrent requests, background job.
- **Permissions.** Their admin account vs your customer account.

Then reply with the *difference*, not the disagreement: "Reproduces on staging
with a customer account, not with admin — looks permission-dependent." You just
turned a stand-off into a lead.

Two habits that prevent most of these: always record the build/version, and
always try it once in a clean session before filing.

## Rejected — and when to push back

"Works as designed" sometimes means the design is wrong. That's not a testing
argument, it's a product one, so make it in product terms: who is affected, how
often, what it costs. "It's designed that way, but 30% of sign-ups hit this
screen and 12 support tickets last month came from it" is a case. "But it's a
bug" is not.

Accept rejection gracefully when the reasoning holds. Your credibility is a
budget; spend it on the reports that matter.

## Defect metrics worth knowing

You'll see these on dashboards — including TestForge's:

- **Defect density** — defects per module/story. Points at where to test more
  (principle 4: defects cluster).
- **Defect removal efficiency** — defects found before release ÷ total found
  including those found after. The honest measure of whether testing worked.
- **Defect age / time to fix** — how long reports sit.
- **Reopen rate** — high means "Fixed" is being used to mean "written".
- **Escape rate** — what production found that you didn't. Read it as a source of
  new test cases, not as a stick.

Beware of counting: "bugs found" is a terrible measure of a tester. It rewards
filing noise and punishes preventing defects in requirements review — the most
valuable thing you do.

## Check your understanding

- A developer marks your bug Fixed. What are the three things you check before
  Closed?
- The bug reproduces for you and not the developer. Name four differences worth
  checking first.
- Why is "number of bugs found" a bad performance metric for a tester?

**Next:** how all of this fits into a two-week sprint.
`,
};
