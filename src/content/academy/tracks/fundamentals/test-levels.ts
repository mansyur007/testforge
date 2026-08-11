import type { Lesson } from "../../types";

export const testLevels: Lesson = {
  slug: "test-levels",
  title: "Test levels",
  summary:
    "Unit, integration, system and acceptance testing — what each one can catch, and what it structurally cannot.",
  minutes: 9,
  status: "published",
  body: `
## Four levels, four different questions

A "level" is defined by **what you are testing and against what specification**.
Each level can only catch a certain class of defect. That's the whole point of
having four.

### 1. Component / unit testing

**What:** one function, class or module, in isolation, with its collaborators
faked.
**Against:** the detailed design or the code's own intent.
**Written by:** developers, almost always.
**Catches:** wrong arithmetic, unhandled nulls, off-by-one, bad branching.
**Cannot catch:** anything about how two pieces fit together. A unit test suite
at 100% coverage tells you nothing about whether the app works.

\`\`\`js
// Fast, isolated, and completely blind to whether the API it feeds exists.
expect(cartTotal([{ price: 1000, qty: 3 }])).toBe(3000);
\`\`\`

### 2. Integration testing

**What:** two or more components talking to each other — or your service
talking to a database, a queue, a third-party API.
**Against:** the architecture / interface design.
**Catches:** mismatched contracts, wrong assumptions about the other side, bad
serialisation, transactions that don't roll back, auth headers that go missing.

Two flavours worth knowing the names of: **component integration** (modules
inside one application) and **system integration** (your system against other
systems — the payment gateway, the shipping provider).

The classic integration defect: the front-end sends \`{ quantity: "3" }\` and
the back-end expects a number. Both unit test suites are green. The feature is
broken.

### 3. System testing

**What:** the whole assembled application, end to end, in an environment that
resembles production.
**Against:** the system requirements — functional *and* non-functional.
**Catches:** broken end-to-end flows, wrong behaviour across screens, and
everything non-functional: performance, security, usability, compatibility.

This is where most manual QA effort lives, and where the techniques in this
track pay off. You test as a user of the system, but with the requirements
open next to you.

### 4. Acceptance testing

**What:** the same system, but the question changes — not "does it work?" but
**"do we accept it?"**
**Against:** user needs, business processes, contracts, regulation.
**Run by:** users, product owners, customers, sometimes a regulator.

Common forms:

- **UAT** — real users doing their real workflow.
- **Operational acceptance** — can we back it up, restore it, monitor it,
  deploy it at 2am? (Beloved of ops, forgotten by everyone else.)
- **Contractual / regulatory acceptance** — a checklist someone will sue over.
- **Alpha / beta** — alpha at the developer's site, beta out in the wild.

## The trap: "it passed system testing, so it's fine"

Each level is blind to what its scope excludes. A feature can pass every level
and still be wrong, because none of them asked whether the requirement itself
made sense. That's why acceptance testing exists and why requirement review
(previous lesson) is testing too.

## How this maps to your daily work

On a modern web team you'll typically see:

| Level | Who | Where it runs |
|---|---|---|
| Unit | Devs | On every commit, seconds |
| Integration / API | Devs + QA | CI, seconds to minutes |
| System / E2E | QA | CI nightly + before release, minutes |
| Acceptance | PO / users | Staging, before release |

When you get to the [automation track](/academy/automation), this table becomes
the test pyramid — and the argument about its shape.

## Check your understanding

- A user can log in but their profile picture never loads because the
  front-end asks for \`/avatar\` and the service serves \`/avatars\`. Which
  level should have caught it?
- Which level would catch "the report takes 40 seconds to render with a year of
  data"?
- Why is 100% unit coverage a weak argument for shipping?

**Next:** test *types* — a different axis entirely, and the one most people
mix up with levels.
`,
  selfCheck: [
    {
      id: "q1",
      stem: "Login works, but the avatar never loads: the front end requests /avatar and the service serves /avatars. Which level should have caught it?",
      choices: [
        { id: "a", text: "Component (unit) testing" },
        { id: "b", text: "Integration testing", correct: true },
        { id: "c", text: "Acceptance testing" },
        { id: "d", text: "None — this is a design defect" },
      ],
      explanation:
        "Both sides can be individually correct and still disagree about the contract between them. A mismatched path, type or header is the textbook integration defect: each unit suite stays green because neither unit ever talks to the other.",
    },
    {
      id: "q2",
      stem: "\"The report takes 40 seconds to render with a year of data.\" Which level is this normally found at?",
      choices: [
        { id: "a", text: "Unit — the query function is slow" },
        { id: "b", text: "System, in an environment with realistic data volume", correct: true },
        { id: "c", text: "Integration — the database is involved" },
        { id: "d", text: "It is not a testable finding" },
      ],
      explanation:
        "Non-functional behaviour needs the assembled system and production-like data. A unit test on the query proves nothing about the whole page, and an integration test with three seeded rows will never reproduce a year of records.",
    },
    {
      id: "q3",
      stem: "Why is 100% unit-test coverage a weak argument for shipping?",
      multi: true,
      choices: [
        { id: "a", text: "It says nothing about how components behave together", correct: true },
        { id: "b", text: "Coverage measures what executed, not whether the result was right", correct: true },
        { id: "c", text: "It cannot tell you whether the requirement itself was sensible", correct: true },
        { id: "d", text: "Unit tests are unreliable and usually flaky" },
      ],
      explanation:
        "Coverage is an execution metric on isolated pieces. It is blind to integration, blind to whether assertions are meaningful, and blind to whether the specification was right in the first place — which is precisely why four levels exist. Unit tests being flaky is not the issue; they are the steadiest tests there are.",
    },
  ],
};
