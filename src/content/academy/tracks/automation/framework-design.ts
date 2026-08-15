import type { Lesson } from "../../types";

export const frameworkDesign: Lesson = {
  slug: "framework-design",
  title: "Designing a framework you can hand over",
  summary:
    "Config, reporting, conventions, and the README that makes it survivable.",
  minutes: 15,
  status: "published",
  body: `
## The test that matters is not in the suite

Here it is: **a new person clones the repository on Monday and opens a correct
pull request by Wednesday, without asking you anything.**

Every decision in this lesson serves that. A suite only one person can run is not
an asset — it is a dependency on that person, and it quietly stops being
maintained the week they change teams.

You have the pieces already. This lesson is about arranging them so somebody else
can pick them up.

## Layout, and the rule behind it

~~~
e2e/
├── README.md
├── playwright.config.ts
├── .env.example
├── fixtures/
│   └── index.ts            # test data, auth, per-worker setup
├── pages/
│   ├── login.page.ts
│   └── project.page.ts
├── helpers/
│   └── api.ts              # thin wrappers over /api/v1
└── tests/
    ├── auth/
    ├── projects/
    └── cases/
~~~

**Group tests by feature, not by test type.** \`tests/checkout/\` beats
\`tests/smoke/\` and \`tests/regression/\`, because the person changing checkout
needs to find every test about checkout — and because a test's "type" changes
depending on who is asking, while the feature it covers does not.

Tags handle the rest without a second directory tree:

~~~ts
test("@smoke TC-SHOP-12 a valid login lands on the dashboard", async ({ page }) => {
~~~

~~~bash
npx playwright test --grep @smoke
~~~

## Config: the choices, made once, visibly

~~~ts
// playwright.config.ts
export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 4 : undefined,
  timeout: 30_000,
  expect: { timeout: 5_000 },

  reporter: [
    ["list"],
    ["html", { open: "never" }],
    ["junit", { outputFile: "results/junit.xml" }],
  ],

  use: {
    baseURL: process.env.TF_BASE_URL ?? "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },

  projects: [
    { name: "setup", testMatch: /global\\.setup\\.ts/ },
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"], storageState: "results/auth.json" },
      dependencies: ["setup"],
    },
  ],
});
~~~

Nothing here is new — every line arrived in an earlier lesson. What is new is
that they are **in one file with the reasons visible in the values**:
\`retries\` differs between CI and local because the tradeoff differs;
\`trace: "on-first-retry"\` because that is when you need it and it is expensive
otherwise. A config full of unexplained numbers is the first thing a new person
mistrusts.

The \`setup\` project signs in once and writes \`storageState\`, so every test
starts authenticated — the answer the page-objects lesson gave to sixty slow
logins.

## Configuration comes from the environment

~~~bash
# .env.example — committed. Real .env is gitignored.
TF_BASE_URL=http://localhost:3000
TF_PROJECT=your-project-slug
TF_EMAIL=qa@example.com
TF_PASSWORD=
TF_API_KEY=
~~~

**Commit \`.env.example\`, never \`.env\`.** The example is documentation that
cannot go stale silently: if a new variable is needed and not added there, the
next person's first run fails with a missing variable rather than something
mysterious.

Fail loudly and early on a missing variable:

~~~ts
// global.setup.ts
for (const key of ["TF_BASE_URL", "TF_EMAIL", "TF_PASSWORD"]) {
  if (!process.env[key]) throw new Error(\`Missing required env var: \${key}\`);
}
~~~

Twenty tests timing out because \`baseURL\` is undefined is a twenty-minute
diagnosis. One line naming the missing variable is a ten-second one.

## Conventions worth writing down

Four, and they are the ones that decay first without a written rule:

- **Test names carry the case id** — \`TC-<SLUG>-<n>\`, so results match in
  TestForge. Enforce it with a lint rule if the suite is large.
- **Page objects expose actions and locators; tests own assertions.**
- **Every test creates its own data and cleans up in a fixture.**
- **No \`waitForTimeout\`.** Ban it in review; an ESLint rule is better.

Written down they survive a handover. As folklore they last until the second new
joiner.

## The README is part of the deliverable

The single highest-value file in the repository, and the most commonly missing.
Six sections:

~~~markdown
# E2E Tests

## Setup
git clone … && npm ci && npx playwright install --with-deps
cp .env.example .env   # then fill it in — ask #qa for credentials

## Running
npm run e2e                  # everything
npm run e2e -- --grep @smoke # smoke only
npm run e2e -- --ui          # interactive, best for writing tests

## When something fails
npx playwright show-report
npx playwright show-trace results/…/trace.zip

## Structure
tests/ by feature · pages/ page objects · fixtures/ data + auth

## Conventions
Test names carry TC-<SLUG>-<n>. No waitForTimeout. Tests own assertions.

## Who to ask
#qa-automation · owner: @ade
~~~

**"When something fails" is the section people skip and need most.** A new joiner
whose first run is red will either learn to read a trace in two minutes or
conclude the suite is broken. Which of those happens is decided by whether that
section exists.

## What to hand over besides code

A framework is not only a repository:

- **CI that runs it**, on pull requests, red blocking merge.
- **Results going somewhere durable** — the capstone's upload, so history
  outlives a seven-day artifact.
- **A named owner**, and ideally two people who have both run it locally. A suite
  exactly one person has ever run is not handed over.
- **A quarantine list with dates**, so the next person inherits the debt
  explicitly instead of discovering it.

## Knowing when to stop building

The failure mode the page-objects lesson warned about applies to the whole
framework, and at this scale it is more expensive:

- **A custom reporter** when the HTML one was fine.
- **A wrapper API over Playwright** so tests call \`click(el)\` instead of
  \`el.click()\` — now nobody can read the official documentation and apply it.
- **A config abstraction layer** for one environment.
- **A homegrown data generator** where faker existed.

The check: **does this help someone else write a test faster, or does it only
please me?** Abstractions earn their place by being used three times, not by
being anticipated. The best framework is mostly Playwright, arranged clearly,
with a good README.

## A last word on what this is for

Twelve lessons ago the argument was that automation is worth it only where it
pays back, and that "automation replaces manual QA" is false. Everything since
has been in service of a suite that a team trusts: locators that survive a
refactor, assertions that can fail, tests that own their data, results that
accumulate, flakiness treated as a number rather than a mood.

What you have at the end is not a pile of scripts. It is a feedback loop —
somebody changes the application, and within ten minutes the team knows what it
broke, in terms tied to the cases they already wrote.

## Where TestForge fits

Your sandbox project is a working example of the whole loop: cases, a suite, runs
with history, and results arriving from CI through \`/api/v1/junit\`. That is the
thing to show someone who asks what you can do.

Two next steps worth taking:

- **Do it for real.** Point a workflow at an application you actually use, even a
  small one, and let a fortnight of history accumulate.
- **Write it up.** A repository, a README, and a project with real runs is a
  portfolio piece a hiring manager can open — which is where the Beyond
  Functional track picks up.

**You have finished QA Automation.** The Beyond Functional track goes further
out — performance, security, contract testing, observability, and building the
portfolio this track has been quietly assembling. It is being written now, and
the roadmap lists its lessons.
`,
  selfCheck: [
    {
      id: "q1",
      stem: "Why group tests by feature (tests/checkout/) rather than by type (tests/smoke/, tests/regression/)?",
      choices: [
        {
          id: "a",
          text: "Playwright cannot run a directory selectively, so type directories have no effect",
        },
        {
          id: "b",
          text: "Someone changing checkout needs to find every test about checkout, and a test's type changes with who is asking while its feature does not",
          correct: true,
        },
        {
          id: "c",
          text: "Feature directories run faster because Playwright parallelises by folder",
        },
        {
          id: "d",
          text: "Type directories break the JUnit reporter's output structure",
        },
      ],
      explanation:
        "The organising question is what someone needs to find. A developer touching checkout wants every checkout test in one place; if they are split across smoke and regression folders, the ones they miss are the ones that break later. And the classification itself is unstable — the same test is smoke to one team and regression to another, and it gets reclassified without its behaviour changing, while the feature it covers is a durable fact. Tags plus --grep @smoke cover the selective-run need without a second directory tree, so nothing is lost. Playwright runs any subset you point it at and parallelises by file, not folder.",
    },
    {
      id: "q2",
      stem: "Why commit .env.example while gitignoring .env?",
      choices: [
        {
          id: "a",
          text: "Playwright refuses to start if .env.example is missing",
        },
        {
          id: "b",
          text: "It documents the required variables in a way that fails visibly when it goes stale, without putting secrets in the repository",
          correct: true,
        },
        {
          id: "c",
          text: "The example file is loaded automatically when .env is absent, so tests still run",
        },
        {
          id: "d",
          text: "It lets CI read the credentials without configuring secrets",
        },
      ],
      explanation:
        "The example is documentation that cannot rot quietly: if a new variable is needed and nobody adds it there, the next person's first run fails naming the missing variable instead of dying somewhere confusing twenty tests later. It carries the keys and not the values, so no secret enters the repository — which is the boundary the test-data and CI lessons both drew. Nothing loads it automatically as a fallback and nothing requires it to exist; its whole value is social, which is exactly why pairing it with an explicit startup check that throws on a missing variable is worth the four lines.",
    },
    {
      id: "q3",
      stem: "Which of these suggest a framework has been over-built?",
      multi: true,
      choices: [
        {
          id: "a",
          text: "A wrapper API so tests call click(el) instead of el.click()",
          correct: true,
        },
        {
          id: "b",
          text: "A custom reporter built because the HTML reporter was 'too generic'",
          correct: true,
        },
        {
          id: "c",
          text: "A fixture that creates and deletes a project, used by twelve tests",
        },
        {
          id: "d",
          text: "A configuration abstraction layer for a single environment",
          correct: true,
        },
      ],
      explanation:
        "The wrapper is the costliest of the three, because it severs the suite from Playwright's own documentation — a new joiner can no longer read the official docs and apply them, which is precisely the handover this lesson is about. A custom reporter and a config layer for one environment are both effort spent on something nobody asked for, competing with writing tests. The fixture is the counter-example and the pattern working as intended: it is used twelve times, it removes real duplication, and it makes cleanup guaranteed. The check is whether an abstraction helps somebody else write a test faster — earned by being used three times, not by being anticipated.",
    },
  ],
};
