import type { Lesson } from "../../types";

export const performanceTesting: Lesson = {
  slug: "performance-testing",
  title: "Performance testing with k6",
  summary:
    "Load, stress and soak — and what a p95 actually tells you.",
  minutes: 16,
  status: "published",
  body: `
## The average is the enemy

"Average response time: 200ms." Everyone nods, the release ships, and support
spends the week on complaints.

Here is why. Ten requests: nine at 100ms, one at 1.2 seconds. The average is
210ms and looks fine. But **one user in ten waited over a second**, and if that
request is the checkout button, that is 10% of your revenue having a bad time.

Averages hide the tail, and the tail is where users live. Percentiles are the fix:

| Metric | Reads as |
|---|---|
| p50 (median) | Half of users had it better than this |
| p95 | 1 in 20 had it worse |
| p99 | 1 in 100 had it worse — your loudest complainers |

**Report p95 and p99, and never report an average alone.** At scale, p99 is not
an edge case: a page making 50 requests will hit its own p99 on almost every
load, and the users who land there are disproportionately the ones with the most
data, which usually means your best customers.

## Four test types, four different questions

They get used interchangeably and they are not the same:

| Type | Question | Shape |
|---|---|---|
| **Load** | Does it hold up at expected traffic? | Ramp to normal peak, hold |
| **Stress** | Where does it break, and how? | Ramp past peak until it fails |
| **Soak** | Does it degrade over hours? | Moderate load, several hours |
| **Spike** | Does it survive a sudden surge? | Jump to 10× instantly, drop back |

**Soak is the one people skip and the one that finds memory leaks**, connection
pool exhaustion, and disks filling with logs. Those never appear in a
twenty-minute run — they appear at 3am on day four, which is also when nobody is
watching.

Stress testing has a second purpose worth naming: **how a system fails matters as
much as when.** Graceful degradation — queuing, shedding load, a clear error —
is a very different outcome from data corruption or a cascade that takes the
database with it.

## k6: a load test is a script

~~~js
// load-test.js
import http from "k6/http";
import { check, sleep } from "k6";

export const options = {
  stages: [
    { duration: "2m", target: 100 },   // ramp up
    { duration: "5m", target: 100 },   // hold
    { duration: "2m", target: 0 },     // ramp down
  ],
  thresholds: {
    http_req_duration: ["p(95)<500", "p(99)<1500"],
    http_req_failed: ["rate<0.01"],
  },
};

export default function () {
  const res = http.get(\`\${__ENV.BASE_URL}/api/v1/projects\`, {
    headers: { Authorization: \`Bearer \${__ENV.API_KEY}\` },
  });

  check(res, {
    "status is 200": (r) => r.status === 200,
    "body is not empty": (r) => r.body.length > 0,
  });

  sleep(1);
}
~~~

~~~bash
k6 run --env BASE_URL=https://staging.example.com --env API_KEY=$KEY load-test.js
~~~

Three things in that file do the real work:

**\`stages\`** — the ramp. Never start at full load: you want to see *where*
degradation begins, and a cold start at 100 users measures your connection pool
warming up rather than your application.

**\`thresholds\`** — the pass/fail criteria, and the reason this is a *test*
rather than a measurement. Without them k6 prints numbers and exits 0, and a
"performance test" that cannot fail is the same non-test as a UI test with no
assertion. With them, k6 exits non-zero and CI goes red.

**\`sleep(1)\`** — think time. Real users pause between actions. Without it you
are simulating a denial-of-service attack, and the numbers you get describe a
scenario that will never happen.

**\`check()\` is not an assertion.** A failed check is recorded and the script
continues — it does not fail the run. Only thresholds do. This trips up everyone
once.

## A number without its conditions is an opinion

T2's non-functional lesson made this the shape of every finding, and it is the
whole discipline here. Not "the API is slow" but:

> \`GET /api/v1/projects\` at 100 concurrent users, staging, 8 vCPU / 16GB, seeded
> with 500 projects: p95 1.8s against a 500ms target, error rate 0.3%. p95 was
> 240ms at 20 users. Degradation begins around 60 users.

Everything in that sentence is load-bearing. **Same environment, same data
volume, same version, or the comparison is meaningless** — and the second-most
common mistake in performance testing is running against a database with 50 rows
when production has 5 million. The first is having no target at all.

**Where the target comes from is a conversation, not a guess.** "p95 under 500ms
at 200 concurrent users" should come from real traffic data and a product
decision. Inventing one yourself produces a test that measures your imagination.

## Reading the result

k6's summary, and what each line is actually telling you:

~~~
http_req_duration.....: avg=210ms min=98ms med=180ms p(90)=420ms p(95)=1.2s
http_req_failed.......: 0.30% ✓ 29 ✗ 9571
iterations............: 9600  32/s
vus...................: 100
~~~

Three questions, in order:

1. **Did failures appear before slowness, or after?** Errors first usually means
   a hard limit — connection pool, rate limiter, file descriptors. Slowness first
   means saturation of something continuous — CPU, database, disk.
2. **Where did p95 leave the pack?** The gap between p50 and p95 widening is the
   signal. A flat p50 with a climbing p95 is queuing.
3. **Did it recover?** Response times returning to baseline after ramp-down is
   healthy. Staying high means something did not release — the leak a soak test
   would have found.

**A load test that only tells you the numbers has done half the job.** The other
half is server-side: CPU, memory, database slow query log, connection counts.
Without them you know *that* it slowed down and not *why*, and the fix is on the
other side of that question.

## Where testers go wrong

- **Testing the wrong thing.** The login endpoint is rarely the bottleneck. Test
  the journey that matters commercially and the endpoints that touch the most
  data.
- **A tiny dataset.** A query that is instant over 500 rows and catastrophic over
  5 million is the single most common production performance defect, and an empty
  staging database is guaranteed to miss it.
- **Ignoring caching.** The second run is fast because of a cache, not because
  you fixed anything. Vary the parameters, or measure cold and warm separately
  and say which you are reporting.
- **One run.** Run it three times. If the numbers disagree wildly, that variance
  *is* your finding.
- **Load-testing production.** Do not, without written agreement, a scheduled
  window, and someone watching. This is the same rule of engagement T2 set for
  security probing, and here it is easier to cause real damage by accident.

## Where it belongs in the pipeline

Every pull request is too often; before a release is too late to fix anything
cheaply. The pattern that works:

- **A short smoke load test on merge to main** — one minute, 10 users, a
  threshold. Catches order-of-magnitude regressions immediately.
- **A full load test nightly or weekly**, on a stable environment.
- **A soak before a major release**, or after any change to caching, pooling or
  session handling.

Thresholds make all three CI-able: k6 exits non-zero when one is breached, which
is all a pipeline needs.

## Where TestForge fits

k6 can emit JUnit XML, which means a load test can become a run against cases the
same way your Playwright suite does — one case per scenario, with the threshold
as the pass criterion.

That is more useful than it first sounds. Performance results in a shared history
turn "it feels slower lately" into a line you can point at: the same scenario,
same environment, p95 climbing from 240ms to 900ms across six weeks of builds.
The automation track's capstone is the mechanism; this is another thing worth
sending through it.

**Next:** security testing for QA — the OWASP Top 10 through a tester's eyes, and
the checks you can run without becoming a penetration tester.
`,
  selfCheck: [
    {
      id: "q1",
      stem: "A report says \"average response time 200ms, well within our 500ms target\". Why is that potentially hiding a serious problem?",
      choices: [
        {
          id: "a",
          text: "Averages are always calculated incorrectly by load testing tools",
        },
        {
          id: "b",
          text: "An average hides the tail — a small share of very slow requests barely moves it, but those are real users having a bad experience",
          correct: true,
        },
        {
          id: "c",
          text: "200ms is measured server-side, so the real figure is always higher",
        },
        {
          id: "d",
          text: "Nothing is hidden, as long as the sample size is large enough",
        },
      ],
      explanation:
        "Nine requests at 100ms and one at 1.2 seconds average out to 210ms, which looks comfortable while one user in ten waited over a second — and if that request is checkout, that is a tenth of your revenue having a bad time. A larger sample makes this worse rather than better, because the tail gets longer while the average stays flat. Percentiles are what expose it: p95 and p99 say directly how bad it gets for the unlucky, and at scale p99 is not an edge case, since a page making 50 requests hits its own p99 almost every load. Report p95 and p99, and never an average alone.",
    },
    {
      id: "q2",
      stem: "A k6 script has several check() calls that fail during the run, but the run exits 0 and CI stays green. Why?",
      choices: [
        {
          id: "a",
          text: "Checks only fail a run when more than 50% of them fail",
        },
        {
          id: "b",
          text: "check() records a result and continues; only thresholds decide the exit code",
          correct: true,
        },
        {
          id: "c",
          text: "Checks are disabled automatically when stages are configured",
        },
        {
          id: "d",
          text: "The run must be invoked with --strict for checks to count",
        },
      ],
      explanation:
        "This is the distinction that catches everyone once: checks are observations recorded in the summary, while thresholds are the pass criteria that set the exit code. A script with checks and no thresholds prints numbers and exits 0 no matter how badly it performed — which is the same non-test as a UI test with no assertion, and exactly why a performance test without thresholds cannot be wired into a pipeline. Adding http_req_duration: [\"p(95)<500\"] is what turns the measurement into a test that can go red.",
    },
    {
      id: "q3",
      stem: "Which of these would make a performance result untrustworthy or unactionable?",
      multi: true,
      choices: [
        {
          id: "a",
          text: "Running against a staging database with 500 rows where production has 5 million",
          correct: true,
        },
        {
          id: "b",
          text: "Reporting \"p95 1.8s\" without naming the environment, data volume and concurrency",
          correct: true,
        },
        {
          id: "c",
          text: "Ramping up through stages rather than starting at full load",
        },
        {
          id: "d",
          text: "Reusing identical parameters every iteration so responses are served from cache",
          correct: true,
        },
      ],
      explanation:
        "The dataset gap is the most common production performance defect there is — a query that is instant over 500 rows and catastrophic over 5 million passes every test you ran. A number without its conditions cannot be compared to anything, which is T2's non-functional lesson applied here: same environment, same data volume, same version, or the comparison is meaningless. And identical parameters measure your cache rather than your application, so vary them or report cold and warm separately and say which. Ramping through stages is correct practice, not a flaw: it shows where degradation begins, and starting cold at full load measures your connection pool warming up.",
    },
  ],
};
