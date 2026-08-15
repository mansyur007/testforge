import type { Lesson } from "../../types";

export const portfolio: Lesson = {
  slug: "portfolio",
  title: "Building a QA portfolio",
  summary:
    "Publish a real project — suites, runs, results — that a hiring manager can open.",
  minutes: 12,
  status: "published",
  sandbox: true,
  body: `
## Why a CV alone loses

Every QA CV says the same things: *strong test design, attention to detail,
experienced with Playwright and API testing.* None of it is checkable. A hiring
manager with two hundred applications and an afternoon is not reading for
adjectives — they are looking for **a reason to shortlist**, and the fastest
reason available is work they can open in a browser.

That is the entire argument for a portfolio. Not that it proves you are good, but
that it moves the conversation from *what you claim* to **what you did**, which
is the ground you want to be standing on.

## What a portfolio is not

- A list of tools with progress bars.
- A certificate image. (A certificate says you passed an exam. It does not say
  you can test.)
- A private repository nobody can open.
- A forty-page test plan PDF. Nobody opens a PDF.

## Three artefacts, and what each one proves

**1. A test suite for a real, public application.** Pick something anyone can
open — a public demo site, an open-source tool, a government form. This matters
more than it sounds: a reviewer can hold your cases next to the actual thing and
judge whether you understood it.

**2. Execution history.** Cases show that you can design. Runs show that you
executed, maintained and re-ran them, and that a real failure was found and
recorded. A catalogue with no runs reads as a writing exercise.

**3. A written argument.** Two or three paragraphs: what risk you prioritised,
where your coverage stops, and **what you deliberately did not test**. This is
the differentiator. Anyone can list cases; very few candidates can explain an
omission, and explaining omissions is most of the job.

## Depth beats breadth, and it is not close

One feature tested thoroughly — with boundaries, negative cases, a permissions
angle, a stated risk rationale — beats three hundred shallow cases covering an
entire application.

Three hundred cases reads as generated, and a reviewer's next thought is *"how
many of these have ever failed?"*, which is T2's pass-rate-theatre argument
pointed at you. Fifteen cases with visible reasoning reads as a tester.

## The automation half

A small repository is worth more than a large one here. What a reviewer actually
checks, in about four minutes:

- **Does it run?** One documented command, from a clean clone. If it takes longer
  than two minutes to get going, they stop.
- **Is it deterministic?** No \`sleep\`, no dependence on test order, no
  yesterday's date hardcoded. T3 spent a track on this and it is exactly what
  gets looked for.
- **Are the assertions real?** A suite that cannot fail is decoration — the same
  test applied to generated tests in the previous lesson.
- **Is a failure readable?** Break something on purpose, screenshot the output,
  and make sure it names what went wrong.
- **CI running on push**, with results visible. This is the difference between
  "wrote tests once" and "runs tests".

Add two or three **excellent bug reports** — title, environment, steps, expected
versus actual, evidence, impact — written to T1's standard. A great bug report is
the cheapest possible demonstration of care.

## What must never go in it

This is a hard line, not a style preference:

- **Nothing belonging to a current or former employer.** Not test cases, not
  screenshots, not "anonymised" internal documents.
- **No real customer data**, ever.
- **No internal URLs, ticket ids, colleague names** in screenshots. Crop and
  check before publishing.
- **No credentials** — and check the **git history**, not just the current tree.
  A secret removed in a later commit is still published.

A hiring manager who opens your portfolio and sees a previous employer's internal
test suite learns one thing about you, and it is not a good thing. This is also
the kind of mistake that ends an employment relationship rather than a
conversation.

## 🛠 Your exercise

Your Academy sandbox project is a real project with real cases and real runs.
Publish it and then read it as a stranger would.

1. Open your sandbox project → **Settings → Public sharing**.
2. Turn on the master toggle, then enable **Test Cases**, **Runs** and
   **Reports** individually.
3. Copy the public URL — it is \`/public/<your-project-slug>\` — and open it in a
   **private window**, logged out. That is what a reviewer sees.
4. Now score yourself on the sixty-second pass:
   - Does the project have a description that says what it is?
   - Are case titles meaningful, or are they "Test 1", "Test 2"?
   - Does every case have expected results, not just steps?
   - Is there run history, with at least one genuine failure?
   - Would a stranger understand what you were testing and why?
5. Fix the three worst things you find. Then leave sharing on and put the URL on
   your CV.

Two facts about that page worth knowing before you use it in an application.
**Public means public, not unlisted** — the URL is your project slug, so treat
anything you enable as readable by anyone who guesses it. And the page is
\`noindex\` by default: if you want it to appear in search results, that is a
separate toggle you turn on deliberately.

What it never exposes, whatever you enable: comments, attachments, assignees,
defect links, per-result tester notes, member names or emails. Runs are a list
with statuses and there is no per-result page for anything to leak from, and
Reports are aggregates only. You can publish your work without publishing your
colleagues.

## Putting it where it gets seen

One line, at the top of the CV, not in a footer: **Test portfolio:
\`<your URL>\`**. The same line in the LinkedIn headline field or the first line
of the about section. In an application form's "anything else" box, that link is
worth more than the paragraph you were going to write.

Then check it every few months. A dead link on a CV is worse than no link, and a
portfolio whose last run was fourteen months ago says something you did not mean
to say.

**Next:** interview preparation — the questions that always come, and how to
answer them with the evidence you have just published.
`,
  selfCheck: [
    {
      id: "q1",
      stem: "Why does a portfolio of 15 thoroughly-designed cases for one feature usually beat 300 shallow cases covering a whole application?",
      choices: [
        {
          id: "a",
          text: "Reviewers are not allowed to spend more than a few minutes on any one application",
        },
        {
          id: "b",
          text: "Depth is where reasoning is visible; a large shallow catalogue reads as generated and invites the question of how many of those cases have ever failed",
          correct: true,
        },
        {
          id: "c",
          text: "Large suites are harder to keep passing in CI",
        },
        {
          id: "d",
          text: "Hiring managers prefer manual cases to automated ones",
        },
      ],
      explanation:
        "A portfolio is evidence of judgement, and judgement only shows in depth — boundaries, negative cases, a permissions angle, and a stated reason for where coverage stops. Three hundred shallow cases demonstrate volume, which is exactly what nobody is short of, and they trigger the pass-rate-theatre question from T2's metrics lesson: how many of these have ever caught anything? Reviewer time and CI maintenance are real, but they are not the reason — a reviewer with unlimited time would still learn more from the fifteen.",
    },
    {
      id: "q2",
      stem: "Which of these belong in a public QA portfolio?",
      multi: true,
      choices: [
        {
          id: "a",
          text: "A written note explaining what you deliberately chose not to test, and why",
          correct: true,
        },
        {
          id: "b",
          text: "Run history against a public application, including a genuine failure you found",
          correct: true,
        },
        {
          id: "c",
          text: "An anonymised copy of a former employer's regression suite",
        },
        {
          id: "d",
          text: "Two or three bug reports with environment, steps, expected versus actual, and evidence",
          correct: true,
        },
      ],
      explanation:
        "The stated omission is the single most distinguishing artefact, because explaining what you left out and why is most of the job and almost nobody does it. Execution history proves you ran and maintained the suite rather than only writing it, and a failure you actually found is the proof that it can fail. Well-formed bug reports are the cheapest demonstration of care there is. The employer's suite is the hard line: anonymising does not make it yours, and a reviewer who recognises it learns something about how you will treat their material.",
    },
    {
      id: "q3",
      stem: "You enable public sharing on your sandbox project to use as a portfolio. What is true about that page?",
      choices: [
        {
          id: "a",
          text: "It is unlisted — the URL is unguessable, so only people you send it to can reach it",
        },
        {
          id: "b",
          text: "It is public at your project's slug and each section is opt-in, and it never exposes comments, assignees, defect links or per-result tester notes",
          correct: true,
        },
        {
          id: "c",
          text: "It publishes everything in the project, so anything private must be deleted first",
        },
        {
          id: "d",
          text: "It appears in search results as soon as sharing is enabled",
        },
      ],
      explanation:
        "The URL is built from your project slug, which makes it guessable — that is the deliberate difference between public sharing and an unlisted token link, and the settings page says so. What appears is opt-in section by section (Cases, Runs, Reports), and the things that would expose people rather than work — comments, attachments, assignees, defect links, per-result notes, member names — are never published under any setting, so you do not have to delete anything to share safely. Indexing is a separate toggle: the page is noindex until you decide otherwise.",
    },
  ],
};
