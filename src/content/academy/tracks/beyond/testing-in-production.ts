import type { Lesson } from "../../types";

export const testingInProduction: Lesson = {
  slug: "testing-in-production",
  title: "Observability and testing in production",
  summary:
    "Feature flags, canaries, synthetic checks, and reading your own logs.",
  minutes: 14,
  status: "published",
  body: `
## What this is not

"Testing in production" does not mean skipping the testing before it. Every
argument in the previous eleven lessons still holds.

It means accepting something staging cannot fix. Staging has a fraction of the
data, none of the traffic, mocked third parties, a different network, and none
of your users. Some defects only exist where those things are real — and they
are found in production either way. **The only question is whether you find them
before your users do, or read about them in a support ticket.**

The previous lesson was about getting confidence without a full environment
before deploy. This one is about the half that comes after.

## Two prerequisites, and neither is optional

You are allowed to test in production when you can do both of these:

**See what happens.** Logs, metrics and traces, reachable by you, not just by
the platform team. Without them you are not testing, you are poking.

**Limit the damage.** A feature flag, a canary, and a rollback that takes
minutes. Without those, every production test is a bet on being right.

A team with neither should treat "we test in production" as a description of
what is happening to them, not a strategy.

## Observability, in tester's terms

| | Answers | You use it to |
|---|---|---|
| **Metrics** | *Is* something wrong? | Notice a change: error rate, latency, throughput |
| **Traces** | *Where* is it wrong? | Follow one request across services |
| **Logs** | *What* happened? | Read the detail of the specific failure |

The practical version for a tester: when you reproduce something in production,
**capture the trace id.** A bug report carrying a trace id skips the entire
"can you give us a timestamp and we'll go looking" round trip, and it is the
single highest-value habit in this lesson.

The **four golden signals** are what to watch when you do not know what to watch:
latency, traffic, errors, saturation. Most production surprises show up in one of
those four before anyone files anything.

And the numeric version of T2's rule — a number without its conditions is an
opinion — is the **SLO**: "99.5% of checkout requests under 800ms over 30 days".
That sentence has a target, a scope and a window, so it can be met or missed
rather than argued about. The gap between it and 100% is the error budget, and a
spent budget is a legitimate reason to stop shipping features.

## Deploy and release are different events

Separating them is the biggest testability win available in production, and it
is what makes everything below safe.

**Feature flags** ship the code dark and turn it on for whoever you choose —
your own account first, then internal users, then a percentage. Testing with
real data, real integrations and real traffic, with an off switch that does not
need a deploy.

Three things flags demand in return:

- **Test both states.** The off path is the rollback path. A flag whose off
  branch was never exercised is a rollback that fails at the worst moment.
- **They multiply state space.** Ten independent flags are 1024 combinations.
  Nobody tests 1024 combinations, so keep the number of *simultaneously live*
  flags small and know which ones interact.
- **They are debt.** A flag that has been on for everyone for six months is dead
  configuration and untested branches. Removing it is a task, and it should be
  on the board.

**Canary releases** send a small share of real traffic to the new version and
compare its error rate and latency against the old one. This is automatable and
usually under-automated: the comparison is the test, and the rollback should be
its assertion failing.

**Blue-green** keeps two full environments and switches traffic. Faster
rollback, more infrastructure, and — the part people forget — **your database
migration has to work for both versions at once**, which is a testing problem
before it is an operations one.

## Synthetic monitoring: where your E2E suite goes to live

Take the five or six tests that cover your critical paths — login, search,
checkout — and run them against production on a schedule from a couple of
regions. They answer a question no dashboard does: *does the thing work right
now, whether or not anyone has tried it yet.*

Rules that keep it from becoming a liability:

- **A dedicated, identifiable test account**, never a real customer's.
- **Read-only where possible**, and where not, clean up after yourself.
- **Tag the traffic** so it is excluded from analytics, conversion metrics and
  revenue reporting. Synthetic checkouts in the sales figures is an easy mistake
  to make once.
- **Nothing destructive**, no third-party systems (a synthetic payment is a real
  payment), and no test data left where support will find it and open a ticket.

Synthetic and real-user monitoring answer different questions and you want both:
RUM tells you what your users actually experienced on their real devices,
synthetics tell you whether a specific journey is working at 4am on a quiet
Sunday.

## Production is also your best source of test ideas

This is the part testers under-use. Before designing the next test round, go and
read:

- **The most-used flows.** Effort should follow usage, and the ranking is almost
  never what the team assumes.
- **The real browser and device mix.** T2's compatibility lesson said to build
  the matrix from your own analytics rather than from a market-share chart —
  this is that data.
- **The endpoints carrying most of the traffic**, which is where a performance
  regression hurts most.
- **The errors already happening.** Most applications log failures nobody has
  triaged. Reading a week of them is often the highest-yield hour in a sprint.
- **The searches returning nothing**, the forms abandoned at one particular
  step, the retries.

And after every incident: **an incident that does not produce a test is an
incident you have agreed to have again.** Write the regression check while the
post-mortem is still open, not from the ticket three weeks later.

## Where TestForge fits

Point the scheduled synthetic run at a project of its own and upload each result
through \`/api/v1/junit\` the way the T3 capstone did. The value is not the
individual run, it is the record: a suite named after each critical journey, one
result per interval, so **"was checkout working last Tuesday at 03:00"** becomes
a query rather than a memory.

The honest limitation: this is a test-management system, not an alerting
platform. It will hold the history and show you the pattern; it will not page
anyone at 3am. Wire the alert to your monitoring stack and keep TestForge for
the record that survives the incident.

**Next:** AI in QA — where it genuinely helps, and where a plausible-looking test
is worse than no test at all.
`,
  selfCheck: [
    {
      id: "q1",
      stem: "A team wants to start testing new features against production traffic. What has to be in place first?",
      choices: [
        {
          id: "a",
          text: "A complete end-to-end suite passing on staging, so production testing is only a confirmation",
        },
        {
          id: "b",
          text: "The ability to observe what happens — logs, metrics, traces — and the ability to limit the blast radius with flags, canaries and a fast rollback",
          correct: true,
        },
        {
          id: "c",
          text: "A production database copy that testers can query directly",
        },
        {
          id: "d",
          text: "Written sign-off from support that they will handle any customer impact",
        },
      ],
      explanation:
        "Those two capabilities are what separate testing in production from gambling in production. Without observability you cannot tell what your change did, so nothing you learn is evidence; without a flag, a canary or a quick rollback, every attempt is a bet that you were right. A green staging suite is worth having and does not substitute for either — the whole premise is that staging lacks the data, traffic and real integrations where these defects live. Direct query access to customer data is a privacy problem rather than a prerequisite, and sign-off from support is not a control: it moves the consequence to another team instead of limiting it.",
    },
    {
      id: "q2",
      stem: "Why does a feature flag's 'off' state need testing as deliberately as its 'on' state?",
      choices: [
        {
          id: "a",
          text: "Because the off state is the rollback path, and a rollback that was never exercised fails exactly when you need it",
          correct: true,
        },
        {
          id: "b",
          text: "Because flags evaluated as off still execute both code branches",
        },
        {
          id: "c",
          text: "Because most flag platforms default to on if the service is unreachable",
        },
        {
          id: "d",
          text: "Because the off state is what search engines index",
        },
      ],
      explanation:
        "Turning the flag off is the emergency plan, so an untested off branch means the recovery is unverified at the moment it matters most — typically during an incident, under time pressure, with the person who wrote it asleep. This is also why the number of simultaneously live flags matters: ten independent flags are 1024 combinations, and nobody tests 1024 of anything, so the discipline is to keep the live set small and know which ones interact. The other options describe behaviour flag systems do not have; a well-configured client fails closed to the old path precisely because that path is the safe one.",
    },
    {
      id: "q3",
      stem: "Which of these are sound practices for a synthetic monitoring suite running against production?",
      multi: true,
      choices: [
        {
          id: "a",
          text: "Using a dedicated, identifiable test account rather than a real customer's",
          correct: true,
        },
        {
          id: "b",
          text: "Tagging the traffic so it is excluded from analytics and revenue reporting",
          correct: true,
        },
        {
          id: "c",
          text: "Cleaning up any data the run creates, and keeping the checks read-only where possible",
          correct: true,
        },
        {
          id: "d",
          text: "Including a real payment through the live payment provider, so the check covers the whole journey",
        },
      ],
      explanation:
        "The first three are what keep a production suite from causing the problems it is meant to detect: an identifiable account means support and the data team can recognise the activity, tagging keeps synthetic runs out of conversion and revenue figures, and cleanup stops the suite from filling production with debris someone else has to triage. The payment is the line: a synthetic transaction through a live provider is a real transaction with real money and a real third party, which the rules of engagement exclude — the same boundary the security lesson drew. Cover the journey up to the provider's boundary and verify the integration itself in a sandbox environment built for it.",
    },
  ],
};
