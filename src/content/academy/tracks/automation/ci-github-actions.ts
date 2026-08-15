import type { Lesson } from "../../types";

export const ciGithubActions: Lesson = {
  slug: "ci-github-actions",
  title: "Running in CI with GitHub Actions",
  summary:
    "Workflows, matrices, artifacts, and keeping the pipeline under ten minutes.",
  minutes: 16,
  status: "published",
  sandbox: true,
  body: `
## A suite nobody runs is a suite nobody trusts

Tests on your laptop protect you. Tests on every pull request protect the team.
The gap between those two is the difference between automation as a personal
habit and automation as a safety net — and it is one file.

Two things have to be true before that file is worth writing, and both are
things previous lessons built: the suite has to pass reliably when run in a
different environment (locators, waiting), and each test has to own its data so
parallel workers do not collide.

## The smallest workflow that works

~~~yaml
# .github/workflows/e2e.yml
name: E2E

on:
  pull_request:
  push:
    branches: [main]

jobs:
  test:
    timeout-minutes: 20
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm

      - run: npm ci

      - run: npx playwright install --with-deps chromium

      - run: npx playwright test
        env:
          TF_BASE_URL: \${{ secrets.TF_BASE_URL }}
          TF_EMAIL: \${{ secrets.TF_EMAIL }}
          TF_PASSWORD: \${{ secrets.TF_PASSWORD }}
~~~

Line by line, the parts that are not obvious:

- **\`timeout-minutes\`** on the job. Without it a hung test burns the full six
  hours GitHub allows before anyone notices.
- **\`npm ci\`, not \`npm install\`** — it installs exactly the lockfile, so CI
  cannot drift to a different dependency tree than your machine.
- **\`--with-deps\`** installs the system libraries the browsers need. This is the
  step people omit and then spend an afternoon on a missing \`libnss3\`.
- **\`chromium\`** alone to start. Installing three browsers costs about a minute
  every run; add them when you have a reason.
- **Secrets in \`env\`, never in the file.** The repository is not a secret store,
  and a committed password is a rotation and an incident report.

## Artifacts are what make a red CI run debuggable

A failed run whose only output is "expected visible, got hidden" leaves you
guessing. Upload the report and the traces:

~~~yaml
      - uses: actions/upload-artifact@v4
        if: \${{ !cancelled() }}
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 7
~~~

**\`if: !cancelled()\`** rather than \`if: failure()\` — a passing run's trace is
what you want on the day something looks suspicious but green, and it is the only
way to compare a good run against a bad one. It skips genuinely cancelled runs,
which have nothing worth keeping.

Set retention deliberately. The default is 90 days, artifacts count against
storage billing, and nobody opens a three-week-old trace.

With \`trace: "on-first-retry"\` from the config in your first Playwright lesson,
the artifact contains a trace for exactly the tests that needed one. Download it,
run \`npx playwright show-trace\`, and you are stepping through the CI failure
frame by frame on your own machine. That loop — red on CI, trace on your desk in
two minutes — is the whole reason this lesson comes before the flaky-tests one.

## Where the application under test comes from

Three shapes, and choosing the wrong one is the most common reason a first CI
attempt fails:

**1. The app is in the same repository** — let Playwright start it:

~~~ts
// playwright.config.ts
webServer: {
  command: "npm run build && npm run start",
  url: "http://localhost:3000",
  reuseExistingServer: !process.env.CI,
  timeout: 120_000,
},
~~~

**2. A deployed environment** — point \`baseURL\` at staging and run after deploy.
Simplest to configure, and it introduces a real hazard: your tests now share an
environment with everyone else's, which is exactly the shared-state problem the
test-data lesson described, one level up. Unique data per run matters more here,
not less.

**3. Services the app needs** — a database, a cache — as service containers:

~~~yaml
    services:
      postgres:
        image: postgres:16
        env: { POSTGRES_PASSWORD: postgres }
        options: >-
          --health-cmd pg_isready --health-interval 10s --health-retries 5
~~~

The health options are not decoration. Without them the job starts your tests
before Postgres accepts connections, and you get a failure that looks like a
flaky test and is not.

## Keeping it under ten minutes

A pipeline people wait for gets read; one that takes forty minutes gets merged
around. Roughly in order of payoff:

| Lever | Typical effect |
|---|---|
| \`fullyParallel: true\` and \`workers: 4\` on CI | The largest single win |
| Sharding across jobs (below) | Near-linear with the number of runners |
| Cache the browser binaries | 30–60s per run |
| One browser on PRs, the full matrix nightly | Cuts browser time by two-thirds |
| API setup instead of UI setup | Seconds per test, compounding |
| \`storageState\` instead of logging in per test | Seconds per test |

Sharding splits the suite across parallel jobs:

~~~yaml
    strategy:
      fail-fast: false
      matrix:
        shard: [1, 2, 3, 4]
    steps:
      - run: npx playwright test --shard=\${{ matrix.shard }}/4
~~~

**\`fail-fast: false\`** matters: the default cancels the other shards as soon as
one fails, so you learn about one failure instead of all of them and need another
full run to find the rest.

Sharding produces one report per shard. Playwright's \`blob\` reporter plus
\`npx playwright merge-reports\` reassembles them into one, which also matters for
the next lesson — **the capstone wants one JUnit file, not four**.

## The browser matrix, and when to pay for it

~~~yaml
    strategy:
      matrix:
        browser: [chromium, firefox, webkit]
~~~

Tripling every run on every pull request is usually the wrong trade. The pattern
that holds up: **chromium on pull requests, the full matrix nightly or before a
release.** Cross-browser defects are real but rare, and they are rarely urgent
within the ten minutes somebody is waiting to merge.

This is the automation form of the argument T2's compatibility lesson made about
choosing a device matrix from real usage rather than from the list of everything
that exists.

## The rules that keep CI honest

- **A red pipeline blocks the merge.** A suite that can be ignored will be, and
  from that day it is documentation rather than a gate.
- **\`forbidOnly: !!process.env.CI\`.** One committed \`test.only\` otherwise reduces
  your whole suite to a single green test, silently.
- **Retries are a bandage with a bill.** \`retries: 2\` on CI is a reasonable
  default and it hides flakiness rather than fixing it. Keep the setting and keep
  reading which tests only pass on attempt two — that list is the next lesson's
  subject.
- **Never disable a failing test to go green.** Quarantine it explicitly, with an
  owner and a date. The difference between quarantine and deletion is that
  somebody is still accountable.
- **Don't point CI at production.** The test-data lesson's boundaries apply with
  more force here, because CI runs unattended and often.

## The exercise

Put a workflow on a repository and make it run against **your TestForge sandbox
project**:

1. Create \`.github/workflows/e2e.yml\` from the workflow above.
2. Add \`TF_BASE_URL\`, \`TF_EMAIL\` and \`TF_PASSWORD\` as repository secrets —
   Settings → Secrets and variables → Actions. Confirm nothing sensitive is in
   the file you committed.
3. Open a pull request and watch it run.
4. **Make one test fail on purpose**, push, and download the artifact. Open the
   trace with \`npx playwright show-trace\` and find the frame where it went wrong.
5. Fix it and watch the check go green.

Step four is the point again. A workflow you have only ever seen pass has not
taught you anything yet; the skill is turning a red CI run into a diagnosis
without access to the machine it failed on.

## Where TestForge fits

Right now your results live in a GitHub artifact that expires in seven days,
attached to one pull request, visible to whoever thinks to look. That is fine for
debugging and useless for the questions a team actually asks — is this case
getting worse, which tests fail most often, what did last month look like.

Adding one reporter line and one upload step sends the same results somewhere
they accumulate against the cases they exercise. That is the capstone, and it is
next.

**Next:** the capstone — emit JUnit XML, upload it to TestForge through
\`/api/v1/junit\`, and read back the run you just created.
`,
  selfCheck: [
    {
      id: "q1",
      stem: "Why upload the Playwright report artifact with `if: !cancelled()` rather than `if: failure()`?",
      choices: [
        {
          id: "a",
          text: "failure() is not a valid GitHub Actions expression",
        },
        {
          id: "b",
          text: "A passing run's trace is what lets you compare a good run against a bad one when something is green but suspicious",
          correct: true,
        },
        {
          id: "c",
          text: "Artifacts uploaded on failure are automatically deleted after the job ends",
        },
        {
          id: "d",
          text: "failure() only triggers when the whole workflow fails, never a single job",
        },
      ],
      explanation:
        "Keeping artifacts from green runs costs storage and buys you the baseline: when a test starts behaving oddly without failing, the only way to see what changed is to compare its trace against one from when things were fine. !cancelled() also still skips genuinely cancelled runs, which have nothing worth keeping. failure() is valid and does work at the step level — it just throws away the comparison, which is exactly what you want on the day a green suite stops being trustworthy. Retention is worth setting deliberately in either case, since the default keeps everything for 90 days against your storage bill.",
    },
    {
      id: "q2",
      stem: "A sharded workflow uses the default fail-fast behaviour. Shard 2 fails. What is the practical cost?",
      choices: [
        {
          id: "a",
          text: "The remaining shards are cancelled, so you see one failure and need another full run to find the rest",
          correct: true,
        },
        {
          id: "b",
          text: "The failing shard is retried automatically until it passes or the job times out",
        },
        {
          id: "c",
          text: "Shard 2's tests are redistributed across the other shards",
        },
        {
          id: "d",
          text: "Nothing — fail-fast only affects matrix builds across browsers, not shards",
        },
      ],
      explanation:
        "fail-fast cancels the sibling matrix jobs the moment one fails, which is sensible for a build where the first error explains everything and wasteful for a test suite where each shard holds independent information. You fix the one failure you saw, push, and then discover the three in shard 4 — two full pipeline cycles instead of one. Setting fail-fast: false is the fix. It applies to any matrix dimension, shards included, and it has nothing to do with retries or redistributing tests.",
    },
    {
      id: "q3",
      stem: "Which of these belong in a CI workflow for a browser suite?",
      multi: true,
      choices: [
        {
          id: "a",
          text: "npm ci rather than npm install",
          correct: true,
        },
        {
          id: "b",
          text: "npx playwright install --with-deps",
          correct: true,
        },
        {
          id: "c",
          text: "Credentials committed to the workflow file so the run is reproducible",
        },
        {
          id: "d",
          text: "timeout-minutes on the job",
          correct: true,
        },
      ],
      explanation:
        "npm ci installs exactly the lockfile, so CI cannot silently drift onto a different dependency tree than the one you tested against. --with-deps installs the system libraries the browsers need, and omitting it produces the missing-libnss3 class of failure that looks like a broken test and is not. A job timeout stops a hung run from burning the full six hours GitHub allows. Credentials belong in repository secrets and referenced through env — a repository is not a secret store, and committing a working login turns a routine change into a rotation and an incident report, which is the same boundary the test-data lesson drew.",
    },
  ],
};
