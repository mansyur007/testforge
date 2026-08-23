import type { Lesson } from "../../types";

export const testData: Lesson = {
  slug: "test-data",
  title: "Test data and fixtures",
  summary:
    "Independent tests, seeded state, and cleaning up after yourself.",
  minutes: 13,
  status: "published",
  body: `
## The failure that teaches this lesson

Your suite is green. You add a test. Now a *different* test fails — one you did
not touch. You run it alone and it passes. You run the suite again and something
else fails.

That is shared state, and it is the second-biggest source of unreliable
automation after locators. The cause is almost always the same: two tests using
the same record, and one of them changing it.

~~~ts
// both tests use the seeded project "Demo"
test("renames the project", async ({ page }) => { /* renames Demo → Demo v2 */ });
test("shows the project name", async ({ page }) => { /* expects "Demo" */ });
~~~

Run them in that order and the second fails. Run them the other way and both
pass. Playwright runs files in parallel by default, so the order is not yours to
rely on — and a test that depends on running order is a test that will eventually
fail on someone else's machine, at the least convenient moment.

## The rule the whole lesson serves

**Every test creates the data it needs and does not care what else has run.**

Say it as a check you can apply to any test in a review: *could this run alone,
twice in a row, at the same time as a copy of itself?* If any of those three is
no, the test has a data problem.

The three questions map to three real failures — depends on another test,
leaves residue that breaks its own second run, and collides with a parallel
worker. A test that survives all three survives CI.

## Unique data beats cleaned-up data

The cheapest way to stop two tests colliding is to stop them wanting the same
row:

~~~ts
const suffix = \`\${Date.now()}-\${Math.random().toString(36).slice(2, 8)}\`;
const projectName = \`Checkout regression \${suffix}\`;
~~~

Playwright gives you a better ingredient than \`Date.now()\` for the parallel case,
because two workers can start in the same millisecond:

~~~ts
test("creates a project", async ({ page }, testInfo) => {
  const name = \`proj-\${testInfo.workerIndex}-\${testInfo.repeatEachIndex}-\${Date.now()}\`;
});
~~~

Two rules that keep this from becoming its own problem:

- **Keep it recognisable.** \`proj-3-0-1723641200\` in a stuck test tells you which
  worker made it. \`a8f3c1\` tells you nothing at three in the morning.
- **Do not make it unique when the test is about the value.** A test for "duplicate
  project names are rejected" needs the *same* name twice, and randomising it
  deletes the test.

## Fixtures own setup and teardown

The previous lesson introduced fixtures as better than a base class. Here is the
property that makes them the right tool for data specifically: **the code after
\`use()\` runs even when the test fails.**

~~~ts
// fixtures.ts
const PROJECT = process.env.TF_PROJECT!;   // your sandbox project's slug

export const test = base.extend<{ testCase: { id: string; displayId: string } }>({
  testCase: async ({ request }, use, testInfo) => {
    const title = \`case-\${testInfo.workerIndex}-\${Date.now()}\`;
    const res = await request.post(\`/api/v1/projects/\${PROJECT}/cases\`, {
      data: { title },
    });
    const created = await res.json();

    await use(created);          // the test runs here

    await request.delete(\`/api/v1/projects/\${PROJECT}/cases/\${created.id}\`);   // always runs
  },
});
~~~

~~~ts
test("editing a case does not disturb anyone else's", async ({ page, testCase }) => {
  await page.goto(\`/projects/\${PROJECT}/cases/\${testCase.id}\`);
  // ...
});
~~~

Note the shape of the path: TestForge's write routes are **project-scoped**, so
every one of them carries the slug — \`/api/v1/projects/<slug>/cases\`, not
\`/api/v1/cases\`. Projects themselves are made in the UI and there is no endpoint
to create one, which is exactly why the fixture creates the *case* and treats the
sandbox project as fixed scenery.

The test asks for a case by naming it in its signature, gets a fresh one, and
the cleanup is guaranteed. Compare with \`afterEach\`, which is skipped when the
test times out in some runners and which sits far away from the setup it undoes —
two things that make orphaned data accumulate quietly for months.

**Scope it when creation is expensive.** A per-worker fixture is created once per
worker process rather than once per test:

~~~ts
export const test = base.extend<{}, { seededOrg: Org }>({
  seededOrg: [async ({}, use) => {
    const org = await createOrg();
    await use(org);
    await deleteOrg(org.id);
  }, { scope: "worker" }],
});
~~~

That is the right home for things every test reads and none of them modifies — an
organisation, a set of roles, a licence. **The moment a test writes to it, it
stops being shared data and goes back to per-test.**

## Set up through the API, not the UI

Creating a case through the interface takes eight actions, exercises code the
test is not about, and fails for reasons unrelated to what you are testing.

~~~ts
// slow, brittle, and tests the wrong thing
await page.getByRole("link", { name: "New case" }).click();
await page.getByLabel("Title").fill(title);
await page.getByRole("button", { name: "Create" }).click();

// fast, and a failure here is genuinely a broken environment
await request.post(\`/api/v1/projects/\${PROJECT}/cases\`, { data: { title } });
~~~

**Test through the UI what the UI does; arrange everything else underneath.** The
one exception is the test whose subject *is* the creation flow — that one clicks
through it, because that is the feature.

This is also why setup failures should be loud. If the API call fails, the test
should error immediately rather than continuing into a confusing UI assertion.
Fixtures give you this for free: an exception before \`use()\` marks the test as
failed in setup, which reads very differently in a report from a failed
assertion.

## Four sources of data, and when each is right

| Source | Good for | Cost |
|---|---|---|
| **Created per test, via API** | Anything a test modifies | A little setup time; the default |
| **Seeded once, read-only** | Reference data, a static catalogue | Breaks the moment a test writes to it |
| **Generated** (faker or similar) | Volume, unicode, long strings, edge shapes | Non-deterministic failures if unseeded |
| **Fixture file** (JSON/CSV) | A known-awkward payload worth keeping | Goes stale silently when the schema moves |

On generated data, one rule saves hours: **a failing test must be reproducible.**
Log the values that were used, or seed the generator per test so the same test
produces the same data on a rerun. "It failed once with a name I no longer have"
is not a defect report anyone can act on.

## Never point a suite at production

A destructive test does not know it is destructive until it deletes something
real. Three hard boundaries:

- **No real customer data in a test environment**, even copied. Anonymise or
  synthesise. Copying a production database into staging is a data-protection
  incident with extra steps.
- **No real email addresses.** \`user+\${suffix}@example.com\` — \`example.com\` is
  reserved for exactly this and cannot receive mail.
- **Credentials from the environment, never the repository.** \`process.env\`, a
  \`.env\` in \`.gitignore\`, and secrets in CI's secret store.

The manual track's non-functional lesson set out rules of engagement for probing
a live system; this is the same principle applied to data — the suite runs where
it is authorised to, against data nobody will miss.

## When cleanup fails anyway

It will. A worker is killed, CI is cancelled, a delete endpoint 500s. Plan for it
rather than assuming it away:

- **Make the suite tolerant of residue.** A test that asserts "there are 3
  cases" breaks on leftovers; one that asserts "*my* case appears in the
  list" does not. Prefer assertions scoped to the data the test created.
- **Have a sweeper.** A scheduled job deleting test records older than a day
  costs an hour to write and removes a permanent class of mystery failure.
- **Do not chain cleanup to the assertion.** Cleanup belongs after \`use()\` in a
  fixture, so a failing assertion still tidies up.

## Where TestForge fits

Your sandbox project is the right place to practise all of this, and the capstone
depends on it: the run you upload through \`/api/v1/junit\` lands in a project, and
the case history is only meaningful if runs are comparable. Two runs against
different leftover data are two different experiments.

One honest detail about the cleanup above: \`DELETE\` on a case is a **soft**
delete. The case disappears from the lists and from your assertions, and a purge
job removes the row later. That is the common shape in real products, and it is
worth knowing before you write a test that expects the record to be gone from
the database the instant the request returns.

There is a diagnostic worth carrying into the flaky-tests lesson. A case that
fails only when the full suite runs, and passes alone every time, is almost never
a defect — it is shared state. Run history makes that visible: the same case, the
same build, green in one run and red in the next, with nothing in the application
between them.

**Next:** API automation — testing the endpoints directly, which is both a faster
layer for the tests themselves and the mechanism this lesson has been leaning on
for setup.
`,
  selfCheck: [
    {
      id: "q1",
      stem: "A test passes when run alone but fails when the whole suite runs. What is the most likely cause?",
      choices: [
        {
          id: "a",
          text: "The suite timeout is too low for the number of tests",
        },
        {
          id: "b",
          text: "Shared state — another test is modifying data this one depends on, and parallel execution makes the order unreliable",
          correct: true,
        },
        {
          id: "c",
          text: "Playwright disables auto-waiting when more than one file runs",
        },
        {
          id: "d",
          text: "The browser cache is reused between tests in a suite run",
        },
      ],
      explanation:
        "Pass-alone-fail-together is the signature of two tests wanting the same record, where one of them writes to it. Because Playwright runs files in parallel by default, the order is not yours to rely on, so the failure appears and disappears depending on scheduling — which is exactly what makes it read as flakiness rather than as the deterministic data problem it is. The fix is not a retry or a longer timeout but ownership: each test creates the data it needs, ideally with a unique name, and cleans up after itself in a fixture. Playwright also gives each test a fresh browser context, so cache is not the culprit.",
    },
    {
      id: "q2",
      stem: "Why is data cleanup better placed after use() in a fixture than in an afterEach hook?",
      choices: [
        {
          id: "a",
          text: "afterEach cannot make network requests",
        },
        {
          id: "b",
          text: "Fixture teardown runs even when the test fails, and it sits next to the setup it undoes",
          correct: true,
        },
        {
          id: "c",
          text: "Fixtures run cleanup before the assertions, so failures cannot leave data behind",
        },
        {
          id: "d",
          text: "afterEach only runs for the last test in a file",
        },
      ],
      explanation:
        "The guarantee is the point: the code after use() runs whether the test passed, failed, or timed out, so a broken assertion still tidies up. The second benefit is proximity — creation and deletion are in the same function, which is what stops the two drifting apart until deletes silently stop matching what is created. afterEach can make requests and does run for every test, but it is skipped on timeout in some runners and lives far from the setup it is meant to undo, which is how orphaned records accumulate for months unnoticed. Cleanup deliberately does not run before the assertions — the test needs its data.",
    },
    {
      id: "q3",
      stem: "Which of these are sound test-data practices?",
      multi: true,
      choices: [
        {
          id: "a",
          text: "Create the case via an API call in a fixture rather than clicking through the creation form",
          correct: true,
        },
        {
          id: "b",
          text: "Assert \"my case appears in the list\" rather than \"there are exactly 3 cases\"",
          correct: true,
        },
        {
          id: "c",
          text: "Reuse one seeded account across the suite so tests do not waste time creating users",
        },
        {
          id: "d",
          text: "Log or seed generated data so a failure can be reproduced with the same values",
          correct: true,
        },
      ],
      explanation:
        "Arranging through the API is faster and keeps the test failing only for reasons it is about — click through the form only in the test whose subject is the creation flow. Scoping assertions to your own data makes the suite tolerant of the leftovers that cleanup will eventually fail to remove, where a global count breaks on any residue. And reproducibility is what separates a defect report from an anecdote: an unseeded generator that fails once with a value you no longer have gives nobody anything to act on. The shared account is the trap — it works until one test changes a setting or a password, and then it produces exactly the pass-alone-fail-together failure this lesson opens with.",
    },
  ],
};
