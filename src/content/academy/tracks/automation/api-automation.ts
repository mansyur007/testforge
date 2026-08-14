import type { Lesson } from "../../types";

export const apiAutomation: Lesson = {
  slug: "api-automation",
  title: "API automation",
  summary:
    "Faster, steadier tests below the UI — and using the API to set up UI tests.",
  minutes: 14,
  status: "draft",
  body: `
## The layer most suites under-use

A UI test for "creating a case with a blank title is rejected" takes eight
seconds, drives a browser, and can fail because a button moved. The same rule
tested against the endpoint takes 200 milliseconds and fails only when the rule
itself breaks.

That is the trade the first lesson of this track was about, made concrete: **push
each test as low as it can go while it still says something true about what the
user gets.** Validation rules, permissions, error codes and business logic are
almost always lower than the browser.

You have already been using this layer. The previous lesson arranged data through
the API because doing it through the UI was slow and brittle. This lesson is the
same tool pointed at the thing under test rather than at the setup.

## Playwright tests APIs without a browser

No new dependency, no second framework:

~~~ts
import { test, expect } from "@playwright/test";

test("rejects a case with a blank title", async ({ request }) => {
  const res = await request.post("/api/v1/cases", {
    data: { title: "", suiteId: "s_123" },
  });

  expect(res.status()).toBe(422);
  const body = await res.json();
  expect(body.error).toContain("title");
});
~~~

The \`request\` fixture is an HTTP client with the config's \`baseURL\` and its own
cookie jar. Two things follow from that: it does not open a browser, so these
tests run in milliseconds; and it can share authentication with your UI tests
rather than needing a separate login mechanism.

**Note the assertion style.** \`expect(res.status())\` is a plain value comparison,
not a web-first assertion — there is nothing to poll, because an HTTP response
either arrived or did not. The retry rules from the assertions lesson apply to
locators; here the ordinary form is correct.

## Authenticating once

~~~ts
// playwright.config.ts
use: {
  baseURL: process.env.TF_BASE_URL,
  extraHTTPHeaders: {
    Authorization: \`Bearer \${process.env.TF_API_KEY}\`,
  },
},
~~~

An API key from the environment is the simplest correct answer, and it is what
TestForge itself expects. When a test needs a *different* identity — checking
that a viewer cannot delete a suite — build a client for it rather than mutating
the shared one:

~~~ts
test("a viewer cannot delete a suite", async ({ playwright }) => {
  const viewer = await playwright.request.newContext({
    baseURL: process.env.TF_BASE_URL,
    extraHTTPHeaders: { Authorization: \`Bearer \${process.env.TF_VIEWER_KEY}\` },
  });

  const res = await viewer.delete("/api/v1/suites/s_123");
  expect(res.status()).toBe(403);

  await viewer.dispose();
});
~~~

**Authorization tests are the highest-value thing on this layer**, and they are
close to impossible through a UI that simply hides the button. A hidden button is
not a permission check — the endpoint is — and this is how you find out which one
your application actually has. The manual track made the same argument about
checking authorization by URL first; this is its automated form.

## What to assert on a response

More than the status code, and less than everything:

~~~ts
const res = await request.post("/api/v1/cases", { data: { title: "TC-12", suiteId } });

expect(res.status()).toBe(201);                       // 1. status
expect(res.headers()["content-type"]).toContain("application/json");

const body = await res.json();
expect(body).toMatchObject({ title: "TC-12", suiteId });   // 2. the fields you care about
expect(body.id).toMatch(/^c_/);                            // 3. shape, not exact value
expect(new Date(body.createdAt).getTime()).toBeGreaterThan(0);
~~~

\`toMatchObject\` is the workhorse: it checks the fields you name and ignores the
rest, so a new field added to the response does not break forty tests. Asserting
deep equality against a whole payload is the API equivalent of a CSS selector
chain — it fails on changes that are not defects.

Assert **shape** for anything the server generates. \`body.id\` being a string that
starts with \`c_\` is a real contract; \`body.id === "c_7f3a"\` is today's database
sequence.

## Status codes worth being precise about

A test that accepts "any error" is barely a test. The difference between these is
usually a real defect:

| Code | Means | Common bug it catches |
|---|---|---|
| 400 | Malformed request | Validation returning 500 instead |
| 401 | Not authenticated | An endpoint that forgot to require auth |
| 403 | Authenticated, not allowed | The big one — permissions not enforced server-side |
| 404 | Not found | Leaking existence: returning 403 vs 404 for other users' records |
| 409 | Conflict | Duplicate handling that silently overwrites |
| 422 | Understood, semantically invalid | Business rules bypassed |

**401 versus 403 and 403 versus 404 are the two pairs worth testing explicitly.**
The second is subtler than it looks: returning 403 for a record that exists but
belongs to someone else tells an attacker it exists. Whichever your application
chooses, it should choose consistently, and a test is how that stays true.

## Testing the error paths is the point

The happy path is usually already covered by a UI test. The value of this layer is
everything the UI cannot easily reach:

~~~ts
const cases = [
  { data: {}, status: 422, why: "no fields at all" },
  { data: { title: "" }, status: 422, why: "blank title" },
  { data: { title: "x".repeat(5000) }, status: 422, why: "title over the limit" },
  { data: { title: "TC-1", suiteId: "does-not-exist" }, status: 404, why: "unknown suite" },
];

for (const c of cases) {
  test(\`rejects \${c.why}\`, async ({ request }) => {
    const res = await request.post("/api/v1/cases", { data: c.data });
    expect(res.status()).toBe(c.status);
  });
}
~~~

Generating tests from a table is legitimate here in a way it is not in the UI:
each case is one fast request, the failure message names which row failed, and
adding the fifteenth boundary costs a line. **Keep them as separate \`test()\`
calls rather than a loop inside one test**, so a failure reports the specific
case and one failing row does not hide the four after it.

## The hybrid test is where this pays off most

~~~ts
test("TC-31 a case created by API appears in the suite view", async ({ page, request }) => {
  const res = await request.post("/api/v1/cases", {
    data: { title: \`TC-31 login \${Date.now()}\`, suiteId },
  });
  const created = await res.json();

  await page.goto(\`/suites/\${suiteId}\`);
  await expect(page.getByRole("row", { name: created.title })).toBeVisible();
});
~~~

Arrange below, act and assert above. This is the shape most of a mature suite
ends up in, and it is why the previous lesson and this one belong together: the
API is both a thing to test and the tool that makes UI tests fast and
independent.

The reverse direction is worth knowing too — perform an action in the UI, then
verify through the API that the *stored* state is right. A form that appears to
save but writes the wrong field is a bug the screen will happily hide from you.

## What this layer will not tell you

Being honest about the limits keeps the pyramid argument honest:

- **That the feature works for a person.** Every endpoint can be correct while
  the button that calls them is disabled.
- **Anything about rendering, layout, or accessibility.**
- **That the client sends what you think it sends.** Your test constructs the
  request; the real application constructs a different one. This is the gap
  contract testing exists to close, and it is on the Beyond Functional track.

So the split is not "API tests instead of UI tests". It is: the rules, the
permissions and the error paths below; a small number of journeys a user actually
takes above.

## Where TestForge fits

The capstone uses this lesson's tooling for real: \`/api/v1/junit\` is an endpoint,
your upload is a POST with a multipart body, and the run it creates is something
you can then read back and assert on. Practising against \`/api/v1/projects\` and
\`/api/v1/cases\` in your sandbox project now is exactly the muscle the capstone
needs.

Worth trying once for the shape of it: create a case through the API, upload a
JUnit result whose test name carries that case's id, and read the run back to
confirm the match landed. That is the whole product loop in three requests, and
it is the thing the last two lessons of this track assemble properly.

**Next:** running the suite in CI with GitHub Actions — workflows, artifacts, and
keeping the pipeline under ten minutes so people actually wait for it.
`,
  selfCheck: [
    {
      id: "q1",
      stem: "Why is checking that a viewer gets 403 from DELETE /api/v1/suites/s_123 more valuable than checking that the delete button is hidden in the UI?",
      choices: [
        {
          id: "a",
          text: "Because API tests run faster, so the same check costs less CI time",
        },
        {
          id: "b",
          text: "Because a hidden button is not a permission check — the endpoint is, and only the request proves the rule is enforced server-side",
          correct: true,
        },
        {
          id: "c",
          text: "Because Playwright cannot reliably assert that an element is absent",
        },
        {
          id: "d",
          text: "Because UI permissions are handled by the browser rather than the application",
        },
      ],
      explanation:
        "Hiding a control is presentation; enforcement happens where the request lands. An application can hide the button perfectly and still delete the suite for anyone who sends the DELETE, and that gap is invisible to every test that only drives the interface. Sending the request as the restricted identity is the only thing that demonstrates the rule holds — which is why authorization is the highest-value work on this layer. Speed is a real benefit but a secondary one, and Playwright asserts absence perfectly well with toBeHidden and not.toBeVisible.",
    },
    {
      id: "q2",
      stem: "Which assertion style is right for a created record's generated id?",
      choices: [
        {
          id: "a",
          text: "expect(body.id).toBe(\"c_7f3a\") — pin the exact value so any change is caught",
        },
        {
          id: "b",
          text: "expect(body.id).toMatch(/^c_/) — assert the shape, because the value is generated",
          correct: true,
        },
        {
          id: "c",
          text: "expect(body).toEqual(expectedFullPayload) — compare the whole response for completeness",
        },
        {
          id: "d",
          text: "Skip it — generated fields cannot be meaningfully asserted",
        },
      ],
      explanation:
        "The prefix is a contract the application promises; the specific characters after it are today's database sequence, so pinning them writes a test that fails on the next run for no reason. Deep equality against a whole payload has the same problem one level up — it is the API equivalent of a CSS selector chain, breaking whenever a new field is added even though nothing regressed. toMatchObject with the fields you actually care about, plus a shape check on the generated ones, gives you a test that fails when the contract breaks and stays quiet otherwise. Skipping it entirely gives up a real check: an id with the wrong prefix means the wrong kind of record was created.",
    },
    {
      id: "q3",
      stem: "Which of these are true about where API tests fit alongside UI tests?",
      multi: true,
      choices: [
        {
          id: "a",
          text: "Validation rules and error paths usually belong below the UI, where each case is one fast request",
          correct: true,
        },
        {
          id: "b",
          text: "Arranging state through the API and asserting through the UI makes the UI test faster and independent",
          correct: true,
        },
        {
          id: "c",
          text: "A passing API suite means the feature works for a user, so the UI journey is redundant",
        },
        {
          id: "d",
          text: "API tests do not prove the real client sends the request your test constructs",
          correct: true,
        },
      ],
      explanation:
        "Pushing rules and error paths down is the pyramid argument made concrete — fifteen boundary cases cost fifteen fast requests instead of two minutes of browser time. The hybrid shape, arranging below and asserting above, is what most mature suites converge on and is why this lesson and the test-data one belong together. But the layer has a real ceiling: every endpoint can be correct while the button calling them is disabled, so a small number of genuine user journeys stays necessary. And the gap in the last option is the honest limitation — your test builds the request, the application builds a different one, which is precisely what contract testing exists to close.",
    },
  ],
};
