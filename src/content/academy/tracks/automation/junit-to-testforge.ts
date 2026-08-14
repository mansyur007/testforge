import type { Lesson } from "../../types";

export const junitToTestforge: Lesson = {
  slug: "junit-to-testforge",
  title: "Capstone: publish results to TestForge",
  summary:
    "Emit JUnit XML, upload it via /api/v1/junit, and read the run you just created.",
  minutes: 15,
  status: "draft",
  sandbox: true,
  body: `
## Closing the loop

Everything so far produces a green tick that disappears. This lesson attaches
your results to the cases they exercise, so the questions a team actually asks —
*is this getting worse, which tests fail most, what did last month look like* —
have somewhere to be answered from.

Three steps: emit JUnit XML, POST it, read the run back.

## 1. Emit JUnit XML

~~~ts
// playwright.config.ts
reporter: [
  ["list"],
  ["junit", { outputFile: "results/junit.xml" }],
],
~~~

JUnit XML is the format every CI tool and test management system understands. It
is not Playwright-specific — pytest, JUnit, NUnit and Jest all emit it, which is
why TestForge ingests it rather than a vendor format.

If you shard across jobs, **merge first**. Four shards produce four XML files and
the endpoint wants one run:

~~~bash
npx playwright merge-reports --reporter junit ./blob-report > results/junit.xml
~~~

## 2. Get the two things the upload needs

**Your project slug.** Open your sandbox project in TestForge and read it out of
the URL — \`/projects/academy-3f2a9b1c\` means the slug is \`academy-3f2a9b1c\`.
Sandbox slugs are derived from your account, so yours is not the one printed
here. Copy your own.

**An API key.** Settings → API Keys → create one, and copy it immediately. Put it
in your CI secret store as \`TF_API_KEY\`, never in the repository.

## 3. Upload

~~~bash
curl -X POST \\
  "$TF_BASE_URL/api/v1/junit?project=$TF_PROJECT&name=CI%20run&source=playwright" \\
  -H "Authorization: Bearer $TF_API_KEY" \\
  -H "Content-Type: application/xml" \\
  --data-binary @results/junit.xml
~~~

The query parameters:

| Parameter | Meaning |
|---|---|
| \`project\` | **Required.** Your project slug |
| \`name\` | What the run is called. Defaults to a timestamp — set something readable |
| \`source\` | The framework, e.g. \`playwright\`. Shown on the run |
| \`origin\` | Where it ran, e.g. \`CI · GitHub Actions\`. Free text, 120 chars |
| \`env\` | Optional environment name, for keeping staging and production runs apart |

A success response tells you what happened:

~~~json
{
  "runId": "run_8fd21a",
  "runUrl": "/projects/academy-3f2a9b1c/runs/run_8fd21a",
  "matched": 12,
  "automated": 12,
  "unmatched": ["logs out from the account menu"],
  "summary": { "passed": 11, "failed": 1, "skipped": 0 }
}
~~~

**\`unmatched\` is the field to read.** Those tests ran, and their results were
thrown away because nothing in your project corresponds to them.

## 4. Matching: the part that actually decides whether this works

The endpoint matches each test in the XML to a case in your project, in this
order:

1. **A \`TC-<SLUG>-<number>\` annotation in the test name**, where \`<SLUG>\` is your
   project slug and \`<number>\` is the case's number in the project. Matched
   case-insensitively.
2. **Failing that, an exact title match** — the test name, with any TC id
   removed, compared to the case title ignoring case.

So for a project with slug \`academy-3f2a9b1c\` and a case number 12:

~~~ts
test("TC-ACADEMY-3F2A9B1C-12 a valid login lands on the dashboard", async ({ page }) => {
~~~

~~~ts
// also works, if a case is titled exactly this
test("a valid login lands on the dashboard", async ({ page }) => {
~~~

**Earlier lessons on this track wrote \`TC-12\` for brevity. That form does not
match** — the slug is part of the pattern, because case numbers are only unique
within a project. A bare \`TC-12\` falls through to the title rule, and the title
rule then compares the whole string *including* "TC-12", so it matches nothing
unless a case is literally titled that.

Prefer the annotation over the title match. Titles get edited for clarity, and a
suite that matches on prose silently stops matching the day somebody improves a
case title. An id is a contract — the same argument the locators lesson made
about \`data-testid\`.

The slug is long and you should not type it into 400 test names. Put it in one
place:

~~~ts
// tc.ts
const SLUG = process.env.TF_PROJECT!.toUpperCase();
export const tc = (n: number, title: string) => \`TC-\${SLUG}-\${n} \${title}\`;
~~~

~~~ts
test(tc(12, "a valid login lands on the dashboard"), async ({ page }) => {
~~~

## 5. Wire it into the workflow

~~~yaml
      - run: npx playwright test

      - name: Publish results to TestForge
        if: \${{ !cancelled() }}
        run: |
          curl -sS -X POST \\
            "$TF_BASE_URL/api/v1/junit?project=$TF_PROJECT&name=$GITHUB_REF_NAME%20%23$GITHUB_RUN_NUMBER&source=playwright&origin=CI%20%C2%B7%20GitHub%20Actions" \\
            -H "Authorization: Bearer $TF_API_KEY" \\
            -H "Content-Type: application/xml" \\
            --data-binary @results/junit.xml
        env:
          TF_BASE_URL: \${{ secrets.TF_BASE_URL }}
          TF_API_KEY: \${{ secrets.TF_API_KEY }}
          TF_PROJECT: \${{ secrets.TF_PROJECT }}
~~~

**\`if: !cancelled()\` again, and it matters more here than for artifacts.** The
default is to skip a step when a previous one failed — so with the default, the
only runs that ever reach TestForge are the passing ones, and a history of
nothing but green is worse than no history at all.

## When it does not work

| Status | Meaning | Fix |
|---|---|---|
| **401** | Bad or missing key | Check the \`Authorization: Bearer …\` header and that the key was copied whole |
| **404** | Project not found, *or you are not a member of it* | Check the slug against the URL; confirm the key belongs to an account with access |
| **400** | XML did not parse, or contained no tests | Confirm the file is non-empty and that the junit reporter actually ran |
| **422** | Parsed fine, **nothing matched a case** | The naming problem above — the response lists the unmatched names |

The 404 is worth reading twice: **a project you cannot see is reported the same
as one that does not exist.** That is deliberate — it avoids confirming which
slugs exist to someone who is not a member — and it means "wrong key" and "wrong
slug" look identical from outside. The api-automation lesson made this exact
point about 403 versus 404; here it is in the product you are integrating with.

A 422 is the most common first failure, and it is good news: the upload worked
end to end, and only the naming is wrong.

## The exercise

Against **your sandbox project**, end to end:

1. Add the \`junit\` reporter and confirm \`results/junit.xml\` appears locally.
2. Open your sandbox, note the slug from the URL and the number of one seeded
   case, and rename one test to carry \`TC-<SLUG>-<n>\`.
3. Upload with the \`curl\` above. Read \`matched\` and \`unmatched\` in the response.
4. **Get a 422 on purpose** — upload a file where no test name matches anything —
   and read the error. Then fix the naming and upload again.
5. Open \`runUrl\` in TestForge. Confirm the run exists, the case shows the result,
   and the case's history now has an entry.
6. Add the upload step to the workflow from the previous lesson and let CI create
   a run.

Step five is the capstone. A run you produced from a test you wrote, attached to
a case, with a history that will still be there next month — that is the loop
this whole track was building toward.

## What you can do now that you could not before

Once results accumulate, the run history answers things a green tick cannot:

- **Which cases fail most often** — the flakiness list, and the next lesson's raw
  material.
- **Whether a fix held**, because the case has a before and an after.
- **Whether a red run is a regression or a maintenance event.** Forty cases red
  at once after a login change is a suite problem; one case red on a build that
  touched its feature is a defect. The locators lesson asked you to record that
  distinction honestly; this is where it becomes visible.
- **What to tell people.** T2's reporting lesson wanted a release recommendation
  in terms a product owner acts on. "The suite passed" is not that; "the checkout
  cases have been green for eleven builds, the two red ones are a known locator
  fix" is.

## For your portfolio

This is a real, demonstrable thing: a repository with a suite, a workflow that
runs it on every pull request, and a test management project with accumulated
history. It is more convincing than any certificate, because a hiring manager can
open it.

The Beyond Functional track's portfolio lesson picks this up directly.

**Next:** flaky tests — how to find the cause of the ones this run history is
about to start showing you, and how to quarantine honestly instead of retrying
forever.
`,
  selfCheck: [
    {
      id: "q1",
      stem: "An upload returns 422 with a list of unmatched test names. What has happened?",
      choices: [
        {
          id: "a",
          text: "The API key lacks write permission for the project",
        },
        {
          id: "b",
          text: "The XML parsed and the request was authorised, but no test name matched a case — so no run was created",
          correct: true,
        },
        {
          id: "c",
          text: "The XML was malformed and could not be read",
        },
        {
          id: "d",
          text: "The project slug does not exist",
        },
      ],
      explanation:
        "422 means the request got all the way through authentication and parsing and then found nothing to attach results to, which is why the response hands back the names it could not place. It is the most common first failure and the most encouraging one — the plumbing works and only the naming is wrong. The usual cause is a test named TC-12 rather than TC-<SLUG>-12, since case numbers are unique only within a project. A bad key is 401, a slug you cannot see or that does not exist is 404, and unparseable or empty XML is 400.",
    },
    {
      id: "q2",
      stem: "Why should the upload step run with `if: !cancelled()` rather than the default?",
      choices: [
        {
          id: "a",
          text: "Because the default skips the step when a previous step failed, so only passing runs would ever reach TestForge",
          correct: true,
        },
        {
          id: "b",
          text: "Because uploads from cancelled runs corrupt the case history",
        },
        {
          id: "c",
          text: "Because the endpoint rejects runs that contain failures unless the flag is set",
        },
        {
          id: "d",
          text: "Because it makes the upload run before the tests finish, saving pipeline time",
        },
      ],
      explanation:
        "GitHub skips subsequent steps once one fails, and the test step fails precisely when there are failing tests — the results most worth recording. Left on the default, your history fills with nothing but green runs, which is worse than having no history because it looks like evidence. !cancelled() sends results whether the suite passed or failed while still skipping genuinely cancelled runs. The endpoint is perfectly happy to record failures; that is the point of recording them.",
    },
    {
      id: "q3",
      stem: "Which statements about matching results to cases are correct?",
      multi: true,
      choices: [
        {
          id: "a",
          text: "The annotation is TC-<SLUG>-<number>, where SLUG is the project slug, because case numbers are only unique within a project",
          correct: true,
        },
        {
          id: "b",
          text: "Without a TC id, the test name is compared to the case title, ignoring case",
          correct: true,
        },
        {
          id: "c",
          text: "Matching by title is preferable, since titles are more readable than ids",
        },
        {
          id: "d",
          text: "A 404 can mean the project exists but your key's account is not a member of it",
          correct: true,
        },
      ],
      explanation:
        "The slug is part of the pattern because a case number alone would be ambiguous across projects, which is why the TC-12 shorthand used earlier in the track does not actually match. The title fallback is real and case-insensitive, but it is the weaker of the two: titles get edited for clarity, and a suite matching on prose stops matching the day someone improves a case title — an id is a contract, the same argument the locators lesson made for data-testid. And the 404 deliberately conflates 'does not exist' with 'you cannot see it', so that the endpoint does not confirm which slugs exist to a non-member.",
    },
  ],
};
