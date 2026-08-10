import type { Lesson } from "../../types";

export const testTypes: Lesson = {
  slug: "test-types",
  title: "Test types",
  summary:
    "Functional, non-functional, white-box and change-related testing — and why smoke and regression are not the same thing.",
  minutes: 9,
  status: "published",
  body: `
## Levels answer "where", types answer "what about it"

A **level** is *what chunk of the system* you're testing (unit → acceptance). A
**type** is *what property* you're testing it for. They're independent axes: you
can do performance testing (type) at the integration level, or functional
testing at the acceptance level.

There are four families.

## 1. Functional testing — "what does it do?"

Does the system do what it's supposed to do? Every technique in the rest of this
track — equivalence partitioning, boundary values, decision tables, state
transitions — is a way of designing functional tests.

Coverage here is measured against *requirements*: which acceptance criteria have
a test, which don't.

## 2. Non-functional testing — "how well does it do it?"

The property, not the behaviour. These are the ones that get skipped and then
sink a launch.

| Type | The question | Cheap first check |
|---|---|---|
| Performance / load | Fast enough, under how much traffic? | Time the slowest page with a realistic data volume |
| Reliability | Does it stay up? Recover? | Kill the DB connection mid-request |
| Security | Can someone do what they shouldn't? | Change the ID in the URL to someone else's |
| Usability | Can a real person finish the task? | Watch one, silently |
| Compatibility | Which browsers/devices/OS? | The two your analytics actually show |
| Accessibility | Can it be used with a keyboard, a screen reader? | Tab through it. Just tab through it |
| Portability | Can we install/migrate it? | Follow your own setup docs on a clean machine |

You do not need to be an expert in all of these to test them usefully. "The
search page takes 11 seconds with 50,000 products" is a finding that a junior
can produce in an afternoon and that nobody else on the team has looked for.

## 3. White-box (structural) testing — "which code ran?"

Tests derived from the structure rather than the spec: statement coverage,
branch coverage, path coverage. Mostly the developers' world, mostly at unit
level, but the *idea* matters to you — coverage tells you what was **executed**,
never whether the result was **correct**. A test that runs every line and
asserts nothing has 100% coverage and zero value.

## 4. Change-related testing — "did we break it?"

Two names people use interchangeably and shouldn't:

**Confirmation testing (retesting)** — the defect was fixed; you run *the same
steps that failed* to confirm it's actually fixed. Narrow, targeted, mandatory.

**Regression testing** — a change was made; you run tests over the areas the
change could have affected, to see whether something that used to work now
doesn't. Broad, repetitive, and the number one candidate for automation
precisely because it's the same tests over and over, forever.

**Smoke testing** is a third thing: a thin, fast set of checks — can I log in,
does the home page render, can I create one order — run *first*, to decide
whether the build is worth testing at all. Smoke is about **triage**, regression
is about **change**. A smoke suite that takes 40 minutes has stopped being a
smoke suite.

A useful mental split:

\`\`\`
build deployed
  └─ smoke  (5 min)  → if red, reject the build, don't waste a day
       └─ new feature testing (functional, designed from the story)
            └─ regression  (around what changed)
                 └─ confirmation (each fixed defect, before closing it)
\`\`\`

## Choosing types under time pressure

You will not run every type. Pick by risk:

- Money moves → security + reliability first.
- Public sign-up form → compatibility + accessibility, because your users are
  not on your laptop.
- Internal admin tool used by six people → functional only is a defensible call.
  Say so out loud, in the test plan, so it's a decision and not an oversight.

## Check your understanding

- A developer fixes the bug you filed. You run your original steps. What is that
  called, and is it enough?
- Your regression suite takes 6 hours and blocks every release. What type of
  test would you build first to get the team un-stuck?
- Where does "the checkout button is unreachable by keyboard" fit?

**Next:** the seven principles — the shortest lesson here, and the one that
saves you the most arguments.
`,
};
