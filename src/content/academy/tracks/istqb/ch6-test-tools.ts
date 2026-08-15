import type { Lesson } from "../../types";

// §7.2/§7.3: written from the published learning objectives for this chapter,
// in our own words. No syllabus text is reproduced and no question here is
// derived from any real or sample paper.
export const ch6TestTools: Lesson = {
  slug: "ch6-test-tools",
  title: "Chapter 6 — Test tools",
  summary: "Tool support for testing, and the risks of adopting one.",
  minutes: 12,
  status: "published",
  body: `
## The smallest chapter in the syllabus

Chapter 6 supplies **2 of the 40 questions** in our practice paper, from **two
objectives** — one K2, one K1. It is the only chapter you can reasonably expect
to cover completely in a single sitting.

| Section | Objective | K-level |
|---|---|---|
| 6.1 Tool support for testing | How the types of tool support testing | K2 |
| 6.2 Benefits and risks of test automation | Both sides of adopting one | K1 |

Two questions is not nothing — it is 5% of the paper, and the pass line is 65%,
so these are two of the cheapest marks available. Do not skip a chapter this
small because it is small.

## 6.1 How tools support testing

The syllabus groups tools by **what activity they support**, and that grouping is
what a K2 question asks you to recognise:

| Tool support for | Examples of what it does |
|---|---|
| **Management of testing and testware** | Tracks cases, runs, results, defects, requirements, traceability |
| **Static testing** | Review support, and static analysis of code and other artefacts |
| **Test design and implementation** | Generating cases, test data, and test procedures |
| **Test execution and coverage** | Running tests automatically, comparing results, measuring coverage |
| **Non-functional testing** | Performance and load generation, security scanning, monitoring |
| **DevOps** | Pipelines, build and deploy automation, the plumbing tests run inside |
| **Collaboration** | Communication and shared understanding across the team |
| **Scalability and standardisation** | Virtual machines, containers, standardised environments |
| **Anything else** | Spreadsheets, SQL clients — a tool is anything that supports an activity |

That last row matters more than it looks. **A tool is not necessarily a testing
product.** A spreadsheet used to build a decision table, or a database client
used to verify what was actually stored, is tool support for testing in exactly
the sense the syllabus means.

TestForge itself sits in the first row — management of testing and testware —
which is also why this Academy's exercises use it that way rather than as a
test-execution tool.

## 6.2 Benefits and risks of test automation

A K1 objective, so recognition is enough — but recognise **both columns**,
because a question almost always asks for one specific side and offers the other
as distractors.

| Benefits | Risks |
|---|---|
| Time saved by removing repetitive manual work | Expectations of the tool may be unrealistic |
| Greater consistency — the tool does the same thing every time | Time, cost and effort of introducing it are underestimated |
| Objective measurement, such as coverage | Effort to **maintain** the test assets is underestimated |
| Easier access to information about testing — statistics and reports | The tool may be relied on instead of thinking, replacing test design with tool output |
| | Version control of testware may be neglected |
| | Relationships and interoperability between tools may be overlooked |
| | The vendor may fail, withdraw support, or sell the product |
| | Open-source support may cease, or the project be abandoned |
| | The chosen tool may not suit the platform, or lack compatibility |

**The two risks worth memorising**, because they are the most examined and the
most true: **maintenance effort is routinely underestimated**, and **a tool can
replace thinking rather than support it** — an automated suite grows, keeps
passing, and quietly stops being designed.

Two more points the syllabus makes about adoption:

- **Run a pilot** before rolling a tool out broadly, to learn what it really
  demands and to decide whether the way you work has to change.
- **Success is not the purchase.** It depends on adapting processes to fit the
  tool, providing training and coaching, defining usage guidelines, and gathering
  information about the tool's actual use — a tool nobody was trained on is
  shelfware with an invoice attached.

T3's automation track is the practitioner's version of this whole chapter, and
its framework lesson makes the same argument at length: what you are building is
a feedback loop, not a pile of scripts.

## The distinctions that decide marks

| Confused pair | The line between them |
|---|---|
| Benefits / risks of automation | Both lists exist; the question wants one of them |
| Tool / testing product | Any tool that supports an activity counts — spreadsheets included |
| Buying a tool / adopting one | Pilot, training, guidelines, and adapting the process |
| Consistency / correctness | A tool repeats reliably; it does not know what is right |
| Coverage measurement / good testing | An objective number, not a judgement about value |

## Drill it

**[Chapter 6 quiz →](/academy/istqb/practice-exam/chapter/6)**

Eight questions, untimed. With only two objectives behind them, anything less
than full marks here is worth a second read of the two tables above — this is
the one chapter where complete coverage is genuinely achievable.

**Next:** exam strategy — the timing, the question styles, and what to do with
the last ten minutes.
`,
  selfCheck: [
    {
      id: "q1",
      stem: "Which of these are risks of test automation as the syllabus presents them?",
      multi: true,
      choices: [
        {
          id: "a",
          text: "The effort required to maintain the test assets is underestimated",
          correct: true,
        },
        {
          id: "b",
          text: "The tool is relied on instead of thinking, so test design is replaced by tool output",
          correct: true,
        },
        {
          id: "c",
          text: "The vendor may withdraw support, or an open-source project may be abandoned",
          correct: true,
        },
        {
          id: "d",
          text: "Automated tests execute more consistently than manual ones",
        },
      ],
      explanation:
        "Maintenance effort is the risk that materialises most often — a suite is written once and maintained for years, and the second cost is rarely budgeted. Over-reliance is the subtler one: a growing, always-passing suite can quietly stop being designed, which is the same trap as the pesticide-paradox principle from chapter 1. Vendor and open-source support ending is a real dependency risk the syllabus names explicitly. Consistency of execution is a benefit, not a risk, and it appears here because questions in this chapter routinely mix one column into the other.",
    },
    {
      id: "q2",
      stem: "A tester uses a spreadsheet to build a decision table and a SQL client to verify what was stored. In syllabus terms, is this tool support for testing?",
      choices: [
        {
          id: "a",
          text: "Yes — a tool is anything that supports a test activity, and these support test design and test execution respectively",
          correct: true,
        },
        {
          id: "b",
          text: "No — only dedicated testing products count as test tools",
        },
        {
          id: "c",
          text: "Only the SQL client counts, because it touches the system under test",
        },
        {
          id: "d",
          text: "Only if they are formally adopted through a tool selection process",
        },
      ],
      explanation:
        "The syllabus groups tools by the activity they support rather than by what they are marketed as, and it explicitly allows that a tool supporting any test activity is a test tool. The spreadsheet supports test design and implementation; the database client supports execution by letting you verify what was actually stored rather than what the screen displayed. Requiring a formal selection process confuses adoption practice with the definition — the pilot, training and guidelines advice applies to rolling a tool out across a team, not to whether something counts as one.",
    },
  ],
};
