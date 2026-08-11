import type { Lesson } from "../../types";

export const sdlcAndStlc: Lesson = {
  slug: "sdlc-and-stlc",
  title: "SDLC and STLC",
  summary:
    "How software gets built, where testing sits inside it, and why 'shift left' is more than a slogan.",
  minutes: 10,
  status: "published",
  body: `
## SDLC: how software gets built

The **Software Development Life Cycle** is just the sequence of activities that
turns an idea into running software: requirements → design → implementation →
testing → deployment → maintenance.

What changes between methodologies is not *which* activities happen, but **how
big a batch** they happen in and **how often**.

| Model | Batch size | Testing happens | You'll meet it in |
|---|---|---|---|
| Waterfall | The whole product | Once, near the end | Government, medical, some banking |
| V-model | The whole product | Each build phase has a matching test level, planned up front | Regulated / safety-critical work |
| Iterative / incremental | A chunk | Every iteration | Older enterprise teams |
| Agile (Scrum, Kanban) | One story | Continuously, inside the sprint | Most product companies today |
| DevOps / CD | One commit | On every push, automated | Modern web teams |

The V-model is worth understanding even if you never work in one, because it
draws the single most important picture in testing: **each level of
specification has a level of testing that verifies it.**

\`\`\`
Requirements ─────────────────────► Acceptance testing
   System design ────────────────► System testing
      Architecture ────────────► Integration testing
         Detailed design ────► Component (unit) testing
                    Code
\`\`\`

Read down the left, then up the right. Acceptance testing answers "did we build
the right thing?" against the requirements. Unit testing answers "did this
function do what its author intended?". Confusing the two is how teams end up
with 90% unit coverage and a product nobody can check out of.

## STLC: how testing gets done

The **Software Testing Life Cycle** is the same idea applied to your own work.
Six phases, and they repeat at whatever cadence your team ships at — once per
release in waterfall, once per story in Agile.

1. **Requirement analysis.** Read the story. Find what's missing, ambiguous, or
   contradictory. *Deliverable: questions, and a list of what's testable.*
2. **Test planning.** Scope, risks, what you'll test and what you deliberately
   won't, environments, who does what, when you'd stop. *Deliverable: a test
   plan — one page is fine.*
3. **Test design.** Turn requirements into cases using the techniques in this
   track. *Deliverable: test cases and test data.*
4. **Environment setup.** A place to run, with data that resembles reality.
   Often the thing that actually delays you.
5. **Test execution.** Run them; log results; raise defects; retest fixes.
   *Deliverable: results, defect reports.*
6. **Test closure.** What did we learn? What escaped to production and why?
   *Deliverable: a summary and, honestly, better cases next time.*

Two entry/exit ideas run through all six:

- **Entry criteria** — what must be true before a phase starts (e.g. "build
  deployed to staging, smoke passed").
- **Exit criteria** — what must be true to call it done (e.g. "all P1 cases
  executed, no open critical defects, coverage of the acceptance criteria
  complete"). Notice that "no bugs left" is never an exit criterion, because it
  is not achievable.

## Shift left, and why it pays

The cost of fixing a defect rises the later you find it — a requirements
ambiguity costs a conversation, the same ambiguity found in production costs a
hotfix, a rollback, support tickets and trust.

"Shifting left" means moving testing activity earlier: reviewing requirements,
attending design discussions, writing the acceptance criteria *with* the
product owner, pairing with a developer on unit test ideas. None of it involves
executing a test case, and all of it is testing.

The practical version for your first job: **when a story lands in refinement,
read it and bring three questions.** That habit alone will change how your team
sees you.

## Check your understanding

- In the V-model, which test level verifies the *requirements* document?
- Your team ships every day from \`main\`. What happens to the STLC phases —
  do they disappear?
- Name one exit criterion you could actually measure.

**Next:** the four test levels, in detail.
`,
  selfCheck: [
    {
      id: "q1",
      stem: "In the V-model, which test level verifies the requirements document?",
      choices: [
        { id: "a", text: "Component (unit) testing" },
        { id: "b", text: "Integration testing" },
        { id: "c", text: "System testing" },
        { id: "d", text: "Acceptance testing", correct: true },
      ],
      explanation:
        "Each specification level pairs with the test level that verifies it: detailed design with unit, architecture with integration, system design with system testing, and requirements with acceptance testing — which is why acceptance asks whether we built the right thing rather than whether the code works.",
    },
    {
      id: "q2",
      stem: "Your team ships to production several times a day. What happens to the six STLC phases?",
      choices: [
        { id: "a", text: "They disappear — continuous delivery replaces them" },
        { id: "b", text: "They still happen, but per story instead of per release", correct: true },
        { id: "c", text: "Only execution survives; planning and design are dropped" },
        { id: "d", text: "They move entirely into the developers' work" },
      ],
      explanation:
        "The phases are activities, not a calendar. Shipping faster changes the batch size and the cadence, so analysis, planning, design, setup, execution and closure happen for each story rather than once per release — they get smaller and more frequent, not optional.",
    },
    {
      id: "q3",
      stem: "Which of these is a usable exit criterion?",
      choices: [
        { id: "a", text: "No bugs remain in the product" },
        { id: "b", text: "The team feels confident about the release" },
        { id: "c", text: "All P1 cases executed and no open critical defects", correct: true },
        { id: "d", text: "Testing has run for two full weeks" },
      ],
      explanation:
        "An exit criterion has to be measurable and achievable. \"No bugs remain\" cannot be established, confidence is not evidence, and a fixed duration says nothing about coverage — but executed-cases plus open-defect severity can be checked by anyone.",
    },
  ],
};
